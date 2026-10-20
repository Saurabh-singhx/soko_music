// Soko persistent storage engine (localStorage wrapper & rehydration)
function persistLastPlayedTrack(track) {
      if (!track || !track.id) return;
      try {
        localStorage.setItem(STORAGE_KEY_LAST_PLAYED, JSON.stringify({
          id: track.id,
          title: track.title,
          artist: track.artist,
          cover: track.cover,
          duration: track.duration || 215,
          audioUrl: track.audioUrl || ''
        }));
      } catch (e) {}
    }

    function getLastPlayedTrack() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_LAST_PLAYED);
        if (raw) return JSON.parse(raw);
      } catch (e) {}
      return null;
    }

function initPersistentStorage() {
      try {
        const isExcluded = (t) => {
          if (!t) return false;
          const filterFn = (typeof isPodcastOrLongTrack === 'function')
            ? isPodcastOrLongTrack
            : (typeof window !== 'undefined' && typeof window.isPodcastOrLongTrack === 'function' ? window.isPodcastOrLongTrack : null);
          if (filterFn) return filterFn(t);
          return (Number(t.duration) || 0) > 600;
        };

        let purgedAny = false;
        const purgedIds = new Set();

        // 0. Pre-clean CATALOG of any long tracks
        for (let i = CATALOG.length - 1; i >= 0; i--) {
          if (isExcluded(CATALOG[i])) {
            purgedAny = true;
            purgedIds.add(CATALOG[i].id);
            downloadedSet.delete(CATALOG[i].id);
            CATALOG.splice(i, 1);
          }
        }

        // 1. Rehydrate custom & downloaded tracks into CATALOG (purging > 10 min tracks)
        const savedTracksJson = localStorage.getItem(STORAGE_KEY_CUSTOM_TRACKS);
        if (savedTracksJson) {
          const savedTracks = JSON.parse(savedTracksJson);
          if (Array.isArray(savedTracks)) {
            for (const st of savedTracks) {
              if (isExcluded(st)) {
                purgedAny = true;
                purgedIds.add(st.id);
                if (typeof window !== 'undefined' && window.SokoNative && typeof window.SokoNative.deleteDownloadedTrack === 'function') {
                  try { window.SokoNative.deleteDownloadedTrack(st.id); } catch (e) {}
                }
                continue;
              }
              const existingIdx = CATALOG.findIndex(t => t.id === st.id);
              if (existingIdx >= 0) {
                CATALOG[existingIdx] = st;
              } else {
                CATALOG.push(st);
              }
            }
          }
        }

        // 2. Rehydrate downloadedSet (Preserve user downloads excluding purged)
        const savedIdsJson = localStorage.getItem(STORAGE_KEY_DOWNLOADED_IDS);
        if (savedIdsJson) {
          const savedIds = JSON.parse(savedIdsJson);
          if (Array.isArray(savedIds)) {
            for (const id of savedIds) {
              if (purgedIds.has(id)) {
                purgedAny = true;
                continue;
              }
              const t = findTrackAcrossAllSources(id);
              if (t && isExcluded(t)) {
                purgedAny = true;
                purgedIds.add(id);
                continue;
              }
              downloadedSet.add(id);
            }
          }
        }

        // 3. Rehydrate user playlists (cleaning out any purged IDs)
        const savedPlaylistsJson = localStorage.getItem(STORAGE_KEY_PLAYLISTS);
        if (savedPlaylistsJson) {
          const savedPlaylists = JSON.parse(savedPlaylistsJson);
          if (Array.isArray(savedPlaylists) && savedPlaylists.length > 0) {
            userPlaylists = savedPlaylists.map(pl => {
              if (Array.isArray(pl.songIds)) {
                const originalLen = pl.songIds.length;
                const filtered = pl.songIds.filter(id => !purgedIds.has(id));
                if (filtered.length !== originalLen) purgedAny = true;
                return { ...pl, songIds: filtered };
              }
              return pl;
            });
            if (typeof window !== 'undefined') window.userPlaylists = userPlaylists;
          }
        }

        // 4. Rehydrate max cache limit
        const savedLimit = localStorage.getItem(STORAGE_KEY_MAX_CACHE);
        if (savedLimit) {
          const parsed = parseFloat(savedLimit);
          if (!isNaN(parsed) && parsed > 0) {
            maxCacheGB = parsed;
            const selectEl = document.getElementById('maxCacheSelect');
            if (selectEl) selectEl.value = maxCacheGB.toFixed(1);
          }
        }

        if (purgedAny) {
          persistDownloadState();
        }

        console.log(`[Storage] Rehydrated ${downloadedSet.size} offline tracks and ${userPlaylists.length} playlists`);
      } catch (err) {
        console.warn("[Storage] Rehydration notice:", err);
      }
    }

    function persistDownloadState() {
      try {
        const isExcluded = (t) => {
          if (!t) return false;
          const filterFn = (typeof isPodcastOrLongTrack === 'function')
            ? isPodcastOrLongTrack
            : (typeof window !== 'undefined' && typeof window.isPodcastOrLongTrack === 'function' ? window.isPodcastOrLongTrack : null);
          if (filterFn) return filterFn(t);
          return (Number(t.duration) || 0) > 600;
        };

        localStorage.setItem(STORAGE_KEY_DOWNLOADED_IDS, JSON.stringify(Array.from(downloadedSet)));

        const customTracks = CATALOG
          .filter(t => !BUNDLED_TRACKS.some(b => b.id === t.id) && !isExcluded(t))
          .map(t => ({
            id: t.id,
            title: t.title || 'Unknown Title',
            artist: t.artist || 'Unknown Artist',
            duration: Number(t.duration) || 0,
            cover: t.cover || '',
            favorite: Boolean(t.favorite),
            audioUrl: t.audioUrl || ''
          }));
        localStorage.setItem(STORAGE_KEY_CUSTOM_TRACKS, JSON.stringify(customTracks));

        if (typeof window !== 'undefined' && window.userPlaylists) {
          userPlaylists = window.userPlaylists;
        }
        localStorage.setItem(STORAGE_KEY_PLAYLISTS, JSON.stringify(userPlaylists));
        localStorage.setItem(STORAGE_KEY_MAX_CACHE, maxCacheGB.toString());
      } catch (err) {
        console.warn("[Storage] Persistence notice:", err);
        if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
          try {
            const essentialCustom = CATALOG
              .filter(t => downloadedSet.has(t.id) && !BUNDLED_TRACKS.some(b => b.id === t.id) && !isExcluded(t))
              .slice(-200)
              .map(t => ({ id: t.id, title: t.title, artist: t.artist, duration: t.duration, cover: t.cover, favorite: t.favorite, audioUrl: t.audioUrl }));
            localStorage.setItem(STORAGE_KEY_CUSTOM_TRACKS, JSON.stringify(essentialCustom));
          } catch (innerErr) {
            console.error("[Storage] Critical quota recovery failed:", innerErr);
          }
        }
      }
    }

function updateMaxCacheLimit(val) {
      maxCacheGB = parseFloat(val);
      persistDownloadState();
      updateStorageMetrics();
      showToast(`Cache ceiling set to ${maxCacheGB} GB`, '💾');
    }

window.persistLastPlayedTrack = persistLastPlayedTrack;
window.getLastPlayedTrack = getLastPlayedTrack;
window.initPersistentStorage = initPersistentStorage;
window.persistDownloadState = persistDownloadState;
window.updateMaxCacheLimit = updateMaxCacheLimit;
