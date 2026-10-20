// ============================================================
// YOUTUBE MUSIC SEARCH CLIENT
// ============================================================
function handleDebouncedSearch(val) {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    executeSearch(val);
  }, 350);
}

async function executeSearch(query) {
  const list = document.getElementById('searchResultsList');
  if (!list) return;
  const q = query.trim();
  if (!q) {
    list.innerHTML = '<div style="text-align: center; color: var(--text-dim); padding: 40px;">Type a title, artist, or song name to search</div>';
    currentYtmSearchResults = [];
    return;
  }

  // 1. Instant local search from CATALOG + REGIONAL_CHARTS
  const localMatches = [];
  const lowerQ = q.toLowerCase();
  for (const t of CATALOG) {
    if (isPodcastOrLongTrack(t)) continue;
    if ((t.title.toLowerCase().includes(lowerQ) || t.artist.toLowerCase().includes(lowerQ)) && !localMatches.some(m => m.id === t.id)) {
      localMatches.push(t);
    }
  }
  if (typeof REGIONAL_CHARTS === 'object') {
    for (const reg in REGIONAL_CHARTS) {
      for (const t of REGIONAL_CHARTS[reg]) {
        if (isPodcastOrLongTrack(t)) continue;
        if ((t.title.toLowerCase().includes(lowerQ) || t.artist.toLowerCase().includes(lowerQ)) && !localMatches.some(m => m.id === t.id)) {
          localMatches.push(t);
        }
      }
    }
  }

  currentYtmSearchResults = [...localMatches];
  renderSearchResults(list, currentYtmSearchResults, true);

  // 2. Live YouTube Music Search via InnerTube
  try {
    const payload = {
      context: {
        client: {
          clientName: "WEB_REMIX",
          clientVersion: "1.20240101.01.00",
          hl: "en",
          gl: "US"
        }
      },
      query: q
    };

    let searchCookie = null;
    if (userSession && userSession.cookie) {
      searchCookie = userSession.cookie;
    } else if (window.SokoNative && typeof window.SokoNative.getStoredYtmCookies === 'function') {
      const c = window.SokoNative.getStoredYtmCookies();
      if (c && c.length > 20) searchCookie = c;
    }

    const data = await callInnerTubeApi("youtubei/v1/search", payload, searchCookie);

    function findResponsiveItems(obj, out = []) {
      if (!obj || typeof obj !== 'object') return out;
      if (obj.musicResponsiveListItemRenderer) {
        out.push(obj.musicResponsiveListItemRenderer);
      }
      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) findResponsiveItems(obj[i], out);
      } else {
        for (const k in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, k)) {
            findResponsiveItems(obj[k], out);
          }
        }
      }
      return out;
    }

    function extractVideoId(obj) {
      if (!obj || typeof obj !== 'object') return null;
      if (obj.watchEndpoint && obj.watchEndpoint.videoId && typeof obj.watchEndpoint.videoId === 'string' && obj.watchEndpoint.videoId.length === 11) {
        return obj.watchEndpoint.videoId;
      }
      if (obj.videoId && typeof obj.videoId === 'string' && obj.videoId.length === 11) {
        return obj.videoId;
      }
      if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
          const r = extractVideoId(obj[i]);
          if (r) return r;
        }
      } else {
        for (const k in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, k)) {
            const r = extractVideoId(obj[k]);
            if (r) return r;
          }
        }
      }
      return null;
    }

    const items = findResponsiveItems(data);
    const onlineTracks = [];
    for (const item of items) {
      if (isInnerTubePodcastItem(item)) continue;
      const videoId = extractVideoId(item);
      if (!videoId) continue;

      const cols = item.flexColumns || [];
      if (cols.length === 0) continue;

      const col0 = cols[0]?.musicResponsiveListItemFlexColumnRenderer;
      const tRuns = col0?.text?.runs || col0?.title?.runs || [];
      const title = tRuns.length > 0 ? tRuns[0].text : '';
      if (!title) continue;

      let artist = q;
      if (cols.length > 1) {
        const col1 = cols[1]?.musicResponsiveListItemFlexColumnRenderer;
        const aRuns = col1?.text?.runs || col1?.title?.runs || [];
        const candidates = aRuns
          .map(r => r.text ? r.text.trim() : '')
          .filter(t => t && t !== '•' && t !== 'Song' && t !== 'Video' && t !== 'Album' && t !== 'Single' && t !== 'Playlist' && !/^[0-9]+:[0-9]+(:[0-9]+)?$/.test(t));
        if (candidates.length > 0) {
          artist = candidates[0];
        }
      }

      const thumbs = item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
      const cover = thumbs.length > 0 ? thumbs[thumbs.length - 1].url : ('https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg');

      let duration = 210;
      if (item.fixedColumns && item.fixedColumns.length > 0) {
        const fc = item.fixedColumns[0]?.musicResponsiveListItemFixedColumnRenderer;
        const durRun = (fc?.text?.runs || []).find(x => /^[0-9]+:[0-9]+(:[0-9]+)?$/.test((x.text || '').trim()));
        if (durRun) duration = parseDurationStringToSeconds(durRun.text);
      }
      if (duration === 210 && cols.length > 1) {
        for (let ci = 1; ci < cols.length; ci++) {
          const col = cols[ci]?.musicResponsiveListItemFlexColumnRenderer;
          const durRun = (col?.text?.runs || []).find(x => /^[0-9]+:[0-9]+(:[0-9]+)?$/.test((x.text || '').trim()));
          if (durRun) {
            duration = parseDurationStringToSeconds(durRun.text);
            break;
          }
        }
      }
      if (duration === 210 && item.lengthText) {
        const lStr = item.lengthText.runs?.[0]?.text || item.lengthText.simpleText;
        if (lStr) duration = parseDurationStringToSeconds(lStr);
      }

      const trackObj = {
        id: videoId,
        title: title,
        artist: artist,
        duration: duration,
        cover: cover,
        audioUrl: '',
        bitrate: '160k Opus'
      };

      if (isPodcastOrLongTrack(trackObj) || isPodcastOrLongTrack(item)) {
        continue; // Filter out podcasts and long tracks > 10 min
      }

      if (!onlineTracks.some(ot => ot.id === videoId) && !localMatches.some(lm => lm.id === videoId)) {
        onlineTracks.push(trackObj);
      }
    }

    if (onlineTracks.length > 0) {
      currentYtmSearchResults = [...localMatches, ...onlineTracks];
      renderSearchResults(list, currentYtmSearchResults, false);
    } else {
      renderSearchResults(list, currentYtmSearchResults, false);
    }
  } catch (err) {
    console.warn("YouTube live search notice:", err);
    renderSearchResults(list, currentYtmSearchResults, false);
  }
}

window.handleDebouncedSearch = handleDebouncedSearch;
window.executeSearch = executeSearch;
