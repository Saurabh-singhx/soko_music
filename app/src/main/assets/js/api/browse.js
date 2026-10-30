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
