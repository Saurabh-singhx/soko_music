// ============================================================
// HOME FEED & SHELVES UI
// ============================================================
async function playCuratedMix(mixId) {
  let mix = null;
  if (currentHomeShelves) {
    for (const s of currentHomeShelves) {
      if (s.mixes) {
        mix = s.mixes.find(m => m.id === mixId || m.playlistId === mixId);
        if (mix) break;
      }
    }
  }
  if (!mix) {
    mix = CURATED_MIXES.find(m => m.id === mixId || m.playlistId === mixId);
  }

  if (!mix) return;

  // 1. If mix already has multiple fully resolved tracks
  if (mix.tracks && mix.tracks.length > 1) {
    activePlaylist = {
      id: mix.id,
      name: mix.title,
      songIds: mix.tracks.map(t => t.id)
    };
    window.activeQueueList = mix.tracks;
    radioQueue = [];
    currentTrackIndex = 0;
    selectTrackToPlay(mix.tracks[0].id);
    showToast(`Playing "${mix.title}"`, '🔀');
    return;
  }

  // 2. If mix has predefined multiple songIds (e.g. curated mixes)
  if (mix.songIds && mix.songIds.length > 1) {
    const validTracks = mix.songIds.map(id => findTrackAcrossAllSources(id)).filter(Boolean);
    if (validTracks.length > 0) {
      activePlaylist = {
        id: mix.id,
        name: mix.title,
        songIds: validTracks.map(t => t.id)
      };
      window.activeQueueList = validTracks;
      radioQueue = [];
      currentTrackIndex = 0;
      selectTrackToPlay(validTracks[0].id);
      showToast(`Playing "${mix.title}"`, '🔀');
      return;
    }
  }

  // 3. If mix has a YouTube Music playlistId, resolve tracks dynamically
  if (mix.playlistId) {
    showToast(`Loading "${mix.title}"...`, '⏳');
    const resolved = await resolvePlaylistTracks(mix.playlistId);
    if (resolved && resolved.length > 0) {
      mix.tracks = resolved;
      mix.songIds = resolved.map(t => t.id);
      activePlaylist = {
        id: mix.id,
        name: mix.title,
        songIds: mix.songIds
      };
      window.activeQueueList = resolved;
      radioQueue = [];
      currentTrackIndex = 0;
      selectTrackToPlay(resolved[0].id);
      showToast(`Playing "${mix.title}"`, '🔀');
      return;
    }
  }

  // 4. If single track exists in mix.tracks
  if (mix.tracks && mix.tracks.length === 1) {
    activePlaylist = {
      id: mix.id,
      name: mix.title,
      songIds: mix.tracks.map(t => t.id)
    };
    window.activeQueueList = mix.tracks;
    radioQueue = [];
    currentTrackIndex = 0;
    selectTrackToPlay(mix.tracks[0].id);
    showToast(`Playing "${mix.title}"`, '🔀');
    return;
  }

  // 5. Fallback if offline
  const fallbackPool = (REGIONAL_CHARTS['Global'] || CATALOG).slice(0, 10);
  if (fallbackPool.length > 0) {
    activePlaylist = {
      id: mix.id,
      name: mix.title,
      songIds: fallbackPool.map(t => t.id)
    };
    window.activeQueueList = fallbackPool;
    radioQueue = [];
    currentTrackIndex = 0;
    selectTrackToPlay(fallbackPool[0].id);
    showToast(`Playing "${mix.title}"`, '🔀');
  }
}

function playAllShelfTracks(shelfId) {
  const shelf = currentHomeShelves.find(s => s.id === shelfId);
  if (!shelf || !shelf.tracks || shelf.tracks.length === 0) return;
  activePlaylist = {
    id: 'shelf_' + shelf.id,
    name: shelf.title,
    songIds: shelf.tracks.map(t => t.id)
  };
  window.activeQueueList = shelf.tracks;
  radioQueue = [];
  currentTrackIndex = 0;
  selectTrackToPlay(shelf.tracks[0].id);
  showToast(`Playing "${shelf.title}"`, '▶️');
}

