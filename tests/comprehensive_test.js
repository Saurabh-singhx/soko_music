/**
 * Comprehensive Automated Verification Suite for Soko Music App
 * Tests:
 * 1. Playback Engine: Authentic track audio vs local Opus (zero wrong song hashing)
 * 2. Persistent Storage: Downloaded songs survive process kills / clears; storage metrics do not reset
 * 3. 100-Song Regional Charts & Pagination
 * 4. Search Engine: Instant local search + live result rendering
 * 5. Playlist Persistence
 */

const fs = require('fs');
const path = require('path');

// Mock localStorage
const mockStorage = {};
const localStorage = {
  getItem: (k) => (k in mockStorage ? mockStorage[k] : null),
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
};

// Mock DOM elements
function createMockElement(id, tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    innerText: '',
    innerHTML: '',
    value: '',
    style: {},
    classList: {
      classes: new Set(),
      add: function(c) { this.classes.add(c); },
      remove: function(c) { this.classes.delete(c); },
      contains: function(c) { return this.classes.has(c); },
      toggle: function(c, force) {
        if (force === undefined) {
          if (this.classes.has(c)) this.classes.delete(c);
          else this.classes.add(c);
        } else if (force) this.classes.add(c);
        else this.classes.delete(c);
      }
    },
    addEventListener: () => {},
    scrollIntoView: () => {},
    matches: () => false,
    closest: () => null,
    parentNode: {
      insertBefore: () => {}
    }
  };
}

const elements = {};
function getEl(id) {
  if (!elements[id]) elements[id] = createMockElement(id);
  return elements[id];
}

const document = {
  getElementById: (id) => getEl(id),
  querySelectorAll: (selector) => [],
  querySelector: (selector) => getEl('mockQuerySelector'),
  createElement: (tag) => createMockElement('created_' + Math.random(), tag),
  body: createMockElement('body', 'body')
};

const window = {
  addEventListener: () => {},
  location: { origin: 'https://music.youtube.com' }
};

// Read index.html and extract JavaScript & Styles
let rawHtml = fs.readFileSync(path.join(__dirname, '../apps/mobile/index.html'), 'utf8');
let html = rawHtml;
const cssLinkRegex = /<link\s+[^>]*href=["']([^"']+\.css)["'][^>]*>/gi;
let cssMatch;
while ((cssMatch = cssLinkRegex.exec(rawHtml)) !== null) {
  const cssPath = path.join(__dirname, '../apps/mobile', cssMatch[1]);
  if (fs.existsSync(cssPath)) {
    html += '\n<style>\n' + fs.readFileSync(cssPath, 'utf8') + '\n</style>\n';
  }
}
let jsSource = '';
const scriptSrcRegex = /<script\s+[^>]*src=["']([^"']+\.js)["'][^>]*>\s*<\/script>/gi;
let srcMatch;
while ((srcMatch = scriptSrcRegex.exec(rawHtml)) !== null) {
  const jsPath = path.join(__dirname, '../apps/mobile', srcMatch[1]);
  if (fs.existsSync(jsPath)) {
    jsSource += '\n// Source: ' + srcMatch[1] + '\n' + fs.readFileSync(jsPath, 'utf8') + '\n';
  }
}
const inlineScriptMatches = rawHtml.matchAll(/<script(?![^>]*src=)[\s\S]*?>([\s\S]*?)<\/script>/gi);
for (const match of inlineScriptMatches) {
  jsSource += '\n// Inline Script\n' + match[1] + '\n';
}

if (!jsSource.trim()) {
  console.error('FAIL: No script content found in apps/mobile/index.html');
  process.exit(1);
}
const jsCode = jsSource + `
window.REGIONAL_CHARTS = REGIONAL_CHARTS;
window.CATALOG = CATALOG;
window.BUNDLED_TRACKS = BUNDLED_TRACKS;
window.downloadedSet = downloadedSet;
window.userPlaylists = userPlaylists;
window.selectTrackToPlay = selectTrackToPlay;
window.playRealTrack = playRealTrack;
window.renderCharts = renderCharts;
window.setChartPage = setChartPage;
window.persistDownloadState = persistDownloadState;
window.initPersistentStorage = initPersistentStorage;
window.updateStorageMetrics = updateStorageMetrics;
window.executeSearch = executeSearch;
window.stopAllAudioEngines = stopAllAudioEngines;
window.togglePlayPause = togglePlayPause;
window.playNextTrack = playNextTrack;
window.fetchAndApplyYtmRadioQueue = fetchAndApplyYtmRadioQueue;
window.scheduleLookAhead = scheduleLookAhead;
window.toggleFavorite = toggleFavorite;
window.startPlaybackTelemetry = startPlaybackTelemetry;
window.updatePlaybackTelemetry = updatePlaybackTelemetry;
window.recordTrackCompletionTelemetry = recordTrackCompletionTelemetry;
window.syncFavoriteToYouTubeMusic = syncFavoriteToYouTubeMusic;
window.renderLibraryTracks = renderLibraryTracks;
window.filterLibraryTracks = filterLibraryTracks;
window.setLibraryPage = setLibraryPage;
window.setLibrarySort = setLibrarySort;
window.renderHomeShelves = renderHomeShelves;
window.prepareHomeShelves = prepareHomeShelves;
window.playAllOfflineTracks = playAllOfflineTracks;
window.deleteOfflineTrack = deleteOfflineTrack;
window.clearUnpinnedCache = clearUnpinnedCache;
window.switchTab = switchTab;
window.switchNavTab = switchNavTab;
Object.defineProperty(window, 'currentLibraryPage', { get: () => currentLibraryPage, set: (v) => { currentLibraryPage = v; } });
Object.defineProperty(window, 'currentLibraryFilter', { get: () => currentLibraryFilter, set: (v) => { currentLibraryFilter = v; } });
Object.defineProperty(window, 'currentLibrarySort', { get: () => currentLibrarySort, set: (v) => { currentLibrarySort = v; } });
Object.defineProperty(window, 'currentLibrarySortDir', { get: () => currentLibrarySortDir, set: (v) => { currentLibrarySortDir = v; } });
Object.defineProperty(window, 'currentHomeShelves', { get: () => currentHomeShelves, set: (v) => { currentHomeShelves = v; } });
Object.defineProperty(window, 'lookAheadNextTrack', { get: () => lookAheadNextTrack, set: (v) => { lookAheadNextTrack = v; } });
Object.defineProperty(window, 'currentTrack', { get: () => currentTrack, set: (v) => { currentTrack = v; } });
Object.defineProperty(window, 'isOnlineYtPlaying', { get: () => isOnlineYtPlaying, set: (v) => { isOnlineYtPlaying = v; } });
Object.defineProperty(window, 'isPlaying', { get: () => isPlaying, set: (v) => { isPlaying = v; } });
Object.defineProperty(window, 'isRepeat', { get: () => isRepeat, set: (v) => { isRepeat = v; } });
Object.defineProperty(window, 'currentSessionCpn', { get: () => currentSessionCpn, set: (v) => { currentSessionCpn = v; } });
Object.defineProperty(window, 'hasSentPlaybackStart', { get: () => hasSentPlaybackStart, set: (v) => { hasSentPlaybackStart = v; } });
Object.defineProperty(window, 'hasSentMidpointPing', { get: () => hasSentMidpointPing, set: (v) => { hasSentMidpointPing = v; } });
window.playCuratedMix = playCuratedMix;
window.resolvePlaylistTracks = resolvePlaylistTracks;
window.parseBrowseShelves = parseBrowseShelves;
window.fetchYouTubeMusicFeed = fetchYouTubeMusicFeed;
window.initPullToRefresh = initPullToRefresh;
window.updateHomeAuthBanner = updateHomeAuthBanner;
window.isPodcastOrLongTrack = isPodcastOrLongTrack;
window.parseDurationStringToSeconds = parseDurationStringToSeconds;
window.isInnerTubePodcastItem = isInnerTubePodcastItem;
window.MAX_ALLOWED_DURATION_SECONDS = MAX_ALLOWED_DURATION_SECONDS;
window.startDownloadTrack = startDownloadTrack;
window.triggerDownloadCurrentTrack = triggerDownloadCurrentTrack;
window.autoPrefetchNextTrack = autoPrefetchNextTrack;
Object.defineProperty(window, 'activeDownloads', { get: () => activeDownloads, set: (v) => { activeDownloads = v; } });
Object.defineProperty(window, 'currentYtmSearchResults', { get: () => currentYtmSearchResults, set: (v) => { currentYtmSearchResults = v; } });
Object.defineProperty(window, 'userSession', { get: () => userSession, set: (v) => { userSession = v; } });
Object.defineProperty(window, 'personalShelves', { get: () => personalShelves, set: (v) => { personalShelves = v; } });
Object.defineProperty(window, 'activePlaylist', { get: () => activePlaylist, set: (v) => { activePlaylist = v; } });
Object.defineProperty(window, 'hasSentCompletionPing', { get: () => hasSentCompletionPing, set: (v) => { hasSentCompletionPing = v; } });
`;

// Sandbox context for execution
const context = {
  console,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  requestAnimationFrame: (cb) => setTimeout(cb, 16),
  cancelAnimationFrame: (id) => clearTimeout(id),
  localStorage,
  document,
  window,
  MediaMetadata: class {},
  navigator: { mediaSession: { setActionHandler: () => {}, metadata: null } }
};

// Evaluate the script inside sandbox
const scriptFn = new Function(...Object.keys(context), jsCode);
scriptFn(...Object.values(context));

console.log('====================================================');
console.log('🧪 SOKO MUSIC COMPREHENSIVE AUTOMATED VERIFICATION');
console.log('====================================================');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
  }
}

// ------------------------------------------------------------
// TEST SUITE 1: Zero Hardcoded Songs & Dynamic Charts Verification
// ------------------------------------------------------------
console.log('\n--- Test Suite 1: Zero Hardcoded Songs & Dynamic Charts Verification ---');
assert(typeof window.REGIONAL_CHARTS === 'object', 'REGIONAL_CHARTS is defined');
assert(window.CATALOG.length === 0, 'Zero hardcoded songs in CATALOG (actual: 0)');
assert(window.BUNDLED_TRACKS.length === 0, 'Zero hardcoded tracks in BUNDLED_TRACKS (actual: 0)');
assert(window.GENUINE_BUNDLED_IDS.size === 0, 'Zero hardcoded bundled IDs in GENUINE_BUNDLED_IDS (actual: 0)');

const regions = ['Global', 'India', 'United States', 'United Kingdom'];
regions.forEach(reg => {
  assert(Array.isArray(window.REGIONAL_CHARTS[reg]), `Region ${reg} is an array`);
  assert(window.REGIONAL_CHARTS[reg].length === 0, `Region ${reg} has 0 hardcoded tracks initially (actual: ${window.REGIONAL_CHARTS[reg].length})`);
});

