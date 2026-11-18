// ============================================================
// CHARTS TAB (Dynamic Live Charts with Pagination)
// ============================================================
const REGIONAL_PLAYLIST_IDS = window.REGIONAL_PLAYLIST_IDS || {
  "Global": "PL4fGSI1pDJn49TUu37nJoN2QTeYuRwmNv",
  "India": "PL4fGSI1pDJn40WjZ6utkIuj2rNg-7iGsq",
  "United States": "PL4fGSI1pDJn6puJdseH2Rt9sMvt9E2M4i",
  "United Kingdom": "PL4fGSI1pDJn688ebB8czINn0_nov50e3A",
  "Canada": "PL4fGSI1pDJn4IeWA7bBJYh__qgOCRMkIh",
  "Australia": "PL4fGSI1pDJn44PMHPLYatj8rta8WYtZ8_",
  "Japan": "PL4fGSI1pDJn5FhDrWnRp2NLzJCoPliNgT",
  "Germany": "PL7eU2Xjx0QsVwyGVvaKSj6reaKGQ9F-zO",
  "France": "PL4fGSI1pDJn50iCQRUVmgUjOrCggCQ9nR",
  "Brazil": "PL4fGSI1pDJn4Gs2meaJRo9O8PNYvhjHIg",
  "South Korea": "PL4fGSI1pDJn5S09aId3dUGp40ygUqmPGc",
  "Indonesia": "PL4fGSI1pDJn5QPpj0R4vVgRWk8sSq549G",
  "Egypt": "PL4fGSI1pDJn4EhpZkSSpdyWUet73FalVU",
  "Thailand": "PL4fGSI1pDJn5J-6eohuDgVr8lTdRpcVQo",
  "Ukraine": "PL4fGSI1pDJn7524WZdmWAIRc6cQ3vUzZK"
};

let isFetchingCharts = false;
let isRefreshingCharts = false;

async function fetchLiveRegionalCharts(region, forceRefresh = false) {
  if (isFetchingCharts) return;
  isFetchingCharts = true;
  const canonical = (typeof getCanonicalChartRegion === 'function') ? getCanonicalChartRegion(region) : (region || 'Global');
  try {
    // 1. Try real charts engine if available (live InnerTube charts)
    if (typeof window.fetchRealCharts === 'function') {
      const tracks = await window.fetchRealCharts(canonical, forceRefresh);
      if (tracks && tracks.length > 0) {
        if (typeof REGIONAL_CHARTS === 'object' && REGIONAL_CHARTS) {
          REGIONAL_CHARTS[canonical] = tracks;
        }
        try {
          localStorage.setItem(`soko_cached_charts_${canonical}`, JSON.stringify(tracks));
        } catch (e) {}
        renderCharts(canonical, (typeof currentChartPage !== 'undefined' && currentChartPage) ? currentChartPage : 1);
        return tracks;
      }
    }

    // 2. Fallback to playlist resolver
    const playlistId = REGIONAL_PLAYLIST_IDS[canonical] || REGIONAL_PLAYLIST_IDS["Global"];
    if (playlistId && typeof resolvePlaylistTracks === 'function') {
      const tracks = await resolvePlaylistTracks(playlistId);
      if (tracks && tracks.length > 0) {
        if (typeof REGIONAL_CHARTS === 'object' && REGIONAL_CHARTS) {
          REGIONAL_CHARTS[canonical] = tracks;
        }
        try {
          localStorage.setItem(`soko_cached_charts_${canonical}`, JSON.stringify(tracks));
        } catch (e) {}
        renderCharts(canonical, (typeof currentChartPage !== 'undefined' && currentChartPage) ? currentChartPage : 1);
        return tracks;
      }
    }
  } catch (err) {
    console.warn(`[Charts] Failed to fetch live charts for ${canonical}:`, err);
  } finally {
    isFetchingCharts = false;
  }
}