function prepareHomeShelves(apiShelves = []) {
  const allShelves = [];
  const claimedShelves = new Set();

  // 1. Quick picks (YouTube Music horizontal line-like cards)
  const apiQuick = apiShelves.find(s => !claimedShelves.has(s) && s.title && (
    s.title.toLowerCase().includes('quick') ||
    s.title.toLowerCase().includes('listen again') ||
    s.title.toLowerCase().includes('start radio') ||
    s.title.toLowerCase().includes('songs you might like')
  )) || apiShelves.find(s => !claimedShelves.has(s) && s.tracks && s.tracks.length > 0 &&
    !s.title.toLowerCase().includes('trend') &&
    !s.title.toLowerCase().includes('chart') &&
    !s.title.toLowerCase().includes('mix') &&
    !s.title.toLowerCase().includes('forgot')
  );

  if (apiQuick) claimedShelves.add(apiQuick);

  const quickTracks = (apiQuick && apiQuick.tracks && apiQuick.tracks.length > 0)
    ? apiQuick.tracks
    : ((REGIONAL_CHARTS && REGIONAL_CHARTS['Global']) || []).slice(0, 16);
  allShelves.push({
    id: 'quick_picks',
    title: 'Quick picks',
    badge: 'START RADIO FROM A SONG',
    type: 'ytm-line',
    tracks: quickTracks
  });

  // 2. Trending songs for you (YouTube Music horizontal line-like cards)
  const apiTrending = apiShelves.find(s => !claimedShelves.has(s) && s.title && (
    s.title.toLowerCase().includes('trend') ||
    s.title.toLowerCase().includes('chart') ||
    s.title.toLowerCase().includes('buzz') ||
    s.title.toLowerCase().includes('hit') ||
    s.title.toLowerCase().includes('popular') ||
    s.title.toLowerCase().includes('video')
  ));
  if (apiTrending) claimedShelves.add(apiTrending);

  const trendTracks = (apiTrending && apiTrending.tracks && apiTrending.tracks.length > 0)
    ? apiTrending.tracks
    : ((REGIONAL_CHARTS && REGIONAL_CHARTS['India']) || []).slice(0, 16);
  allShelves.push({
    id: 'trending_for_you',
    title: 'Trending songs for you',
    badge: 'CHARTS & BUZZ',
    type: 'ytm-line',
    tracks: trendTracks
  });

  // 3. Forgotten favorites (YouTube Music horizontal line-like cards)
  const apiForgotten = apiShelves.find(s => !claimedShelves.has(s) && s.title && (
    s.title.toLowerCase().includes('forgot') ||
    s.title.toLowerCase().includes('revisit') ||
    s.title.toLowerCase().includes('rediscover') ||
    s.title.toLowerCase().includes('replay')
  ));
  if (apiForgotten) claimedShelves.add(apiForgotten);

  const quickIds = new Set(quickTracks.map(t => t.id));
  const trendIds = new Set(trendTracks.map(t => t.id));
  const forgottenPool = [
    ...CATALOG.filter(t => t.favorite || downloadedSet.has(t.id)),
    ...(((REGIONAL_CHARTS && REGIONAL_CHARTS['United States']) || []).slice(0, 16))
  ];
  const uniqueForgotten = [];
  const seenF = new Set();
  for (const t of forgottenPool) {
    if (!seenF.has(t.id) && !quickIds.has(t.id) && !trendIds.has(t.id)) {
      seenF.add(t.id);
      uniqueForgotten.push(t);
    }
  }
  const forgottenTracks = (apiForgotten && apiForgotten.tracks && apiForgotten.tracks.length > 0)
    ? apiForgotten.tracks
    : (uniqueForgotten.length >= 8 ? uniqueForgotten.slice(0, 16) : forgottenPool.slice(0, 16));
  allShelves.push({
    id: 'forgotten_favorites',
    title: 'Forgotten favorites',
    badge: 'REVISIT PAST FAVORITES',
    type: 'ytm-line',
    tracks: forgottenTracks
  });

  // 4. Mix for you (Personalized Mixes with even-height cards)
  let liveMixes = [];
  for (const s of apiShelves) {
    if (s.mixes && s.mixes.length > 0) {
      for (const m of s.mixes) {
        if (!liveMixes.some(existing => existing.id === m.id || existing.title.toLowerCase() === m.title.toLowerCase())) {
          liveMixes.push(m);
        }
      }
    }
  }

  const finalMixes = [];
  const seenMixKeys = new Set();
  for (const m of liveMixes) {
    if (!seenMixKeys.has(m.id)) {
      seenMixKeys.add(m.id);
      finalMixes.push(m);
    }
  }
  for (const m of CURATED_MIXES) {
    if (!seenMixKeys.has(m.id) && !seenMixKeys.has(m.title.toLowerCase())) {
      seenMixKeys.add(m.id);
      finalMixes.push(m);
    }
  }

  allShelves.push({
    id: 'mix_for_you',
    title: 'Mix for you',
    badge: 'PLAYLISTS TAILORED FOR YOU',
    type: 'mix',
    mixes: finalMixes.slice(0, 10)
  });

  // 5. Any extra shelves from YouTube Music (e.g. New music videos)
  for (const s of apiShelves) {
    if (!claimedShelves.has(s) && s.tracks && s.tracks.length > 0) {
      const lower = (s.title || '').toLowerCase();
      const badgeLower = (s.badge || '').toLowerCase();
      if (lower.includes('podcast') || lower.includes('episode') ||
          badgeLower.includes('podcast') || badgeLower.includes('episode')) {
        continue;
      }
      if (!lower.includes('quick') && !lower.includes('trend') && !lower.includes('chart') && !lower.includes('forgot') && !lower.includes('mix')) {
        const filteredTracks = s.tracks.filter(t => !isPodcastOrLongTrack(t));
        if (filteredTracks.length > 0) {
          allShelves.push({
            id: 'shelf_' + Math.random().toString(36).substring(2, 7),
            title: s.title,
            badge: s.badge || 'OFFICIAL YOUTUBE MUSIC',
            type: 'shelf-card',
            tracks: filteredTracks
          });
        }
      }
    }
  }

  return allShelves;
}