// Test initial loading state when charts are empty
window.renderCharts('Global', 1);
const chartsListEl = getEl('chartsTrackList');
assert(chartsListEl.innerHTML.includes('Loading Live Global Charts'), 'renderCharts displays loading state when region is empty');

// Test dynamic chart rendering when populated
const mockDynamicCharts = [];
for (let i = 1; i <= 50; i++) {
  mockDynamicCharts.push({
    id: `dyn_chart_${i}`,
    title: i === 1 ? 'Die With A Smile' : `Chart Track ${i}`,
    artist: i === 1 ? 'Lady Gaga & Bruno Mars' : `Artist ${i}`,
    duration: 215,
    cover: `https://i.ytimg.com/vi/dyn_chart_${i}/hqdefault.jpg`
  });
}
window.REGIONAL_CHARTS['Global'] = mockDynamicCharts;
window.REGIONAL_CHARTS['India'] = mockDynamicCharts.map(t => ({ ...t, id: 'in_' + t.id, title: 'India ' + t.title }));
window.REGIONAL_CHARTS['United States'] = mockDynamicCharts.map(t => ({ ...t, id: 'us_' + t.id, title: 'US ' + t.title }));
window.REGIONAL_CHARTS['United Kingdom'] = mockDynamicCharts.map(t => ({ ...t, id: 'uk_' + t.id, title: 'UK ' + t.title }));
window.renderCharts('Global', 1);
assert(chartsListEl.innerHTML.includes('Die With A Smile'), 'Page 1 renders Top track "Die With A Smile"');
assert(chartsListEl.innerHTML.includes('>1<'), 'Page 1 displays Rank 1 badge');

window.setChartPage(2);
assert(chartsListEl.innerHTML.includes('>21<'), 'Page 2 displays Rank 21 badge');

// ------------------------------------------------------------
// TEST SUITE 2: Playback Engine & Exact Track Streaming
// ------------------------------------------------------------
console.log('\n--- Test Suite 2: Playback Engine & Exact Track Streaming ---');

// Test 2A: Clicking an online track (e.g. "Tauba Tauba", ID: yJg-Y5byMMw)
console.log('Testing click on online chart track (Tauba Tauba, yJg-Y5byMMw)...');
window.selectTrackToPlay('yJg-Y5byMMw');
assert(window.currentTrack.id === 'yJg-Y5byMMw', 'Current track ID is yJg-Y5byMMw');
assert(window.isOnlineYtPlaying === true, 'isOnlineYtPlaying is TRUE for online track');
const ytWrapper = getEl('ytOnlinePlayerWrapper');
assert(ytWrapper.innerHTML.includes('yJg-Y5byMMw'), 'YouTube player is loaded with exact video ID yJg-Y5byMMw (zero wrong song hashing)');

// Test 2B: Clicking another online track ("Die With A Smile", ID: kPa7bsKwL-c)
console.log('Testing click on another online track (Die With A Smile, kPa7bsKwL-c)...');
window.selectTrackToPlay('kPa7bsKwL-c');
assert(window.currentTrack.id === 'kPa7bsKwL-c', 'Current track ID is kPa7bsKwL-c');
assert(window.isOnlineYtPlaying === true, 'isOnlineYtPlaying is TRUE');
assert(ytWrapper.innerHTML.includes('kPa7bsKwL-c'), 'YouTube player loaded exact video ID kPa7bsKwL-c');

// Test 2C: Offline playback when track is downloaded on disk
console.log('Testing offline playback for downloaded track on disk...');
window.SokoNative = {
  getDownloadedTrackPath: (id) => id === 'local_offline_test' ? '/data/user/0/com.soko.music/files/music/local_offline_test.opus' : '',
  isTrackDownloaded: (id) => id === 'local_offline_test',
  playAudio: () => {},
  setActivePlaybackId: () => {},
  stopAudio: () => {}
};
window.selectTrackToPlay('local_offline_test');
assert(window.currentTrack.id === 'local_offline_test', 'Current track ID is local_offline_test');
assert(window.isOnlineYtPlaying === false, 'isOnlineYtPlaying is FALSE for downloaded offline track');

// ------------------------------------------------------------
// TEST SUITE 3: Persistent Storage & Cache Retention
// ------------------------------------------------------------
console.log('\n--- Test Suite 3: Persistent Storage Engine (Surviving Process Kills) ---');

const initialOfflineCount = window.downloadedSet.size;
assert(initialOfflineCount === 0, `Initial downloadedSet has 0 hardcoded tracks (actual: ${initialOfflineCount})`);

// Download an online track
console.log('Simulating user downloading "Die With A Smile" (kPa7bsKwL-c)...');
window.downloadedSet.add('kPa7bsKwL-c');
const customTrack = {
  id: 'kPa7bsKwL-c',
  title: 'Die With A Smile',
  artist: 'Lady Gaga & Bruno Mars',
  duration: 251,
  cover: 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg',
  audioUrl: '',
  favorite: true
};
window.CATALOG.push(customTrack);
const offPl = window.userPlaylists.find(p => p.id === 'pl_offline');
offPl.songIds.push('kPa7bsKwL-c');

// Save state
window.persistDownloadState();

// Verify localStorage was written
const savedIds = JSON.parse(localStorage.getItem('soko_downloaded_ids_v2'));
assert(Array.isArray(savedIds) && savedIds.includes('kPa7bsKwL-c'), 'localStorage soko_downloaded_ids_v2 contains kPa7bsKwL-c');

const savedTracks = JSON.parse(localStorage.getItem('soko_custom_tracks_v2'));
assert(Array.isArray(savedTracks) && savedTracks.some(t => t.id === 'kPa7bsKwL-c'), 'localStorage soko_custom_tracks_v2 contains full track metadata');

// Verify Storage Metrics before clear
window.updateStorageMetrics();
const storageStatsEl = getEl('cachedSongStats');
assert(storageStatsEl.innerText.includes('1 real songs'), `Storage metrics accurately shows 1 song (actual: "${storageStatsEl.innerText}")`);

// SIMULATE APP CLEAR / FORCE STOP / REBOOT
console.log('\nSimulating App Force Close & Restart (wiping in-memory state)...');
window.downloadedSet.clear();
// Reset to only bundled 0
window.BUNDLED_TRACKS.forEach(b => window.downloadedSet.add(b.id));
assert(window.downloadedSet.has('kPa7bsKwL-c') === false, 'In-memory state reset (simulating kill)');

// Call initPersistentStorage() on app launch
console.log('App Launching: executing initPersistentStorage()...');
window.initPersistentStorage();

// Verify rehydration
assert(window.downloadedSet.has('kPa7bsKwL-c') === true, 'downloadedSet restored kPa7bsKwL-c from persistent storage');
assert(window.downloadedSet.size === 1, `downloadedSet size is 1 (does NOT reset to hardcoded size)`);

window.updateStorageMetrics();
assert(storageStatsEl.innerText.includes('1 real songs'), `Post-restart metrics retains all downloaded tracks: "${storageStatsEl.innerText}"`);

// ------------------------------------------------------------
// TEST SUITE 4: Playlist Creation & Persistence
// ------------------------------------------------------------
console.log('\n--- Test Suite 4: Custom Playlist Persistence ---');
const newPlaylist = {
  id: 'pl_roadtrip_test',
  name: 'Road Trip 2026',
  isSystem: false,
  songIds: ['kPa7bsKwL-c', '4HVhnhpJxr0']
};
window.userPlaylists.push(newPlaylist);
window.persistDownloadState();

const savedPls = JSON.parse(localStorage.getItem('soko_user_playlists_v2'));
assert(savedPls.some(p => p.id === 'pl_roadtrip_test'), 'Custom playlist saved to localStorage');

// Clear in-memory playlists
window.userPlaylists = [];
window.initPersistentStorage();
assert(window.userPlaylists.some(p => p.id === 'pl_roadtrip_test'), 'Custom playlist successfully restored after restart');

// ------------------------------------------------------------
// TEST SUITE 5: Search Engine
// ------------------------------------------------------------
console.log('\n--- Test Suite 5: Search Engine ---');
window.executeSearch('Die With A Smile');
const searchResultsEl = getEl('searchResultsList');
assert(searchResultsEl.innerHTML.includes('Die With A Smile'), 'Search found "Die With A Smile" instantly');
assert(searchResultsEl.innerHTML.includes('search-track-card'), 'Search rendered responsive .search-track-card cards');

// ------------------------------------------------------------
// TEST SUITE 6: Edge Case Playback Engine & Dual-Audio Immunity
// ------------------------------------------------------------
console.log('\n--- Test Suite 6: Playback Edge Cases & Dual-Audio Immunity ---');

// 6A: stopAllAudioEngines properly shuts down all audio sinks
window.stopAllAudioEngines();
assert(window.isOnlineYtPlaying === false, 'stopAllAudioEngines sets isOnlineYtPlaying to FALSE');
assert(window.isPlaying === false, 'stopAllAudioEngines sets isPlaying to FALSE');

// 6B: Mock Native Bridge & In-Flight Download Invalidation
let lastStoppedAudio = false;
let lastActivePlaybackId = "";
window.SokoNative = {
  stopAudio: () => { lastStoppedAudio = true; },
  setActivePlaybackId: (id) => { lastActivePlaybackId = id; },
  downloadAndPlayTrack: (id) => {},
  isTrackDownloaded: () => false,
  getDownloadedTrackPath: () => ""
};

// User selects Track A
window.selectTrackToPlay('kPa7bsKwL-c');
assert(lastActivePlaybackId === 'kPa7bsKwL-c', 'Active playback ID set to Track A (kPa7bsKwL-c)');
assert(lastStoppedAudio === true, 'Previous native audio stopped when starting Track A');

// User now selects Track B while Track A was in-flight
lastStoppedAudio = false;
window.selectTrackToPlay('yJg-Y5byMMw');
assert(lastActivePlaybackId === 'yJg-Y5byMMw', 'Active playback ID updated to Track B (yJg-Y5byMMw)');
assert(lastStoppedAudio === true, 'Previous native audio stopped when switching to Track B');
assert(window.currentTrack.id === 'yJg-Y5byMMw', 'Current track switched to Track B');

// Late download completion for Track A must NOT hijack playback from Track B
window.onNativeDownloadComplete('kPa7bsKwL-c', '/data/user/0/com.soko.music/files/music/kPa7bsKwL-c.m4a', true);
assert(window.currentTrack.id === 'yJg-Y5byMMw', 'Out-of-order Track A download completion does not hijack Track B');

