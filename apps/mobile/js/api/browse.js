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

    const targetGl = currentChartRegion === 'India' ? 'IN' : (currentChartRegion === 'United Kingdom' ? 'GB' : (currentChartRegion === 'United States' ? 'US' : 'IN'));
    const homePayload = {
      context: {
        client: {
          clientName: "WEB_REMIX",
          clientVersion: "1.20261020.10.00",
          hl: "en",
          gl: targetGl
        }
      },
      browseId: "FEmusic_home"
    };

    if (isUser && userSession && userSession.visitorData) {
      homePayload.context.client.visitorData = userSession.visitorData;
    } else if (!isUser && window.lastYtmVisitorData) {
      homePayload.context.client.visitorData = window.lastYtmVisitorData;
    }

    const homeData = await callInnerTubeApi("youtubei/v1/browse", homePayload, cookie);
    if (homeData && homeData.responseContext && homeData.responseContext.visitorData) {
      if (!isUser) {
        window.lastYtmVisitorData = homeData.responseContext.visitorData;
      }
    }
    let extractedShelves = parseBrowseShelves(homeData);

    // If shelves contain playlist carousels without tracks, resolve tracks from the top mixes
    // so they contain authentic playable songs
    for (const s of extractedShelves) {
      const sTitleLower = (s.title || '').toLowerCase();
      const needsTrackResolution = (!s.tracks || s.tracks.length === 0) && s.mixes && s.mixes.length > 0;
      if (needsTrackResolution) {
        for (let i = 0; i < Math.min(3, s.mixes.length); i++) {
          const pid = s.mixes[i].playlistId;
          if (pid) {
            try {
              const resTracks = await resolvePlaylistTracks(pid);
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
    if (mixShelf && mixShelf.mixes.length > 0 && (!mixShelf.mixes[0].tracks || mixShelf.mixes[0].tracks.length === 0)) {
      const firstPid = mixShelf.mixes[0].playlistId;
      if (firstPid) {
        resolvePlaylistTracks(firstPid).then(rTracks => {
          if (rTracks && rTracks.length > 0) {
            mixShelf.mixes[0].tracks = rTracks;
            mixShelf.mixes[0].songIds = rTracks.map(t => t.id);
          }
        }).catch(() => {});
      }
    }

    // Enrich with explore only for unauthenticated browse or when fewer than 3 shelves exist
    if (!isUser || extractedShelves.length < 3) {
      try {
        const expPayload = {
          context: {
            client: {
              clientName: "WEB_REMIX",
              clientVersion: "1.20261020.10.00",
              hl: "en",
              gl: targetGl,
              visitorData: window.lastYtmVisitorData || undefined
            }
          },
          browseId: "FEmusic_explore"
        };
        const expData = await callInnerTubeApi("youtubei/v1/browse", expPayload, cookie);
        const expShelves = parseBrowseShelves(expData);
        for (const es of expShelves) {
          if (!extractedShelves.some(s => s.title.toLowerCase() === es.title.toLowerCase())) {
            extractedShelves.push(es);
          }
        }
      } catch (ignored) {}
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
