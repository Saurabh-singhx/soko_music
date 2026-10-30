// ============================================================
// LIBRARY & TRACK ROW UI
// ============================================================
function createTrackRowHtml(track, isInsidePlaylist = false, isLibraryView = false) {
  const isCached = isTrackOffline(track.id);
  const isDownloading = activeDownloads.has(track.id);
  return `
    <div class="track-row" onclick="selectTrackToPlay('${track.id}')">
      <img class="track-art" src="${track.cover}" alt="${track.title}" onerror="this.onerror=null; this.src='assets/logo.png';" />
      <div class="track-meta">
        <div class="track-title">${track.title}</div>
        <div class="track-desc">${track.artist} • ${formatTime(track.duration)}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
        ${isLibraryView ? `
          <span title="Stored Offline" style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; color: #10B981; margin-right: 2px;">
            <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
          </span>
        ` : `
          <button class="action-icon-btn-compact" onclick="event.stopPropagation(); startDownloadTrack('${track.id}')" title="${isCached ? 'Cached Offline' : 'Download'}">
            ${isCached ? 
              '<svg width="17" height="17" fill="#10B981" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' : 
              (isDownloading ? 
                '<svg width="17" height="17" fill="#F59E0B" viewBox="0 0 24 24" class="spin-icon"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>' : 
                '<svg width="17" height="17" fill="var(--text-dim)" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>'
              )
            }
          </button>
        `}
        ${isInsidePlaylist ? `
          <button class="action-icon-btn-compact" onclick="event.stopPropagation(); removeSongFromActivePlaylist('${track.id}')" title="Remove">✕</button>
        ` : `
          <button class="action-icon-btn-compact" onclick="event.stopPropagation(); promptAddSongToPlaylist('${track.id}')" title="Add to playlist">
            <svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
          </button>
        `}
        ${isLibraryView ? `
          <button class="action-icon-btn-compact" onclick="event.stopPropagation(); deleteOfflineTrack('${track.id}')" title="Delete from Offline" style="color: var(--text-dim);">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
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
      t = { id, title: 'Offline Song', artist: 'Soko Offline', duration: 200, cover: 'assets/logo.png' };
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
  if (btn) btn.style.color = isShuffle ? 'var(--accent-primary)' : 'var(--text-dim)';

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
    const t = findTrackAcrossAllSources(id);
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
        <div style="text-align: center; padding: 32px 16px; color: var(--text-dim);">
          <div style="font-size: 28px; margin-bottom: 8px;">🔍</div>
          <div style="font-size: 13px; font-weight: 600; color: #FFF; margin-bottom: 4px;">No matching offline songs</div>
          <div style="font-size: 11px;">No downloaded tracks match "${currentLibraryFilter}"</div>
        </div>
      `;
    } else {
      list.innerHTML = `
        <div style="text-align: center; padding: 36px 16px; background: var(--bg-card); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md); margin-top: 8px;">
          <div style="font-size: 32px; margin-bottom: 8px;">📥</div>
          <div style="font-size: 14px; font-weight: 700; color: #FFF; margin-bottom: 4px;">No offline songs yet</div>
          <div style="font-size: 12px; color: var(--text-dim); max-width: 260px; margin: 0 auto 16px;">
            Download songs from Charts or Search for instant, 0-buffering playback anywhere.
          </div>
          <button class="filter-pill active" onclick="switchTab('charts')" style="padding: 8px 18px; font-size: 12px; font-weight: 600; margin: 0 auto;">
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
          <span style="color: var(--text-dim); font-size: 11px; font-family: ui-monospace, monospace;">
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
