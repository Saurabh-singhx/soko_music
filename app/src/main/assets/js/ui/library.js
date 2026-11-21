// ============================================================
// LIBRARY & TRACK ROW UI - Vibrant Light Redesign
// ============================================================
function createTrackRowHtml(track, isInsidePlaylist = false, isLibraryView = false) {
  const isCached = isTrackOffline(track.id);
  const isDownloading = activeDownloads.has(track.id);
  const fallbackArt = (typeof getSvgArtworkFallback === 'function') ? getSvgArtworkFallback(track.id, '♫') : 'assets/logo.png';
  const coverSrc = track.cover || fallbackArt;

  return `
    <div class="track-row" onclick="selectTrackToPlay('${track.id}')">
      <img class="track-art" src="${coverSrc}" alt="${track.title || 'Track'}" onerror="if (typeof handleImageLoadError === 'function') handleImageLoadError(this, '${track.id}'); else { this.onerror=null; this.src='assets/logo.png'; }" loading="lazy" />
      <div class="track-meta">
        <div class="track-title">${track.title || 'Unknown Title'}</div>
        <div class="track-desc">${track.artist || 'Unknown Artist'} &middot; ${formatTime(track.duration)}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
        ${isLibraryView ? `
          <span title="Stored Offline" style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: #ECFDF5; color: #16A34A; margin-right: 2px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </span>
        ` : `
          <button class="action-icon-btn-compact" onclick="event.stopPropagation(); startDownloadTrack('${track.id}')" title="${isCached ? 'Cached Offline' : (isDownloading ? 'Downloading...' : 'Download')}" aria-label="${isCached ? 'Cached Offline' : 'Download'}">
            ${isCached ? 
              '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : 
              (isDownloading ? 
                '<svg width="17" height="17" fill="#FF5A1F" viewBox="0 0 24 24" class="spin-icon"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>' : 
                '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>'
              )
            }
          </button>
        `}
        ${isInsidePlaylist ? `
          <button class="action-icon-btn-compact" onclick="event.stopPropagation(); removeSongFromActivePlaylist('${track.id}')" title="Remove" style="color: var(--brand-red);">✕</button>
        ` : `
          <button class="action-icon-btn-compact" onclick="event.stopPropagation(); promptAddSongToPlaylist('${track.id}')" title="Add to playlist">
            <svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          </button>
        `}
        ${isLibraryView ? `
          <button class="action-icon-btn-compact" onclick="event.stopPropagation(); deleteOfflineTrack('${track.id}')" title="Delete from Offline" style="color: var(--text-dim);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

function filterLibraryTracks(query) {
  currentLibraryFilter = (query || '').trim().toLowerCase();
  currentLibraryPage = 1;
  renderLibraryTracks();
}

function setLibraryPage(page) {
  currentLibraryPage = page;
  renderLibraryTracks();
  const listEl = document.getElementById('libraryTracksList');
  if (listEl && typeof listEl.scrollIntoView === 'function') {
    listEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function playAllOfflineTracks(shuffle = false) {
  const filterFn = (typeof isPodcastOrLongTrack === 'function')
    ? isPodcastOrLongTrack
    : (typeof window !== 'undefined' && typeof window.isPodcastOrLongTrack === 'function' ? window.isPodcastOrLongTrack : null);
  const cached = Array.from(downloadedSet).map(id => {
    let t = findTrackAcrossAllSources(id);
    if (!t) {
      let localArt = 'assets/logo.png';
      if (typeof window !== 'undefined' && window.SokoNative && typeof window.SokoNative.getDownloadedCoverPath === 'function') {
        try {
          if (window.SokoNative.getDownloadedCoverPath(id)) localArt = 'artworks/' + id + '.jpg';
        } catch (e) {}
      }
      t = { id, title: 'Offline Song', artist: 'Soko Offline', duration: 200, cover: localArt };
    }
    return t;
  }).filter(t => t && !(filterFn ? filterFn(t) : (Number(t.duration) || 0) > 600));
  if (cached.length === 0) {
    showToast('No downloaded songs in offline storage', 'ℹ️');
    return;
  }
  isShuffle = shuffle;
  window.isShuffle = isShuffle;
  const btn = document.getElementById('btnShuffle');
  if (btn) btn.style.color = isShuffle ? 'var(--brand-orange)' : 'var(--text-dim)';

  window.activeQueueList = cached;
  const firstTrack = isShuffle ? cached[Math.floor(Math.random() * cached.length)] : cached[0];
  selectTrackToPlay(firstTrack.id);
  showToast(isShuffle ? 'Shuffling All Offline Songs 🔀' : 'Playing All Offline Songs ▶', '⚡');
}

function deleteOfflineTrack(trackId) {
  if (!trackId) return;
  if (BUNDLED_TRACKS.some(b => b.id === trackId)) {
    showToast('Bundled core tracks cannot be removed from storage', 'ℹ️');
    return;
  }
  const track = findTrackAcrossAllSources(trackId);
  downloadedSet.delete(trackId);

  if (typeof window !== 'undefined' && window.SokoNative && window.SokoNative.deleteDownloadedTrack) {
    try {
      window.SokoNative.deleteDownloadedTrack(trackId);
    } catch (e) {
      console.warn('[Storage] Native track deletion error:', e);
    }
  }

  const offPl = userPlaylists.find(p => p.id === 'pl_offline');
  if (offPl) {
    offPl.songIds = offPl.songIds.filter(id => id !== trackId);
  }

  const inOtherPlaylist = userPlaylists.some(p => p.id !== 'pl_offline' && p.songIds && p.songIds.includes(trackId));
  const isFav = userPlaylists.find(p => p.id === 'pl_favorites')?.songIds?.includes(trackId) || (track && track.favorite);
  if (!inOtherPlaylist && !isFav) {
    const catIdx = CATALOG.findIndex(t => t.id === trackId);
    if (catIdx >= 0) {
      CATALOG.splice(catIdx, 1);
    }
  }

  persistDownloadState();
  updateStorageMetrics();
  renderLibraryTracks();
  renderPlaylists();
  renderShelves();
  showToast(`Removed "${track ? track.title : 'Song'}" from offline storage`, '🗑️');
}

function setLibrarySort(sortKey) {
  if (currentLibrarySort === sortKey) {
    currentLibrarySortDir = currentLibrarySortDir === 'asc' ? 'desc' : 'asc';
  } else {
    currentLibrarySort = sortKey;
    currentLibrarySortDir = (sortKey === 'duration' || sortKey === 'recent') ? 'desc' : 'asc';
  }
  currentLibraryPage = 1;
  const chips = document.querySelectorAll('.library-sort-chip');
  if (chips && chips.forEach) {
    chips.forEach(c => {
      if (c.classList && c.classList.remove) c.classList.remove('active');
      if (typeof c.querySelector === 'function') {
        const arrow = c.querySelector('.sort-dir-arrow');
        if (arrow) arrow.textContent = '';
      }
    });
  }
  const activeBtn = document.getElementById('sortBtn-' + sortKey);
  if (activeBtn) {
    if (activeBtn.classList && activeBtn.classList.add) activeBtn.classList.add('active');
    if (typeof activeBtn.querySelector === 'function') {
      const arrow = activeBtn.querySelector('.sort-dir-arrow');
      if (arrow) {
        arrow.textContent = currentLibrarySortDir === 'asc' ? ' ↑' : ' ↓';
      }
    }
  }
  renderLibraryTracks();
}

function renderLibraryTracks() {
  const list = document.getElementById('libraryTracksList');
  const badge = document.getElementById('librarySongCountBadge');
  const paginationEl = document.getElementById('libraryPagination');
  if (!list) return;

  const filterFn = (typeof isPodcastOrLongTrack === 'function')
    ? isPodcastOrLongTrack
    : (typeof window !== 'undefined' && typeof window.isPodcastOrLongTrack === 'function' ? window.isPodcastOrLongTrack : null);
  const seenIds = new Set();
  let cachedTracks = [];
  for (const id of downloadedSet) {
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    let t = findTrackAcrossAllSources(id);
    if (!t) {
      let localArt = 'assets/logo.png';
      if (typeof window !== 'undefined' && window.SokoNative && typeof window.SokoNative.getDownloadedCoverPath === 'function') {
        try {
          if (window.SokoNative.getDownloadedCoverPath(id)) localArt = 'artworks/' + id + '.jpg';
        } catch (e) {}
      }
      t = { id, title: 'Downloaded Track', artist: 'Offline Storage', duration: 215, cover: localArt };
    }
    if (t && !(filterFn ? filterFn(t) : (Number(t.duration) || 0) > 600)) {
      cachedTracks.push(t);
    }
  }

  if (badge) {
    badge.innerText = `${cachedTracks.length} song${cachedTracks.length === 1 ? '' : 's'}`;
  }

  if (currentLibraryFilter) {
    const query = currentLibraryFilter.toLowerCase();
    cachedTracks = cachedTracks.filter(t => 
      (t.title && t.title.toLowerCase().includes(query)) ||
      (t.artist && t.artist.toLowerCase().includes(query))
    );
  }

  // Apply Sorting
  if (currentLibrarySort === 'title') {
    cachedTracks.sort((a, b) => {
      const cmp = (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
      return currentLibrarySortDir === 'desc' ? -cmp : cmp;
    });
  } else if (currentLibrarySort === 'artist') {
    cachedTracks.sort((a, b) => {
      const cmp = (a.artist || '').localeCompare(b.artist || '', undefined, { sensitivity: 'base' }) ||
                  (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' });
      return currentLibrarySortDir === 'desc' ? -cmp : cmp;
    });
  } else if (currentLibrarySort === 'duration') {
    cachedTracks.sort((a, b) => {
      const diff = (b.duration || 0) - (a.duration || 0);
      return currentLibrarySortDir === 'desc' ? diff : -diff;
    });
  } else {
    // 'recent': O(1) index map for instant O(N log N) sort
    const indexMap = new Map();
    let idx = 0;
    for (const id of downloadedSet) {
      indexMap.set(id, idx++);
    }
    cachedTracks.sort((a, b) => {
      const posA = indexMap.get(a.id) ?? 0;
      const posB = indexMap.get(b.id) ?? 0;
      return currentLibrarySortDir === 'asc' ? (posA - posB) : (posB - posA);
    });
  }

  if (cachedTracks.length === 0) {
    if (currentLibraryFilter) {
      list.innerHTML = `
        <div style="text-align: center; padding: 36px 16px; color: var(--text-muted);">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: #FFF3ED; color: var(--brand-orange); display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; border: 1px solid var(--brand-orange-border);">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 4px;">No matching offline songs</div>
          <div style="font-size: 12px; color: var(--text-muted);">No downloaded tracks match "${currentLibraryFilter}"</div>
        </div>
      `;
    } else {
      list.innerHTML = `
        <div style="text-align: center; padding: 36px 16px; background: #FFFFFF; border: 1px dashed var(--border-subtle); border-radius: var(--radius-md); margin-top: 8px; box-shadow: var(--shadow-card);">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: #ECFDF5; color: var(--brand-green); display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; border: 1px solid var(--brand-green-border);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </div>
          <div style="font-size: 14px; font-weight: 800; color: #111827; margin-bottom: 4px;">No offline songs yet</div>
          <div style="font-size: 12px; color: var(--text-muted); max-width: 260px; margin: 0 auto 16px; line-height: 1.45;">
            Download songs from Charts or Search for instant, 0-buffering playback anywhere.
          </div>
          <button class="filter-pill active" onclick="switchNavTab('charts', document.querySelectorAll('.nav-tab-item')[1])" style="padding: 8px 20px; font-size: 12px; font-weight: 700; margin: 0 auto;">
            Explore Top Charts
          </button>
        </div>
      `;
    }
    if (paginationEl) paginationEl.innerHTML = '';
    return;
  }

  const totalPages = Math.ceil(cachedTracks.length / LIBRARY_PER_PAGE);
  if (currentLibraryPage > totalPages) currentLibraryPage = totalPages;
  if (currentLibraryPage < 1) currentLibraryPage = 1;

  const startIndex = (currentLibraryPage - 1) * LIBRARY_PER_PAGE;
  const pageTracks = cachedTracks.slice(startIndex, startIndex + LIBRARY_PER_PAGE);

  list.innerHTML = pageTracks.map(t => createTrackRowHtml(t, false, true)).join('');

  if (paginationEl) {
    if (totalPages > 1) {
      paginationEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 4px 6px; font-size: 12px;">
          <button class="filter-pill ${currentLibraryPage === 1 ? 'disabled' : ''}" 
            style="padding: 6px 14px; font-size: 11px; ${currentLibraryPage === 1 ? 'opacity: 0.4; pointer-events: none;' : ''}"
            onclick="setLibraryPage(${currentLibraryPage - 1})">
            ‹ Prev
          </button>
          <span style="color: var(--text-muted); font-size: 11px; font-family: ui-monospace, monospace; font-weight: 700;">
            Page ${currentLibraryPage} of ${totalPages} (${cachedTracks.length} total)
          </span>
          <button class="filter-pill ${currentLibraryPage === totalPages ? 'disabled' : ''}" 
            style="padding: 6px 14px; font-size: 11px; ${currentLibraryPage === totalPages ? 'opacity: 0.4; pointer-events: none;' : ''}"
            onclick="setLibraryPage(${currentLibraryPage + 1})">
            Next ›
          </button>
        </div>
      `;
    } else {
      paginationEl.innerHTML = '';
    }
  }
}

window.createTrackRowHtml = createTrackRowHtml;
window.filterLibraryTracks = filterLibraryTracks;
window.setLibraryPage = setLibraryPage;
window.playAllOfflineTracks = playAllOfflineTracks;
window.deleteOfflineTrack = deleteOfflineTrack;
window.setLibrarySort = setLibrarySort;
window.renderLibraryTracks = renderLibraryTracks;
