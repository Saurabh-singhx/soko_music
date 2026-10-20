// Soko cache engine: storage metrics and unpinned LRU cache eviction
const LRU_STORAGE_KEY = 'soko_lru_timestamps';
const lruPlayRegistry = new Map();

function initLruRegistry() {
  try {
    const raw = localStorage.getItem(LRU_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      for (const [k, v] of Object.entries(parsed)) {
        lruPlayRegistry.set(k, v);
      }
    }
  } catch (e) {}
}

function persistLruRegistry() {
  try {
    const obj = {};
    for (const [k, v] of lruPlayRegistry.entries()) {
      obj[k] = v;
    }
    localStorage.setItem(LRU_STORAGE_KEY, JSON.stringify(obj));
  } catch (e) {}
}

function recordLruPlay(trackId) {
  if (!trackId) return;
  lruPlayRegistry.set(trackId, { lastPlayed: Date.now() });
  persistLruRegistry();
}

function getTrackUsedBytes() {
  if (typeof window !== 'undefined' && window.SokoNative && window.SokoNative.getDiskStorageUsedBytes) {
    try {
      const bytes = window.SokoNative.getDiskStorageUsedBytes();
      if (bytes > 0) return bytes;
    } catch (e) {}
  }
  return downloadedSet.size * 3.4 * 1024 * 1024;
}

function enforceLruEviction(newBytes = 3.5 * 1024 * 1024) {
  const limitGB = (typeof window !== 'undefined' && window.maxCacheGB !== undefined) ? window.maxCacheGB : (typeof maxCacheGB !== 'undefined' ? maxCacheGB : 1.0);
  const maxBytes = limitGB * 1024 * 1024 * 1024;
  let currentBytes = getTrackUsedBytes();
  if (currentBytes + newBytes <= maxBytes) return;

  const favPlaylist = userPlaylists.find(p => p.id === 'pl_favorites');
  const favIds = new Set(favPlaylist ? favPlaylist.songIds : []);

  while (currentBytes + newBytes > maxBytes) {
    let oldestId = null;
    let oldestTime = Infinity;

    for (const id of downloadedSet) {
      const isBundled = BUNDLED_TRACKS.some(b => b.id === id);
      const isFav = favIds.has(id) || CATALOG.some(t => t.id === id && t.favorite);
      if (isBundled || isFav) continue;

      const record = lruPlayRegistry.get(id);
      const lastPlayed = record ? record.lastPlayed : 0;
      if (lastPlayed < oldestTime) {
        oldestTime = lastPlayed;
        oldestId = id;
      }
    }

    if (!oldestId) break; // All remaining tracks are pinned/favorites

    console.log('[LRU-Eviction] Evicting oldest unpinned track to free cache:', oldestId);
    deleteOfflineTrack(oldestId);
    lruPlayRegistry.delete(oldestId);
    currentBytes -= 3.4 * 1024 * 1024;
  }
  persistLruRegistry();
}

function updateStorageMetrics() {
  const label = document.getElementById('storageLabel');
  const bar = document.getElementById('storageUsedBar');
  const stats = document.getElementById('cachedSongStats');

  const count = downloadedSet.size;
  let usedMB = (count * 3.4).toFixed(1);
  if (typeof window !== 'undefined' && window.SokoNative && window.SokoNative.getDiskStorageUsedBytes) {
    try {
      const bytes = window.SokoNative.getDiskStorageUsedBytes();
      if (bytes > 0) {
        usedMB = (bytes / (1024 * 1024)).toFixed(1);
      }
    } catch (e) {}
  }
  const usedGB = (usedMB / 1024).toFixed(2);
  const percent = Math.min(100, Math.round((usedGB / maxCacheGB) * 100));

  if (label) label.innerText = `${usedMB} MB / ${maxCacheGB.toFixed(1)} GB`;
  if (bar) bar.style.width = `${Math.max(4, percent)}%`;
  if (stats) stats.innerText = `${count} real songs stored locally (${usedMB} MB)`;
}

function clearUnpinnedCache() {
  const toRemove = [];
  for (const id of downloadedSet) {
    const isBundled = BUNDLED_TRACKS.some(b => b.id === id);
    const track = findTrackAcrossAllSources(id);
    const isFavorite = track && track.favorite;
    if (!isBundled && !isFavorite) {
      toRemove.push(id);
    }
  }

  toRemove.forEach(id => {
    downloadedSet.delete(id);
    lruPlayRegistry.delete(id);
    if (typeof window !== 'undefined' && window.SokoNative && window.SokoNative.deleteDownloadedTrack) {
      try {
        window.SokoNative.deleteDownloadedTrack(id);
      } catch (e) {
        console.warn('[Storage] Native track deletion error:', e);
      }
    }
  });

  const offPl = userPlaylists.find(p => p.id === 'pl_offline');
  if (offPl) {
    offPl.songIds = offPl.songIds.filter(id => downloadedSet.has(id));
  }

  persistLruRegistry();
  persistDownloadState();
  updateStorageMetrics();
  renderShelves();
  renderLibraryTracks();
  renderPlaylists();
  showToast(`Cleared ${toRemove.length} unpinned songs & freed disk space`, '🧹');
}

initLruRegistry();

window.lruPlayRegistry = lruPlayRegistry;
window.recordLruPlay = recordLruPlay;
window.enforceLruEviction = enforceLruEviction;
window.getTrackUsedBytes = getTrackUsedBytes;
window.updateStorageMetrics = updateStorageMetrics;
window.clearUnpinnedCache = clearUnpinnedCache;
