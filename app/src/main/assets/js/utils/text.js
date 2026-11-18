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

