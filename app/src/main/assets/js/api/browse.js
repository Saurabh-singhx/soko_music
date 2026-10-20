// ============================================================
// YOUTUBE MUSIC BROWSE & FEED API
// ============================================================
async function fetchYouTubeMusicFeed(force = false) {
  const isUser = userSession && userSession.isLoggedIn;
  const isDemo = userSession && userSession.isDemo;
  const cookie = isUser ? (userSession.cookie || '') : '';

  try {
    if (isDemo) {
      const demoShelves = [
        {
          title: "Quick picks",
          badge: "START RADIO FROM A SONG",
          tracks: (REGIONAL_CHARTS['Global'] || CATALOG).slice(0, 16),
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
          tracks: (REGIONAL_CHARTS['India'] || CATALOG).slice(0, 16),
          mixes: []
        },
        {
          title: "Forgotten favorites",
          badge: "REVISIT PAST FAVORITES",
          tracks: (REGIONAL_CHARTS['United States'] || CATALOG).slice(0, 16),
          mixes: []
        }
      ];
      personalShelves = demoShelves;
      localStorage.setItem('soko_ytm_cached_feed_v2', JSON.stringify(demoShelves));
      renderHomeShelves(demoShelves);
      return { success: true, shelves: demoShelves };
    }

    const homePayload = {
      context: {
        client: {
          clientName: "WEB_REMIX",
          clientVersion: "1.20240101.01.00",
          hl: "en",
          gl: currentChartRegion === 'India' ? 'IN' : (currentChartRegion === 'United Kingdom' ? 'GB' : 'US')
        }
      },
      browseId: "FEmusic_home"
    };

    const homeData = await callInnerTubeApi("youtubei/v1/browse", homePayload, cookie);
    let extractedShelves = parseBrowseShelves(homeData);

    // If a shelf with title "Quick picks" only contains playlist carousels (e.g. unauthenticated browse),
    // resolve tracks from its playlist so that Quick picks has authentic song items!
    for (const s of extractedShelves) {
      const sTitleLower = (s.title || '').toLowerCase();
      if ((sTitleLower.includes('quick') || sTitleLower.includes('listen again') || sTitleLower.includes('start radio')) &&
          (!s.tracks || s.tracks.length === 0) && s.mixes && s.mixes.length > 0) {
        for (let i = 0; i < Math.min(2, s.mixes.length); i++) {
          const pid = s.mixes[i].playlistId;
          if (pid) {
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

    // Enrich with explore if needed for unauthenticated browse
    if (!isUser || extractedShelves.length < 2) {
      try {
        const expPayload = {
          context: {
            client: {
              clientName: "WEB_REMIX",
              clientVersion: "1.20240101.01.00",
              hl: "en",
              gl: currentChartRegion === 'India' ? 'IN' : (currentChartRegion === 'United Kingdom' ? 'GB' : 'US')
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
      renderHomeShelves(extractedShelves);
      return { success: true, shelves: extractedShelves };
    }
  } catch (err) {
    console.warn("YouTube Music feed notice:", err);
    const container = document.getElementById('homeFeedContainer');
    if (container && (!personalShelves || personalShelves.length === 0)) {
      renderHomeShelves([]);
    }
    return { success: false, error: err };
  }

  const container = document.getElementById('homeFeedContainer');
  if (container && (!personalShelves || personalShelves.length === 0)) {
    renderHomeShelves([]);
  }
  return { success: false, error: new Error("No shelves extracted") };
}

window.fetchYouTubeMusicFeed = fetchYouTubeMusicFeed;
