// ============================================================
// SEARCH RESULTS UI & FILTERING
// ============================================================
function renderSearchResults(container, tracks, isLoadingMore) {
  if (tracks.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 40px;">No matching songs found</div>';
    return;
  }

  let html = tracks.map(track => {
    const isDownloaded = isTrackOffline(track.id);
    const isDownloading = activeDownloads.has(track.id);
    const isCurrentPlaying = currentTrack && currentTrack.id === track.id && isPlaying;

    return `
      <div class="search-track-card" onclick="selectTrackToPlay('${track.id}')">
        <div class="search-track-art-wrapper">
          <img class="search-track-art" src="${track.cover}" alt="${track.title}" onerror="this.onerror=null; this.src='assets/logo.png';" />
          <div class="search-play-badge ${isCurrentPlaying ? 'playing' : ''}">
            ${isCurrentPlaying ? 
              '<svg width="14" height="14" fill="#6366F1" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>' :
              '<svg width="14" height="14" fill="#ffffff" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>'
            }
          </div>
        </div>
        <div class="search-track-info">
          <div class="search-track-title">${track.title}</div>
          <div class="search-track-artist">${track.artist}</div>
        </div>
        <div class="search-track-actions">
          <button class="search-btn-action" title="${isDownloaded ? 'Downloaded' : 'Download'}" onclick="event.stopPropagation(); startDownloadTrack('${track.id}')">
            ${isDownloaded ? 
              '<svg width="18" height="18" fill="#10B981" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' : 
              (isDownloading ? 
                '<svg width="18" height="18" fill="#F59E0B" viewBox="0 0 24 24" class="spin-icon"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>' :
                '<svg width="18" height="18" fill="var(--text-dim)" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>'
              )
            }
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (isLoadingMore) {
    html += '<div style="text-align: center; color: var(--text-muted); font-size: 11px; padding: 12px;">Searching YouTube Music...</div>';
  }

  container.innerHTML = html;
}

function filterSearchCategory(cat) {
  document.querySelectorAll('#pane-search .filter-pill').forEach(p => p.classList.remove('active'));
  if (typeof event !== 'undefined' && event && event.target) event.target.classList.add('active');
  const input = document.getElementById('searchInput');
  const q = input ? input.value : '';

  if (cat === 'offline') {
    const offlineList = CATALOG.filter(t => downloadedSet.has(t.id));
    currentYtmSearchResults = offlineList;
    window.currentYtmSearchResults = offlineList;
    renderSearchResults(document.getElementById('searchResultsList'), offlineList, false);
  } else if (cat === 'favorites') {
    const favList = CATALOG.filter(t => t.favorite);
    currentYtmSearchResults = favList;
    window.currentYtmSearchResults = favList;
    renderSearchResults(document.getElementById('searchResultsList'), favList, false);
  } else {
    executeSearch(q);
  }
}

window.renderSearchResults = renderSearchResults;
window.filterSearchCategory = filterSearchCategory;
