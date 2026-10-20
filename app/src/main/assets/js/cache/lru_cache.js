// Soko cache engine: storage metrics and unpinned LRU cache eviction
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

      persistDownloadState();
      updateStorageMetrics();
      renderShelves();
      renderLibraryTracks();
      renderPlaylists();
      showToast(`Cleared ${toRemove.length} unpinned songs & freed disk space`, '🧹');
    }

window.updateStorageMetrics = updateStorageMetrics;
window.clearUnpinnedCache = clearUnpinnedCache;
