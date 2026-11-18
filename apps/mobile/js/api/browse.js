// ============================================================
// YOUTUBE MUSIC BROWSE & FEED API
// ============================================================
async function fetchYouTubeMusicFeed(force = false) {
  const isUser = userSession && userSession.isLoggedIn;
  const isDemo = userSession && userSession.isDemo;
  const cookie = isUser ? (userSession.cookie || '') : '';

  try {
    if (isDemo) {
      const getTracks = (region) => {
        const pool = ((REGIONAL_CHARTS && REGIONAL_CHARTS[region]) || CATALOG || []);
        return (typeof selectRotatingTracks === 'function')
          ? selectRotatingTracks(pool, 16, force)
          : pool.slice(0, 16);
      };

      const demoShelves = [
        {
          title: "Quick picks",
          badge: "START RADIO FROM A SONG",
          tracks: getTracks('Global'),
          mixes: []
        },
        {
          title: "Mixed for you",
          badge: "PLAYLISTS TAILORED FOR YOU",
          tracks: [],
          mixes: CURATED_MIXES.map(m => ({
            ...m,
            tracks: (m.songIds || []).map(id => findTrackAcrossAllSources(id)).filter(Boolean)
          }))
        },
        {
          title: "Trending songs for you",
          badge: "CHARTS & BUZZ",
          tracks: getTracks('India'),
          mixes: []
        },
        {
          title: "Forgotten favorites",
          badge: "REVISIT PAST FAVORITES",
          tracks: getTracks('United States'),
          mixes: []
        },
        {
          title: "Listen together",
          badge: "GROUP SESSION & PARTY PICKS",
          tracks: getTracks('United Kingdom'),
          mixes: []
        }
      ];
      personalShelves = demoShelves;
      localStorage.setItem('soko_ytm_cached_feed_v2', JSON.stringify(demoShelves));
      renderHomeShelves(demoShelves, force);
      return { success: true, shelves: demoShelves };
    }

    // On force refresh (e.g. pull-to-refresh), proactively update live regional charts in background
    if (force && typeof fetchLiveRegionalCharts === 'function' && typeof currentChartRegion !== 'undefined' && currentChartRegion) {
      fetchLiveRegionalCharts(currentChartRegion).catch(() => {});
    }

    const targetGl = (typeof currentChartRegion !== 'undefined' && currentChartRegion === 'India') ? 'IN' : ((typeof currentChartRegion !== 'undefined' && currentChartRegion === 'United Kingdom') ? 'GB' : ((typeof currentChartRegion !== 'undefined' && currentChartRegion === 'United States') ? 'US' : 'IN'));

    const baseClient = {
      clientName: "WEB_REMIX",
      clientVersion: "1.20261020.10.00",
      hl: "en",
      gl: targetGl
    };
    if (isUser && userSession && userSession.visitorData) {
      baseClient.visitorData = userSession.visitorData;
    } else if (window.lastYtmVisitorData) {
      baseClient.visitorData = window.lastYtmVisitorData;
    }

    // Concurrently fetch FEmusic_home, FEmusic_explore, Feel-good (throwback) chip, and Party (together) chip
    const [homeRes, expRes, feelRes, partyRes] = await Promise.allSettled([
      callInnerTubeApi("youtubei/v1/browse", { context: { client: baseClient }, browseId: "FEmusic_home" }, cookie),
      callInnerTubeApi("youtubei/v1/browse", { context: { client: baseClient }, browseId: "FEmusic_explore" }, cookie),
      callInnerTubeApi("youtubei/v1/browse", {
        context: { client: baseClient },
        browseId: "FEmusic_home",
        params: "ggNCSgQIDBABSgQIDRABSgQICBADSgQIBxABSgQICRABSgQIDhABSgQIBBABSgQIAxABSgQIChABSgQIBhABSgQIBRAB"
      }, cookie),
      callInnerTubeApi("youtubei/v1/browse", {
        context: { client: baseClient },
        browseId: "FEmusic_home",
        params: "ggNCSgQIDBABSgQIDRABSgQICBABSgQIBxABSgQICRABSgQIDhADSgQIBBABSgQIAxABSgQIChABSgQIBhABSgQIBRAB"
      }, cookie)
    ]);

    const homeData = homeRes.status === 'fulfilled' ? homeRes.value : null;
    const expData = expRes.status === 'fulfilled' ? expRes.value : null;
    const feelData = feelRes.status === 'fulfilled' ? feelRes.value : null;
    const partyData = partyRes.status === 'fulfilled' ? partyRes.value : null;

    if (homeData && homeData.responseContext && homeData.responseContext.visitorData && !isUser) {
      window.lastYtmVisitorData = homeData.responseContext.visitorData;
    }

    const homeShelves = parseBrowseShelves(homeData);
    const expShelves = parseBrowseShelves(expData);
    const feelShelves = parseBrowseShelves(feelData);
    const partyShelves = parseBrowseShelves(partyData);

    let extractedShelves = [];
    const seenTitles = new Set();

    const isListenAgainOrInvalid = (s) => {
      if (!s || !s.title) return true;
      const tLower = s.title.toLowerCase().trim();
      const bLower = (s.badge || '').toLowerCase().trim();
      return tLower.includes('listen again') || bLower.includes('listen again') ||
             tLower.includes('recently played') || bLower.includes('recently played') ||
             tLower.includes('history') || bLower.includes('history') ||
             tLower.includes('podcast') || bLower.includes('podcast') ||
             tLower.includes('episode') || bLower.includes('episode');
    };

    // 1. Identify Quick picks from homeShelves (DO NOT TOUCH!)
    const quickShelf = homeShelves.find(s => !isListenAgainOrInvalid(s) && (
      s.title.toLowerCase().includes('quick') ||
      (s.tracks && s.tracks.length > 0 && !s.title.toLowerCase().includes('mix'))
    ));
    if (quickShelf) {
      const qLower = quickShelf.title.toLowerCase().trim();
      quickShelf.title = qLower.includes('quick') ? quickShelf.title : "Quick picks";
      quickShelf.badge = quickShelf.badge || "START RADIO FROM A SONG";
      seenTitles.add('quick picks');
      extractedShelves.push(quickShelf);
    }

    // 2. Identify Mix for you and aggregate all authentic mixes from all sources
    let mixShelf = homeShelves.find(s => !isListenAgainOrInvalid(s) && (
      s.title.toLowerCase().includes('mixed for you') ||
      s.title.toLowerCase().includes('mix for you') ||
      (s.mixes && s.mixes.length > 0)
    ));
    if (!mixShelf) {
      mixShelf = feelShelves.find(s => !isListenAgainOrInvalid(s) && s.mixes && s.mixes.length > 0) ||
                 partyShelves.find(s => !isListenAgainOrInvalid(s) && s.mixes && s.mixes.length > 0) ||
                 expShelves.find(s => !isListenAgainOrInvalid(s) && s.mixes && s.mixes.length > 0);
    }

    const allMixes = [];
    const seenMixKeys = new Set();
    const addMix = (m) => {
      if (!m) return;
      const key = (m.playlistId || m.id || m.title || '').toLowerCase();
      if (!key || seenMixKeys.has(key)) return;
      seenMixKeys.add(key);
      allMixes.push(m);
    };

    for (const shelfList of [homeShelves, feelShelves, partyShelves, expShelves]) {
      for (const s of shelfList) {
        if (isListenAgainOrInvalid(s)) continue;
        if (s.mixes && s.mixes.length > 0) {
          for (const m of s.mixes) addMix(m);
        }
      }
    }

    if (!mixShelf) {
      mixShelf = {
        title: "Mix for you",
        badge: "PLAYLISTS TAILORED FOR YOU",
        tracks: [],
        mixes: allMixes
      };
    } else {
      const isMixedForYou = mixShelf.title.toLowerCase().includes('mixed for you');
      mixShelf.title = isMixedForYou ? mixShelf.title : "Mix for you";
      mixShelf.badge = mixShelf.badge || "PLAYLISTS TAILORED FOR YOU";
      mixShelf.mixes = allMixes;
      mixShelf.tracks = mixShelf.tracks || [];
    }
    seenTitles.add('mix for you');
    extractedShelves.push(mixShelf);

    // 3. Feel-good shelves: ONLY the throwback tracks -> "Forgotten favorites" (prevent duplicate Quick picks/Mixes)
    if (feelShelves && feelShelves.length > 0) {
      const feelTrackShelf = feelShelves.find(s => !isListenAgainOrInvalid(s) && s !== mixShelf && s.tracks && s.tracks.length > 0) ||
                             feelShelves.find(s => !isListenAgainOrInvalid(s) && s !== mixShelf);
      if (feelTrackShelf && !seenTitles.has('forgotten favorites')) {
        feelTrackShelf.title = "Forgotten favorites";
        feelTrackShelf.badge = "REVISIT PAST FAVORITES";
        seenTitles.add('forgotten favorites');
        extractedShelves.push(feelTrackShelf);
      }
    }

    // 4. Explore shelves: ONLY the trending tracks -> "Trending songs for you"
    if (expShelves && expShelves.length > 0) {
      const trendShelf = expShelves.find(s => !isListenAgainOrInvalid(s) && s !== mixShelf && (s.title.toLowerCase().includes('trend') || (s.tracks && s.tracks.length > 0))) ||
                         expShelves.find(s => !isListenAgainOrInvalid(s) && s !== mixShelf);
      if (trendShelf && !seenTitles.has('trending songs for you')) {
        trendShelf.title = "Trending songs for you";
        trendShelf.badge = "CHARTS & BUZZ";
        seenTitles.add('trending songs for you');
        extractedShelves.push(trendShelf);
      }
    }

    // 5. Party shelves: ONLY the party tracks -> "Listen together" (prevent duplicate Quick picks/Mixes)
    if (partyShelves && partyShelves.length > 0) {
      const partyTrackShelf = partyShelves.find(s => !isListenAgainOrInvalid(s) && s !== mixShelf && s.tracks && s.tracks.length > 0) ||
                              partyShelves.find(s => !isListenAgainOrInvalid(s) && s !== mixShelf);
      if (partyTrackShelf && !seenTitles.has('listen together')) {
        partyTrackShelf.title = "Listen together";
        partyTrackShelf.badge = "GROUP SESSION & PARTY PICKS";
        seenTitles.add('listen together');
        extractedShelves.push(partyTrackShelf);
      }
    }

    // 6. Truly unique auxiliary shelves from homeShelves (e.g. "Similar to The Weeknd")
    for (const s of homeShelves) {
      if (isListenAgainOrInvalid(s)) continue;
      if (s === quickShelf || s === mixShelf) continue;
      const tLower = s.title.toLowerCase().trim();
      if (!tLower.includes('mix') && !tLower.includes('quick') && !tLower.includes('forgot') && !tLower.includes('trend') && !tLower.includes('together')) {
        if (!seenTitles.has(tLower)) {
          seenTitles.add(tLower);
          extractedShelves.push(s);
        }
      }
    }

    // Pre-resolve tracks for the top 5 mixes in Mix for you so tapping starts immediately
    if (mixShelf && mixShelf.mixes && mixShelf.mixes.length > 0) {
      for (let i = 0; i < Math.min(5, mixShelf.mixes.length); i++) {
        const m = mixShelf.mixes[i];
        const pid = m.playlistId;
        const vid = m.videoId;
        if (pid || vid) {
          try {
            const resTracks = await resolvePlaylistTracks(pid, vid);
            if (resTracks && resTracks.length > 0) {
              m.tracks = resTracks;
              m.songIds = resTracks.map(t => t.id);
              if ((!m.cover || m.cover === 'assets/logo.png') && resTracks[0]?.cover) {
                m.cover = resTracks[0].cover;
              }
              if (!m.videoId && resTracks[0]?.id) {
                m.videoId = resTracks[0].id;
              }
              mixShelf.tracks = mixShelf.tracks || [];
              for (const rt of resTracks) {
                if (!mixShelf.tracks.some(t => t.id === rt.id)) {
                  mixShelf.tracks.push(rt);
                }
              }
            }
          } catch (err) {}
        }
      }
    }



    if (extractedShelves.length > 0) {
      personalShelves = extractedShelves;
      localStorage.setItem('soko_ytm_cached_feed_v2', JSON.stringify(extractedShelves));
      renderHomeShelves(extractedShelves, force);
      return { success: true, shelves: extractedShelves };
    }
  } catch (err) {
    console.warn("Cloud feed notice:", err);
    const container = document.getElementById('homeFeedContainer');
    if (container && (!personalShelves || personalShelves.length === 0)) {
      renderHomeShelves([], force);
    }
    return { success: false, error: err };
  }

  const container = document.getElementById('homeFeedContainer');
  if (container && (!personalShelves || personalShelves.length === 0)) {
    renderHomeShelves([], force);
  }
  return { success: false, error: new Error("No shelves extracted") };
}