function updateHomeAuthBanner() {
  const banner = document.getElementById('homeAuthBanner');
  if (!banner) return;

  if (userSession && userSession.isLoggedIn) {
    banner.innerHTML = '';
    banner.style.display = 'none';
  } else {
    banner.style.display = 'block';
    banner.innerHTML = `
      <div onclick="loginWithGoogle()" style="background: linear-gradient(135deg, rgba(255, 0, 0, 0.12), rgba(99, 102, 241, 0.08)); border: 1px solid rgba(255, 0, 0, 0.25); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 50%; background: #FF0000; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(255, 0, 0, 0.35); flex-shrink: 0;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
          </div>
          <div>
            <div style="font-size: 13px; font-weight: 800; color: #fff;">Connect YouTube Music</div>
            <div style="font-size: 11px; color: var(--text-muted);">Sign in for your personal mixes, library & history</div>
          </div>
        </div>
        <button class="filter-pill active auth-banner-signin-btn">Sign In</button>
      </div>
    `;
  }
}

function renderHomeShelves(rawShelves) {
  const container = document.getElementById('homeFeedContainer');
  if (!container) return;

  const shelves = prepareHomeShelves(rawShelves);
  const visibleShelves = shelves.filter(s => (s.tracks && s.tracks.length > 0) || (s.mixes && s.mixes.length > 0));
  currentHomeShelves = visibleShelves;

  if (visibleShelves.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 16px; color: var(--text-muted);">
        <svg width="28" height="28" fill="var(--accent-primary)" viewBox="0 0 24 24" class="spin-icon" style="margin-bottom: 12px;"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
        <div style="font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 6px;">Syncing YouTube Music</div>
        <div style="font-size: 12px;">Loading live recommendations...</div>
      </div>
    `;
    return;
  }

  container.innerHTML = visibleShelves.map(shelf => {
    if (shelf.type === 'ytm-line') {
      return `
        <div class="section-title-row" style="margin-top: 22px;">
          <div>
            <span class="ytm-shelf-badge">${shelf.badge || 'START RADIO FROM A SONG'}</span>
            <h2 class="section-title">${shelf.title}</h2>
          </div>
          <button class="filter-pill shelf-play-all-btn" onclick="playAllShelfTracks('${shelf.id}')">Play all</button>
        </div>
        <div class="ytm-grid-shelf">
          ${shelf.tracks.map(createYtmLineCardHtml).join('')}
        </div>
      `;
    } else if (shelf.type === 'mix') {
      return `
        <div class="section-title-row" style="margin-top: 22px;">
          <div>
            <span class="ytm-shelf-badge">${shelf.badge || 'PLAYLISTS TAILORED FOR YOU'}</span>
            <h2 class="section-title">${shelf.title}</h2>
          </div>
        </div>
        <div class="shelf-container">
          ${shelf.mixes.map(createMixCardHtml).join('')}
        </div>
      `;
    } else {
      return `
        <div class="section-title-row" style="margin-top: 22px;">
          <div>
            <span class="ytm-shelf-badge">${shelf.badge || 'RECOMMENDED'}</span>
            <h2 class="section-title">${shelf.title}</h2>
          </div>
        </div>
        <div class="shelf-container">
          ${shelf.tracks.map(createShelfCardHtml).join('')}
        </div>
      `;
    }
  }).join('');
}

async function loadHomeFeed() {
  updateHomeAuthBanner();
  try {
    const cached = localStorage.getItem('soko_ytm_cached_feed_v2');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        personalShelves = parsed;
      }
    }
  } catch (e) {}

  // Immediately render shelves (cached or default sections)
  renderHomeShelves(personalShelves || []);

  await fetchYouTubeMusicFeed();
}

function renderShelves() {
  updateHomeAuthBanner();
  if (personalShelves && personalShelves.length > 0) {
    renderHomeShelves(personalShelves);
  } else {
    loadHomeFeed();
  }
}

window.playCuratedMix = playCuratedMix;
window.playAllShelfTracks = playAllShelfTracks;
window.prepareHomeShelves = prepareHomeShelves;
window.updateHomeAuthBanner = updateHomeAuthBanner;
window.renderHomeShelves = renderHomeShelves;
window.loadHomeFeed = loadHomeFeed;
window.renderShelves = renderShelves;
