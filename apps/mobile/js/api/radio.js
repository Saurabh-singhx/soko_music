// ============================================================
// YOUTUBE MUSIC RADIO QUEUE GENERATOR
// ============================================================
async function fetchAndApplyYtmRadioQueue(trackId, mode = 'auto') {
  try {
    if (!trackId) return;

    // Check if we are in append/auto mode and queue already has plenty of songs
    const isReplace = (mode === true || mode === 'replace');
    const isAppend = (mode === false || mode === 'append');

    if (!isReplace && window.activeQueueList && window.activeQueueList.length > 5 && window.activeQueueList.some(t => t.id === trackId)) {
      const cIdx = window.activeQueueList.findIndex(t => t.id === trackId);
      if (cIdx >= 0 && cIdx < window.activeQueueList.length - 3) {
        // Active queue already contains this track and has plenty of upcoming recommendations
        return;
      }
    }

    let cookie = null;
    if (userSession && userSession.cookie) {
      cookie = userSession.cookie;
    } else if (window.SokoNative && typeof window.SokoNative.getStoredYtmCookies === 'function') {
      const c = window.SokoNative.getStoredYtmCookies();
      if (c && c.length > 20) cookie = c;
    }

    const payload = {
      context: {
        client: {
          clientName: "WEB_REMIX",
          clientVersion: "1.20261020.10.00",
          hl: "en",
          gl: (typeof currentChartRegion !== 'undefined' && currentChartRegion === 'India') ? 'IN' : ((typeof currentChartRegion !== 'undefined' && currentChartRegion === 'United Kingdom') ? 'GB' : 'US')
        }
      },
      videoId: trackId,
      playlistId: "RDAMVM" + trackId,
      isAudioOnly: true
    };

    const res = await callInnerTubeApi("youtubei/v1/next", payload, cookie);
    if (!res) return;

    const tabs = res.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs;
    const contents = tabs?.[0]?.tabRenderer?.content?.musicQueueRenderer?.content?.playlistPanelRenderer?.contents || [];

    const queueTracks = [];
    for (const item of contents) {
      const r = item.playlistPanelVideoRenderer;
      if (!r || !r.videoId) continue;
      if (isInnerTubePodcastItem(r)) continue;
      const title = r.title?.runs?.[0]?.text || "Unknown Track";
      const artist = r.shortBylineText?.runs?.[0]?.text || "Unknown Artist";
      let cover = `https://i.ytimg.com/vi/${r.videoId}/hqdefault.jpg`;
      if (r.thumbnail?.thumbnails?.length) {
        cover = r.thumbnail.thumbnails[r.thumbnail.thumbnails.length - 1].url;
      }
      let duration = 215;
      const lenStr = r.lengthText?.runs?.[0]?.text || r.lengthText?.simpleText;
      if (lenStr) {
        duration = parseDurationStringToSeconds(lenStr);
      }
      const tObj = { id: r.videoId, title, artist, cover, duration, plays: 0 };
      if (isPodcastOrLongTrack(tObj) || isPodcastOrLongTrack(r)) {
        continue; // Filter out podcasts and tracks > 10 min
      }
      queueTracks.push(tObj);
      if (!CATALOG.some(t => t.id === tObj.id)) {
        CATALOG.push(tObj);
      }
    }

    if (queueTracks.length > 1) {
      const shouldAppend = isAppend || (!isReplace && window.activeQueueList && window.activeQueueList.length > 1);

      if (shouldAppend && window.activeQueueList && window.activeQueueList.length > 0) {
        // Append mode: preserve existing queue and add fresh unique recommendations at the end
        const existingIds = new Set(window.activeQueueList.map(t => t.id));
        const freshTracks = queueTracks.filter(t => !existingIds.has(t.id));
        if (freshTracks.length > 0) {
          window.activeQueueList = [...window.activeQueueList, ...freshTracks];
          console.log(`[YTM-Radio] Appended ${freshTracks.length} fresh radio songs (total queue: ${window.activeQueueList.length})`);
        }
        window.isRadioActive = true;
      } else {
        // Replace mode: Quick picks or brand new radio launch
        console.log(`[YTM-Radio] Connected ${queueTracks.length} dynamic recommended songs for ${trackId}`);
        window.activeQueueList = queueTracks;
        window.isRadioActive = true;
        activePlaylist = null;
        window.activePlaylist = null;
        if (typeof showToast === 'function') {
          showToast('📻 Dynamic Radio started', '📻');
        }
      }
      const currentId = currentTrack?.id || trackId;
      scheduleLookAhead(currentId);
      autoPrefetchNextTrack(currentId);
      if (typeof updatePlayerUI === 'function') {
        const cur = (typeof window !== 'undefined' && window.currentTrack) || (typeof currentTrack !== 'undefined' ? currentTrack : null);
        updatePlayerUI(cur);
      }
    } else if (isReplace) {
      if (typeof showToast === 'function') {
        showToast('⚠️ No radio recommendations found for this track', '📻');
      }
    }
  } catch (err) {
    console.warn("fetchAndApplyYtmRadioQueue notice:", err);
    if (typeof showToast === 'function') {
      showToast('⚠️ Unable to connect Dynamic Radio', '⚠️');
    }
  }
}

