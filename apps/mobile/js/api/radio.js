// ============================================================
// YOUTUBE MUSIC RADIO QUEUE GENERATOR
// ============================================================
async function fetchAndApplyYtmRadioQueue(trackId, force = false) {
  try {
    if (!force && window.activeQueueList && window.activeQueueList.length > 5 && window.activeQueueList.some(t => t.id === trackId)) {
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
          clientVersion: "1.20240101.01.00",
          hl: "en",
          gl: currentChartRegion === 'India' ? 'IN' : (currentChartRegion === 'United Kingdom' ? 'GB' : 'US')
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

    if (queueTracks.length > 1 && currentTrack && currentTrack.id === trackId) {
      const isChartActive = REGIONAL_CHARTS && currentChartRegion && window.activeQueueList === REGIONAL_CHARTS[currentChartRegion];
      const homeShelves = (typeof window !== 'undefined' && window.currentHomeShelves) || currentHomeShelves;
      const isShelfActive = !force && !window.isRadioActive && homeShelves && homeShelves.some(s => s.tracks && s.tracks === window.activeQueueList);
      if (!activePlaylist && !isChartActive && !isShelfActive) {
        if (!force && window.isRadioActive && window.activeQueueList && window.activeQueueList.length > 1 && window.activeQueueList.some(t => t.id === trackId)) {
          // If radio is already active and we are near the end, append fresh unique recommendations
          const existingIds = new Set(window.activeQueueList.map(t => t.id));
          const freshTracks = queueTracks.filter(t => !existingIds.has(t.id));
          if (freshTracks.length > 0) {
            window.activeQueueList = [...window.activeQueueList, ...freshTracks];
            console.log(`[YTM-Radio] Appended ${freshTracks.length} fresh radio songs (total queue: ${window.activeQueueList.length})`);
          }
        } else {
          // Start dynamic radio queue with recommendations
          console.log(`[YTM-Radio] Connected ${queueTracks.length} dynamic recommended songs for ${trackId}`);
          window.activeQueueList = queueTracks;
          window.isRadioActive = true;
          if (typeof showToast === 'function') {
            showToast('📻 YouTube Music Radio started', '📻');
          }
        }
        scheduleLookAhead(trackId);
        autoPrefetchNextTrack(trackId);
      }
    }
  } catch (err) {
    console.warn("fetchAndApplyYtmRadioQueue notice:", err);
  }
}

window.fetchAndApplyYtmRadioQueue = fetchAndApplyYtmRadioQueue;
