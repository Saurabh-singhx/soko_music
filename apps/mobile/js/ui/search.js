// ============================================================
// SEARCH RESULTS UI & FILTERING - Vibrant Light Redesign
// ============================================================

function renderSearchResults(container, tracks, isLoadingMore) {
  if (!container) return;

  if (tracks.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 48px 16px;">
        <div style="width: 52px; height: 52px; border-radius: 16px; background: #FFF3ED; color: var(--brand-orange); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; border: 1px solid var(--brand-orange-border);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 4px;">No matching songs found</div>
        <div style="font-size: 12px; color: var(--text-muted);">Try a different track title, artist name, or filter pill</div>
      </div>
    `;
    return;
  }

  let html = tracks.map(track => {
    const isDownloaded = isTrackOffline(track.id);
    const isDownloading = activeDownloads.has(track.id);
    const isCurrentPlaying = currentTrack && currentTrack.id === track.id && isPlaying;
    const fallbackArt = (typeof getSvgArtworkFallback === 'function') ? getSvgArtworkFallback(track.id, '♫') : 'assets/logo.png';
    const coverSrc = track.cover || fallbackArt;

    return `
      <div class="search-track-card" onclick="selectTrackToPlay('${track.id}')">
        <div class="search-track-art-wrapper">
          <img class="search-track-art" src="${coverSrc}" alt="${track.title}" onerror="if (typeof handleImageLoadError === 'function') handleImageLoadError(this, '${track.id}'); else { this.onerror=null; this.src='assets/logo.png'; }" loading="lazy" />
          <div class="search-play-badge ${isCurrentPlaying ? 'playing' : ''}">
            ${isCurrentPlaying ? 
              '<svg width="14" height="14" fill="#FFFFFF" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>' :
              '<svg width="14" height="14" fill="#FFFFFF" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'
            }
          </div>
        </div>
        <div class="search-track-info">
          <div class="search-track-title">${track.title}</div>
          <div class="search-track-artist">${track.artist}</div>
        </div>
        <div class="search-track-actions">
          <button class="search-btn-action" title="${isDownloaded ? 'Downloaded Offline' : (isDownloading ? 'Downloading...' : 'Download')}" aria-label="${isDownloaded ? 'Downloaded' : 'Download'}" onclick="event.stopPropagation(); startDownloadTrack('${track.id}')">
            ${isDownloaded ? 
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : 
              (isDownloading ? 
                '<svg width="18" height="18" fill="#FF5A1F" viewBox="0 0 24 24" class="spin-icon"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>' :
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>'
              )
            }
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (isLoadingMore) {
    html += '<div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 12px; font-weight: 600;">Searching Music Catalog...</div>';
  }

  container.innerHTML = html;
}

function filterSearchCategory(cat) {
  document.querySelectorAll('#pane-search .filter-pill').forEach(p => p.classList.remove('active'));
  if (typeof event !== 'undefined' && event && event.target) {
    const pill = event.target.closest('.filter-pill');
    if (pill) pill.classList.add('active');
  }
  const input = document.getElementById('searchInput');
  const q = input ? input.value : '';

  if (cat === 'offline') {
    const offlineList = Array.from(downloadedSet).map(id => {
      let t = findTrackAcrossAllSources(id);
      if (!t) {
        t = { id, title: 'Offline Song', artist: 'Soko Offline', duration: 200, cover: 'assets/logo.png' };
      }
      return t;
    }).filter(Boolean);
    currentYtmSearchResults = offlineList;
    window.currentYtmSearchResults = offlineList;
    renderSearchResults(document.getElementById('searchResultsList'), offlineList, false);
  } else if (cat === 'favorites') {
    const favPl = userPlaylists.find(p => p.id === 'pl_favorites');
    const favIds = favPl ? favPl.songIds : [];
    const allFavIds = Array.from(new Set([...favIds, ...CATALOG.filter(t => t.favorite).map(t => t.id)]));
    const favList = allFavIds.map(id => {
      let t = findTrackAcrossAllSources(id);
      if (!t) {
        t = { id, title: 'Favorite Song', artist: 'Soko Music', duration: 200, cover: 'assets/logo.png' };
      }
      return t;
    }).filter(Boolean);
    currentYtmSearchResults = favList;
    window.currentYtmSearchResults = favList;
    renderSearchResults(document.getElementById('searchResultsList'), favList, false);
  } else {
    executeSearch(q);
  }
}

window.renderSearchResults = renderSearchResults;
window.filterSearchCategory = filterSearchCategory;
