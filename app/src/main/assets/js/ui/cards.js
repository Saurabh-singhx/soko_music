// ============================================================
// CARDS UI TEMPLATES - Vibrant Light Redesign
// ============================================================

function createShelfCardHtml(track) {
  if (!track || !track.id) return '';
  const isCached = isTrackOffline(track.id);
  const fallbackArt = (typeof getSvgArtworkFallback === 'function') ? getSvgArtworkFallback(track.id, '♫') : 'assets/logo.png';
  const coverSrc = track.cover || fallbackArt;
  return `
    <div class="shelf-card" onclick="selectTrackToPlay('${track.id}')">
      <div class="shelf-card-art-wrapper">
        <img class="shelf-card-art" src="${coverSrc}" alt="${track.title || 'Track'}" onerror="if (typeof handleImageLoadError === 'function') handleImageLoadError(this, '${track.id}'); else { this.onerror=null; this.src='assets/logo.png'; }" loading="lazy" />
        ${isCached ? '<div class="offline-chip-mini">⚡ 160k</div>' : ''}
      </div>
      <div class="shelf-card-info">
        <div class="shelf-card-title">${track.title || 'Unknown Title'}</div>
        <div class="shelf-card-artist">${track.artist || 'Unknown Artist'}</div>
      </div>
    </div>
  `;
}

function createYtmLineCardHtml(track, shelfId = null) {
  if (!track || !track.id) return '';
  const isCached = isTrackOffline(track.id);
  const isDownloading = activeDownloads.has(track.id);
  const isRadioStart = shelfId === 'quick_picks';
  const shelfArg = shelfId ? `'${shelfId}'` : 'null';
  const fallbackArt = (typeof getSvgArtworkFallback === 'function') ? getSvgArtworkFallback(track.id, '♫') : 'assets/logo.png';
  const coverSrc = track.cover || fallbackArt;
  return `
    <div class="ytm-line-card" onclick="selectTrackToPlay('${track.id}', ${isRadioStart}, ${shelfArg})">
      <div class="ytm-line-art-wrapper">
        <img class="ytm-line-art" src="${coverSrc}" alt="${track.title || 'Track'}" onerror="if (typeof handleImageLoadError === 'function') handleImageLoadError(this, '${track.id}'); else { this.onerror=null; this.src='assets/logo.png'; }" loading="lazy" />
        ${isCached ? '<div class="offline-chip-mini">⚡</div>' : ''}
      </div>
      <div class="ytm-line-info">
        <div class="ytm-line-title">${track.title || 'Unknown Title'}</div>
        <div class="ytm-line-artist">${track.artist || 'Unknown Artist'}${track.plays ? ` • ${track.plays}` : ''}</div>
      </div>
      <div class="ytm-line-actions">
        <button class="ytm-line-btn" onclick="event.stopPropagation(); startDownloadTrack('${track.id}')" title="${isCached ? 'Stored Offline' : (isDownloading ? 'Downloading...' : 'Download Offline')}" aria-label="${isCached ? 'Stored Offline' : 'Download Offline'}">
          ${isCached ? 
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' : 
            (isDownloading ? 
              '<svg width="18" height="18" fill="#FF5A1F" viewBox="0 0 24 24" class="spin-icon"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>' : 
              '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>')}
        </button>
      </div>
    </div>
  `;
}

function createMixCardHtml(mix) {
  if (!mix || !mix.id) return '';
  let coverArt = mix.cover;
  const firstTrack = (mix.tracks && mix.tracks.length > 0) ? mix.tracks[0] :
    ((mix.songIds && mix.songIds.length > 0) ? findTrackAcrossAllSources(mix.songIds[0]) : null);
  if (!coverArt || coverArt === 'assets/logo.png') {
    if (firstTrack && firstTrack.cover) coverArt = firstTrack.cover;
  }
  if (!coverArt && mix.videoId) {
    coverArt = `https://i.ytimg.com/vi/${mix.videoId}/hqdefault.jpg`;
  }

  const vibrantGradients = [
    'linear-gradient(135deg, #FF6B00 0%, #EF4444 60%, #FB7185 100%)',
    'linear-gradient(135deg, #FF5A1F 0%, #FF8C42 52%, #FBBF24 100%)',
    'linear-gradient(135deg, #16A34A 0%, #10B981 55%, #34D399 100%)',
    'linear-gradient(135deg, #E11D48 0%, #EF4444 50%, #FF6B00 100%)',
    'linear-gradient(135deg, #059669 0%, #16A34A 50%, #F59E0B 100%)'
  ];
  let hash = 0;
  const idStr = String(mix.id || mix.title || '');
  for (let i = 0; i < idStr.length; i++) hash = (hash << 5) - hash + idStr.charCodeAt(i);
  const selectedGradient = mix.gradient || vibrantGradients[Math.abs(hash) % vibrantGradients.length];

  const fallbackArt = (typeof getSvgArtworkFallback === 'function') ? getSvgArtworkFallback(mix.id, '♫', 'MIX') : 'assets/logo.png';
  coverArt = coverArt || fallbackArt;
  const isLogo = !coverArt || coverArt === 'assets/logo.png';
  const imgStyle = isLogo
    ? 'opacity: 0.88; mix-blend-mode: overlay; width: 100%; height: 100%; object-fit: contain;'
    : 'opacity: 1; mix-blend-mode: normal; object-fit: cover; width: 100%; height: 100%;';
  const badge = mix.badge || 'Mix';
  const displayTitle = mix.title || (firstTrack ? firstTrack.title : 'Mix');
  const displaySubtitle = (mix.subtitle && mix.subtitle !== 'YouTube Music' && mix.subtitle !== 'Cloud Music')
    ? mix.subtitle
    : (firstTrack ? firstTrack.artist : 'Personalized Mix');
  const safeId = String(mix.id).replace(/'/g, "\\'");

  return `
    <div class="shelf-card" onclick="playCuratedMix('${safeId}')">
      <div class="shelf-card-art-wrapper" style="background: ${selectedGradient};">
        <img class="shelf-card-art" src="${coverArt}" alt="${displayTitle}" onerror="this.onerror=null; this.src='assets/logo.png';" loading="lazy" style="${imgStyle}" />
        <div class="mix-card-badge">${badge}</div>
      </div>
      <div class="shelf-card-info">
        <div class="shelf-card-title">${displayTitle}</div>
        <div class="shelf-card-artist">${displaySubtitle}</div>
      </div>
    </div>
  `;
}

window.createShelfCardHtml = createShelfCardHtml;
window.createYtmLineCardHtml = createYtmLineCardHtml;
window.createMixCardHtml = createMixCardHtml;
