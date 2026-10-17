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

// Read index.html and extract JavaScript
const html = fs.readFileSync(path.join(__dirname, '../apps/mobile/index.html'), 'utf8');
const scriptMatch = html.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/i);
if (!scriptMatch) {
  console.error('FAIL: No script tag found in apps/mobile/index.html');
  process.exit(1);
}
const jsCode = scriptMatch[1] + `
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
Object.defineProperty(window, 'currentTrack', { get: () => currentTrack, set: (v) => { currentTrack = v; } });
Object.defineProperty(window, 'isOnlineYtPlaying', { get: () => isOnlineYtPlaying, set: (v) => { isOnlineYtPlaying = v; } });
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
// TEST SUITE 1: 100-Song Regional Charts & Pagination
// ------------------------------------------------------------
console.log('\n--- Test Suite 1: 100-Song Regional Charts & Pagination ---');
assert(typeof window.REGIONAL_CHARTS === 'object', 'REGIONAL_CHARTS is defined');
const regions = ['Global', 'India', 'United States', 'United Kingdom'];
regions.forEach(reg => {
  assert(Array.isArray(window.REGIONAL_CHARTS[reg]), `Region ${reg} is an array`);
  assert(window.REGIONAL_CHARTS[reg].length === 100, `Region ${reg} has exactly 100 tracks (actual: ${window.REGIONAL_CHARTS[reg].length})`);
  const sample = window.REGIONAL_CHARTS[reg][0];
  assert(sample && sample.id && sample.id.length === 11, `Region ${reg} track 0 has authentic 11-char YouTube ID: ${sample.id}`);
  assert(sample.cover && sample.cover.includes('i.ytimg.com'), `Region ${reg} track 0 has YouTube album art: ${sample.cover}`);
});

// Test Pagination
window.renderCharts('Global', 1);
const chartsListEl = getEl('chartsTrackList');
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
assert(window.currentTrack.title === 'Tauba Tauba', 'Current track title is "Tauba Tauba"');
assert(window.isOnlineYtPlaying === true, 'isOnlineYtPlaying is TRUE for online track');
const ytWrapper = getEl('ytOnlinePlayerWrapper');
assert(ytWrapper.innerHTML.includes('yJg-Y5byMMw'), 'YouTube player is loaded with exact video ID yJg-Y5byMMw (zero wrong song hashing)');

// Test 2B: Clicking another online track ("Die With A Smile", ID: kPa7bsKwL-c)
console.log('Testing click on another online track (Die With A Smile, kPa7bsKwL-c)...');
window.selectTrackToPlay('kPa7bsKwL-c');
assert(window.currentTrack.id === 'kPa7bsKwL-c', 'Current track ID is kPa7bsKwL-c');
assert(window.isOnlineYtPlaying === true, 'isOnlineYtPlaying is TRUE');
assert(ytWrapper.innerHTML.includes('kPa7bsKwL-c'), 'YouTube player loaded exact video ID kPa7bsKwL-c');

// Test 2C: Clicking a local offline bundled track ("Gale Lag Ja", ID: 4HVhnhpJxr0)
console.log('Testing click on local bundled track (Gale Lag Ja, 4HVhnhpJxr0)...');
window.selectTrackToPlay('4HVhnhpJxr0');
assert(window.currentTrack.id === '4HVhnhpJxr0', 'Current track ID is 4HVhnhpJxr0');
assert(window.isOnlineYtPlaying === false, 'isOnlineYtPlaying is FALSE for local offline track');

// ------------------------------------------------------------
// TEST SUITE 3: Persistent Storage & Cache Retention
// ------------------------------------------------------------
console.log('\n--- Test Suite 3: Persistent Storage Engine (Surviving Process Kills) ---');

const initialOfflineCount = window.downloadedSet.size;
assert(initialOfflineCount === 16, `Initial downloadedSet has 16 bundled tracks (actual: ${initialOfflineCount})`);

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
assert(storageStatsEl.innerText.includes('17 real songs'), `Storage metrics accurately shows 17 songs (actual: "${storageStatsEl.innerText}")`);

// SIMULATE APP CLEAR / FORCE STOP / REBOOT
console.log('\nSimulating App Force Close & Restart (wiping in-memory state)...');
window.downloadedSet.clear();
// Reset to only bundled 16
window.BUNDLED_TRACKS.forEach(b => window.downloadedSet.add(b.id));
assert(window.downloadedSet.has('kPa7bsKwL-c') === false, 'In-memory state reset (simulating kill)');

// Call initPersistentStorage() on app launch
console.log('App Launching: executing initPersistentStorage()...');
window.initPersistentStorage();

// Verify rehydration
assert(window.downloadedSet.has('kPa7bsKwL-c') === true, 'downloadedSet restored kPa7bsKwL-c from persistent storage');
assert(window.downloadedSet.size === 17, `downloadedSet size is 17 (does NOT reset to hardcoded size)`);

window.updateStorageMetrics();
assert(storageStatsEl.innerText.includes('17 real songs'), `Post-restart metrics retains all 17 downloaded tracks: "${storageStatsEl.innerText}"`);

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

console.log('\n====================================================');
console.log(`🏁 TEST RESULTS: ${testsPassed} Passed, ${testsFailed} Failed`);
console.log('====================================================');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL AUTOMATED TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}
