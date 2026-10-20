// Soko background audio track download and caching engine
window.onNativeDownloadProgress = function(trackId, percent) {
      activeDownloads.set(trackId, percent);
      const track = findTrackAcrossAllSources(trackId);
      if (track) {
        updateDownloadBannerUI(track, percent, percent >= 100);
      }
      renderShelves();
    };

    window.onNativeDownloadComplete = function(trackId, localPath, autoPlay) {
      activeDownloads.delete(trackId);
      downloadedSet.add(trackId);
      const track = findTrackAcrossAllSources(trackId);
      if (track) {
        track.audioUrl = localPath;
        if (!CATALOG.some(t => t.id === track.id)) {
          CATALOG.push(track);
        }
        updateDownloadBannerUI(track, 100, true);
        if (autoPlay && currentTrack && currentTrack.id === trackId) {
          showToast('✓ "' + track.title + '" playing from local storage!', '⚡');
        } else if (!autoPlay) {
          showToast('⚡ Pre-cached next song: "' + track.title + '"', '⚡');
        }
      }
      const offPl = userPlaylists.find(p => p.id === 'pl_offline');
      if (offPl && !offPl.songIds.includes(trackId)) {
        offPl.songIds.push(trackId);
      }
      persistDownloadState();
      updateStorageMetrics();
      renderShelves();
      renderLibraryTracks();
      renderPlaylists();
      if (currentTrack && currentTrack.id === trackId) {
        updatePlayerUI(currentTrack);
      }
      if (lookAheadNextTrack && lookAheadNextTrack.id === trackId) {
        updateLookAheadUI();
      }
    };

    window.onNativeDownloadFailed = function(trackId, errorMsg) {
      activeDownloads.delete(trackId);
      const track = findTrackAcrossAllSources(trackId);
      updateDownloadBannerUI(track || { title: 'Download' }, 0, true);
      showToast('⚠️ ' + errorMsg, '⚠️');
      if (track && currentTrack && currentTrack.id === trackId && !errorMsg.includes('No internet connection')) {
        playOnlineYouTubeStream(track);
      }
    };

    // ============================================================
    // OFFLINE DOWNLOAD ENGINE
    // ============================================================
    // activeDownloads map managed in state/store.js

    function startDownloadTrack(trackId) {
      let track = findTrackAcrossAllSources(trackId);
      if (!track) return;
      if (!CATALOG.some(t => t.id === track.id)) {
        CATALOG.push(track);
      }

      if (isPodcastOrLongTrack(track)) {
        showToast('⚠️ Podcasts & songs over 10 min cannot be downloaded', '⚠️');
        return;
      }

      if (isTrackOffline(track.id)) {
        showToast(`"${track.title}" is already offline cached!`, '⚡');
        return;
      }

      if (activeDownloads.has(track.id)) {
        showToast(`"${track.title}" is currently downloading...`, '⏳');
        return;
      }

      if (typeof enforceLruEviction === 'function') {
        enforceLruEviction(3.5 * 1024 * 1024);
      }

      activeDownloads.set(track.id, 5);
      updateDownloadBannerUI(track, 5, false);
      renderShelves();
      renderLibraryTracks();
      showToast(`Downloading "${track.title}" (128k AAC)...`, '📥');

      if (window.SokoNative && typeof window.SokoNative.downloadTrack === 'function') {
        window.SokoNative.downloadTrack(track.id, track.title, track.artist, track.cover);
      } else {
        let progress = 0;
        const interval = setInterval(() => {
          progress += Math.floor(Math.random() * 20) + 15;
          if (progress >= 100) {
            clearInterval(interval);
            window.onNativeDownloadComplete(track.id, `assets/music/${track.id}.opus`, false);
          } else {
            window.onNativeDownloadProgress(track.id, progress);
          }
        }, 300);
      }
    }

    function triggerDownloadCurrentTrack() {
      if (currentTrack) {
        if (isPodcastOrLongTrack(currentTrack)) {
          showToast('⚠️ Podcasts & songs over 10 min cannot be downloaded', '⚠️');
          return;
        }
        startDownloadTrack(currentTrack.id);
      }
    }

window.startDownloadTrack = startDownloadTrack;
window.triggerDownloadCurrentTrack = triggerDownloadCurrentTrack;
