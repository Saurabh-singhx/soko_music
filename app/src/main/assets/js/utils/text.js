// Text extraction helpers for InnerTube structured objects
function extractTextString(val) {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) return val.map(extractTextString).join(' ');
  if (typeof val === 'object') {
    if (Array.isArray(val.runs)) {
      return val.runs.map(r => (r && r.text) ? r.text : '').join(' ');
    }
    if (val.simpleText) return String(val.simpleText);
  }
  return '';
}

window.extractTextString = extractTextString;

// Dynamic High-Resolution Artwork URL Upgrader
function getHighResArtworkUrl(url, targetSize = 800) {
  if (!url || typeof url !== 'string' || url.includes('assets/logo.png')) return url || 'assets/logo.png';
  try {
    if (url.includes('googleusercontent.com')) {
      if (/=w\d+-h\d+/.test(url)) {
        return url.replace(/=w\d+-h\d+/, `=w${targetSize}-h${targetSize}`);
      }
      if (/=s\d+/.test(url)) {
        return url.replace(/=s\d+/, `=s${targetSize}`);
      }
    }
  } catch (e) {}
  return url;
}

// Vibrant SVG Artwork Generator & Fallback Data URI (Redesign Visuals)
function getSvgArtworkFallback(titleOrId = '', motif = '♫', label = '') {
  const palettes = [
    { from: '#FF5A1F', mid: '#FF8C42', to: '#FBBF24' }, // orangeGold
    { from: '#E11D48', mid: '#EF4444', to: '#FF6B00' }, // redFlame
    { from: '#16A34A', mid: '#10B981', to: '#34D399' }, // freshGreen
    { from: '#FF6B00', mid: '#EF4444', to: '#FB7185' }, // sunsetPop
    { from: '#059669', mid: '#16A34A', to: '#F59E0B' }, // emeraldSun
    { from: '#F97316', mid: '#FB923C', to: '#FACC15' }, // citrus
    { from: '#DC2626', mid: '#E11D48', to: '#F97316' }, // berryRed
    { from: '#10B981', mid: '#FF5A1F', to: '#FF6B00' }  // mintOrange
  ];
  let hash = 0;
  const str = String(titleOrId || '');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const pal = palettes[Math.abs(hash) % palettes.length];
  const safeMotif = motif || '♫';
  const labelSvg = label ? `<rect x="25" y="78" width="50" height="14" rx="4" fill="rgba(0,0,0,0.35)"/><text x="50" y="88" fill="#ffffff" font-size="8" font-weight="bold" font-family="sans-serif" text-anchor="middle">${label}</text>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g_${Math.abs(hash)}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${pal.from}"/><stop offset="50%" stop-color="${pal.mid}"/><stop offset="100%" stop-color="${pal.to}"/></linearGradient></defs><rect width="100" height="100" fill="url(#g_${Math.abs(hash)})"/><circle cx="84" cy="16" r="30" fill="#ffffff" fill-opacity="0.2"/><circle cx="14" cy="86" r="34" fill="#111827" fill-opacity="0.2"/><text x="50" y="58" font-size="34" font-weight="bold" font-family="sans-serif" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${safeMotif}</text>${labelSvg}</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function createArtHTML(palette, motif, label = '') {
  const palettes = {
    orangeGold: 'linear-gradient(135deg, #FF5A1F 0%, #FF8C42 52%, #FBBF24 100%)',
    redFlame:   'linear-gradient(135deg, #E11D48 0%, #EF4444 50%, #FF6B00 100%)',
    freshGreen: 'linear-gradient(135deg, #16A34A 0%, #10B981 55%, #34D399 100%)',
    sunsetPop:  'linear-gradient(135deg, #FF6B00 0%, #EF4444 60%, #FB7185 100%)',
    emeraldSun: 'linear-gradient(135deg, #059669 0%, #16A34A 50%, #F59E0B 100%)',
    citrus:     'linear-gradient(135deg, #F97316 0%, #FB923C 50%, #FACC15 100%)',
    berryRed:   'linear-gradient(135deg, #DC2626 0%, #E11D48 55%, #F97316 100%)',
    mintOrange: 'linear-gradient(135deg, #10B981 0%, #FF5A1F 100%)',
    warmWhite:  'linear-gradient(135deg, #FF5A1F 0%, #FFFFFF 52%, #16A34A 100%)',
  };
  const bg = palettes[palette] || palettes.orangeGold;
  return `
    <div style="width: 100%; height: 100%; background: ${bg}; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; user-select: none;">
      <svg style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0.2;" viewBox="0 0 100 100" preserveAspectRatio="none">
        <circle cx="84" cy="16" r="30" fill="#FFFFFF"/>
        <circle cx="14" cy="86" r="34" fill="#111827"/>
      </svg>
      <span style="position: relative; z-index: 10; color: #FFFFFF; font-family: var(--font-display, sans-serif); font-weight: 800; font-size: clamp(14px, 38%, 42px); line-height: 1;">${motif || '♫'}</span>
      ${label ? `<span style="position: relative; z-index: 10; margin-top: 4px; padding: 2px 6px; border-radius: 4px; background: rgba(0,0,0,0.3); color: #ffffff; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">${label}</span>` : ''}
    </div>
  `;
}

// Graceful offline & error image loader fallback
function handleImageLoadError(imgEl, trackId) {
  if (!imgEl) return;
  imgEl.onerror = null;
  if (trackId && typeof window !== 'undefined' && window.SokoNative && typeof window.SokoNative.getDownloadedCoverPath === 'function') {
    try {
      const localPath = window.SokoNative.getDownloadedCoverPath(trackId);
      if (localPath) {
        imgEl.src = 'artworks/' + trackId + '.jpg';
        return;
      }
    } catch (e) {}
  }
  imgEl.src = 'assets/logo.png';
}

window.getHighResArtworkUrl = getHighResArtworkUrl;
window.handleImageLoadError = handleImageLoadError;
window.getSvgArtworkFallback = getSvgArtworkFallback;
window.createArtHTML = createArtHTML;
