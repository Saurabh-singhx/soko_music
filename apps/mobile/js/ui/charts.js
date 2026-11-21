// ============================================================
// CHARTS TAB (Dynamic Live Charts with Pagination) - Vibrant Light Redesign
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
        <svg width="28" height="28" fill="var(--brand-orange)" viewBox="0 0 24 24" class="spin-icon" style="margin-bottom: 12px;"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
        <div style="font-size: 14px; font-weight: 700; color: #111827; margin-bottom: 6px;">Loading Live ${canonical} Charts</div>
        <div style="font-size: 12px; color: var(--text-muted);">Fetching top regional songs...</div>
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
    let badgeStyle = 'background: #F3F4F6; color: #6B7280; border: 1px solid #EAECEF;';
    if (globalRank === 1) {
      badgeStyle = 'background: linear-gradient(135deg, #FF6B00 0%, #F59E0B 100%); color: #FFFFFF; box-shadow: 0 2px 8px rgba(255, 90, 31, 0.35); font-weight: 800;';
    } else if (globalRank === 2) {
      badgeStyle = 'background: linear-gradient(135deg, #94A3B8 0%, #64748B 100%); color: #FFFFFF; font-weight: 800;';
    } else if (globalRank === 3) {
      badgeStyle = 'background: linear-gradient(135deg, #EF4444 0%, #D97706 100%); color: #FFFFFF; font-weight: 800;';
    }

    const isDownloaded = (typeof isTrackOffline === 'function') ? isTrackOffline(track.id) : false;
    const isDownloading = (typeof activeDownloads !== 'undefined' && activeDownloads && typeof activeDownloads.has === 'function') ? activeDownloads.has(track.id) : false;
    const durFormatted = (typeof formatTime === 'function') ? formatTime(track.duration) : (track.duration || '3:30');
    const fallbackArt = (typeof getSvgArtworkFallback === 'function') ? getSvgArtworkFallback(track.id, '♫') : 'assets/logo.png';
    const coverSrc = track.cover || fallbackArt;

    return `
      <div class="track-row" onclick="selectTrackToPlay('${track.id}')">
        <span style="font-size: 13px; font-weight: 800; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 10px; flex-shrink: 0; ${badgeStyle}">${globalRank}</span>
        <img class="track-art" src="${coverSrc}" alt="${track.title}" onerror="if (typeof handleImageLoadError === 'function') handleImageLoadError(this, '${track.id}'); else { this.onerror=null; this.src='assets/logo.png'; }" loading="lazy" />
        <div class="track-meta" style="flex: 1; min-width: 0;">
          <div class="track-title" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.title}</div>
          <div class="track-desc" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${track.artist} &middot; ${durFormatted}</div>
        </div>
        <button class="action-icon-btn" onclick="event.stopPropagation(); startDownloadTrack('${track.id}')" title="${isDownloaded ? 'Cached Offline' : (isDownloading ? 'Downloading...' : 'Download')}" aria-label="${isDownloaded ? 'Cached Offline' : 'Download'}">
          ${isDownloaded ? 
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : 
            (isDownloading ? 
              '<svg width="18" height="18" fill="#FF5A1F" viewBox="0 0 24 24" class="spin-icon"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>' :
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>'
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
