const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Starting Real Live Regional Charts Unit Tests...');

// Setup browser-like environment
const sandbox = {
  window: {},
  document: {
    getElementById: (id) => null,
    querySelectorAll: (sel) => []
  },
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  fetch: null,
  CATALOG: [],
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  }
};
sandbox.window = sandbox;
sandbox.self = sandbox;

vm.createContext(sandbox);

// Load dependencies in order
const filesToLoad = [
  'apps/mobile/js/config/constants.js',
  'apps/mobile/js/utils/duration.js',
  'apps/mobile/js/utils/text.js',
  'apps/mobile/js/utils/filter.js',
  'apps/mobile/js/data/regional_charts.js',
  'apps/mobile/js/api/innertube.js',
  'apps/mobile/js/api/browse_parser.js',
  'apps/mobile/js/api/playlist.js',
  'apps/mobile/js/api/browse.js'
];

for (const f of filesToLoad) {
  const code = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  vm.runInContext(code, sandbox);
}

// ------------------------------------------------------------
// Test 1: Initial state verification
// ------------------------------------------------------------
console.log('\n--- Test 1: Initial Regional Charts State ---');
assert(typeof sandbox.window.REGIONAL_CHARTS === 'object', 'REGIONAL_CHARTS is defined');
const expectedRegions = ['Global', 'India', 'United States', 'United Kingdom'];
for (const reg of expectedRegions) {
  assert(Array.isArray(sandbox.window.REGIONAL_CHARTS[reg]), `Region ${reg} is an array`);
  assert(sandbox.window.REGIONAL_CHARTS[reg].length === 0, `Region ${reg} starts with 0 hardcoded tracks`);
}
assert(typeof sandbox.window.fetchRealCharts === 'function', 'fetchRealCharts function is exposed on window');
assert(typeof sandbox.window.fetchLiveRegionalCharts === 'function', 'fetchLiveRegionalCharts is exposed on window');
console.log('✓ Test 1 Passed: Initial state is clean with 0 hardcoded tracks');

// ------------------------------------------------------------
// Test 2: Canonical Region Normalization
// ------------------------------------------------------------
console.log('\n--- Test 2: Canonical Region Normalization ---');
const canon = sandbox.window.getCanonicalChartRegion;
assert.strictEqual(canon('global'), 'Global');
assert.strictEqual(canon('ZZ'), 'Global');
assert.strictEqual(canon('in'), 'India');
assert.strictEqual(canon('united states'), 'United States');
assert.strictEqual(canon('US'), 'United States');
assert.strictEqual(canon('uk'), 'United Kingdom');
assert.strictEqual(canon('gb'), 'United Kingdom');
assert.strictEqual(canon('canada'), 'Canada');
console.log('✓ Test 2 Passed: Region normalization works accurately');

// ------------------------------------------------------------
// Test 3: Live Charts Fetching with InnerTube API Mock
// ------------------------------------------------------------
console.log('\n--- Test 3: Live Charts Fetching & Parsing ---');

