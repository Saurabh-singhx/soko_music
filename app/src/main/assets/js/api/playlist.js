// ============================================================
// YOUTUBE MUSIC PLAYLIST RESOLVER
// ============================================================
async function resolvePlaylistTracks(playlistId) {
  if (!playlistId) return [];
  const cleanId = playlistId.startsWith('VL') ? playlistId.substring(2) : playlistId;
  const isUser = userSession && userSession.isLoggedIn;
  const cookie = isUser ? (userSession.cookie || '') : '';

  try {
    const payload = {
      context: {
        client: {
          clientName: "WEB_REMIX",
          clientVersion: "1.20240101.01.00",
          hl: "en",
          gl: currentChartRegion === 'India' ? 'IN' : (currentChartRegion === 'United Kingdom' ? 'GB' : 'US')
        }
      },
      playlistId: cleanId,
      isAudioOnly: true
    };

    const res = await callInnerTubeApi("youtubei/v1/next", payload, cookie);
    let contents = res?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.musicQueueRenderer?.content?.playlistPanelRenderer?.contents ||
                   res?.contents?.playlistPanelRenderer?.contents ||
                   res?.continuationContents?.playlistPanelContinuation?.contents;

    if (!contents || !Array.isArray(contents) || contents.length === 0) {
      const found = [];
      function findPanels(o, depth = 8) {
        if (!o || typeof o !== 'object' || depth < 0) return;
        if (o.playlistPanelVideoRenderer) {
          found.push(o.playlistPanelVideoRenderer);
          return;
        }
        if (Array.isArray(o)) {
          for (const it of o) findPanels(it, depth - 1);
        } else {
          for (const k in o) {
            if (Object.prototype.hasOwnProperty.call(o, k)) findPanels(o[k], depth - 1);
          }
        }
      }
      findPanels(res);
      if (found.length > 0) {
        contents = found.map(r => ({ playlistPanelVideoRenderer: r }));
      }
    }

    const tracks = [];
    for (const item of (contents || [])) {
      const r = item.playlistPanelVideoRenderer;
      if (!r || !r.videoId) continue;
      if (isInnerTubePodcastItem(r)) continue;
      let title = "Unknown Track";
      if (r.title?.runs) {
        title = r.title.runs.map(x => x.text || '').join('').trim();
      } else if (typeof r.title === 'string') {
        title = r.title;
      }
      let artist = "YouTube Music";
      const aRuns = r.shortBylineText?.runs || r.longBylineText?.runs || [];
      const aCands = aRuns.map(x => x.text ? x.text.trim() : '').filter(x => x && x !== '•' && !/^[0-9]+:[0-9]+(:[0-9]+)?$/.test(x));
      if (aCands.length > 0) artist = aCands.join(', ');

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
        continue; // Exclude podcasts and tracks > 10 min
      }
      tracks.push(tObj);
      if (!CATALOG.some(t => t.id === tObj.id)) {
        CATALOG.push(tObj);
      }
    }
    if (tracks.length > 0) return tracks;
  } catch (err) {
    console.warn("Failed resolving playlist via next:", err);
  }

  try {
    const browsePayload = {
      context: {
        client: {
          clientName: "WEB_REMIX",
          clientVersion: "1.20240101.01.00",
          hl: "en",
          gl: currentChartRegion === 'India' ? 'IN' : (currentChartRegion === 'United Kingdom' ? 'GB' : 'US')
        }
      },
      browseId: "VL" + cleanId
    };
    const bRes = await callInnerTubeApi("youtubei/v1/browse", browsePayload, cookie);
    const secList = bRes?.contents?.twoColumnBrowseResultsRenderer?.secondaryContents?.sectionListRenderer?.contents ||
                    bRes?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents ||
                    bRes?.contents?.sectionListRenderer?.contents || [];
    const bTracks = [];
    for (const s of secList) {
      const shelf = s.musicPlaylistShelfRenderer || s.musicShelfRenderer;
      if (!shelf || !shelf.contents) continue;
      for (const it of shelf.contents) {
        const r = it.musicResponsiveListItemRenderer;
        if (!r) continue;
        if (isInnerTubePodcastItem(r)) continue;
        let vid = r.playlistItemData?.videoId;
        if (!vid) {
          const c0 = r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer;
          vid = c0?.text?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId;
        }
        if (!vid) continue;
        let title = r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.map(x => x.text).join('') || "Unknown";
        let artist = r.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.map(x => x.text).filter(x => x && x !== '•').join(', ') || "YouTube Music";
        const thumbs = r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
        const cover = thumbs.length > 0 ? thumbs[thumbs.length - 1].url : `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
        let duration = 215;
        if (r.fixedColumns && r.fixedColumns.length > 0) {
          const fc = r.fixedColumns[0]?.musicResponsiveListItemFixedColumnRenderer;
          const durRun = (fc?.text?.runs || []).find(x => /^[0-9]+:[0-9]+(:[0-9]+)?$/.test((x.text || '').trim()));
          if (durRun) duration = parseDurationStringToSeconds(durRun.text);
        }
        if (duration === 215 && r.flexColumns && r.flexColumns.length > 1) {
          for (let ci = 1; ci < r.flexColumns.length; ci++) {
            const col = r.flexColumns[ci]?.musicResponsiveListItemFlexColumnRenderer;
            const durRun = (col?.text?.runs || []).find(x => /^[0-9]+:[0-9]+(:[0-9]+)?$/.test((x.text || '').trim()));
            if (durRun) {
              duration = parseDurationStringToSeconds(durRun.text);
              break;
            }
          }
        }
        if (duration === 215 && r.lengthText) {
          const lStr = r.lengthText.runs?.[0]?.text || r.lengthText.simpleText;
          if (lStr) duration = parseDurationStringToSeconds(lStr);
        }
        const tObj = { id: vid, title, artist, cover, duration, plays: 0 };
        if (isPodcastOrLongTrack(tObj) || isPodcastOrLongTrack(r)) {
          continue; // Exclude podcasts and tracks > 10 min
        }
        bTracks.push(tObj);
        if (!CATALOG.some(t => t.id === tObj.id)) {
          CATALOG.push(tObj);
        }
      }
    }
    if (bTracks.length > 0) return bTracks;
  } catch (err2) {
    console.warn("Failed resolving playlist via browse:", err2);
  }

  const curatedMatch = (typeof CURATED_MIXES !== 'undefined' && Array.isArray(CURATED_MIXES))
    ? CURATED_MIXES.find(m => m.id === playlistId || m.id === cleanId || m.playlistId === playlistId)
    : null;
  if (curatedMatch && curatedMatch.songIds && curatedMatch.songIds.length > 0) {
    const curTracks = curatedMatch.songIds.map(id => findTrackAcrossAllSources(id)).filter(t => t && !isPodcastOrLongTrack(t));
    if (curTracks.length > 0) return curTracks;
  }

  return [];
}

window.resolvePlaylistTracks = resolvePlaylistTracks;