async function refreshCurrentCharts() {
  if (isRefreshingCharts) return;
  isRefreshingCharts = true;

  const rawRegion = window.currentChartRegion || (typeof currentChartRegion !== 'undefined' ? currentChartRegion : 'Global');
  const canonical = (typeof getCanonicalChartRegion === 'function') ? getCanonicalChartRegion(rawRegion) : (rawRegion || 'Global');

  const refreshBtn = document.getElementById('btnRefreshCharts');
  const refreshIcon = document.getElementById('chartsRefreshIcon');

  if (refreshIcon) refreshIcon.classList.add('spin-icon');
  if (refreshBtn) refreshBtn.disabled = true;

  // 1. Bypass local cache
  try {
    localStorage.removeItem(`soko_cached_charts_${canonical}`);
    if (rawRegion !== canonical) {
      localStorage.removeItem(`soko_cached_charts_${rawRegion}`);
    }
  } catch (e) {}

  // 2. Clear in-memory chart tracks for this region
  if (typeof REGIONAL_CHARTS === 'object' && REGIONAL_CHARTS) {
    REGIONAL_CHARTS[canonical] = [];
    if (rawRegion !== canonical) {
      REGIONAL_CHARTS[rawRegion] = [];
    }
  }

  // 3. Show spinning refresh indicator / toast
  if (typeof showToast === 'function') {
    showToast('Refreshing live charts...', '🔄');
  }

  // 4. Reset page to 1 and re-render loading skeleton / spinner
  currentChartPage = 1;
  window.currentChartPage = 1;
  renderCharts(canonical, 1);

  // 5. Trigger live fetch with forceRefresh
  try {
    if (typeof window.fetchRealCharts === 'function') {
      const tracks = await window.fetchRealCharts(canonical, true);
      if (tracks && tracks.length > 0) {
        if (typeof REGIONAL_CHARTS === 'object' && REGIONAL_CHARTS) {
          REGIONAL_CHARTS[canonical] = tracks;
        }
        try {
          localStorage.setItem(`soko_cached_charts_${canonical}`, JSON.stringify(tracks));
        } catch (e) {}
      }
    } else if (typeof fetchLiveRegionalCharts === 'function') {
      await fetchLiveRegionalCharts(canonical, true);
    }
  } catch (err) {
    console.warn(`[Charts] Error refreshing charts for ${canonical}:`, err);
    if (typeof showToast === 'function') {
      showToast('Failed to refresh charts', '⚠️');
    }
  } finally {
    isRefreshingCharts = false;
    if (refreshIcon) refreshIcon.classList.remove('spin-icon');
    if (refreshBtn) refreshBtn.disabled = false;
    renderCharts(canonical, 1);
  }
}

function switchChartRegion(region) {
  const canonical = (typeof getCanonicalChartRegion === 'function') ? getCanonicalChartRegion(region) : (region || 'Global');
  currentChartRegion = canonical;
  window.currentChartRegion = canonical;
  currentChartPage = 1;
  window.currentChartPage = 1;

  if (typeof REGIONAL_CHARTS === 'object' && REGIONAL_CHARTS && !REGIONAL_CHARTS[canonical]) {
    REGIONAL_CHARTS[canonical] = [];
  }

  document.querySelectorAll('#pane-charts .filter-pill').forEach(p => {
    const pillText = p.getAttribute('data-region') || p.innerText.trim();
    const pillCanonical = (typeof getCanonicalChartRegion === 'function') ? getCanonicalChartRegion(pillText) : pillText;
    p.classList.toggle('active', pillCanonical === canonical || pillText === region || pillText === canonical);
  });

  renderCharts(canonical, 1);
  if (typeof showToast === 'function') {
    showToast(`Showing ${canonical} Top Charts`, '📈');
  }
}

function setChartPage(page) {
  currentChartPage = page;
  window.currentChartPage = page;
  const rawRegion = window.currentChartRegion || (typeof currentChartRegion !== 'undefined' ? currentChartRegion : 'Global');
  const canonical = (typeof getCanonicalChartRegion === 'function') ? getCanonicalChartRegion(rawRegion) : (rawRegion || 'Global');
  renderCharts(canonical, currentChartPage);
  const pane = document.getElementById('pane-charts');
  if (pane) pane.scrollTop = 0;
}

