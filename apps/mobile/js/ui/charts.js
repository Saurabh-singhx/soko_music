// ============================================================
// CHARTS TAB (Dynamic Live Charts with Pagination)
// ============================================================
const REGIONAL_PLAYLIST_IDS = {
  "Global": "PL4fGSI1pDJn49TUu37nJoN2QTeYuRwmNv",
  "India": "PL4fGSI1pDJn40WjZ6utkIuj2rNg-7iGsq",
  "United States": "PL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i",
  "United Kingdom": "PL4fGSI1pDJn688ebB8czINn0_nov50e3A"
};

let isFetchingCharts = false;

async function fetchLiveRegionalCharts(region) {
  if (isFetchingCharts) return;
  isFetchingCharts = true;
  try {
    const playlistId = REGIONAL_PLAYLIST_IDS[region];
    if (playlistId && typeof resolvePlaylistTracks === 'function') {
      const tracks = await resolvePlaylistTracks(playlistId);
      if (tracks && tracks.length > 0) {
        REGIONAL_CHARTS[region] = tracks;
        try {
          localStorage.setItem(`soko_cached_charts_${region}`, JSON.stringify(tracks));
        } catch (e) {}
        renderCharts(region, 1);
        return;
      }
    }
  } catch (err) {
    console.warn(`[Charts] Failed to fetch live charts for ${region}:`, err);
  } finally {
    isFetchingCharts = false;
  }
}

function switchChartRegion(region) {
  currentChartRegion = region;
  window.currentChartRegion = region;
  currentChartPage = 1;
  window.currentChartPage = 1;
  document.querySelectorAll('#pane-charts .filter-pill').forEach(p => {
    p.classList.toggle('active', p.innerText === region);
  });
  renderCharts(region, 1);
  showToast(`Showing ${region} Top Charts`, '📈');
}

function setChartPage(page) {
  currentChartPage = page;
  window.currentChartPage = page;
  renderCharts(currentChartRegion, currentChartPage);
  const pane = document.getElementById('pane-charts');
  if (pane) pane.scrollTop = 0;
}

function renderCharts(region, page = 1) {
  const list = document.getElementById('chartsTrackList');
  if (!list) return;

  const rawTracks = (REGIONAL_CHARTS && REGIONAL_CHARTS[region]) ? REGIONAL_CHARTS[region] : [];
  const tracks = rawTracks.filter(t => !isPodcastOrLongTrack(t));

  if (tracks.length === 0) {
    try {
      const cached = localStorage.getItem(`soko_cached_charts_${region}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          REGIONAL_CHARTS[region] = parsed;
          renderCharts(region, page);
          return;
        }
      }
    } catch (e) {}

    list.innerHTML = `
      <div style="text-align: center; padding: 48px 16px; color: var(--text-muted);">
        <svg width="28" height="28" fill="var(--accent-primary)" viewBox="0 0 24 24" class="spin-icon" style="margin-bottom: 12px;"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
        <div style="font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 6px;">Loading Live ${region} Charts</div>
        <div style="font-size: 12px;">Fetching top regional songs...</div>
      </div>
    `;
    const paginationContainer = document.getElementById('chartsPagination');
    if (paginationContainer) paginationContainer.innerHTML = '';

    fetchLiveRegionalCharts(region);
    return;
  }

  const totalPages = Math.ceil(tracks.length / CHARTS_PER_PAGE) || 1;
  const startIdx = (page - 1) * CHARTS_PER_PAGE;
  const pageTracks = tracks.slice(startIdx, startIdx + CHARTS_PER_PAGE);

  list.innerHTML = pageTracks.map((track, i) => {
    const globalRank = startIdx + i + 1;
    let badgeColor = 'var(--text-dim)';
    let badgeBg = 'transparent';
    if (globalRank === 1) { badgeColor = '#F59E0B'; badgeBg = 'rgba(245, 158, 11, 0.15)'; }
    else if (globalRank === 2) { badgeColor = '#94A3B8'; badgeBg = 'rgba(148, 163, 184, 0.15)'; }
    else if (globalRank === 3) { badgeColor = '#B45309'; badgeBg = 'rgba(180, 83, 9, 0.15)'; }

    const isDownloaded = isTrackOffline(track.id);
    const isDownloading = activeDownloads.has(track.id);

    return `
      <div class="track-row" onclick="selectTrackToPlay('${track.id}')">
        <span style="font-size: 13px; font-weight: 800; color: ${badgeColor}; background: ${badgeBg}; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; flex-shrink: 0;">${globalRank}</span>
        <img class="track-art" src="${track.cover}" alt="${track.title}" onerror="this.onerror=null; this.src='assets/logo.png';" />
        <div class="track-meta" style="flex: 1; min-width: 0;">
          <div class="track-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.title}</div>
          <div class="track-desc" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.artist} • ${formatTime(track.duration)}</div>
        </div>
        <button class="action-icon-btn" onclick="event.stopPropagation(); startDownloadTrack('${track.id}')" title="${isDownloaded ? 'Cached Offline' : 'Download'}">
          ${isDownloaded ? 
            '<svg width="18" height="18" fill="#10B981" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' : 
            (isDownloading ? 
              '<svg width="18" height="18" fill="#F59E0B" viewBox="0 0 24 24" class="spin-icon"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>' :
              '<svg width="18" height="18" fill="var(--text-dim)" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>'
            )
          }
        </button>
      </div>
    `;
  }).join('');

  let paginationContainer = document.getElementById('chartsPagination');
  if (!paginationContainer) {
    paginationContainer = document.createElement('div');
    paginationContainer.id = 'chartsPagination';
    paginationContainer.style.cssText = 'display: flex; align-items: center; justify-content: center; gap: 8px; margin: 20px 0 32px 0; padding: 0 16px;';
    list.parentNode.insertBefore(paginationContainer, list.nextSibling);
  }

  let pHtml = `
    <button class="filter-pill" style="min-height: 40px; padding: 6px 14px; font-size: 11px; ${page === 1 ? 'opacity: 0.4; pointer-events: none;' : ''}" onclick="setChartPage(${page - 1})">Prev</button>
  `;
  for (let p = 1; p <= totalPages; p++) {
    pHtml += `
      <button class="filter-pill ${p === page ? 'active' : ''}" style="min-width: 40px; min-height: 40px; padding: 6px 10px; font-size: 11px; text-align: center;" onclick="setChartPage(${p})">${p}</button>
    `;
  }
  pHtml += `
    <button class="filter-pill" style="min-height: 40px; padding: 6px 14px; font-size: 11px; ${page === totalPages ? 'opacity: 0.4; pointer-events: none;' : ''}" onclick="setChartPage(${page + 1})">Next</button>
  `;
  paginationContainer.innerHTML = pHtml;
}

window.REGIONAL_PLAYLIST_IDS = REGIONAL_PLAYLIST_IDS;
window.fetchLiveRegionalCharts = fetchLiveRegionalCharts;
window.switchChartRegion = switchChartRegion;
window.setChartPage = setChartPage;
window.renderCharts = renderCharts;
