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
  if (!mix && typeof CURATED_MIXES !== 'undefined') {
    mix = CURATED_MIXES.find(m => m.id === mixId || m.playlistId === mixId);
  }

  if (!mix) {
    showToast('Unable to find this mix', '⚠️');
    return;
  }

  // 1. If mix already has multiple fully resolved tracks
  if (mix.tracks && mix.tracks.length > 1) {
    activePlaylist = {
      id: mix.id,
      name: mix.title,
      songIds: mix.tracks.map(t => t.id)
    };
    window.activePlaylist = activePlaylist;
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
      window.activePlaylist = activePlaylist;
      window.activeQueueList = validTracks;
      radioQueue = [];
      currentTrackIndex = 0;
      selectTrackToPlay(validTracks[0].id);
      showToast(`Playing "${mix.title}"`, '🔀');
      return;
    }
  }

  // 3. If mix has an original song / videoId, play that exact song immediately!
  const origVid = mix.videoId || (mix.tracks && mix.tracks[0] && mix.tracks[0].id);
  if (origVid) {
    const origTrack = (mix.tracks && mix.tracks.find(t => t.id === origVid)) || {
      id: origVid,
      title: mix.title,
      artist: (mix.subtitle && mix.subtitle !== 'YouTube Music' && mix.subtitle !== 'Cloud Music') ? mix.subtitle : 'Cloud Music',
      cover: mix.cover || `https://i.ytimg.com/vi/${origVid}/hqdefault.jpg`,
      duration: 215,
      plays: 0
    };
    if (!CATALOG.some(t => t.id === origTrack.id)) {
      CATALOG.push(origTrack);
    }
    mix.tracks = [origTrack];
    mix.songIds = [origTrack.id];

    activePlaylist = {
      id: mix.id,
      name: mix.title,
      songIds: [origTrack.id]
    };
    window.activePlaylist = activePlaylist;
    window.activeQueueList = [origTrack];
    radioQueue = [];
    currentTrackIndex = 0;
    selectTrackToPlay(origTrack.id);
    showToast(`Playing "${origTrack.title}"`, '▶️');

    // In background, if mix has a playlistId, resolve the rest of the playlist queue
    if (mix.playlistId && typeof resolvePlaylistTracks === 'function') {
      resolvePlaylistTracks(mix.playlistId, origVid).then(resolved => {
        if (resolved && resolved.length > 1) {
          mix.tracks = resolved;
          mix.songIds = resolved.map(t => t.id);
          activePlaylist.songIds = mix.songIds;
          window.activePlaylist = activePlaylist;
          window.activeQueueList = resolved;
        }
      }).catch(() => {});
    }
    return;
  }

  // 4. If mix only has a playlistId (no seed videoId), resolve tracks dynamically
  if (mix.playlistId) {
    showToast(`Loading "${mix.title}"...`, '⏳');
    try {
      const resolved = await resolvePlaylistTracks(mix.playlistId, mix.videoId);
      if (resolved && resolved.length > 0) {
        mix.tracks = resolved;
        mix.songIds = resolved.map(t => t.id);
        if ((!mix.cover || mix.cover === 'assets/logo.png') && resolved[0]?.cover) {
          mix.cover = resolved[0].cover;
        }
        if (!mix.videoId && resolved[0]?.id) {
          mix.videoId = resolved[0].id;
        }
        activePlaylist = {
          id: mix.id,
          name: mix.title,
          songIds: mix.songIds
        };
        window.activePlaylist = activePlaylist;
        window.activeQueueList = resolved;
        radioQueue = [];
        currentTrackIndex = 0;
        selectTrackToPlay(resolved[0].id);
        showToast(`Playing "${mix.title}"`, '🔀');
        return;
      }
    } catch (err) {
      console.warn("Failed resolving playlist tracks:", err);
    }
  }

  // 5. If there is any problem, show error toast. DO NOT FALL BACK TO CHARTS!
  showToast(`Unable to play "${mix.title}". Please try again.`, '⚠️');
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