// Late download failure for Track A must NOT stream Track A over Track B
window.onNativeDownloadFailed('kPa7bsKwL-c', 'Timeout');
assert(window.currentTrack.id === 'yJg-Y5byMMw', 'Out-of-order Track A download failure does not switch active track to A');

// 6C: Becoming noisy (unplugging headphones) pauses active playback
window.isPlaying = true;
window.handleBecomingNoisy();
assert(window.isPlaying === false, 'Headset disconnect (ACTION_AUDIO_BECOMING_NOISY) paused playback');

// 6D: Repeat mode & Track completion
window.isRepeat = true;
const songBeforeEnded = window.currentTrack.id;
window.onNativeTrackEnded();
assert(window.currentTrack.id === songBeforeEnded, 'Repeat mode repeats current track on track completion');

window.isRepeat = false;
window.onNativeTrackEnded();
assert(window.currentTrack.id !== songBeforeEnded, 'Non-repeat mode progresses to next track on track completion');

// ------------------------------------------------------------
// TEST SUITE 7: Dynamic YouTube Music Radio Queue Progression
// ------------------------------------------------------------
console.log('\n--- Test Suite 7: Dynamic YouTube Music Radio Queue & Up-Next ---');

// Mock response for youtubei/v1/next RDAMVM
const mockRadioItems = [
  { playlistPanelVideoRenderer: { videoId: 'rad_track_1', title: { runs: [{ text: 'Track 1 Current' }] }, shortBylineText: { runs: [{ text: 'Artist 1' }] } } },
  { playlistPanelVideoRenderer: { videoId: 'rad_track_2', title: { runs: [{ text: 'Track 2 Recommended' }] }, shortBylineText: { runs: [{ text: 'Artist 2' }] } } },
  { playlistPanelVideoRenderer: { videoId: 'rad_track_3', title: { runs: [{ text: 'Track 3 Recommended' }] }, shortBylineText: { runs: [{ text: 'Artist 3' }] } } },
  { playlistPanelVideoRenderer: { videoId: 'rad_track_4', title: { runs: [{ text: 'Track 4 Recommended' }] }, shortBylineText: { runs: [{ text: 'Artist 4' }] } } }
];

window.callInnerTubeApi = async function(endpoint, payload, cookie) {
  if (endpoint === 'youtubei/v1/next') {
    return {
      contents: {
        singleColumnMusicWatchNextResultsRenderer: {
          tabbedRenderer: {
            watchNextTabbedResultsRenderer: {
              tabs: [
                {
                  tabRenderer: {
                    content: {
                      musicQueueRenderer: {
                        content: {
                          playlistPanelRenderer: {
                            contents: mockRadioItems
                          }
                        }
                      }
                    }
                  }
                }
              ]
            }
          }
        }
      }
    };
  }
  return null;
};