const mockBrowseResponse = {
  contents: {
    twoColumnBrowseResultsRenderer: {
      secondaryContents: {
        sectionListRenderer: {
          contents: [
            {
              musicPlaylistShelfRenderer: {
                contents: [
                  {
                    musicResponsiveListItemRenderer: {
                      playlistItemData: { videoId: 'track_1' },
                      flexColumns: [
                        {
                          musicResponsiveListItemFlexColumnRenderer: {
                            text: { runs: [{ text: 'Song One' }] }
                          }
                        },
                        {
                          musicResponsiveListItemFlexColumnRenderer: {
                            text: { runs: [{ text: 'Artist A' }, { text: ' • ' }, { text: 'Single' }, { text: ' • ' }, { text: '10M views' }] }
                          }
                        }
                      ],
                      thumbnail: {
                        musicThumbnailRenderer: {
                          thumbnail: {
                            thumbnails: [
                              { url: 'https://lh3.googleusercontent.com/test=w120-h120', width: 120, height: 120 },
                              { url: 'https://lh3.googleusercontent.com/test=w544-h544', width: 544, height: 544 }
                            ]
                          }
                        }
                      },
                      fixedColumns: [
                        {
                          musicResponsiveListItemFixedColumnRenderer: {
                            text: { runs: [{ text: '3:45' }] }
                          }
                        }
                      ]
                    }
                  },
                  {
                    // Podcast item should be filtered out
                    musicResponsiveListItemRenderer: {
                      playlistItemData: { videoId: 'podcast_item' },
                      flexColumns: [
                        {
                          musicResponsiveListItemFlexColumnRenderer: {
                            text: { runs: [{ text: 'Podcast Episode 99' }] }
                          }
                        },
                        {
                          musicResponsiveListItemFlexColumnRenderer: {
                            text: { runs: [{ text: 'Podcast Host • Episode' }] }
                          }
                        }
                      ],
                      fixedColumns: [
                        {
                          musicResponsiveListItemFixedColumnRenderer: {
                            text: { runs: [{ text: '45:00' }] }
                          }
                        }
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
  }
};

let apiCalls = 0;
sandbox.window.callInnerTubeApi = async function(endpoint, payload) {
  apiCalls++;
  return mockBrowseResponse;
};

(async () => {
  const tracks = await sandbox.window.fetchRealCharts('Global');
  assert(Array.isArray(tracks), 'Returns an array of tracks');
  assert.strictEqual(tracks.length, 1, 'Podcast track was excluded, 1 song returned');
  assert.strictEqual(tracks[0].id, 'track_1');
  assert.strictEqual(tracks[0].title, 'Song One');
  assert.strictEqual(tracks[0].artist, 'Artist A');
  assert.strictEqual(tracks[0].duration, 225); // 3*60 + 45 = 225s
  assert(tracks[0].cover.includes('=w800-h800'), 'Cover artwork was upgraded to high-res (w800)');
  assert(sandbox.window.REGIONAL_CHARTS['Global'].length === 1, 'REGIONAL_CHARTS[Global] was populated');
  assert(sandbox.localStorage.getItem('soko_cached_charts_Global'), 'Charts saved to localStorage cache');

  console.log('✓ Test 3 Passed: Live chart fetch, parsing, and filtering verified');

  // ------------------------------------------------------------
  // Test 4: In-Memory & LocalStorage Cache
  // ------------------------------------------------------------
  console.log('\n--- Test 4: Cache vs forceRefresh ---');
  const cachedCallsBefore = apiCalls;
  const cachedTracks = await sandbox.window.fetchRealCharts('Global', false);
  assert.strictEqual(apiCalls, cachedCallsBefore, 'Cache hit did not call InnerTube API');
  assert.strictEqual(cachedTracks.length, 1);

  // Force refresh
  await sandbox.window.fetchRealCharts('Global', true);
  assert.strictEqual(apiCalls, cachedCallsBefore + 1, 'forceRefresh=true bypassed cache and called API');
  console.log('✓ Test 4 Passed: Cache behavior and forceRefresh verified');

  // ------------------------------------------------------------
  // Test 5: Offline Fallback
  // ------------------------------------------------------------
  console.log('\n--- Test 5: Offline Fallback ---');
  // Wipe in-memory charts
  sandbox.window.REGIONAL_CHARTS['Global'] = [];
  // Simulate network failure
  sandbox.window.callInnerTubeApi = async function() {
    throw new Error('Network error (offline)');
  };

  const offlineTracks = await sandbox.window.fetchRealCharts('Global', false);
  assert(offlineTracks.length === 1, 'Recovered tracks from localStorage cache when offline');
  assert.strictEqual(offlineTracks[0].id, 'track_1');

  // Test non-cached region offline
  const nonCachedOffline = await sandbox.window.fetchRealCharts('India', false);
  assert(Array.isArray(nonCachedOffline) && nonCachedOffline.length === 0, 'Returns clean empty array when no cache exists');
  console.log('✓ Test 5 Passed: Offline fallback is graceful and resilient');

  console.log('\n====================================================');
  console.log('🎉 ALL REAL LIVE REGIONAL CHARTS TESTS PASSED!');
  console.log('====================================================');
})().catch(err => {
  console.error('✗ TEST FAILED:', err);
  process.exit(1);
});