function selectRotatingTracks(pool, count = 16, shouldRotate = false) {
  if (!pool || pool.length === 0) return [];
  if (pool.length <= count && !shouldRotate) return pool.slice(0, count);

  if (shouldRotate && pool.length > 2) {
    // Perform pseudo-randomized Fisher-Yates shuffle on a copy so each refresh yields fresh songs
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = tmp;
    }
    return shuffled.slice(0, count);
  }
  return pool.slice(0, count);
}

function prepareHomeShelves(apiShelves = [], shouldRotate = false) {
  const allShelves = [];
  const claimedShelves = new Set();

  let apiQuick = null;
  let apiMix = null;
  let apiForgotten = null;
  let apiTrending = null;
  let apiTogether = null;

  // 1. Identify Quick picks (YouTube Music horizontal line-like cards)
  apiQuick = apiShelves.find(s => s.title && (
    s.title.toLowerCase().includes('quick') ||
    s.title.toLowerCase().includes('start radio') ||
    s.title.toLowerCase().includes('songs you might like')
  ) && !s.title.toLowerCase().includes('listen again'));

  // 2. Identify Mix for you (Authentic YouTube Music Mixed for you shelf)
  apiMix = apiShelves.find(s => s.title && (
    s.title.toLowerCase().includes('mixed for you') ||
    s.title.toLowerCase().includes('mix for you') ||
    s.title.toLowerCase().includes('mixes for you') ||
    s.title.toLowerCase().includes('your mix') ||
    s.title.toLowerCase().trim() === 'mixed for you' ||
    s.title.toLowerCase().trim() === 'mix for you'
  ) && !s.title.toLowerCase().includes('listen again'));

  if (!apiMix) {
    apiMix = apiShelves.find(s => (
      (s.mixes && s.mixes.length > 0) ||
      (s.title && s.title.toLowerCase().includes('mix')) ||
      (s.badge && s.badge.toLowerCase().includes('mix'))
    ) && !s.title.toLowerCase().includes('listen again') &&
         !s.title.toLowerCase().includes('quick') &&
         !s.title.toLowerCase().includes('forgot') &&
         !s.title.toLowerCase().includes('together'));
  }

  // 3. Identify Forgotten favorites (YouTube Music horizontal line-like cards)
  apiForgotten = apiShelves.find(s => s !== apiMix && s.title && (
    s.title.toLowerCase().includes('forgot') ||
    s.title.toLowerCase().includes('revisit') ||
    s.title.toLowerCase().includes('rediscover') ||
    s.title.toLowerCase().includes('replay') ||
    s.title.toLowerCase().includes('past favorite') ||
    s.title.toLowerCase().includes('throwback') ||
    s.title.toLowerCase().includes('feel good') ||
    s.title.toLowerCase().includes('feel-good')
  ) && !s.title.toLowerCase().includes('listen again'));

  // 4. Identify Trending songs for you (YouTube Music horizontal line-like cards)
  apiTrending = apiShelves.find(s => s !== apiMix && s.title && (
    s.title.toLowerCase().includes('trend') ||
    s.title.toLowerCase().includes('chart') ||
    s.title.toLowerCase().includes('buzz') ||
    s.title.toLowerCase().includes('hit') ||
    s.title.toLowerCase().includes('popular') ||
    s.title.toLowerCase().includes('video')
  ) && !s.title.toLowerCase().includes('listen again') && (s.tracks && s.tracks.length > 0));

  if (!apiTrending) {
    apiTrending = apiShelves.find(s => s !== apiMix && s.title && (
      s.title.toLowerCase().includes('trend') ||
      s.title.toLowerCase().includes('chart') ||
      s.title.toLowerCase().includes('buzz') ||
      s.title.toLowerCase().includes('hit') ||
      s.title.toLowerCase().includes('popular') ||
      s.title.toLowerCase().includes('video')
    ) && !s.title.toLowerCase().includes('listen again'));
  }

  // 5. Identify Listen together (Party, Social & Communal Picks)
  apiTogether = apiShelves.find(s => s !== apiMix && s.title && (
    s.title.toLowerCase().includes('together') ||
    s.title.toLowerCase().includes('party') ||
    s.title.toLowerCase().includes('hangout') ||
    s.title.toLowerCase().includes('group') ||
    s.title.toLowerCase().includes('friends') ||
    s.title.toLowerCase().includes('communal') ||
    s.title.toLowerCase().includes('dance')
  ) && !s.title.toLowerCase().includes('listen again'));

  // If no explicit Quick picks title, look for another track shelf that wasn't claimed
  if (!apiQuick) {
    apiQuick = apiShelves.find(s => s !== apiMix && s !== apiForgotten && s !== apiTrending && s !== apiTogether && s.tracks && s.tracks.length >= 4 &&
      !s.title.toLowerCase().includes('listen again')
    );
  }

  // Claim all identified core shelves up front so none steals tracks from another
  if (apiQuick) claimedShelves.add(apiQuick);
  if (apiMix) claimedShelves.add(apiMix);
  if (apiForgotten) claimedShelves.add(apiForgotten);
  if (apiTrending) claimedShelves.add(apiTrending);
  if (apiTogether) claimedShelves.add(apiTogether);

  // --- Populate 1. Quick picks ---
  const quickPool = [];
  const quickSeen = new Set();
  if (apiQuick && apiQuick.tracks) {
    for (const t of apiQuick.tracks) {
      if (!quickSeen.has(t.id) && !isPodcastOrLongTrack(t)) {
        quickSeen.add(t.id);
        quickPool.push(t);
      }
    }
  }

  // Merge authentic tracks from unclaimed YouTube Music shelves
  if (quickPool.length < 16) {
    for (const s of apiShelves) {
      const sTitleLower = (s.title || '').toLowerCase();
      if (!claimedShelves.has(s) && !sTitleLower.includes('listen again') && s.tracks) {
        for (const t of s.tracks) {
          if (!quickSeen.has(t.id) && !isPodcastOrLongTrack(t)) {
            quickSeen.add(t.id);
            quickPool.push(t);
            if (quickPool.length >= 16) break;
          }
        }
      }
      if (quickPool.length >= 16) break;
    }
  }

  // If still under 16, draw from user's authentic library or history
  if (quickPool.length < 16 && typeof downloadedSet !== 'undefined') {
    for (const id of downloadedSet) {
      const t = findTrackAcrossAllSources(id);
      if (t && !quickSeen.has(t.id) && !isPodcastOrLongTrack(t)) {
        quickSeen.add(t.id);
        quickPool.push(t);
        if (quickPool.length >= 16) break;
      }
    }
  }

  // Only if zero YouTube Music shelves exist (first launch offline), use CATALOG as placeholder
  if (quickPool.length < 16 && apiShelves.length === 0 && typeof CATALOG !== 'undefined') {
    for (const t of CATALOG) {
      if (!quickSeen.has(t.id) && !isPodcastOrLongTrack(t)) {
        quickSeen.add(t.id);
        quickPool.push(t);
        if (quickPool.length >= 16) break;
      }
    }
  }

  const quickTracks = selectRotatingTracks(quickPool, 16, shouldRotate);
  allShelves.push({
    id: 'quick_picks',
    title: 'Quick picks',
    badge: (apiQuick && apiQuick.badge && !apiQuick.badge.toLowerCase().includes('listen again')) ? apiQuick.badge : 'START RADIO FROM A SONG',
    type: 'ytm-line',
    tracks: quickTracks
  });

  // --- Populate 2. Mix for you (Authentic YouTube Music Mixed for you shelf) ---
  let mixShelfMixes = [];
  let mixShelfTracks = [];

  if (apiMix) {
    if (apiMix.mixes && apiMix.mixes.length > 0) {
      mixShelfMixes = [...apiMix.mixes];
    }
    if (apiMix.tracks && apiMix.tracks.length > 0) {
      mixShelfTracks = apiMix.tracks.filter(t => !isPodcastOrLongTrack(t));
    }
  }

  // Also collect any authentic mixes from other live shelves
  for (const s of apiShelves) {
    if (s.mixes && s.mixes.length > 0) {
      const sLower = (s.title || '').toLowerCase();
      if (!sLower.includes('listen again')) {
        for (const m of s.mixes) {
          if (!mixShelfMixes.some(existing => existing.id === m.id || (m.playlistId && existing.playlistId === m.playlistId) || existing.title.toLowerCase() === m.title.toLowerCase())) {
            mixShelfMixes.push(m);
          }
        }
      }
    }
  }

  // If mixes have videoId, ensure original tracks and covers are available
  for (const m of mixShelfMixes) {
    if (m.videoId) {
      if (!m.cover || m.cover === 'assets/logo.png') {
        m.cover = `https://i.ytimg.com/vi/${m.videoId}/hqdefault.jpg`;
      }
      if (!m.tracks || m.tracks.length === 0) {
        const t = { id: m.videoId, title: m.title, artist: m.subtitle || 'Cloud Music', cover: m.cover, duration: 215, plays: 0 };
        m.tracks = [t];
        m.songIds = [m.videoId];
        if (!mixShelfTracks.some(existing => existing.id === m.videoId)) {
          mixShelfTracks.push(t);
        }
      }
    } else if (m.tracks && m.tracks.length > 0 && (!m.cover || m.cover === 'assets/logo.png')) {
      if (m.tracks[0].cover) m.cover = m.tracks[0].cover;
    }
  }

  // Only if no authentic mixes were found at all (e.g. offline launch), use CURATED_MIXES
  if (mixShelfMixes.length === 0 && typeof CURATED_MIXES !== 'undefined') {
    for (const m of CURATED_MIXES) {
      mixShelfMixes.push(m);
    }
  }

  const chosenMixes = (shouldRotate && mixShelfMixes.length > 4)
    ? [...mixShelfMixes].sort(() => Math.random() - 0.5).slice(0, 10)
    : mixShelfMixes.slice(0, 10);

  const chosenMixTracks = selectRotatingTracks(mixShelfTracks, 16, shouldRotate);

  allShelves.push({
    id: 'mix_for_you',
    title: (apiMix && apiMix.title && !apiMix.title.toLowerCase().includes('listen again')) ? apiMix.title : 'Mix for you',
    badge: (apiMix && apiMix.badge) ? apiMix.badge : 'PLAYLISTS TAILORED FOR YOU',
    type: 'mix',
    mixes: chosenMixes,
    tracks: chosenMixTracks
  });

  // --- Populate 3. Forgotten favorites (YouTube Music horizontal line-like cards) ---
  const quickIds = new Set(quickTracks.map(t => t.id));
  const forgottenPool = [];
  const forgottenSeen = new Set();
  if (apiForgotten && apiForgotten.tracks) {
    for (const t of apiForgotten.tracks) {
      if (!forgottenSeen.has(t.id) && !isPodcastOrLongTrack(t)) {
        forgottenSeen.add(t.id);
        forgottenPool.push(t);
      }
    }
  }

  // Pull authentic past listening tracks from YouTube Music throwback / feel-good shelves
  if (forgottenPool.length < 16) {
    for (const s of apiShelves) {
      const sTitleLower = (s.title || '').toLowerCase();
      if ((sTitleLower.includes('replay') || sTitleLower.includes('revisit') || sTitleLower.includes('feel good') || sTitleLower.includes('feel-good') || sTitleLower.includes('throwback') || sTitleLower.includes('past favorite') || sTitleLower.includes('favorite')) && !sTitleLower.includes('listen again') && s.tracks) {
        for (const t of s.tracks) {
          if (!forgottenSeen.has(t.id) && !isPodcastOrLongTrack(t)) {
            forgottenSeen.add(t.id);
            forgottenPool.push(t);
            if (forgottenPool.length >= 16) break;
          }
        }
      }
      if (forgottenPool.length >= 16) break;
    }
  }

  // Merge authentic tracks from unclaimed YouTube Music shelves
  if (forgottenPool.length < 16) {
    for (const s of apiShelves) {
      const sTitleLower = (s.title || '').toLowerCase();
      if (!claimedShelves.has(s) && !sTitleLower.includes('listen again') && s.tracks) {
        for (const t of s.tracks) {
          if (!forgottenSeen.has(t.id) && !isPodcastOrLongTrack(t)) {
            forgottenSeen.add(t.id);
            forgottenPool.push(t);
            if (forgottenPool.length >= 16) break;
          }
        }
      }
      if (forgottenPool.length >= 16) break;
    }
  }

  // Only if zero YouTube Music shelves exist (first launch offline), use CATALOG as placeholder
  if (forgottenPool.length < 16 && apiShelves.length === 0 && typeof CATALOG !== 'undefined') {
    for (const t of CATALOG) {
      if (!forgottenSeen.has(t.id) && !quickIds.has(t.id) && !isPodcastOrLongTrack(t)) {
        forgottenSeen.add(t.id);
        forgottenPool.push(t);
        if (forgottenPool.length >= 16) break;
      }
    }
  }

  const forgottenTracks = selectRotatingTracks(forgottenPool, 16, shouldRotate);
  allShelves.push({
    id: 'forgotten_favorites',
    title: (apiForgotten && (apiForgotten.title.toLowerCase().includes('forgot') || apiForgotten.title.toLowerCase().includes('past favorite'))) ? apiForgotten.title : 'Forgotten favorites',
    badge: (apiForgotten && apiForgotten.badge) ? apiForgotten.badge : 'REVISIT PAST FAVORITES',
    type: 'ytm-line',
    tracks: forgottenTracks
  });

  // --- Populate 4. Trending songs for you (YouTube Music horizontal line-like cards) ---
  const forgottenIds = new Set(forgottenTracks.map(t => t.id));
  const trendPool = [];
  const trendSeen = new Set();
  if (apiTrending && apiTrending.tracks) {
    for (const t of apiTrending.tracks) {
      if (!trendSeen.has(t.id) && !isPodcastOrLongTrack(t)) {
        trendSeen.add(t.id);
        trendPool.push(t);
      }
    }
  }

  // Merge authentic tracks from unclaimed YouTube Music shelves
  if (trendPool.length < 16) {
    for (const s of apiShelves) {
      const sTitleLower = (s.title || '').toLowerCase();
      if (!claimedShelves.has(s) && !sTitleLower.includes('listen again') && s.tracks) {
        for (const t of s.tracks) {
          if (!trendSeen.has(t.id) && !isPodcastOrLongTrack(t)) {
            trendSeen.add(t.id);
            trendPool.push(t);
            if (trendPool.length >= 16) break;
          }
        }
      }
      if (trendPool.length >= 16) break;
    }
  }

  // Only if zero YouTube Music shelves exist (first launch offline), use CATALOG as placeholder
  if (trendPool.length < 16 && apiShelves.length === 0 && typeof CATALOG !== 'undefined') {
    for (const t of CATALOG) {
      if (!trendSeen.has(t.id) && !quickIds.has(t.id) && !forgottenIds.has(t.id) && !isPodcastOrLongTrack(t)) {
        trendSeen.add(t.id);
        trendPool.push(t);
        if (trendPool.length >= 16) break;
      }
    }
  }

  const trendTracks = selectRotatingTracks(trendPool, 16, shouldRotate);
  allShelves.push({
    id: 'trending_for_you',
    title: (apiTrending && apiTrending.title.toLowerCase().includes('trend')) ? apiTrending.title : 'Trending songs for you',
    badge: (apiTrending && apiTrending.badge) ? apiTrending.badge : 'CHARTS & BUZZ',
    type: 'ytm-line',
    tracks: trendTracks
  });

  // --- Populate 5. Listen together (Party, Social & Communal Picks) ---
  const trendIds = new Set(trendTracks.map(t => t.id));
  const togetherPool = [];
  const togetherSeen = new Set();
  if (apiTogether && apiTogether.tracks) {
    for (const t of apiTogether.tracks) {
      if (!togetherSeen.has(t.id) && !isPodcastOrLongTrack(t)) {
        togetherSeen.add(t.id);
        togetherPool.push(t);
      }
    }
  }

  // Merge authentic tracks from unclaimed YouTube Music shelves
  if (togetherPool.length < 16) {
    for (const s of apiShelves) {
      const sTitleLower = (s.title || '').toLowerCase();
      if (!claimedShelves.has(s) && !sTitleLower.includes('listen again') && s.tracks) {
        for (const t of s.tracks) {
          if (!togetherSeen.has(t.id) && !isPodcastOrLongTrack(t)) {
            togetherSeen.add(t.id);
            togetherPool.push(t);
            if (togetherPool.length >= 16) break;
          }
        }
      }
      if (togetherPool.length >= 16) break;
    }
  }

  // Only if zero YouTube Music shelves exist (first launch offline), use CATALOG as placeholder
  if (togetherPool.length < 16 && apiShelves.length === 0 && typeof CATALOG !== 'undefined') {
    for (const t of CATALOG) {
      if (!togetherSeen.has(t.id) && !quickIds.has(t.id) && !forgottenIds.has(t.id) && !trendIds.has(t.id) && !isPodcastOrLongTrack(t)) {
        togetherSeen.add(t.id);
        togetherPool.push(t);
        if (togetherPool.length >= 16) break;
      }
    }
  }

  const togetherTracks = selectRotatingTracks(togetherPool, 16, shouldRotate);
  allShelves.push({
    id: 'listen_together',
    title: (apiTogether && apiTogether.title.toLowerCase().includes('together')) ? apiTogether.title : 'Listen together',
    badge: (apiTogether && apiTogether.badge) ? apiTogether.badge : 'GROUP SESSION & PARTY PICKS',
    type: 'ytm-line',
    tracks: togetherTracks
  });

  // Track canonical titles already added to prevent duplicate / redundant sections
  const seenShelfTitles = new Set([
    'quick picks',
    'mix for you',
    'mixed for you',
    'mixes for you',
    'forgotten favorites',
    'trending songs for you',
    'trending for you',
    'listen together'
  ]);
  for (const s of allShelves) {
    if (s.title) seenShelfTitles.add(s.title.toLowerCase().trim());
  }

  // 6. Additional live track shelves from YouTube Music (e.g. Similar to..., Artist Radios)
  for (const s of apiShelves) {
    if (!claimedShelves.has(s) && s.tracks && s.tracks.length > 0) {
      const lower = (s.title || '').toLowerCase().trim();
      const badgeLower = (s.badge || '').toLowerCase().trim();
      if (lower.includes('podcast') || lower.includes('episode') ||
          badgeLower.includes('podcast') || badgeLower.includes('episode') ||
          lower.includes('listen again') || badgeLower.includes('listen again') ||
          lower.includes('recently played') || badgeLower.includes('recently played') ||
          lower.includes('history') || badgeLower.includes('history')) {
        continue;
      }
      // Prohibit duplicate sections of core shelves
      if (lower.includes('quick') ||
          lower.includes('mix for you') || lower.includes('mixed for you') ||
          lower.includes('forgot') || lower.includes('past favorite') ||
          lower.includes('trend') || lower.includes('chart') ||
          lower.includes('together') || lower.includes('party')) {
        continue;
      }
      if (seenShelfTitles.has(lower) || allShelves.some(existing => existing.title.toLowerCase().trim() === lower)) {
        continue;
      }
      const filteredTracks = s.tracks.filter(t => !isPodcastOrLongTrack(t));
      if (filteredTracks.length > 0) {
        claimedShelves.add(s);
        seenShelfTitles.add(lower);
        allShelves.push({
          id: 'shelf_' + s.title.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
          title: s.title,
          badge: s.badge || 'CURATED HIT',
          type: 'ytm-line',
          tracks: selectRotatingTracks(filteredTracks, 16, shouldRotate)
        });
      }
    }
  }

  // 7. Additional live mix/playlist shelves from YouTube Music (e.g. Dancing on your own, Easy Evenings)
  for (const s of apiShelves) {
    if (!claimedShelves.has(s) && s.mixes && s.mixes.length > 0) {
      const lower = (s.title || '').toLowerCase().trim();
      const badgeLower = (s.badge || '').toLowerCase().trim();
      if (lower.includes('podcast') || lower.includes('episode') ||
          badgeLower.includes('podcast') || badgeLower.includes('episode') ||
          lower.includes('listen again') || badgeLower.includes('listen again') ||
          lower.includes('recently played') || badgeLower.includes('recently played') ||
          lower.includes('history') || badgeLower.includes('history')) {
        continue;
      }
      // Prohibit duplicate sections of core shelves
      if (lower.includes('quick') ||
          lower.includes('mix for you') || lower.includes('mixed for you') ||
          lower.includes('mixes for you') || lower.includes('your mix') ||
          lower.includes('forgot') || lower.includes('past favorite') ||
          lower.includes('trend') || lower.includes('chart') ||
          lower.includes('together') || lower.includes('party')) {
        continue;
      }
      if (seenShelfTitles.has(lower) || allShelves.some(existing => existing.title.toLowerCase().trim() === lower)) {
        continue;
      }
      claimedShelves.add(s);
      seenShelfTitles.add(lower);
      allShelves.push({
        id: 'shelf_mix_' + s.title.replace(/[^a-z0-9]/gi, '_').toLowerCase(),
        title: s.title,
        badge: s.badge || 'PLAYLISTS & MIXES',
        type: 'mix',
        mixes: (shouldRotate && s.mixes.length > 3)
          ? [...s.mixes].sort(() => Math.random() - 0.5).slice(0, 8)
          : s.mixes.slice(0, 8)
      });
    }
  }

  // Final pass: Strictly deduplicate shelves by id and normalized title, and enforce removal of any Listen again shelf
  const finalShelves = [];
  const finalSeenTitles = new Set();
  const finalSeenIds = new Set();

  for (const s of allShelves) {
    const normTitle = (s.title || '').toLowerCase().trim();
    const sId = s.id || '';
    if (normTitle.includes('listen again') || (s.badge && s.badge.toLowerCase().includes('listen again'))) {
      continue;
    }
    if (finalSeenIds.has(sId) || finalSeenTitles.has(normTitle)) {
      continue;
    }
    finalSeenIds.add(sId);
    finalSeenTitles.add(normTitle);
    finalShelves.push(s);
  }

  return finalShelves;
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
      <div onclick="loginWithGoogle()" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(6, 182, 212, 0.08)); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: var(--radius-lg); padding: 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 40px; height: 40px; border-radius: 12px; background: linear-gradient(135deg, #6366F1, #06B6D4); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35); flex-shrink: 0;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path></svg>
          </div>
          <div>
            <div style="font-size: 13px; font-weight: 800; color: #fff;">Connect Cloud Account</div>
            <div style="font-size: 11px; color: var(--text-muted);">Sign in for your personal mixes, library & history</div>
          </div>
        </div>
        <button class="filter-pill active auth-banner-signin-btn">Sign In</button>
      </div>
    `;
  }
}

function renderHomeShelves(rawShelves, shouldRotate = false) {
  const container = document.getElementById('homeFeedContainer');
  if (!container) return;

  const shelves = prepareHomeShelves(rawShelves, shouldRotate);
  const visibleShelves = shelves.filter(s => (s.tracks && s.tracks.length > 0) || (s.mixes && s.mixes.length > 0));
  currentHomeShelves = visibleShelves;

  if (visibleShelves.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 16px; color: var(--text-muted);">
        <svg width="28" height="28" fill="var(--accent-primary)" viewBox="0 0 24 24" class="spin-icon" style="margin-bottom: 12px;"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
        <div style="font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 6px;">Syncing Music Feed</div>
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
          ${shelf.tracks.map(t => createYtmLineCardHtml(t, shelf.id)).join('')}
        </div>
      `;
    } else if (shelf.type === 'mix') {
      const mixesHtml = (shelf.mixes && shelf.mixes.length > 0)
        ? `<div class="shelf-container">${shelf.mixes.map(createMixCardHtml).join('')}</div>`
        : '';
      const tracksHtml = (shelf.tracks && shelf.tracks.length > 0)
        ? `<div class="ytm-grid-shelf" style="margin-top: 12px;">${shelf.tracks.map(t => createYtmLineCardHtml(t, shelf.id)).join('')}</div>`
        : '';
      return `
        <div class="section-title-row" style="margin-top: 22px;">
          <div>
            <span class="ytm-shelf-badge">${shelf.badge || 'PLAYLISTS TAILORED FOR YOU'}</span>
            <h2 class="section-title">${shelf.title}</h2>
          </div>
        </div>
        ${mixesHtml}
        ${tracksHtml}
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
window.selectRotatingTracks = selectRotatingTracks;
window.prepareHomeShelves = prepareHomeShelves;
window.updateHomeAuthBanner = updateHomeAuthBanner;
window.renderHomeShelves = renderHomeShelves;
window.loadHomeFeed = loadHomeFeed;
window.renderShelves = renderShelves;
