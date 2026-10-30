// ============================================================
// YOUTUBE MUSIC BROWSE PARSER
// ============================================================
function parseBrowseShelves(data) {
  if (!data) return [];
  const tabs = data?.contents?.singleColumnBrowseResultsRenderer?.tabs || [];
  let sections = tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents;
  if (!sections || sections.length === 0) {
    sections = data?.contents?.sectionListRenderer?.contents || [];
  }
  const shelves = [];

  function extractVid(o) {
    if (!o || typeof o !== 'object') return null;
    if (o.watchEndpoint?.videoId && typeof o.watchEndpoint.videoId === 'string' && o.watchEndpoint.videoId.length >= 10 && o.watchEndpoint.videoId.length <= 15) {
      return o.watchEndpoint.videoId;
    }
    if (o.videoId && typeof o.videoId === 'string' && o.videoId.length >= 10 && o.videoId.length <= 15) {
      return o.videoId;
    }
    if (o.playlistItemData?.videoId && typeof o.playlistItemData.videoId === 'string' && o.playlistItemData.videoId.length >= 10 && o.playlistItemData.videoId.length <= 15) {
      return o.playlistItemData.videoId;
    }
    return null;
  }

  function extractPid(o) {
    if (!o || typeof o !== 'object') return null;
    let pid = o.watchEndpoint?.playlistId || o.watchPlaylistEndpoint?.playlistId || o.playlistId;
    if (!pid && o.browseEndpoint?.browseId) {
      const bid = o.browseEndpoint.browseId;
      if (bid.startsWith('VL')) pid = bid.substring(2);
      else if (bid.startsWith('RD') || bid.startsWith('PL') || bid.startsWith('MPRE')) pid = bid;
    }
    if (typeof pid === 'string' && pid.length > 3) {
      if (!pid.startsWith('RDAMVM') && !pid.startsWith('RDAMPL')) {
        return pid;
      }
    }
    return null;
  }

  function deepFind(o, matcher, maxDepth = 12) {
    if (!o || typeof o !== 'object' || maxDepth < 0) return null;
    const res = matcher(o);
    if (res) return res;
    if (Array.isArray(o)) {
      for (let i = 0; i < o.length; i++) {
        const r = deepFind(o[i], matcher, maxDepth - 1);
        if (r) return r;
      }
    } else {
      for (const k in o) {
        if (Object.prototype.hasOwnProperty.call(o, k)) {
          const r = deepFind(o[k], matcher, maxDepth - 1);
          if (r) return r;
        }
      }
    }
    return null;
  }

  const MIX_GRADIENTS = [
    'linear-gradient(135deg, #FF0055, #7A00FF)',
    'linear-gradient(135deg, #00C6FF, #0072FF)',
    'linear-gradient(135deg, #43E97B, #38F9D7)',
    'linear-gradient(135deg, #FA709A, #FEE140)',
    'linear-gradient(135deg, #667EEA, #764BA2)',
    'linear-gradient(135deg, #F83600, #F9D423)',
    'linear-gradient(135deg, #FF512F, #DD2476)',
    'linear-gradient(135deg, #4568DC, #B06AB3)'
  ];

  for (const s of sections) {
    const shelf = s.musicCarouselShelfRenderer || s.musicShelfRenderer || s.gridRenderer;
    if (!shelf) continue;
    const h = shelf.header?.musicCarouselShelfBasicHeaderRenderer ||
              shelf.header?.musicShelfBasicHeaderRenderer ||
              shelf.header?.shelfHeaderRenderer ||
              shelf.header?.gridHeaderRenderer ||
              shelf.title;
    const tRuns = h?.title?.runs || (typeof h?.title === 'string' ? [{ text: h.title }] : null) || h?.runs || [];
    const shelfTitle = tRuns.map(r => r.text || '').join('').trim();
    if (!shelfTitle) continue;

    const bRuns = h?.strapline?.runs || h?.subtitle?.runs || [];
    const shelfBadge = bRuns.map(r => r.text || '').join('').trim();

    const sTitleLower = shelfTitle.toLowerCase();
    const sBadgeLower = shelfBadge.toLowerCase();
    if (sTitleLower.includes('podcast') || sTitleLower.includes('episode') ||
        sBadgeLower.includes('podcast') || sBadgeLower.includes('episode')) {
      continue; // Filter out podcast shelves
    }

    const items = shelf.contents || [];
    const tracks = [];
    const mixes = [];

    for (const item of items) {
      // A: Track items (musicResponsiveListItemRenderer)
      if (item.musicResponsiveListItemRenderer) {
        const r = item.musicResponsiveListItemRenderer;
        if (isInnerTubePodcastItem(r)) continue;
        let vid = r.playlistItemData?.videoId ||
                  r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId ||
                  r.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId ||
                  deepFind(r, extractVid, 12);

        let title = '';
        if (r.flexColumns && r.flexColumns[0]) {
          const c0 = r.flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer;
          const runs = c0?.text?.runs || c0?.title?.runs || [];
          title = runs.map(x => x.text || '').join('').trim();
        }
        if (!title) {
          const runs = r.title?.runs || (typeof r.title === 'string' ? [{ text: r.title }] : []);
          title = runs.map(x => x.text || '').join('').trim();
        }
        if (!title || !vid) continue;

        let artist = 'Cloud Music';
        if (r.flexColumns && r.flexColumns.length > 1) {
          const c1 = r.flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer;
          const runs = c1?.text?.runs || c1?.title?.runs || [];
          const cands = runs
            .map(x => x.text ? x.text.trim() : '')
            .filter(x => x && x !== '•' && x !== 'Song' && x !== 'Video' && x !== 'Album' && x !== 'Single' && !/^[0-9]+:[0-9]+(:[0-9]+)?$/.test(x));
          if (cands.length > 0) artist = cands.join(', ');
        } else if (r.subtitle) {
          const runs = r.subtitle.runs || (typeof r.subtitle === 'string' ? [{ text: r.subtitle }] : []);
          const cands = runs
            .map(x => x.text ? x.text.trim() : '')
            .filter(x => x && x !== '•' && x !== 'Song' && x !== 'Video' && x !== 'Album' && x !== 'Single' && !/^[0-9]+:[0-9]+(:[0-9]+)?$/.test(x));
          if (cands.length > 0) artist = cands.join(', ');
        }

        let cover = 'assets/logo.png';
        const thumbs = r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
                       r.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
                       r.thumbnail?.thumbnails || [];
        if (thumbs.length > 0) {
          cover = thumbs[thumbs.length - 1].url;
        } else if (vid) {
          cover = `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
        }

        let duration = 215;
        if (r.fixedColumns && r.fixedColumns.length > 0) {
          const fc = r.fixedColumns[0]?.musicResponsiveListItemFixedColumnRenderer;
          const durRun = (fc?.text?.runs || []).find(x => /^[0-9]+:[0-9]+(:[0-9]+)?$/.test((x.text || '').trim()));
          if (durRun) duration = parseDurationStringToSeconds(durRun.text);
        }
        if (duration === 215 && r.flexColumns && r.flexColumns.length > 1) {
          for (let ci = 1; ci < r.flexColumns.length; ci++) {
            const c = r.flexColumns[ci]?.musicResponsiveListItemFlexColumnRenderer;
            const durRun = (c?.text?.runs || []).find(x => /^[0-9]+:[0-9]+(:[0-9]+)?$/.test((x.text || '').trim()));
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

        const trackObj = { id: vid, title, artist, cover, duration, plays: 0 };
        if (isPodcastOrLongTrack(trackObj) || isPodcastOrLongTrack(r)) {
          continue; // Exclude podcasts and songs > 10 min
        }

        if (!tracks.some(t => t.id === vid)) {
          tracks.push(trackObj);
          if (!CATALOG.some(t => t.id === vid)) {
            CATALOG.push(trackObj);
          }
        }
      }
      // B: Card items (musicTwoRowItemRenderer)
      else if (item.musicTwoRowItemRenderer) {
        const r = item.musicTwoRowItemRenderer;
        if (isInnerTubePodcastItem(r)) continue;
        let pid = extractPid(r) || deepFind(r, extractPid, 12);
        let vid = extractVid(r) || deepFind(r, extractVid, 12);

        let title = '';
        const tRuns = r.title?.runs || (typeof r.title === 'string' ? [{ text: r.title }] : []);
        title = tRuns.map(x => x.text || '').join('').trim();
        if (!title) continue;

        let subtitle = 'Cloud Music';
        const sRuns = r.subtitle?.runs || (typeof r.subtitle === 'string' ? [{ text: r.subtitle }] : []);
        const cands = sRuns
          .map(x => x.text ? x.text.trim() : '')
          .filter(x => x && x !== '•' && x !== 'Song' && x !== 'Video' && x !== 'Album' && x !== 'Single' && !/^[0-9]+:[0-9]+(:[0-9]+)?$/.test(x));
        if (cands.length > 0) subtitle = cands.join(', ');

        let cover = 'assets/logo.png';
        const thumbs = r.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
                       r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
                       r.thumbnail?.thumbnails || [];
        if (thumbs.length > 0) {
          cover = thumbs[thumbs.length - 1].url;
        } else if (vid) {
          cover = `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
        }

        const subLower = subtitle.toLowerCase();
        const titleLower = title.toLowerCase();
        if (subLower.includes('podcast') || subLower.includes('episode') ||
            titleLower.includes('podcast') || titleLower.includes('episode')) {
          continue; // Exclude podcast mixes/cards
        }

        const isMixOrPlaylist = !!pid ||
                                subLower.includes('mix') ||
                                subLower.includes('playlist') ||
                                subLower.includes('station') ||
                                titleLower.includes('mix') ||
                                titleLower.includes('supermix');

        if (isMixOrPlaylist) {
          const mixId = pid || ('mix_' + titleLower.replace(/[^a-z0-9]/g, '_'));
          if (!mixes.some(m => m.id === mixId)) {
            let badge = 'Mix';
            if (titleLower.includes('supermix')) badge = 'Supermix';
            else if (titleLower.includes('discover')) badge = 'Discover';
            else if (titleLower.includes('chill')) badge = 'Chill';
            else if (titleLower.includes('energy') || titleLower.includes('workout')) badge = 'Energy';
            else if (titleLower.includes('focus')) badge = 'Focus';
            else if (titleLower.includes('favorite') || titleLower.includes('replay')) badge = 'Favorites';
            else if (titleLower.includes('party')) badge = 'Party';
            else if (titleLower.includes('romantic') || titleLower.includes('love')) badge = 'Romance';

            const grad = MIX_GRADIENTS[mixes.length % MIX_GRADIENTS.length];
            const origTrack = vid ? { id: vid, title, artist: subtitle, cover, duration: 215, plays: 0 } : null;
            if (origTrack && !CATALOG.some(t => t.id === vid)) {
              CATALOG.push(origTrack);
            }
            mixes.push({
              id: mixId,
              playlistId: pid || null,
              videoId: vid || null,
              title,
              subtitle,
              cover,
              badge,
              gradient: grad,
              songIds: vid ? [vid] : [],
              tracks: origTrack ? [origTrack] : []
            });
          }
        } else if (vid) {
          const trackObj = { id: vid, title, artist: subtitle, cover, duration: 215, plays: 0 };
          if (isPodcastOrLongTrack(trackObj) || isPodcastOrLongTrack(r)) {
            continue;
          }
          if (!tracks.some(t => t.id === vid)) {
            tracks.push(trackObj);
            if (!CATALOG.some(t => t.id === vid)) {
              CATALOG.push(trackObj);
            }
          }
        }
      }
    }

    if (tracks.length > 0 || mixes.length > 0) {
      shelves.push({ title: shelfTitle, badge: shelfBadge, tracks, mixes });
    }
  }

  return shelves;
}

window.parseBrowseShelves = parseBrowseShelves;
