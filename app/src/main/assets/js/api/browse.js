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

    // 1. Home shelves: Quick picks (DO NOT TOUCH!) + Mix for you
    for (const s of homeShelves) {
      if (s.title && s.title.toLowerCase().includes('quick')) {
        // Untouched Quick picks
        extractedShelves.push(s);
      } else if (s.mixes && s.mixes.length > 0) {
        s.title = "Mix for you";
        s.badge = s.badge || "PLAYLISTS TAILORED FOR YOU";
        extractedShelves.push(s);
      } else {
        extractedShelves.push(s);
      }
    }

    // 2. Feel-good shelves: Throwback tracks -> "Forgotten favorites"
    if (feelShelves && feelShelves.length > 0) {
      const feelTrackShelf = feelShelves.find(s => s.tracks && s.tracks.length > 0) || feelShelves[0];
      if (feelTrackShelf) {
        feelTrackShelf.title = "Forgotten favorites";
        feelTrackShelf.badge = "REVISIT PAST FAVORITES";
        extractedShelves.push(feelTrackShelf);
      }
      for (const fs of feelShelves) {
        if (fs !== feelTrackShelf) {
          extractedShelves.push(fs);
        }
      }
    }

    // 3. Explore shelves: Trending tracks -> "Trending songs for you"
    if (expShelves && expShelves.length > 0) {
      const trendShelf = expShelves.find(s => s.title && (s.title.toLowerCase().includes('trend') || (s.tracks && s.tracks.length > 0)));
      if (trendShelf) {
        trendShelf.title = "Trending songs for you";
        trendShelf.badge = "CHARTS & BUZZ";
        extractedShelves.push(trendShelf);
      }
      for (const es of expShelves) {
        if (es !== trendShelf) {
          extractedShelves.push(es);
        }
      }
    }

    // 4. Party shelves: Party tracks -> "Listen together"
    if (partyShelves && partyShelves.length > 0) {
      const partyTrackShelf = partyShelves.find(s => s.tracks && s.tracks.length > 0) || partyShelves[0];
      if (partyTrackShelf) {
        partyTrackShelf.title = "Listen together";
        partyTrackShelf.badge = "GROUP SESSION & PARTY PICKS";
        extractedShelves.push(partyTrackShelf);
      }
      for (const ps of partyShelves) {
        if (ps !== partyTrackShelf) {
          extractedShelves.push(ps);
        }
      }
    }

    // If shelves contain playlist carousels without tracks, resolve tracks from the top mixes
    // so they contain authentic playable songs
    for (const s of extractedShelves) {
      const sTitleLower = (s.title || '').toLowerCase();
      const needsTrackResolution = (!s.tracks || s.tracks.length === 0) && s.mixes && s.mixes.length > 0;
      if (needsTrackResolution) {
        for (let i = 0; i < Math.min(3, s.mixes.length); i++) {
          const pid = s.mixes[i].playlistId;
          const vid = s.mixes[i].videoId;
          if (pid || vid) {
            try {
              const resTracks = await resolvePlaylistTracks(pid, vid);
              if (resTracks && resTracks.length > 0) {
                s.tracks = s.tracks || [];
                for (const rt of resTracks) {
                  if (!s.tracks.some(t => t.id === rt.id)) {
                    s.tracks.push(rt);
                  }
                }
                s.mixes[i].tracks = resTracks;
                s.mixes[i].songIds = resTracks.map(t => t.id);
              }
            } catch (err) {}
          }
        }
      }
    }

    // Proactively resolve the first mix in the background so tapping starts immediately
    const mixShelf = extractedShelves.find(s => s.mixes && s.mixes.length > 0);
    if (mixShelf && mixShelf.mixes.length > 0 && (!mixShelf.mixes[0].tracks || mixShelf.mixes[0].tracks.length <= 1)) {
      const firstPid = mixShelf.mixes[0].playlistId;
      const firstVid = mixShelf.mixes[0].videoId;
      if (firstPid || firstVid) {
        resolvePlaylistTracks(firstPid, firstVid).then(rTracks => {
          if (rTracks && rTracks.length > 0) {
            mixShelf.mixes[0].tracks = rTracks;
            mixShelf.mixes[0].songIds = rTracks.map(t => t.id);
          }
        }).catch(() => {});
      }
    }



    if (extractedShelves.length > 0) {
      personalShelves = extractedShelves;
      localStorage.setItem('soko_ytm_cached_feed_v2', JSON.stringify(extractedShelves));
      renderHomeShelves(extractedShelves, force);
      return { success: true, shelves: extractedShelves };
    }
  } catch (err) {
    console.warn("YouTube Music feed notice:", err);
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
