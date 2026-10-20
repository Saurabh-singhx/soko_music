// ============================================================
// CARDS UI TEMPLATES
// ============================================================
function createShelfCardHtml(track) {
  if (!track || !track.id) return '';
  const isCached = isTrackOffline(track.id);
  return `
    <div class="shelf-card" onclick="selectTrackToPlay('${track.id}')">
      <div class="shelf-card-art-wrapper">
        <img class="shelf-card-art" src="${track.cover || 'assets/logo.png'}" alt="${track.title || 'Track'}" onerror="this.onerror=null; this.src='assets/logo.png';" loading="lazy" />
        ${isCached ? '<div class="offline-chip">⚡ 160k</div>' : ''}
      </div>
      <div class="shelf-card-info">
        <div class="shelf-card-title">${track.title || 'Unknown Title'}</div>
        <div class="shelf-card-artist">${track.artist || 'Unknown Artist'}</div>
      </div>
    </div>
  `;
}

function createYtmLineCardHtml(track) {
  if (!track || !track.id) return '';
  const isCached = isTrackOffline(track.id);
  const isDownloading = activeDownloads.has(track.id);
  return `
    <div class="ytm-line-card" onclick="selectTrackToPlay('${track.id}', true)">
      <div class="ytm-line-art-wrapper">
        <img class="ytm-line-art" src="${track.cover || 'assets/logo.png'}" alt="${track.title || 'Track'}" onerror="this.onerror=null; this.src='assets/logo.png';" loading="lazy" />
        ${isCached ? '<div class="offline-chip-mini">⚡</div>' : ''}
      </div>
      <div class="ytm-line-info">
        <div class="ytm-line-title">${track.title || 'Unknown Title'}</div>
        <div class="ytm-line-artist">${track.artist || 'Unknown Artist'}</div>
      </div>
      <div class="ytm-line-actions">
        <button class="ytm-line-btn" onclick="event.stopPropagation(); startDownloadTrack('${track.id}')" title="${isCached ? 'Stored Offline' : 'Download'}">
          ${isCached ? 
            '<svg width="18" height="18" fill="#10B981" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>' : 
            (isDownloading ? 
              '<svg width="18" height="18" fill="#F59E0B" viewBox="0 0 24 24" class="spin-icon"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>' : 
              '<svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>')}
        </button>
      </div>
    </div>
  `;
}

function createMixCardHtml(mix) {
  if (!mix || !mix.id) return '';
  let coverArt = mix.cover;
  if (!coverArt || coverArt === 'assets/logo.png') {
    const firstTrack = (mix.songIds && mix.songIds.length > 0) ? findTrackAcrossAllSources(mix.songIds[0]) : null;
    if (firstTrack && firstTrack.cover) coverArt = firstTrack.cover;
  }
  coverArt = coverArt || 'assets/logo.png';
  const gradient = mix.gradient || 'linear-gradient(135deg, #6366F1, #06B6D4)';
  const badge = mix.badge || 'Mix';

  return `
    <div class="shelf-card" onclick="playCuratedMix('${mix.id}')">
      <div class="shelf-card-art-wrapper" style="background: ${gradient};">
        <img class="shelf-card-art" src="${coverArt}" alt="${mix.title || 'Mix'}" onerror="this.onerror=null; this.src='assets/logo.png';" loading="lazy" style="opacity: 0.88; mix-blend-mode: overlay;" />
        <div class="mix-card-badge">${badge}</div>
      </div>
      <div class="shelf-card-info">
        <div class="shelf-card-title">${mix.title || 'Mix'}</div>
        <div class="shelf-card-artist">${mix.subtitle || 'Personalized Mix'}</div>
      </div>
    </div>
  `;
}

window.createShelfCardHtml = createShelfCardHtml;
window.createYtmLineCardHtml = createYtmLineCardHtml;
window.createMixCardHtml = createMixCardHtml;