window.fetchYouTubeMusicFeed = fetchYouTubeMusicFeed;

// ============================================================
// REAL LIVE REGIONAL CHARTS API (InnerTube FEmusic_charts & Playlist Resolver)
// ============================================================
let isFetchingChartsMap = {};

async function resolveChartPlaylistId(region, gl, cookie) {
  const pids = window.REGIONAL_PLAYLIST_IDS || {};
  if (pids[region]) return pids[region];

  // Dynamically resolve regional chart playlist via InnerTube search
  try {
    const payload = {
      context: {
        client: {
          clientName: "WEB_REMIX",
          clientVersion: "1.20261020.10.00",
          hl: "en",
          gl: gl || "US"
        }
      },
      query: `Top 100 Music Videos ${region}`
    };
    const sRes = await callInnerTubeApi("youtubei/v1/search", payload, cookie);
    const sStr = JSON.stringify(sRes || {});
    // Match official YouTube Charts channel playlists (PL4fGSI1pDJn...)
    const officialMatch = sStr.match(/"playlistId":"(PL4fGSI1pDJn[a-zA-Z0-9_-]+)"/);
    if (officialMatch && officialMatch[1]) {
      pids[region] = officialMatch[1];
      return officialMatch[1];
    }
    const genericMatch = sStr.match(/"playlistId":"(PL[a-zA-Z0-9_-]+)"/);
    if (genericMatch && genericMatch[1]) {
      pids[region] = genericMatch[1];
      return genericMatch[1];
    }
  } catch (err) {
    console.warn(`[Charts API] Dynamic playlist resolution failed for ${region}:`, err);
  }
  return pids["Global"] || "PL4fGSI1pDJn49TUu37nJoN2QTeYuRwmNv";
}

