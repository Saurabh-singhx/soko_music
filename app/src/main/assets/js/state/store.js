// Soko reactive application state store
let userSession = null;
const savedSession = localStorage.getItem('soko_ytm_session');
if (savedSession) {
  try {
    userSession = JSON.parse(savedSession);
  } catch (e) {
    userSession = null;
  }
}

const downloadedSet = new Set(BUNDLED_TRACKS.map(t => t.id));
let personalShelves = null;
let currentHomeShelves = [];

function isTrackOffline(id) {
      if (!id) return false;
      if (GENUINE_BUNDLED_IDS.has(id)) return true;
      if (typeof window !== 'undefined' && window.SokoNative && typeof window.SokoNative.isTrackDownloaded === 'function') {
        return window.SokoNative.isTrackDownloaded(id);
      }
      return downloadedSet.has(id);
    }

    // PERSISTENT STORAGE ENGINE (Survives App Restarts & Process Kills)
    // ============================================================

let userPlaylists = [
      {
        id: "pl_favorites",
        name: "Liked Songs",
        isSystem: true,
        songIds: ["4HVhnhpJxr0", "Io_Z3HxgJGs", "EW9opRK1MPk", "XI3JGDHduR4", "ZCRL8V0ZkEA", "ZUL-ivsl_Fs"]
      },
      {
        id: "pl_offline",
        name: "Downloaded Music",
        isSystem: true,
        songIds: BUNDLED_TRACKS.map(t => t.id)
      },
      {
        id: "pl_chill",
        name: "Late Night Lo-Fi & Acoustic",
        isSystem: false,
        songIds: ["4HVhnhpJxr0", "EW9opRK1MPk", "ZUL-ivsl_Fs", "ppcVqfsekIs", "tXi15CFnFws"]
      },
      {
        id: "pl_workout",
        name: "High Energy & Party",
        isSystem: false,
        songIds: ["XI3JGDHduR4", "ZCRL8V0ZkEA", "iKopExw_3Zg", "SxkHNou0uiM"]
      }
    ];

let currentTrack = null;
    let isPlaying = false;
    let isShuffle = false;
    let isRepeat = false;
    let lookAheadNextTrack = null;
    let activePlaylist = null;
    let currentChartRegion = 'Global';
    let currentChartPage = 1;
    let currentLibraryPage = 1;

    let currentLibraryFilter = '';
    let currentLibrarySort = 'recent';
    let currentLibrarySortDir = 'desc';
    let maxCacheGB = 4.0;
    let searchDebounceTimer = null;
    let songPendingAddToPlaylist = null;
    let audioEl = null;
    let visualizerAnimFrame = null;
    let currentYtmSearchResults = [];

    // ============================================================
    // LOOKUP ENGINE
    // ============================================================

const activeDownloads = new Map();

function findTrackAcrossAllSources(trackId) {
      if (!trackId) return null;
      let track = CATALOG.find(t => t.id === trackId);
      if (track) return track;

      if (currentYtmSearchResults) {
        track = currentYtmSearchResults.find(t => t.id === trackId);
        if (track) return track;
      }

      if (currentChartRegion && REGIONAL_CHARTS && REGIONAL_CHARTS[currentChartRegion]) {
        track = REGIONAL_CHARTS[currentChartRegion].find(t => t.id === trackId);
        if (track) return track;
      }

      if (typeof REGIONAL_CHARTS === 'object') {
        for (const reg in REGIONAL_CHARTS) {
          track = REGIONAL_CHARTS[reg].find(t => t.id === trackId);
          if (track) return track;
        }
      }

      if (personalShelves) {
        for (const shelf of personalShelves) {
          if (shelf.tracks) {
            track = shelf.tracks.find(t => t.id === trackId);
            if (track) return track;
          }
        }
      }

      if (typeof currentHomeShelves !== 'undefined' && currentHomeShelves) {
        for (const shelf of currentHomeShelves) {
          if (shelf.tracks) {
            track = shelf.tracks.find(t => t.id === trackId);
            if (track) return track;
          }
          if (shelf.mixes) {
            for (const m of shelf.mixes) {
              if (m.tracks) {
                track = m.tracks.find(t => t.id === trackId);
                if (track) return track;
              }
            }
          }
        }
      }

      for (const pl of userPlaylists) {
        if (pl.tracks) {
          track = pl.tracks.find(t => t.id === trackId);
          if (track) return track;
        }
      }

      return null;
    }

// Window bindings
window.userSession = userSession;
window.downloadedSet = downloadedSet;
window.personalShelves = personalShelves;
window.currentHomeShelves = currentHomeShelves;
window.userPlaylists = userPlaylists;
window.currentTrack = currentTrack;
window.isPlaying = isPlaying;
window.isShuffle = isShuffle;
window.isRepeat = isRepeat;
window.lookAheadNextTrack = lookAheadNextTrack;
window.activePlaylist = activePlaylist;
window.currentChartRegion = currentChartRegion;
window.currentChartPage = currentChartPage;
window.currentLibraryPage = currentLibraryPage;
window.currentLibraryFilter = currentLibraryFilter;
window.currentLibrarySort = currentLibrarySort;
window.currentLibrarySortDir = currentLibrarySortDir;
window.maxCacheGB = maxCacheGB;
window.searchDebounceTimer = searchDebounceTimer;
window.songPendingAddToPlaylist = songPendingAddToPlaylist;
window.audioEl = audioEl;
window.visualizerAnimFrame = visualizerAnimFrame;
window.currentYtmSearchResults = currentYtmSearchResults;
window.activeDownloads = activeDownloads;

window.isTrackOffline = isTrackOffline;
window.findTrackAcrossAllSources = findTrackAcrossAllSources;