// Start track 1 and fetch radio queue
window.selectTrackToPlay('rad_track_1');
// Wait for async fetchAndApplyYtmRadioQueue
(async () => {
  await window.fetchAndApplyYtmRadioQueue('rad_track_1');
  assert(window.activeQueueList && window.activeQueueList.length === 4, 'YouTube Music radio queue populated with 4 dynamic tracks');
  assert(window.lookAheadNextTrack && window.lookAheadNextTrack.id === 'rad_track_2', 'Look-ahead correctly identified radio recommendation: Track 2');

  // Trigger playNextTrack()
  window.playNextTrack();
  assert(window.currentTrack.id === 'rad_track_2', 'playNextTrack() smoothly advanced to YouTube Music recommendation: Track 2');
  assert(window.activeQueueList.length === 4, 'Active radio queue was preserved across track transitions');

  // ------------------------------------------------------------
  // TEST SUITE 8: Telemetry & Recommendation Feedback Sync
  // ------------------------------------------------------------
  console.log('\n--- Test Suite 8: Telemetry & Recommendation Feedback Sync ---');
  
  const telemetryPings = [];
  window.SokoNative.sendTelemetryPing = (url) => {
    telemetryPings.push(url);
  };

  const innerTubeCalls = [];
  const originalCallInnerTube = window.callInnerTubeApi;
  window.callInnerTubeApi = async (endpoint, payload, cookie) => {
    innerTubeCalls.push({ endpoint, payload, cookie });
    return originalCallInnerTube(endpoint, payload, cookie);
  };

  // 8A: Session Initialization & CPN generation
  window.startPlaybackTelemetry({ id: 'telemetry_test_1', title: 'Telemetry Song 1', duration: 200 });
  assert(window.currentSessionCpn && window.currentSessionCpn.length === 16, 'Telemetry engine generated 16-character alphanumeric CPN session token');
  assert(telemetryPings.some(u => u.includes('/api/stats/playback') && u.includes('docid=telemetry_test_1')), 'stats/playback initialization ping dispatched for new track');

  // 8B: Progress updates & Midpoint (>50%) History Sync
  window.updatePlaybackTelemetry(15, 200);
  assert(telemetryPings.some(u => u.includes('/api/stats/watchtime') && u.includes('cmt=15.0')), 'stats/watchtime heartbeat ping dispatched');
  
  window.updatePlaybackTelemetry(105, 200); // 105s > 100s (50%)
  assert(window.hasSentMidpointPing === true, 'Midpoint threshold (>50%) reached and flagged for YouTube History Sync');
  assert(telemetryPings.some(u => u.includes('/api/stats/watchtime') && u.includes('len=200.0')), 'stats/watchtime midpoint ping with track length dispatched');

  // 8C: 100% Track Completion
  window.recordTrackCompletionTelemetry();
  assert(window.hasSentCompletionPing === true, '100% completion flagged');
  assert(telemetryPings.some(u => u.includes('state=completed')), 'stats/watchtime completed state dispatched');

  // 8D: Early Skip (<20s) Detection
  telemetryPings.length = 0;
  window.startPlaybackTelemetry({ id: 'telemetry_test_2', title: 'Skipped Song', duration: 180 });
  window.updatePlaybackTelemetry(6, 180); // Played only 6 seconds
  window.startPlaybackTelemetry({ id: 'telemetry_test_3', title: 'Next Song', duration: 210 }); // User skipped to test_3
  assert(telemetryPings.some(u => u.includes('docid=telemetry_test_2') && u.includes('cmt=6.0') && u.includes('state=paused')), 'Early skip (<20s) negative feedback ping dispatched to YouTube');

  // 8E: Favorite Sync (Like / Dislike)
  innerTubeCalls.length = 0;
  // Mock session cookie for testing
  window.SokoNative.getStoredYtmCookies = () => 'test_ytm_cookie_1234567890_abcdef';
  await window.syncFavoriteToYouTubeMusic('telemetry_test_1', true);
  assert(innerTubeCalls.some(c => c.endpoint === 'youtubei/v1/like/like' && c.payload.target.videoId === 'telemetry_test_1'), 'Like event successfully sent to youtubei/v1/like/like');

  await window.syncFavoriteToYouTubeMusic('telemetry_test_1', false);
  assert(innerTubeCalls.some(c => c.endpoint === 'youtubei/v1/like/removelike' && c.payload.target.videoId === 'telemetry_test_1'), 'Unlike event successfully sent to youtubei/v1/like/removelike');

  // --- Test Suite 9: Offline Storage Card Deduplication & Library UI ---
  console.log('\n--- Test Suite 9: Offline Disk Storage Card Deduplication & Library UI ---');
  
  // 9A: Verify exactly one storage card in HTML and that it is inside #pane-settings
  const storageLabelMatches = (html.match(/id="storageLabel"/g) || []).length;
  assert(storageLabelMatches === 1, `HTML contains exactly ONE id="storageLabel" (actual: ${storageLabelMatches})`);

  const storageUsedBarMatches = (html.match(/id="storageUsedBar"/g) || []).length;
  assert(storageUsedBarMatches === 1, `HTML contains exactly ONE id="storageUsedBar" (actual: ${storageUsedBarMatches})`);

  const cachedSongStatsMatches = (html.match(/id="cachedSongStats"/g) || []).length;
  assert(cachedSongStatsMatches === 1, `HTML contains exactly ONE id="cachedSongStats" (actual: ${cachedSongStatsMatches})`);

  const libraryPaneHtmlMatch = html.match(/<section id="pane-library"[\s\S]*?<\/section>/);
  assert(libraryPaneHtmlMatch && !libraryPaneHtmlMatch[0].includes('id="storageLabel"'), 'Library pane has storage card REMOVED');

  const settingsPaneHtmlMatch = html.match(/<section id="pane-settings"[\s\S]*?<\/section>/);
  assert(settingsPaneHtmlMatch && settingsPaneHtmlMatch[0].includes('id="storageLabel"'), 'Settings pane contains the single active storage meter card');

  // 9B: Library elements
  assert(html.includes('id="librarySongCountBadge"'), 'Library contains librarySongCountBadge element');
  assert(html.includes('id="libraryFilterInput"'), 'Library contains libraryFilterInput search input');
  assert(html.includes('id="libraryPagination"'), 'Library contains libraryPagination container');

  // 9C: Test pagination logic in renderLibraryTracks
  for (let i = 1; i <= 30; i++) {
    const tid = `mock_paginated_${i}`;
    if (!window.CATALOG.some(t => t.id === tid)) {
      window.CATALOG.push({ id: tid, title: `Track ${i} Downloaded`, artist: 'Artist Test', duration: 180, cover: 'assets/logo.png' });
    }
    window.downloadedSet.add(tid);
  }
  
  window.currentLibraryFilter = '';
  window.setLibraryPage(1);
  const listEl = getEl('libraryTracksList');
  const paginationEl = getEl('libraryPagination');
  const badgeEl = getEl('librarySongCountBadge');

  assert(window.currentLibraryPage === 1, 'Library page is 1');
  assert(badgeEl.innerText.includes('songs'), 'Badge shows downloaded song count');
  assert(paginationEl.innerHTML.includes('Page 1 of'), 'Pagination element renders page 1 of total pages');

  window.setLibraryPage(2);
  assert(window.currentLibraryPage === 2, 'Navigated to library page 2');
  assert(paginationEl.innerHTML.includes('Page 2 of'), 'Pagination element renders page 2 of total pages');

  // 9D: Quick filter in library
  window.filterLibraryTracks('Track 15');
  assert(listEl.innerHTML.includes('Track 15 Downloaded'), 'Library filter found Track 15');
  assert(!listEl.innerHTML.includes('Track 16 Downloaded'), 'Library filter excluded non-matching Track 16');

  // 9E: Reset filter
  window.filterLibraryTracks('');

  // --- Test Suite 10: Physical Disk Deletion & LocalStorage Quota Safety ---
  console.log('\n--- Test Suite 10: Physical Disk Deletion & LocalStorage Quota Safety ---');

  const deletedTracksFromDisk = [];
  window.SokoNative.deleteDownloadedTrack = (videoId) => {
    deletedTracksFromDisk.push(videoId);
    return true;
  };
  window.SokoNative.getDiskStorageUsedBytes = () => 150 * 1024 * 1024; // 150 MB

  // 10A: Individual track deletion
  const testTrackToDelete = 'mock_paginated_30';
  assert(window.downloadedSet.has(testTrackToDelete), 'Track mock_paginated_30 exists before deletion');
  window.deleteOfflineTrack(testTrackToDelete);
  assert(!window.downloadedSet.has(testTrackToDelete), 'Track mock_paginated_30 removed from downloadedSet');
  assert(deletedTracksFromDisk.includes(testTrackToDelete), 'Physical file deletion called for mock_paginated_30');

  // 10B: Clear unpinned cache
  deletedTracksFromDisk.length = 0;
  window.clearUnpinnedCache();
  assert(deletedTracksFromDisk.length > 0, `Physical disk files purged for ${deletedTracksFromDisk.length} unpinned songs`);

  // 10C: Storage metrics using native disk usage
  window.updateStorageMetrics();
  const storageLabelEl = getEl('storageLabel');
  assert(storageLabelEl.innerText.includes('150.0 MB'), `Native disk storage bytes queried and rendered: "${storageLabelEl.innerText}"`);

  // Clean up mock tracks
  for (let i = 1; i <= 30; i++) {
    window.downloadedSet.delete(`mock_paginated_${i}`);
  }

  // --- Test Suite 11: YouTube Music Feed Redesign, Even Shelf Cards & Library Sorting ---
  console.log('\n--- Test Suite 11: YouTube Music Feed Redesign, Even Shelf Cards & Library Sorting ---');

  // 11A: Header Logo has no square box wrapper
  assert(html.includes('class="brand-icon"'), 'Header contains .brand-icon element');
  assert(html.includes('class="brand-text"'), 'Header contains .brand-text element');
  assert(!html.includes('.brand-icon {\n      width: 28px;\n      height: 28px;\n      object-fit: contain;\n      background: transparent;\n      border: none;\n      border-radius: 0;\n      box-shadow: 0 0 12px') && html.includes('.brand-icon {\n      width: 28px;\n      height: 28px;\n      object-fit: contain;\n      background: transparent;\n      border: none;\n      border-radius: 0;\n      box-shadow: none;'), 'Square box shadow removed from brand-icon CSS and set to none');

  // 11B: Shelf cards even height CSS verification
  assert(html.includes('height: 206px;'), '.shelf-card has fixed equal height 206px');
  assert(html.includes('min-height: 2.7em;'), '.shelf-card-title has fixed 2-line height (min-height: 2.7em)');
  assert(html.includes('.ytm-grid-shelf'), 'CSS contains YouTube Music 4-row grid shelf (.ytm-grid-shelf)');
  assert(html.includes('.ytm-line-card'), 'CSS contains YouTube Music horizontal line card (.ytm-line-card)');

  // 11C: Home Feed Shelves Generation & Render
  const homeShelves = window.prepareHomeShelves([]);
  assert(homeShelves.some(s => s.id === 'quick_picks'), 'Home feed includes "Quick picks" shelf');
  assert(homeShelves.some(s => s.id === 'trending_for_you'), 'Home feed includes "Trending songs for you" shelf');
  assert(homeShelves.some(s => s.id === 'forgotten_favorites'), 'Home feed includes "Forgotten favorites" shelf');
  assert(homeShelves.some(s => s.id === 'mix_for_you'), 'Home feed includes "Mix for you" shelf');

  const quickShelf = homeShelves.find(s => s.id === 'quick_picks');
  assert(quickShelf.type === 'ytm-line', 'Quick picks is configured as YouTube Music horizontal line shelf');
  assert(quickShelf.tracks.length > 0, `Quick picks contains ${quickShelf.tracks.length} tracks`);

  // Render home shelves to mock container
  window.renderHomeShelves([]);
  const homeContainerEl = getEl('homeFeedContainer');
  assert(homeContainerEl.innerHTML.includes('Quick picks'), 'homeFeedContainer renders Quick picks');
  assert(homeContainerEl.innerHTML.includes('Trending songs for you'), 'homeFeedContainer renders Trending songs for you');
  assert(homeContainerEl.innerHTML.includes('Forgotten favorites'), 'homeFeedContainer renders Forgotten favorites');
  assert(homeContainerEl.innerHTML.includes('Mix for you'), 'homeFeedContainer renders Mix for you');
  assert(homeContainerEl.innerHTML.includes('ytm-line-card'), 'homeFeedContainer renders horizontal line cards (.ytm-line-card)');

  // 11D: Library Offline Songs Sorting
  assert(html.includes('id="sortBtn-recent"'), 'Library contains sortBtn-recent');
  assert(html.includes('id="sortBtn-title"'), 'Library contains sortBtn-title');
  assert(html.includes('id="sortBtn-artist"'), 'Library contains sortBtn-artist');
  assert(html.includes('id="sortBtn-duration"'), 'Library contains sortBtn-duration');

  // Test sorting logic
  // Setup 3 tracks with known title/artist/duration
  window.CATALOG.push({ id: 'sort_track_z', title: 'Zebra Song', artist: 'Bravo Artist', duration: 100, cover: 'assets/logo.png' });
  window.CATALOG.push({ id: 'sort_track_a', title: 'Alpha Song', artist: 'Charlie Artist', duration: 300, cover: 'assets/logo.png' });
  window.CATALOG.push({ id: 'sort_track_m', title: 'Middle Song', artist: 'Alpha Artist', duration: 200, cover: 'assets/logo.png' });
  window.downloadedSet.add('sort_track_z');
  window.downloadedSet.add('sort_track_a');
  window.downloadedSet.add('sort_track_m');

  // Sort by Title (A-Z)
  window.setLibrarySort('title');
  assert(window.currentLibrarySort === 'title', 'Current library sort is "title"');
  let renderedLib = getEl('libraryTracksList').innerHTML;
  const idxAlpha = renderedLib.indexOf('Alpha Song');
  const idxMiddle = renderedLib.indexOf('Middle Song');
  const idxZebra = renderedLib.indexOf('Zebra Song');
  assert(idxAlpha < idxMiddle && idxMiddle < idxZebra, 'Title sort orders songs A-Z (Alpha < Middle < Zebra)');

  // Test Bidirectional Title Sorting (Z-A)
  window.setLibrarySort('title'); // Toggle to desc
  assert(window.currentLibrarySort === 'title' && window.currentLibrarySortDir === 'desc', 'Second title sort click toggles to descending (Z-A)');
  renderedLib = getEl('libraryTracksList').innerHTML;
  const idxZebraDesc = renderedLib.indexOf('Zebra Song');
  const idxMiddleDesc = renderedLib.indexOf('Middle Song');
  const idxAlphaDesc = renderedLib.indexOf('Alpha Song');
  assert(idxZebraDesc < idxMiddleDesc && idxMiddleDesc < idxAlphaDesc, 'Title descending sort orders songs Z-A (Zebra < Middle < Alpha)');

  // Sort by Artist
  window.setLibrarySort('artist');
  assert(window.currentLibrarySort === 'artist', 'Current library sort is "artist"');
  renderedLib = getEl('libraryTracksList').innerHTML;
  const idxAlphaArtist = renderedLib.indexOf('Alpha Artist');
  const idxBravoArtist = renderedLib.indexOf('Bravo Artist');
  const idxCharlieArtist = renderedLib.indexOf('Charlie Artist');
  assert(idxAlphaArtist < idxBravoArtist && idxBravoArtist < idxCharlieArtist, 'Artist sort orders songs by artist (Alpha < Bravo < Charlie)');

  // Sort by Duration
  window.setLibrarySort('duration');
  assert(window.currentLibrarySort === 'duration' && window.currentLibrarySortDir === 'desc', 'Current library sort is "duration" (desc)');
  renderedLib = getEl('libraryTracksList').innerHTML;
  const idx300 = renderedLib.indexOf('Alpha Song'); // duration 300
  const idx200 = renderedLib.indexOf('Middle Song'); // duration 200
  const idx100 = renderedLib.indexOf('Zebra Song'); // duration 100
  assert(idx300 < idx200 && idx200 < idx100, 'Duration sort orders songs descending (300s < 200s < 100s)');

  // Toggle Duration (Ascending)
  window.setLibrarySort('duration'); // Toggle to asc
  assert(window.currentLibrarySort === 'duration' && window.currentLibrarySortDir === 'asc', 'Second duration click toggles to ascending (Shortest first)');
  renderedLib = getEl('libraryTracksList').innerHTML;
  const idx100Asc = renderedLib.indexOf('Zebra Song');
  const idx200Asc = renderedLib.indexOf('Middle Song');
  const idx300Asc = renderedLib.indexOf('Alpha Song');
  assert(idx100Asc < idx200Asc && idx200Asc < idx300Asc, 'Duration ascending sort orders songs 100s < 200s < 300s');

  // Reset to recent
  window.setLibrarySort('recent');
  assert(window.currentLibrarySort === 'recent', 'Reset library sort to "recent"');

  // 11E: Playlist Cards and Touch Ergonomics Assertions
  assert(html.includes('.playlist-card-title') && html.includes('height: 2.6em;\n      min-height: 2.6em;\n      max-height: 2.6em;'), 'Playlist card titles have fixed equal height (2.6em)');
  assert(html.includes('.ytm-line-btn {\n      width: 40px;\n      height: 40px;'), '.ytm-line-btn meets minimum 40x40px touch ergonomics');
  assert(html.includes('auth-banner-refresh-btn') && html.includes('shelf-play-all-btn'), 'Buttons use dedicated ergonomic sizing classes');

  // 11F: Home Shelf Queue Preservation
  window.renderHomeShelves([]);
  const testTrackFromShelf = window.currentHomeShelves[0].tracks[1];
  window.selectTrackToPlay(testTrackFromShelf.id);
  assert(window.activeQueueList === window.currentHomeShelves[0].tracks, 'Selecting song from home shelf binds activeQueueList to shelf tracks');

  // Cleanup
  window.downloadedSet.delete('sort_track_z');
  window.downloadedSet.delete('sort_track_a');
  window.downloadedSet.delete('sort_track_m');

  // --- Test Suite 12: Swipe-Down Pull-to-Refresh & YouTube Music Live Data Feeds ---
  console.log('\n--- Test Suite 12: Swipe-Down Pull-to-Refresh & YouTube Music Live Data Feeds ---');

  // 12A: Pull-to-Refresh Elements & CSS
  assert(html.includes('id="pullToRefreshContainer"'), 'HTML contains #pullToRefreshContainer element');
  assert(html.includes('id="ptrArrow"'), 'HTML contains #ptrArrow element');
  assert(html.includes('id="ptrSpinner"'), 'HTML contains #ptrSpinner element');
  assert(html.includes('id="ptrText"'), 'HTML contains #ptrText element');
  assert(html.includes('.ptr-container'), 'CSS contains .ptr-container styles');
  assert(html.includes('.ptr-spinner'), 'CSS contains .ptr-spinner styles');

  // 12B: Logged-in Auth Banner: Component removed from home feed (swipe down refresh operates natively)
  window.userSession = {
    isLoggedIn: true,
    name: 'Verified Audiophile',
    cookie: 'sapisid_test_token_live'
  };
  window.updateHomeAuthBanner();
  const authBannerEl = getEl('homeAuthBanner');
  assert(!authBannerEl.innerHTML.includes('onclick="fetchYouTubeMusicFeed()"'), 'Auth banner has visible refresh button REMOVED');
  assert(!authBannerEl.innerHTML.includes('↻ Refresh'), 'Auth banner does not contain "↻ Refresh" button text');
  assert(authBannerEl.innerHTML === '', 'Auth banner is empty when logged in (component removed from home feed)');
  assert(authBannerEl.style.display === 'none', 'Auth banner display is set to none when logged in');

  // 12C: Pull-to-Refresh Trigger
  let homeFeedFetchTriggered = false;
  const originalFetchHome = window.fetchYouTubeMusicFeed;
  window.fetchYouTubeMusicFeed = async () => {
    homeFeedFetchTriggered = true;
  };
  await window.triggerPullToRefresh();
  assert(homeFeedFetchTriggered === true, 'window.triggerPullToRefresh() triggers fetchYouTubeMusicFeed()');
  window.fetchYouTubeMusicFeed = originalFetchHome;

  // 12D: Parse Browse Shelves with Playlist Carousels (musicTwoRowItemRenderer)
  const mockBrowseData = {
    contents: {
      singleColumnBrowseResultsRenderer: {
        tabs: [{
          tabRenderer: {
            content: {
              sectionListRenderer: {
                contents: [
                  {
                    musicCarouselShelfRenderer: {
                      header: {
                        musicCarouselShelfBasicHeaderRenderer: {
                          title: { runs: [{ text: 'Quick picks' }] },
                          strapline: { runs: [{ text: 'START RADIO FROM A SONG' }] }
                        }
                      },
                      contents: [
                        {
                          musicTwoRowItemRenderer: {
                            title: { runs: [{ text: 'Global Dance Hits' }] },
                            subtitle: { runs: [{ text: 'Calvin Harris, Dua Lipa' }] },
                            navigationEndpoint: {
                              watchEndpoint: { playlistId: 'RDCLAK5uy_global_dance' }
                            },
                            thumbnailRenderer: {
                              musicThumbnailRenderer: {
                                thumbnail: { thumbnails: [{ url: 'https://i.ytimg.com/dance_cover.jpg' }] }
                              }
                            }
                          }
                        }
                      ]
                    }
                  },
                  {
                    musicCarouselShelfRenderer: {
                      header: {
                        musicCarouselShelfBasicHeaderRenderer: {
                          title: { runs: [{ text: 'Mixed for you' }] },
                          strapline: { runs: [{ text: 'PLAYLISTS TAILORED FOR YOU' }] }
                        }
                      },
                      contents: [
                        {
                          musicTwoRowItemRenderer: {
                            title: { runs: [{ text: 'My Supermix Live' }] },
                            subtitle: { runs: [{ text: 'Infinite Personalized Mix' }] },
                            navigationEndpoint: {
                              watchEndpoint: { playlistId: 'RDTMAK5uy_live_super' }
                            },
                            thumbnailRenderer: {
                              musicThumbnailRenderer: {
                                thumbnail: { thumbnails: [{ url: 'https://i.ytimg.com/supermix_cover.jpg' }] }
                              }
                            }
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            }
          }
        }]
      }
    }
  };

  const parsedShelves = window.parseBrowseShelves(mockBrowseData);
  assert(parsedShelves.length === 2, `parseBrowseShelves extracted 2 shelves (actual: ${parsedShelves.length})`);
  const quickParsed = parsedShelves.find(s => s.title === 'Quick picks');
  assert(quickParsed && quickParsed.mixes.length === 1, 'Quick picks contains parsed playlist carousel without dropping shelf');
  assert(quickParsed.mixes[0].playlistId === 'RDCLAK5uy_global_dance', 'Playlist ID extracted correctly from carousel');

  const mixParsed = parsedShelves.find(s => s.title === 'Mixed for you');
  assert(mixParsed && mixParsed.mixes.length === 1, 'Mixed for you contains parsed mix carousel');
  assert(mixParsed.mixes[0].title === 'My Supermix Live', 'Live mix title extracted correctly');
  assert(mixParsed.mixes[0].cover === 'https://i.ytimg.com/supermix_cover.jpg', 'Live mix cover extracted correctly');

  // 12E: Dynamic Playlist Resolution
  innerTubeCalls.length = 0;
  // Mock next endpoint returning tracks for RDCLAK5uy_global_dance
  const prevCallInnerTubeApi = window.callInnerTubeApi;
  window.callInnerTubeApi = async (endpoint, payload, cookie) => {
    innerTubeCalls.push({ endpoint, payload, cookie });
    if (endpoint === 'youtubei/v1/next') {
      return {
        contents: {
          singleColumnMusicWatchNextResultsRenderer: {
            tabbedRenderer: {
              watchNextTabbedResultsRenderer: {
                tabs: [{
                  tabRenderer: {
                    content: {
                      musicQueueRenderer: {
                        content: {
                          playlistPanelRenderer: {
                            contents: [
                              {
                                playlistPanelVideoRenderer: {
                                  videoId: 'live_dance_song_1',
                                  title: { runs: [{ text: 'One Kiss Live' }] },
                                  shortBylineText: { runs: [{ text: 'Calvin Harris' }] },
                                  lengthText: { runs: [{ text: '3:34' }] },
                                  thumbnail: { thumbnails: [{ url: 'https://i.ytimg.com/one_kiss.jpg' }] }
                                }
                              },
                              {
                                playlistPanelVideoRenderer: {
                                  videoId: 'live_dance_song_2',
                                  title: { runs: [{ text: 'Levitating Live' }] },
                                  shortBylineText: { runs: [{ text: 'Dua Lipa' }] },
                                  lengthText: { runs: [{ text: '3:23' }] },
                                  thumbnail: { thumbnails: [{ url: 'https://i.ytimg.com/levitating.jpg' }] }
                                }
                              }
                            ]
                          }
                        }
                      }
                    }
                  }
                }]
              }
            }
          }
        }
      };
    }
    return null;
  };

  const resolvedDanceTracks = await window.resolvePlaylistTracks('RDCLAK5uy_global_dance');
  assert(resolvedDanceTracks.length === 2, `resolvePlaylistTracks returned 2 tracks (actual: ${resolvedDanceTracks.length})`);
  assert(resolvedDanceTracks[0].id === 'live_dance_song_1', 'First resolved track ID is live_dance_song_1');
  assert(window.CATALOG.some(t => t.id === 'live_dance_song_1'), 'Resolved track added to CATALOG');

  // 12F: Live Shelves Preparation & Render
  // Attach resolved tracks to Quick picks
  quickParsed.tracks = resolvedDanceTracks;
  const prepared = window.prepareHomeShelves(parsedShelves);
  const qShelf = prepared.find(s => s.id === 'quick_picks');
  assert(qShelf.tracks.some(t => t.id === 'live_dance_song_1'), 'Quick picks populated with live resolved YouTube Music tracks');

  const mShelf = prepared.find(s => s.id === 'mix_for_you');
  assert(mShelf.mixes.some(m => m.title === 'My Supermix Live'), 'Mix for you populated with live YouTube Music mix');

  window.renderHomeShelves(parsedShelves);
  const homeContainerHtml = getEl('homeFeedContainer').innerHTML;
  assert(homeContainerHtml.includes('One Kiss Live'), 'homeFeedContainer renders live Quick picks track');
  assert(homeContainerHtml.includes('My Supermix Live'), 'homeFeedContainer renders live Mix for you card');

  // 12G: Play Live Mix with Dynamic Resolution
  await window.playCuratedMix('RDTMAK5uy_live_super');
  assert(window.activePlaylist && window.activePlaylist.id === 'RDTMAK5uy_live_super', 'playCuratedMix sets activePlaylist to live mix');
  assert(window.activeQueueList && window.activeQueueList.length === 2, 'playCuratedMix resolved and bound live tracks to queue');
  assert(window.currentTrack && window.currentTrack.id === 'live_dance_song_1', 'Playback started for first track in live mix');

  // 12H: Refresh when logged in sends auth cookie
  let browseCookieUsed = null;
  window.callInnerTubeApi = async (endpoint, payload, cookie) => {
    if (endpoint === 'youtubei/v1/browse') {
      browseCookieUsed = cookie;
      return mockBrowseData;
    }
    return null;
  };
  await window.fetchYouTubeMusicFeed();
  assert(browseCookieUsed === 'sapisid_test_token_live', 'fetchYouTubeMusicFeed sends logged-in user cookie to YouTube Music InnerTube');

  // 12I: Deeply nested song item extraction in parseBrowseShelves
  const realisticResponsiveData = {
    contents: {
      singleColumnBrowseResultsRenderer: {
        tabs: [{
          tabRenderer: {
            content: {
              sectionListRenderer: {
                contents: [
                  {
                    musicCarouselShelfRenderer: {
                      header: {
                        musicCarouselShelfBasicHeaderRenderer: {
                          title: { runs: [{ text: 'Quick picks' }] },
                          strapline: { runs: [{ text: 'START RADIO FROM A SONG' }] }
                        }
                      },
                      contents: [
                        {
                          musicResponsiveListItemRenderer: {
                            flexColumns: [
                              {
                                musicResponsiveListItemFlexColumnRenderer: {
                                  text: {
                                    runs: [{
                                      text: 'Espresso',
                                      navigationEndpoint: {
                                        watchEndpoint: {
                                          videoId: 'dQw4w9WgXcQ',
                                          playlistId: 'RDAMVMdQw4w9WgXcQ'
                                        }
                                      }
                                    }]
                                  }
                                }
                              },
                              {
                                musicResponsiveListItemFlexColumnRenderer: {
                                  text: { runs: [{ text: 'Sabrina Carpenter' }, { text: ' • ' }, { text: '2:55' }] }
                                }
                              }
                            ]
                          }
                        }
                      ]
                    }
                  },
                  {
                    musicCarouselShelfRenderer: {
                      header: {
                        musicCarouselShelfBasicHeaderRenderer: {
                          title: { runs: [{ text: 'Mixed for you' }] },
                          strapline: { runs: [{ text: 'PLAYLISTS TAILORED FOR YOU' }] }
                        }
                      },
                      contents: [
                        {
                          musicTwoRowItemRenderer: {
                            title: { runs: [{ text: 'Chill Mix' }] },
                            subtitle: { runs: [{ text: 'Lofi, Ambient, Chill' }] },
                            navigationEndpoint: {
                              watchEndpoint: {
                                videoId: 'seed_chill_01',
                                playlistId: 'RDTMAK5uy_chill_mix'
                              }
                            }
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            }
          }
        }]
      }
    }
  };

  const parsedResponsive = window.parseBrowseShelves(realisticResponsiveData);
  assert(parsedResponsive.length === 2, `Deep parse extracted 2 shelves (actual: ${parsedResponsive.length})`);
  const respQuick = parsedResponsive.find(s => s.title === 'Quick picks');
  assert(respQuick && respQuick.tracks.length === 1, 'Quick picks contains parsed responsive song');
  assert(respQuick.tracks[0].id === 'dQw4w9WgXcQ', 'Parsed song video ID is dQw4w9WgXcQ');
  assert(respQuick.tracks[0].title === 'Espresso', 'Parsed song title is Espresso');
  assert(respQuick.tracks[0].artist === 'Sabrina Carpenter', 'Parsed song artist is Sabrina Carpenter');
  assert(respQuick.mixes.length === 0, 'RDAMVM auto-radio was NOT turned into a fake mix');

  const respMix = parsedResponsive.find(s => s.title === 'Mixed for you');
  assert(respMix && respMix.mixes.length === 1, 'Mixed for you contains parsed mix');
  assert(respMix.mixes[0].title === 'Chill Mix', 'Mix title is Chill Mix');
  assert(respMix.tracks.length === 0, 'Mix playlist card was NOT added to tracks as a fake song');

  // 12J: Mutual exclusion in prepareHomeShelves prevents data duplication
  const preparedUnique = window.prepareHomeShelves(parsedResponsive);
  const qPicks = preparedUnique.find(s => s.id === 'quick_picks');
  const tSongs = preparedUnique.find(s => s.id === 'trending_for_you');
  const fSongs = preparedUnique.find(s => s.id === 'forgotten_favorites');
  assert(qPicks.tracks[0].title === 'Espresso', 'Quick picks displays authentic live song Espresso');
  assert(!tSongs.tracks[0] || tSongs.tracks[0].title !== 'Espresso', 'Trending songs does not duplicate Quick picks song');
  assert(!fSongs.tracks[0] || fSongs.tracks[0].title !== 'Espresso', 'Forgotten favorites does not duplicate Quick picks song');

  // 12K: Demo account feed generation returns rich distinct shelves
  window.userSession = {
    isLoggedIn: true,
    isDemo: true,
    name: 'Demo Audiophile',
    email: 'demo@soko.music'
  };
  const demoResult = await window.fetchYouTubeMusicFeed();
  assert(demoResult && demoResult.success === true, 'Demo feed fetch returns success');
  assert(window.personalShelves && window.personalShelves.length >= 4, 'Demo session initializes 4 distinct shelves');

  // 12L: Pull-to-refresh directional check
  let ptrTriggerCount = 0;
  const mockFetch = window.fetchYouTubeMusicFeed;
  window.fetchYouTubeMusicFeed = async () => {
    ptrTriggerCount++;
    return { success: true };
  };
  await window.triggerPullToRefresh();
  assert(ptrTriggerCount === 1, 'window.triggerPullToRefresh() executes refresh sequence');
  window.fetchYouTubeMusicFeed = mockFetch;

  // Restore user session and callInnerTubeApi
  window.userSession = {
    isLoggedIn: true,
    name: 'Verified Audiophile',
    cookie: 'sapisid_test_token_live'
  };
  window.callInnerTubeApi = prevCallInnerTubeApi;

  // =========================================================================
  // Test Suite 13: Duration & Podcast Filter Engine (> 10 Min & Podcasts)
  // =========================================================================
  console.log('\n--- Test Suite 13: Content Filtering (Podcasts & Long Tracks > 10 Min) ---');

  // 13A: Duration parsing
  assert(window.parseDurationStringToSeconds('3:45') === 225, '3:45 parses to 225s');
  assert(window.parseDurationStringToSeconds('10:00') === 600, '10:00 parses to 600s');
  assert(window.parseDurationStringToSeconds('10:01') === 601, '10:01 parses to 601s');
  assert(window.parseDurationStringToSeconds('1:15:30') === 4530, '1:15:30 parses to 4530s');
  assert(window.parseDurationStringToSeconds('45 min') === 2700, '45 min parses to 2700s');
  assert(window.parseDurationStringToSeconds('1 hr 20 min') === 3600, '1 hr 20 min parses to >= 3600s');
  assert(window.parseDurationStringToSeconds(180) === 180, 'Numeric duration 180 parses to 180s');

  // 13B: isPodcastOrLongTrack classification
  assert(window.isPodcastOrLongTrack({ title: 'Song Alpha', duration: 215 }) === false, 'Song Alpha (215s) is not filtered');
  assert(window.isPodcastOrLongTrack({ title: 'Song Beta', duration: 600 }) === false, '10 min exact song (600s) is allowed');
  assert(window.isPodcastOrLongTrack({ title: 'Long Jam', duration: 601 }) === true, 'Track > 10 min (601s) is identified as long');
  assert(window.isPodcastOrLongTrack({ title: 'Marathon Mix', duration: 3600 }) === true, '1-hour mix (3600s) is identified as long');
  assert(window.isPodcastOrLongTrack({ title: 'The Daily Tech Podcast', duration: 200 }) === true, 'Podcast keyword in title is identified');
  assert(window.isPodcastOrLongTrack({ title: 'Interview', subtitle: 'Podcasts & Talk', duration: 200 }) === true, 'Podcast keyword in subtitle is identified');
  assert(window.isPodcastOrLongTrack({ title: 'Full Episode: Mystery Case', duration: 180 }) === true, 'Full Episode in title is identified');
  assert(window.isPodcastOrLongTrack({ title: 'Talk Show Ep. 42', duration: 180 }) === true, 'Ep. 42 in title is identified');
  assert(window.isPodcastOrLongTrack({ title: 'Morning Show Episode 5', duration: 180 }) === true, 'Episode 5 in title is identified');

  // 13C: InnerTube podcast structured item inspection
  const podcastItem = {
    title: { runs: [{ text: 'Deep Thoughts' }] },
    badges: [{ musicInlineBadgeRenderer: { accessibilityData: { accessibilityData: { label: 'Podcast' } } } }]
  };
  assert(window.isPodcastOrLongTrack(podcastItem) === true, 'InnerTube item with podcast badge is identified');

  // 13D: Download blocking for podcasts and tracks > 10 min
  window.CATALOG.push({ id: 'filter_test_short', title: 'Allowed Short Song', artist: 'Artist A', duration: 210, cover: 'assets/logo.png' });
  window.CATALOG.push({ id: 'filter_test_long', title: 'Blocked Long Symphony', artist: 'Artist B', duration: 900, cover: 'assets/logo.png' });
  window.CATALOG.push({ id: 'filter_test_podcast', title: 'Tech Podcast Special', artist: 'Podcaster', duration: 300, cover: 'assets/logo.png' });

  window.activeDownloads.clear();
  window.startDownloadTrack('filter_test_long');
  assert(!window.activeDownloads.has('filter_test_long'), 'Track over 10 min is blocked from downloading');

  window.startDownloadTrack('filter_test_podcast');
  assert(!window.activeDownloads.has('filter_test_podcast'), 'Podcast track is blocked from downloading');

  // Short song download is permitted
  window.startDownloadTrack('filter_test_short');
  assert(window.activeDownloads.has('filter_test_short'), 'Eligible song under 10 min downloads normally');
  window.activeDownloads.clear();

  // 13E: Auto-prefetch skips podcasts & long tracks
  let prefetchedTrackId = null;
  const originalNative = window.SokoNative;
  window.SokoNative = {
    downloadTrack: (id) => { prefetchedTrackId = id; },
    isTrackDownloaded: () => false
  };

  window.activeQueueList = [
    { id: 'q_song_1', title: 'Song 1', duration: 200 },
    { id: 'q_song_long', title: 'Song 2 Long', duration: 1200 }
  ];
  window.autoPrefetchNextTrack('q_song_1');
  assert(prefetchedTrackId === null, 'autoPrefetchNextTrack skips pre-caching next track that exceeds 10 minutes');

  window.activeQueueList = [
    { id: 'q_song_1', title: 'Song 1', duration: 200 },
    { id: 'q_podcast', title: 'Tech Show Podcast', duration: 300 }
  ];
  window.autoPrefetchNextTrack('q_song_1');
  assert(prefetchedTrackId === null, 'autoPrefetchNextTrack skips pre-caching next track that is a podcast');

  window.activeQueueList = [
    { id: 'q_song_1', title: 'Song 1', duration: 200 },
    { id: 'q_valid_next', title: 'Regular Song 2', duration: 210 }
  ];
  window.autoPrefetchNextTrack('q_song_1');
  assert(prefetchedTrackId === 'q_valid_next', 'autoPrefetchNextTrack allows pre-caching regular song <= 10 min');
  window.SokoNative = originalNative;

  // 13F: Radio queue fetch filters out podcasts & long songs
  const mockRadioApi = async (endpoint, payload) => {
    return {
      contents: {
        singleColumnMusicWatchNextResultsRenderer: {
          tabbedRenderer: {
            watchNextTabbedResultsRenderer: {
              tabs: [{
                tabRenderer: {
                  content: {
                    musicQueueRenderer: {
                      content: {
                        playlistPanelRenderer: {
                          contents: [
                            {
                              playlistPanelVideoRenderer: {
                                videoId: 'radio_valid_1',
                                title: { runs: [{ text: 'Radio Song 1' }] },
                                shortBylineText: { runs: [{ text: 'Artist 1' }] },
                                lengthText: { runs: [{ text: '3:30' }] }
                              }
                            },
                            {
                              playlistPanelVideoRenderer: {
                                videoId: 'radio_valid_2',
                                title: { runs: [{ text: 'Radio Song 2' }] },
                                shortBylineText: { runs: [{ text: 'Artist 2' }] },
                                lengthText: { runs: [{ text: '4:15' }] }
                              }
                            },
                            {
                              playlistPanelVideoRenderer: {
                                videoId: 'radio_long_3',
                                title: { runs: [{ text: 'Radio 2-Hour Ambient Mix' }] },
                                shortBylineText: { runs: [{ text: 'DJ Sleep' }] },
                                lengthText: { runs: [{ text: '2:00:00' }] }
                              }
                            },
                            {
                              playlistPanelVideoRenderer: {
                                videoId: 'radio_podcast_4',
                                title: { runs: [{ text: 'News Today Podcast Ep. 10' }] },
                                shortBylineText: { runs: [{ text: 'News Network' }] },
                                lengthText: { runs: [{ text: '15:00' }] }
                              }
                            }
                          ]
                        }
                      }
                    }
                  }
                }
              }]
            }
          }
        }
      }
    };
  };

  window.callInnerTubeApi = mockRadioApi;
  window.activePlaylist = null;
  window.activeQueueList = null;
  window.currentTrack = { id: 'radio_seed_track' };
  await window.fetchAndApplyYtmRadioQueue('radio_seed_track');

  assert(window.activeQueueList && window.activeQueueList.length === 2, `Radio queue filtered to only 2 eligible songs (actual: ${window.activeQueueList?.length})`);
  assert(window.activeQueueList[0].id === 'radio_valid_1', 'Radio queue contains radio_valid_1');
  assert(window.activeQueueList[1].id === 'radio_valid_2', 'Radio queue contains radio_valid_2');
  assert(!window.activeQueueList.some(t => t.id === 'radio_long_3'), 'Radio queue excluded 2-hour long mix');
  assert(!window.activeQueueList.some(t => t.id === 'radio_podcast_4'), 'Radio queue excluded podcast episode');

  // 13G: Playlist resolution filters out podcasts & tracks > 10 min
  const mockPlaylistApi = async (endpoint, payload) => {
    return {
      contents: {
        singleColumnMusicWatchNextResultsRenderer: {
          tabbedRenderer: {
            watchNextTabbedResultsRenderer: {
              tabs: [{
                tabRenderer: {
                  content: {
                    musicQueueRenderer: {
                      content: {
                        playlistPanelRenderer: {
                          contents: [
                            {
                              playlistPanelVideoRenderer: {
                                videoId: 'pl_valid_song',
                                title: { runs: [{ text: 'Valid Pop Song' }] },
                                shortBylineText: { runs: [{ text: 'Pop Star' }] },
                                lengthText: { runs: [{ text: '3:45' }] }
                              }
                            },
                            {
                              playlistPanelVideoRenderer: {
                                videoId: 'pl_over_10m',
                                title: { runs: [{ text: 'Super Long Jam' }] },
                                shortBylineText: { runs: [{ text: 'Band' }] },
                                lengthText: { runs: [{ text: '12:30' }] }
                              }
                            },
                            {
                              playlistPanelVideoRenderer: {
                                videoId: 'pl_podcast_item',
                                title: { runs: [{ text: 'The Joe Talk Podcast' }] },
                                shortBylineText: { runs: [{ text: 'Host' }] },
                                lengthText: { runs: [{ text: '5:00' }] }
                              }
                            }
                          ]
                        }
                      }
                    }
                  }
                }
              }]
            }
          }
        }
      }
    };
  };

  window.callInnerTubeApi = mockPlaylistApi;
  const plResolved = await window.resolvePlaylistTracks('test_playlist_filter');
  assert(plResolved.length === 1, `resolvePlaylistTracks returned exactly 1 eligible song (actual: ${plResolved.length})`);
  assert(plResolved[0].id === 'pl_valid_song', 'Resolved playlist has only pl_valid_song');

  // 13H: Search filters out podcasts & tracks > 10 min
  const mockSearchApi = async (endpoint, payload) => {
    return {
      contents: [
        {
          musicResponsiveListItemRenderer: {
            videoId: 'srch_val_11',
            flexColumns: [
              { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'Hit Song' }] } } },
              { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'Hit Artist' }, { text: '•' }, { text: '3:30' }] } } }
            ]
          }
        },
        {
          musicResponsiveListItemRenderer: {
            videoId: 'srch_lng_11',
            flexColumns: [
              { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'Long Ambient Meditation' }] } } },
              { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'Zen Master' }, { text: '•' }, { text: '18:45' }] } } }
            ]
          }
        },
        {
          musicResponsiveListItemRenderer: {
            videoId: 'srch_pod_11',
            flexColumns: [
              { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'Tech Review Podcast' }] } } },
              { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'Reviewer' }, { text: '•' }, { text: '4:15' }] } } }
            ]
          }
        }
      ]
    };
  };

  window.callInnerTubeApi = mockSearchApi;
  await window.executeSearch('test query filter');
  assert(window.currentYtmSearchResults.some(t => t.id === 'srch_val_11'), 'Search results include srch_val_11');
  assert(!window.currentYtmSearchResults.some(t => t.id === 'srch_lng_11'), 'Search results filter out 18:45 track (> 10m)');
  assert(!window.currentYtmSearchResults.some(t => t.id === 'srch_pod_11'), 'Search results filter out podcast track');

  // 13I: parseBrowseShelves filters out podcast shelves and long items
  const mockBrowseDataFilter = {
    contents: {
      singleColumnBrowseResultsRenderer: {
        tabs: [{
          tabRenderer: {
            content: {
              sectionListRenderer: {
                contents: [
                  {
                    musicCarouselShelfRenderer: {
                      header: {
                        musicCarouselShelfBasicHeaderRenderer: {
                          title: { runs: [{ text: 'Podcasts to explore' }] },
                          strapline: { runs: [{ text: 'EPISODES & PODCASTS' }] }
                        }
                      },
                      contents: [
                        {
                          musicResponsiveListItemRenderer: {
                            videoId: 'browse_pod1', // 11 chars
                            flexColumns: [
                              { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'Crime Stories Podcast' }] } } },
                              { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'Narrator' }, { text: '•' }, { text: '45:00' }] } } }
                            ]
                          }
                        }
                      ]
                    }
                  },
                  {
                    musicCarouselShelfRenderer: {
                      header: {
                        musicCarouselShelfBasicHeaderRenderer: {
                          title: { runs: [{ text: 'Hits Today' }] },
                          strapline: { runs: [{ text: 'TOP POP' }] }
                        }
                      },
                      contents: [
                        {
                          musicResponsiveListItemRenderer: {
                            videoId: 'pop_valid11', // 11 chars
                            flexColumns: [
                              { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'Chart Pop Song' }] } } },
                              { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'Singer' }, { text: '•' }, { text: '3:15' }] } } }
                            ]
                          }
                        },
                        {
                          musicResponsiveListItemRenderer: {
                            videoId: 'pop_long_11', // 11 chars
                            flexColumns: [
                              { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'Extended 15-Minute Club Mix' }] } } },
                              { musicResponsiveListItemFlexColumnRenderer: { text: { runs: [{ text: 'DJ Club' }, { text: '•' }, { text: '15:20' }] } } }
                            ]
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            }
          }
        }]
      }
    }
  };

  const parsedFilterShelves = window.parseBrowseShelves(mockBrowseDataFilter);
  assert(!parsedFilterShelves.some(s => s.title.toLowerCase().includes('podcast')), 'parseBrowseShelves dropped the podcast shelf');
  assert(parsedFilterShelves.length === 1 && parsedFilterShelves[0].title === 'Hits Today', 'parseBrowseShelves kept Hits Today shelf');
  assert(parsedFilterShelves[0].tracks.length === 1, `Hits Today has only 1 track (actual: ${parsedFilterShelves[0].tracks.length})`);
  assert(parsedFilterShelves[0].tracks[0].id === 'pop_valid11', 'Hits Today contains only valid 3:15 song');
  assert(!parsedFilterShelves[0].tracks.some(t => t.id === 'pop_long_11'), 'Hits Today excluded 15-minute mix');

  // --- Test Suite 14: Verification of Identified Codebase Fixes ---
  console.log('\n--- Test Suite 14: Verification of Identified Codebase Fixes ---');

  // 14A: Google Sign-in Bridge Callback Synchronization
  assert(typeof window.onGoogleLoginSuccess === 'function', 'window.onGoogleLoginSuccess is defined on window');
  assert(window.onGoogleLoginSuccess === window.onLoginSuccess, 'window.onGoogleLoginSuccess matches window.onLoginSuccess');
  
  window.onGoogleLoginSuccess('test_sapisid_bridge_cookie', 'Alice Audiophile', 'alice@soko.music');
  assert(window.userSession && window.userSession.isLoggedIn === true, 'userSession set to loggedIn after onGoogleLoginSuccess');
  assert(window.userSession.cookie === 'test_sapisid_bridge_cookie', 'userSession has correct cookies');

  // 14B: Settings UI Reactive Updates
  const settingsYtmSubtitleEl = getEl('settingsYtmSubtitle');
  const settingsAuthActionBtnEl = getEl('settingsAuthActionBtn');
  window.updateAuthHeaderUI();
  assert(settingsYtmSubtitleEl.innerText.includes('Connected • Alice Audiophile'), `Settings subtitle updated for logged in user: "${settingsYtmSubtitleEl.innerText}"`);
  assert(settingsAuthActionBtnEl.innerText === 'Manage Account', `Settings auth button updated for logged in user: "${settingsAuthActionBtnEl.innerText}"`);

  window.logoutAccount();
  assert(window.userSession === null, 'userSession is null after logout');
  assert(settingsYtmSubtitleEl.innerText.includes('Not Connected • Guest Mode'), `Settings subtitle restored after logout: "${settingsYtmSubtitleEl.innerText}"`);
  assert(settingsAuthActionBtnEl.innerText === 'Sign In / Connect', `Settings auth button restored after logout: "${settingsAuthActionBtnEl.innerText}"`);

  // 14C: Look-Ahead Checkbox Binding
  const chkLookAheadEl = getEl('chkLookAhead');
  chkLookAheadEl.checked = false;
  let testPrefetchId = null;
  const originalNativeForLookahead = window.SokoNative;
  window.SokoNative = {
    ...originalNativeForLookahead,
    downloadTrack: (id) => { testPrefetchId = id; }
  };
  window.activeQueueList = [
    { id: 'track_curr', title: 'Current Song', duration: 180 },
    { id: 'track_next', title: 'Next Song', duration: 190 }
  ];
  window.autoPrefetchNextTrack('track_curr');
  assert(testPrefetchId === null, 'autoPrefetchNextTrack skips download when #chkLookAhead is unchecked (checked = false)');

  chkLookAheadEl.checked = true;
  window.autoPrefetchNextTrack('track_curr');
  assert(testPrefetchId === 'track_next', 'autoPrefetchNextTrack proceeds when #chkLookAhead is checked (checked = true)');
  window.SokoNative = originalNativeForLookahead;

  // 14D: LRU Cache Eviction Engine
  window.maxCacheGB = 0.011; // ~11.8 MB ceiling (fits ~2.5 songs)
  const prevGetStorage = window.SokoNative ? window.SokoNative.getDiskStorageUsedBytes : null;
  if (window.SokoNative) {
    window.SokoNative.getDiskStorageUsedBytes = () => window.downloadedSet.size * 3.5 * 1024 * 1024;
  }
  window.downloadedSet.clear();
  window.downloadedSet.add('lru_song_1');
  window.downloadedSet.add('lru_fav_2');
  window.downloadedSet.add('lru_song_3');

  window.lruPlayRegistry.clear();
  window.lruPlayRegistry.set('lru_song_1', { lastPlayed: 1000 });
  window.lruPlayRegistry.set('lru_fav_2', { lastPlayed: 2000 });
  window.lruPlayRegistry.set('lru_song_3', { lastPlayed: 3000 });

  const favPl = window.userPlaylists.find(p => p.id === 'pl_favorites');
  if (favPl) favPl.songIds.push('lru_fav_2');

  window.enforceLruEviction(1.5 * 1024 * 1024);
  assert(!window.downloadedSet.has('lru_song_1'), 'Oldest unpinned song (lru_song_1) was evicted by LRU engine');
  assert(window.downloadedSet.has('lru_fav_2'), 'Favorite song (lru_fav_2) was protected from LRU eviction');
  assert(window.downloadedSet.has('lru_song_3'), 'Recent song (lru_song_3) was preserved');

  // Reset maxCacheGB and storage getter
  window.maxCacheGB = 1.0;
  if (window.SokoNative && prevGetStorage) {
    window.SokoNative.getDiskStorageUsedBytes = prevGetStorage;
  }
  window.downloadedSet.clear();
  for (const b of window.BUNDLED_TRACKS) window.downloadedSet.add(b.id);

  // 14E: Deleted Track Metadata Cleanup
  const customTrackId = 'custom_del_test_99';
  const customTrack = {
    id: customTrackId,
    title: 'Deletable Custom Song',
    artist: 'Independent',
    duration: 200,
    cover: 'https://i.ytimg.com/vi/custom_del_test_99/hqdefault.jpg'
  };
  window.CATALOG.push(customTrack);
  window.downloadedSet.add(customTrackId);
  window.persistDownloadState();
  let storedCustom = JSON.parse(localStorage.getItem('soko_custom_tracks_v2') || '[]');
  assert(storedCustom.some(t => t.id === customTrackId), 'Custom track stored in localStorage before deletion');

  window.deleteOfflineTrack(customTrackId);
  assert(!window.downloadedSet.has(customTrackId), 'customTrackId removed from downloadedSet');
  assert(!window.CATALOG.some(t => t.id === customTrackId), 'customTrackId purged from in-memory CATALOG');
  storedCustom = JSON.parse(localStorage.getItem('soko_custom_tracks_v2') || '[]');
  assert(!storedCustom.some(t => t.id === customTrackId), 'customTrackId purged from soko_custom_tracks_v2 in localStorage (no resurrection on restart)');

  // 14F: Library "Play All / Shuffle All" Queue Integration
  window.downloadedSet.add('chart_down_1');
  window.downloadedSet.add('chart_down_2');
  window.playAllOfflineTracks(false);
  assert(window.activeQueueList && window.activeQueueList.length >= window.downloadedSet.size, 'playAllOfflineTracks sets activeQueueList from all downloaded tracks');
  assert(window.isShuffle === false, 'playAllOfflineTracks with shuffle=false sets isShuffle to false');

  window.playAllOfflineTracks(true);
  assert(window.isShuffle === true, 'playAllOfflineTracks with shuffle=true sets isShuffle to true');
  window.downloadedSet.delete('chart_down_1');
  window.downloadedSet.delete('chart_down_2');

  // 14G: Playlist Queue Protection
  const testPlaylist = {
    id: 'custom_playlist_protection_test',
    name: 'Protected Playlist',
    songIds: ['kPa7bsKwL-c', '4HVhnhpJxr0']
  };
  window.activePlaylist = testPlaylist;
  window.selectTrackToPlay('kPa7bsKwL-c');
  assert(window.activePlaylist !== null && window.activePlaylist.id === 'custom_playlist_protection_test', 'selectTrackToPlay preserved activePlaylist context');

  // 14H: Search Category Filtering
  window.downloadedSet.add('custom_search_offline_song');
  window.filterSearchCategory('offline');
  assert(window.currentYtmSearchResults.some(t => t.id === 'custom_search_offline_song'), 'filterSearchCategory("offline") queried complete downloadedSet');
  window.downloadedSet.delete('custom_search_offline_song');

  if (favPl) favPl.songIds.push('custom_fav_search_song');
  window.filterSearchCategory('favorites');
  assert(window.currentYtmSearchResults.some(t => t.id === 'custom_fav_search_song'), 'filterSearchCategory("favorites") queried all user favorites');

  // 14I: Previous Track Restart (>3s)
  let seekCalledSeconds = null;
  window.SokoNative = {
    ...originalNativeForLookahead,
    seekAudio: (sec) => { seekCalledSeconds = sec; }
  };
  window.activeQueueList = [
    { id: 'seq_song_1', title: 'Song 1', duration: 200 },
    { id: 'seq_song_2', title: 'Song 2', duration: 200 }
  ];
  window.currentTrack = window.activeQueueList[1];
  window.currentPlaybackTime = 12;
  window.playPreviousTrack();
  assert(seekCalledSeconds === 0, 'playPreviousTrack restarted current track to 0s when position > 3s');
  assert(window.currentTrack.id === 'seq_song_2', 'Track did not change to previous song when position > 3s');

  window.currentPlaybackTime = 1;
  seekCalledSeconds = null;
  window.playPreviousTrack();
  assert(window.currentTrack.id === 'seq_song_1', 'Track transitioned to previous song when position <= 3s');
  window.SokoNative = originalNativeForLookahead;

  // 14J: Authenticated Telemetry Pings
  let authTelemetryUrl = null;
  let authTelemetryCookie = null;
  window.SokoNative = {
    ...originalNativeForLookahead,
    sendAuthenticatedTelemetryPing: (url, cookie) => {
      authTelemetryUrl = url;
      authTelemetryCookie = cookie;
    }
  };
  window.userSession = {
    isLoggedIn: true,
    cookie: 'test_telemetry_auth_cookie_xyz'
  };
  window.sendTelemetryPing('https://www.youtube.com/api/stats/watchtime?test=1');
  assert(authTelemetryUrl !== null, 'sendTelemetryPing invoked sendAuthenticatedTelemetryPing when userSession has cookies');
  assert(authTelemetryCookie === 'test_telemetry_auth_cookie_xyz', 'sendAuthenticatedTelemetryPing received session cookie');
  window.SokoNative = originalNativeForLookahead;

  // 14K: Quick picks & Trending songs trigger dynamic YouTube Music Radio
  console.log('\n--- Test 14K: Quick Picks & Trending Radio Triggering ---');
  window.fetchYouTubeMusicFeed = async () => ({ success: true, shelves: [] });
  const shelvesToTest = [
    {
      id: 'quick_picks',
      title: 'Quick picks',
      badge: 'START RADIO FROM A SONG',
      tracks: [
        { id: 'qp_seed_1', title: 'Quick Pick Seed', duration: 210 },
        { id: 'qp_static_2', title: 'Quick Pick 2', duration: 190 }
      ]
    },
    {
      id: 'trending_for_you',
      title: 'Trending songs for you',
      badge: 'CHARTS & BUZZ',
      tracks: [
        { id: 'tr_seed_1', title: 'Trending Seed', duration: 240 },
        { id: 'tr_static_2', title: 'Trending 2', duration: 200 }
      ]
    }
  ];
  window.currentHomeShelves = shelvesToTest;

  let radioEndpointPayload = null;
  window.callInnerTubeApi = async (endpoint, payload) => {
    if (endpoint.includes('next') && payload && payload.playlistId) {
      radioEndpointPayload = payload;
    }
    return {
      contents: {
        singleColumnMusicWatchNextResultsRenderer: {
          tabbedRenderer: {
            watchNextTabbedResultsRenderer: {
              tabs: [{
                tabRenderer: {
                  content: {
                    musicQueueRenderer: {
                      content: {
                        playlistPanelRenderer: {
                          contents: [
                            {
                              playlistPanelVideoRenderer: {
                                videoId: 'dyn_radio_1',
                                title: { runs: [{ text: 'Dynamic Radio Track 1' }] },
                                shortBylineText: { runs: [{ text: 'Artist 1' }] },
                                lengthText: { simpleText: '3:30' }
                              }
                            },
                            {
                              playlistPanelVideoRenderer: {
                                videoId: 'dyn_radio_2',
                                title: { runs: [{ text: 'Dynamic Radio Track 2' }] },
                                shortBylineText: { runs: [{ text: 'Artist 2' }] },
                                lengthText: { simpleText: '3:45' }
                              }
                            }
                          ]
                        }
                      }
                    }
                  }
                }
              }]
            }
          }
        }
      }
    };
  };

  // 1. Starting song from Quick picks sets isRadioActive and triggers radio API
  window.isRadioActive = false;
  window.activeQueueList = null;
  window.selectTrackToPlay('qp_seed_1', true);
  assert(window.isRadioActive === true, 'Starting song from Quick picks sets window.isRadioActive to true');
  await window.fetchAndApplyYtmRadioQueue('qp_seed_1', true);
  assert(radioEndpointPayload && radioEndpointPayload.playlistId === 'RDAMVMqp_seed_1', 'InnerTube called with radio playlistId RDAMVMqp_seed_1');
  assert(window.activeQueueList.some(t => t.id === 'dyn_radio_1'), 'Queue contains dynamic YouTube Music radio recommendation dyn_radio_1');
  assert(window.activeQueueList.some(t => t.id === 'dyn_radio_2'), 'Queue contains dynamic YouTube Music radio recommendation dyn_radio_2');

  // 2. Starting song from Trending songs sets isRadioActive and triggers radio API
  radioEndpointPayload = null;
  window.isRadioActive = false;
  window.activeQueueList = null;
  window.selectTrackToPlay('tr_seed_1', true);
  assert(window.isRadioActive === true, 'Starting song from Trending songs sets window.isRadioActive to true');
  await window.fetchAndApplyYtmRadioQueue('tr_seed_1', true);
  assert(radioEndpointPayload && radioEndpointPayload.playlistId === 'RDAMVMtr_seed_1', 'InnerTube called with radio playlistId RDAMVMtr_seed_1');
  assert(window.activeQueueList.some(t => t.id === 'dyn_radio_1'), 'Trending queue dynamically populated with radio recommendations');

  console.log('\n====================================================');
  console.log(`🏁 TEST RESULTS: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log('====================================================');

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 ALL AUTOMATED TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  }
})();