function parseChartBrowseResponse(res) {
  if (!res) return [];
  const secList = res?.contents?.twoColumnBrowseResultsRenderer?.secondaryContents?.sectionListRenderer?.contents ||
                  res?.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents ||
                  res?.contents?.sectionListRenderer?.contents || [];
  const tracks = [];
  for (const s of secList) {
    const shelf = s.musicPlaylistShelfRenderer || s.musicShelfRenderer;
    if (!shelf || !shelf.contents || !Array.isArray(shelf.contents)) continue;
    for (const it of shelf.contents) {
      const r = it.musicResponsiveListItemRenderer;
      if (!r) continue;
      if (typeof isInnerTubePodcastItem === 'function' && isInnerTubePodcastItem(r)) continue;

      let vid = r.playlistItemData?.videoId;
      if (!vid) {
        const c0 = r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer;
        vid = c0?.text?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId;
      }
      if (!vid) {
        vid = r.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId;
      }
      if (!vid || typeof vid !== 'string' || vid.length < 3) continue;

      let title = "Unknown Title";
      const c0 = r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer;
      if (c0?.text?.runs?.length) {
        title = c0.text.runs.map(x => x.text || '').join('').trim();
      } else if (r.title?.runs?.length) {
        title = r.title.runs.map(x => x.text || '').join('').trim();
      }

      let artist = "Cloud Music";
      if (r.flexColumns && r.flexColumns.length > 1) {
        const c1 = r.flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer;
        const runs = c1?.text?.runs || [];
        const artistParts = [];
        for (const x of runs) {
          const t = x.text || '';
          const trimmed = t.trim();
          if (trimmed === '•' || trimmed === 'Song' || trimmed === 'Video' || trimmed === 'Album' || trimmed === 'Single') break;
          if (/^[0-9]+:[0-9]+(:[0-9]+)?$/.test(trimmed)) break;
          if (/^[0-9,.]+\s*(views|plays|subscribers)?$/i.test(trimmed)) break;
          artistParts.push(t);
        }
        const joined = artistParts.join('').trim().replace(/^[,•\s]+|[,•\s]+$/g, '');
        if (joined) artist = joined;
      }

      let cover = `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
      const thumbs = r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
                     r.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
                     r.thumbnail?.thumbnails || [];
      if (thumbs.length > 0) {
        const sorted = [...thumbs].sort((a, b) => ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0)));
        const bestUrl = sorted[0]?.url || thumbs[thumbs.length - 1].url;
        cover = (typeof getHighResArtworkUrl === 'function') ? getHighResArtworkUrl(bestUrl, 800) : bestUrl;
      }

      let duration = 215;
      if (r.fixedColumns && r.fixedColumns.length > 0) {
        const fc = r.fixedColumns[0]?.musicResponsiveListItemFixedColumnRenderer;
        const durRun = (fc?.text?.runs || []).find(x => /^[0-9]+:[0-9]+(:[0-9]+)?$/.test((x.text || '').trim()));
        if (durRun) duration = (typeof parseDurationStringToSeconds === 'function') ? parseDurationStringToSeconds(durRun.text) : 215;
      }
      if (duration === 215 && r.flexColumns && r.flexColumns.length > 1) {
        for (let ci = 1; ci < r.flexColumns.length; ci++) {
          const col = r.flexColumns[ci]?.musicResponsiveListItemFlexColumnRenderer;
          const durRun = (col?.text?.runs || []).find(x => /^[0-9]+:[0-9]+(:[0-9]+)?$/.test((x.text || '').trim()));
          if (durRun) {
            duration = (typeof parseDurationStringToSeconds === 'function') ? parseDurationStringToSeconds(durRun.text) : 215;
            break;
          }
        }
      }
      if (duration === 215 && r.lengthText) {
        const lStr = r.lengthText.runs?.[0]?.text || r.lengthText.simpleText;
        if (lStr && typeof parseDurationStringToSeconds === 'function') {
          duration = parseDurationStringToSeconds(lStr);
        }
      }

      const tObj = {
        id: vid,
        title,
        artist,
        cover,
        duration,
        plays: 0
      };

      if (typeof isPodcastOrLongTrack === 'function' && isPodcastOrLongTrack(tObj)) continue;

      tracks.push(tObj);
      if (typeof CATALOG !== 'undefined' && Array.isArray(CATALOG) && !CATALOG.some(t => t.id === tObj.id)) {
        CATALOG.push(tObj);
      }
    }
  }
  return tracks;
}

async function fetchRealCharts(region, forceRefresh = false) {
  const canonical = (typeof getCanonicalChartRegion === 'function')
    ? getCanonicalChartRegion(region || (typeof currentChartRegion !== 'undefined' ? currentChartRegion : 'Global'))
    : (region || 'Global');

  // Ensure REGIONAL_CHARTS container exists
  if (typeof REGIONAL_CHARTS === 'undefined' || !REGIONAL_CHARTS) {
    window.REGIONAL_CHARTS = window.REGIONAL_CHARTS || {};
  }
  if (!Array.isArray(REGIONAL_CHARTS[canonical])) {
    REGIONAL_CHARTS[canonical] = [];
  }

  // 1. In-memory check (if not forcing refresh)
  if (!forceRefresh && REGIONAL_CHARTS[canonical].length > 0) {
    return REGIONAL_CHARTS[canonical];
  }

  // 2. Local storage cached check (if not forcing refresh)
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(`soko_cached_charts_${canonical}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          REGIONAL_CHARTS[canonical] = parsed;
          if (typeof CATALOG !== 'undefined' && Array.isArray(CATALOG)) {
            for (const t of parsed) {
              if (!CATALOG.some(c => c.id === t.id)) CATALOG.push(t);
            }
          }
          return parsed;
        }
      }
    } catch (e) {
      console.warn(`[Charts API] Error reading cache for ${canonical}:`, e);
    }
  }

  // Prevent duplicate simultaneous requests for same region
  if (isFetchingChartsMap[canonical]) {
    return isFetchingChartsMap[canonical];
  }

  const fetchPromise = (async () => {
    try {
      const isUser = typeof userSession !== 'undefined' && userSession && userSession.isLoggedIn;
      let cookie = isUser ? (userSession.cookie || '') : '';
      if (!cookie && typeof window !== 'undefined' && window.SokoNative && typeof window.SokoNative.getStoredYtmCookies === 'function') {
        const sc = window.SokoNative.getStoredYtmCookies();
        if (sc && sc.length > 20) cookie = sc;
      }

      const glCodes = window.REGIONAL_GL_CODES || {};
      const gl = glCodes[canonical] || (canonical === 'India' ? 'IN' : (canonical === 'United Kingdom' ? 'GB' : 'US'));
      const playlistId = await resolveChartPlaylistId(canonical, gl, cookie);

      let tracks = [];

      // Primary: Browse VL+playlistId
      try {
        const payload = {
          context: {
            client: {
              clientName: "WEB_REMIX",
              clientVersion: "1.20261020.10.00",
              hl: "en",
              gl: gl
            }
          },
          browseId: "VL" + (playlistId.startsWith("VL") ? playlistId.substring(2) : playlistId)
        };
        const browseRes = await callInnerTubeApi("youtubei/v1/browse", payload, cookie);
        tracks = parseChartBrowseResponse(browseRes);
      } catch (err) {
        console.warn(`[Charts API] Browse VL failed for ${canonical}:`, err);
      }

      // Secondary: Fallback to resolvePlaylistTracks if needed
      if ((!tracks || tracks.length === 0) && typeof resolvePlaylistTracks === 'function') {
        try {
          const resTracks = await resolvePlaylistTracks(playlistId);
          if (resTracks && resTracks.length > 0) {
            tracks = resTracks;
          }
        } catch (err2) {
          console.warn(`[Charts API] resolvePlaylistTracks fallback failed for ${canonical}:`, err2);
        }
      }

      if (tracks && tracks.length > 0) {
        REGIONAL_CHARTS[canonical] = tracks;
        try {
          localStorage.setItem(`soko_cached_charts_${canonical}`, JSON.stringify(tracks));
        } catch (e) {}
        return tracks;
      }

      // Offline / error fallback: check cache again even if forceRefresh was true
      try {
        const staleCached = localStorage.getItem(`soko_cached_charts_${canonical}`);
        if (staleCached) {
          const parsed = JSON.parse(staleCached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            REGIONAL_CHARTS[canonical] = parsed;
            return parsed;
          }
        }
      } catch (e) {}

      return REGIONAL_CHARTS[canonical] || [];
    } catch (outerErr) {
      console.warn(`[Charts API] Critical fetch error for ${canonical}:`, outerErr);
      return REGIONAL_CHARTS[canonical] || [];
    } finally {
      delete isFetchingChartsMap[canonical];
    }
  })();

  isFetchingChartsMap[canonical] = fetchPromise;
  return fetchPromise;
}

// Backward compatibility bridge for existing UI callers
async function fetchLiveRegionalCharts(region, forceRefresh = false) {
  const tracks = await fetchRealCharts(region, forceRefresh);
  if (typeof renderCharts === 'function') {
    const canonical = (typeof getCanonicalChartRegion === 'function') ? getCanonicalChartRegion(region) : region;
    if (typeof currentChartRegion === 'undefined' || currentChartRegion === canonical || currentChartRegion === region) {
      renderCharts(canonical, 1);
    }
  }
  return tracks;
}

window.fetchRealCharts = fetchRealCharts;
window.fetchLiveRegionalCharts = fetchLiveRegionalCharts;
window.parseChartBrowseResponse = parseChartBrowseResponse;
window.resolveChartPlaylistId = resolveChartPlaylistId;