function renderCharts(region, page = 1) {
  const list = document.getElementById('chartsTrackList');
  if (!list) return;

  const canonical = (typeof getCanonicalChartRegion === 'function') ? getCanonicalChartRegion(region) : (region || 'Global');

  const rawTracks = (typeof REGIONAL_CHARTS === 'object' && REGIONAL_CHARTS && REGIONAL_CHARTS[canonical]) 
    ? REGIONAL_CHARTS[canonical] 
    : ((typeof REGIONAL_CHARTS === 'object' && REGIONAL_CHARTS && REGIONAL_CHARTS[region]) ? REGIONAL_CHARTS[region] : []);
  const tracks = rawTracks.filter(t => (typeof isPodcastOrLongTrack === 'function') ? !isPodcastOrLongTrack(t) : true);

  if (tracks.length === 0) {
    try {
      const cached = localStorage.getItem(`soko_cached_charts_${canonical}`) || localStorage.getItem(`soko_cached_charts_${region}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (typeof REGIONAL_CHARTS === 'object' && REGIONAL_CHARTS) {
            REGIONAL_CHARTS[canonical] = parsed;
          }
          renderCharts(canonical, page);
          return;
        }
      }
    } catch (e) {}

    list.innerHTML = `
      <div style="text-align: center; padding: 48px 16px; color: var(--text-muted);">
        <svg width="28" height="28" fill="var(--accent-primary)" viewBox="0 0 24 24" class="spin-icon" style="margin-bottom: 12px;"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
        <div style="font-size: 14px; font-weight: 600; color: #fff; margin-bottom: 6px;">Loading Live ${canonical} Charts</div>
        <div style="font-size: 12px;">Fetching top regional songs...</div>
      </div>
    `;
    const paginationContainer = document.getElementById('chartsPagination');
    if (paginationContainer) paginationContainer.innerHTML = '';

    fetchLiveRegionalCharts(canonical);
    return;
  }

  const perPage = (typeof CHARTS_PER_PAGE !== 'undefined' && CHARTS_PER_PAGE) ? CHARTS_PER_PAGE : 20;
  const totalPages = Math.ceil(tracks.length / perPage) || 1;
  const validPage = Math.max(1, Math.min(page, totalPages));
  const startIdx = (validPage - 1) * perPage;
  const pageTracks = tracks.slice(startIdx, startIdx + perPage);

  list.innerHTML = pageTracks.map((track, i) => {
    const globalRank = startIdx + i + 1;
    let badgeColor = 'var(--text-dim)';
    let badgeBg = 'transparent';
    if (globalRank === 1) { badgeColor = '#F59E0B'; badgeBg = 'rgba(245, 158, 11, 0.15)'; }
    else if (globalRank === 2) { badgeColor = '#94A3B8'; badgeBg = 'rgba(148, 163, 184, 0.15)'; }
    else if (globalRank === 3) { badgeColor = '#B45309'; badgeBg = 'rgba(180, 83, 9, 0.15)'; }

    const isDownloaded = (typeof isTrackOffline === 'function') ? isTrackOffline(track.id) : false;
    const isDownloading = (typeof activeDownloads !== 'undefined' && activeDownloads && typeof activeDownloads.has === 'function') ? activeDownloads.has(track.id) : false;
    const durFormatted = (typeof formatTime === 'function') ? formatTime(track.duration) : (track.duration || '3:30');

    return `
      <div class="track-row" onclick="selectTrackToPlay('${track.id}')">
        <span style="font-size: 13px; font-weight: 800; color: ${badgeColor}; background: ${badgeBg}; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 6px; flex-shrink: 0;">${globalRank}</span>
        <img class="track-art" src="${track.cover}" alt="${track.title}" onerror="if (typeof handleImageLoadError === 'function') handleImageLoadError(this, '${track.id}'); else { this.onerror=null; this.src='assets/logo.png'; }" />
        <div class="track-meta" style="flex: 1; min-width: 0;">
          <div class="track-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.title}</div>
          <div class="track-desc" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.artist} • ${durFormatted}</div>
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
    <button class="filter-pill" style="min-height: 40px; padding: 6px 14px; font-size: 11px; ${validPage === 1 ? 'opacity: 0.4; pointer-events: none;' : ''}" onclick="setChartPage(${validPage - 1})">Prev</button>
  `;
  for (let p = 1; p <= totalPages; p++) {
    pHtml += `
      <button class="filter-pill ${p === validPage ? 'active' : ''}" style="min-width: 40px; min-height: 40px; padding: 6px 10px; font-size: 11px; text-align: center;" onclick="setChartPage(${p})">${p}</button>
    `;
  }
  pHtml += `
    <button class="filter-pill" style="min-height: 40px; padding: 6px 14px; font-size: 11px; ${validPage === totalPages ? 'opacity: 0.4; pointer-events: none;' : ''}" onclick="setChartPage(${validPage + 1})">Next</button>
  `;
  paginationContainer.innerHTML = pHtml;
}

window.REGIONAL_PLAYLIST_IDS = REGIONAL_PLAYLIST_IDS;
window.fetchLiveRegionalCharts = fetchLiveRegionalCharts;
window.refreshCurrentCharts = refreshCurrentCharts;
window.switchChartRegion = switchChartRegion;
window.setChartPage = setChartPage;
window.renderCharts = renderCharts;