// ============================================================
// TRIGGER YOUTUBE MUSIC RADIO FOR NOW-PLAYING SONG
// ============================================================
async function triggerRadioCurrentTrack() {
  const notifyToast = (msg, icon = '📻') => {
    if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
      window.showToast(msg, icon);
    } else if (typeof showToast === 'function') {
      showToast(msg, icon);
    }
  };

  let track = null;
  if (typeof window !== 'undefined' && window.currentTrack !== undefined) {
    track = window.currentTrack;
  } else if (typeof currentTrack !== 'undefined') {
    track = currentTrack;
  }

  if (!track || !track.id) {
    notifyToast('Play a song first to start radio', '📻');
    return;
  }

  if (window.__isRadioFetching) {
    return;
  }

  window.__isRadioFetching = true;
  const modalRadioBtn = document.getElementById('modalRadioBtn');
  const miniRadioBtn = document.getElementById('miniRadioBtn');
  const queueRadioBtn = document.getElementById('queueStartRadioBtn');
  const queueStartRadioText = document.getElementById('queueStartRadioText');

  if (modalRadioBtn) modalRadioBtn.classList.add('loading');
  if (miniRadioBtn) miniRadioBtn.classList.add('loading');
  if (queueRadioBtn) queueRadioBtn.classList.add('loading');
  if (queueStartRadioText) queueStartRadioText.innerText = 'Connecting...';

  notifyToast(`📻 Connecting Dynamic Radio for "${track.title || 'Track'}"...`, '📻');

  try {
    if (typeof fetchAndApplyYtmRadioQueue === 'function') {
      await fetchAndApplyYtmRadioQueue(track.id, 'replace');
    }
  } catch (err) {
    console.warn('[Dynamic-Radio] Error triggering radio:', err);
    notifyToast('⚠️ Unable to connect Dynamic Radio', '⚠️');
  } finally {
    window.__isRadioFetching = false;
    if (modalRadioBtn) modalRadioBtn.classList.remove('loading');
    if (miniRadioBtn) miniRadioBtn.classList.remove('loading');
    if (queueRadioBtn) queueRadioBtn.classList.remove('loading');
    const cur = (typeof window !== 'undefined' && window.currentTrack) || (typeof currentTrack !== 'undefined' ? currentTrack : track);
    if (typeof updatePlayerUI === 'function') {
      updatePlayerUI(cur);
    }
  }
}

window.fetchAndApplyYtmRadioQueue = fetchAndApplyYtmRadioQueue;
window.triggerRadioCurrentTrack = triggerRadioCurrentTrack;
