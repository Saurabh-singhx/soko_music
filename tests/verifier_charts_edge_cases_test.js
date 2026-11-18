/**
 * Verifier Independent Edge Case & Comprehensive Verification Suite
 * Verifies:
 * 1. Zero hardcoded songs in initial state
 * 2. Real dynamic chart fetching & regional parsing
 * 3. Cache bypassing via refresh button / forceRefresh
 * 4. 100-song pagination across pages 1 to 5
 * 5. Edge cases: Offline with cache, Offline without cache, Empty response, Malformed response
 * 6. High-res artwork upgrader
 * 7. Asset parity between apps/mobile and app/src/main/assets
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

console.log('🧪 Running Verifier Deep Verification & Edge Case Suite...');

// --- 1. Asset Parity Check ---
console.log('\n--- Check 1: File Synchronization Parity ---');
const filesToCompare = [
  ['apps/mobile/js/data/regional_charts.js', 'app/src/main/assets/js/data/regional_charts.js'],
  ['apps/mobile/js/api/browse.js', 'app/src/main/assets/js/api/browse.js'],
  ['apps/mobile/js/ui/charts.js', 'app/src/main/assets/js/ui/charts.js'],
  ['apps/mobile/index.html', 'app/src/main/assets/index.html']
];

for (const [f1, f2] of filesToCompare) {
  const p1 = path.join(__dirname, '..', f1);
  const p2 = path.join(__dirname, '..', f2);
  assert(fs.existsSync(p1), `Source file exists: ${f1}`);
  assert(fs.existsSync(p2), `Asset file exists: ${f2}`);
  const content1 = fs.readFileSync(p1, 'utf8');
  const content2 = fs.readFileSync(p2, 'utf8');
  assert.strictEqual(content1, content2, `Exact parity verified between ${f1} and ${f2}`);
}
console.log('✓ Check 1 Passed: All modified mobile files and Android assets are 100% in sync');

// --- 2. Zero Hardcoded Tracks Check ---
console.log('\n--- Check 2: Zero Hardcoded Tracks Verification ---');
const rawRegionalCharts = fs.readFileSync(path.join(__dirname, '../apps/mobile/js/data/regional_charts.js'), 'utf8');
const testSandbox = { window: {} };
vm.createContext(testSandbox);
vm.runInContext(rawRegionalCharts, testSandbox);

assert(typeof testSandbox.window.REGIONAL_CHARTS === 'object', 'REGIONAL_CHARTS object is defined');
const initialRegions = ['Global', 'India', 'United States', 'United Kingdom'];
for (const reg of initialRegions) {
  assert(Array.isArray(testSandbox.window.REGIONAL_CHARTS[reg]), `${reg} is an array`);
  assert.strictEqual(testSandbox.window.REGIONAL_CHARTS[reg].length, 0, `${reg} starts with zero tracks`);
}
console.log('✓ Check 2 Passed: Zero hardcoded tracks exist in initial REGIONAL_CHARTS');

// --- 3. DOM & UI Environment Simulation ---
console.log('\n--- Check 3: Full Lifecycle, Refresh, Pagination & Edge Cases ---');

function createMockElement(id, tag = 'div') {
  return {
    id,
    tagName: tag.toUpperCase(),
    innerText: '',
    innerHTML: '',
    value: '',
    disabled: false,
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
    getAttribute: function(attr) {
      if (attr === 'data-region') return this._dataRegion || null;
      return null;
    },
    setAttribute: function(attr, val) {
      if (attr === 'data-region') this._dataRegion = val;
    },
    addEventListener: () => {},
    scrollIntoView: () => {},
    parentNode: { insertBefore: () => {} }
  };
}

const mockElements = {};
function getEl(id) {
  if (!mockElements[id]) mockElements[id] = createMockElement(id);
  return mockElements[id];
}

const filterPills = [
  { ...createMockElement('pill_global'), innerText: 'Global', _dataRegion: 'Global' },
  { ...createMockElement('pill_us'), innerText: 'United States', _dataRegion: 'United States' },
  { ...createMockElement('pill_in'), innerText: 'India', _dataRegion: 'India' },
  { ...createMockElement('pill_uk'), innerText: 'United Kingdom', _dataRegion: 'United Kingdom' }
];

const mockDoc = {
  getElementById: (id) => getEl(id),
  querySelectorAll: (sel) => {
    if (sel.includes('.filter-pill')) return filterPills;
    return [];
  },
  querySelector: (sel) => getEl('mock_' + sel),
  createElement: (tag) => createMockElement('created_' + Math.random(), tag),
  body: createMockElement('body', 'body')
};

const mockStorage = {};
const recordedToasts = [];
const env = {
  window: {},
  document: mockDoc,
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  localStorage: {
    getItem: (k) => (k in mockStorage ? mockStorage[k] : null),
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; },
    clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
  },
  showToast: (msg, icon) => recordedToasts.push({ msg, icon }),
  CATALOG: [],
  isTrackOffline: () => false,
  activeDownloads: new Set(),
  formatTime: (sec) => `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`,
  isPodcastOrLongTrack: (t) => t.duration > 600
};
env.window = env;
env.self = env;
vm.createContext(env);

// Load all required app scripts
const loadScripts = [
  'apps/mobile/js/config/constants.js',
  'apps/mobile/js/utils/duration.js',
  'apps/mobile/js/utils/text.js',
  'apps/mobile/js/utils/filter.js',
  'apps/mobile/js/data/regional_charts.js',
  'apps/mobile/js/api/innertube.js',
  'apps/mobile/js/api/browse_parser.js',
  'apps/mobile/js/api/playlist.js',
  'apps/mobile/js/api/browse.js',
  'apps/mobile/js/ui/charts.js'
];

for (const s of loadScripts) {
  const code = fs.readFileSync(path.join(__dirname, '..', s), 'utf8');
  vm.runInContext(code, env);
}

(async () => {
  // Edge Case A: Empty API response
  console.log('Testing Edge Case A: Empty InnerTube API Response...');
  env.window.callInnerTubeApi = async () => ({ contents: {} });
  const emptyRes = await env.window.fetchRealCharts('India', true);
  assert(Array.isArray(emptyRes), 'Empty response returns array');
  assert.strictEqual(emptyRes.length, 0, 'No tracks created on empty response');

  // Edge Case B: Malformed API response (missing nested arrays)
  console.log('Testing Edge Case B: Malformed InnerTube Response...');
  env.window.callInnerTubeApi = async () => ({
    contents: {
      twoColumnBrowseResultsRenderer: {
        secondaryContents: {
          sectionListRenderer: {
            contents: [{ musicPlaylistShelfRenderer: { contents: [{ brokenRenderer: true }] } }]
          }
        }
      }
    }
  });
  const malformedRes = await env.window.fetchRealCharts('United States', true);
  assert(Array.isArray(malformedRes) && malformedRes.length === 0, 'Gracefully handles malformed item objects');

  // Edge Case C: Valid 100-Track Payload with High-Res Thumbnail Selection
  console.log('Testing Edge Case C: 100-Track Live Feed with Artwork Upgrade & Podcast Filter...');
  const generateMockItem = (index) => ({
    musicResponsiveListItemRenderer: {
      playlistItemData: { videoId: `track_${index}` },
      flexColumns: [
        {
          musicResponsiveListItemFlexColumnRenderer: {
            text: { runs: [{ text: `Real Chart Song ${index}` }] }
          }
        },
        {
          musicResponsiveListItemFlexColumnRenderer: {
            text: { runs: [{ text: `Superstar Artist ${index}` }, { text: ' • ' }, { text: 'Single' }] }
          }
        }
      ],
      thumbnail: {
        musicThumbnailRenderer: {
          thumbnail: {
            thumbnails: [
              { url: `https://lh3.googleusercontent.com/song_${index}=w60-h60`, width: 60, height: 60 },
              { url: `https://lh3.googleusercontent.com/song_${index}=w120-h120`, width: 120, height: 120 },
              { url: `https://lh3.googleusercontent.com/song_${index}=w544-h544`, width: 544, height: 544 }
            ]
          }
        }
      },
      fixedColumns: [
        {
          musicResponsiveListItemFixedColumnRenderer: {
            text: { runs: [{ text: index === 99 ? '15:30' : '3:20' }] } // Index 99 is a podcast/long track (>10m)
          }
        }
      ]
    }
  });

  const hundredItems = [];
  for (let i = 1; i <= 101; i++) {
    hundredItems.push(generateMockItem(i));
  }

  env.window.callInnerTubeApi = async () => ({
    contents: {
      twoColumnBrowseResultsRenderer: {
        secondaryContents: {
          sectionListRenderer: {
            contents: [
              {
                musicPlaylistShelfRenderer: { contents: hundredItems }
              }
            ]
          }
        }
      }
    }
  });

  const parsedTracks = await env.window.fetchRealCharts('Global', true);
  assert.strictEqual(parsedTracks.length, 100, 'Exact 100 tracks parsed (long track was filtered out)');
  assert(parsedTracks[0].cover.includes('=w800-h800'), 'Cover artwork upgraded to w800-h800');
  assert.strictEqual(parsedTracks[0].title, 'Real Chart Song 1');
  assert.strictEqual(parsedTracks[0].artist, 'Superstar Artist 1');
  assert.strictEqual(parsedTracks[0].duration, 200);

  // Check 4: UI Rendering and 100-Song Pagination across Pages 1 to 5
  console.log('\n--- Check 4: 100-Song Pagination Across Pages 1 to 5 ---');
  env.renderCharts('Global', 1);
  const trackListEl = getEl('chartsTrackList');
  const paginationEl = getEl('chartsPagination');

  // Page 1
  assert(trackListEl.innerHTML.includes('Real Chart Song 1'), 'Page 1 renders Track 1');
  assert(trackListEl.innerHTML.includes('>1<'), 'Rank 1 badge present');
  assert(trackListEl.innerHTML.includes('Real Chart Song 20'), 'Page 1 renders Track 20');
  assert(!trackListEl.innerHTML.includes('Real Chart Song 21'), 'Page 1 does NOT contain Track 21');
  assert(paginationEl.innerHTML.includes('disabled') || paginationEl.innerHTML.includes('pointer-events: none'), 'Prev button disabled on Page 1');

  // Page 3
  env.setChartPage(3);
  assert(trackListEl.innerHTML.includes('Real Chart Song 41'), 'Page 3 renders Track 41');
  assert(trackListEl.innerHTML.includes('>41<'), 'Rank 41 badge present');
  assert(trackListEl.innerHTML.includes('Real Chart Song 60'), 'Page 3 renders Track 60');

  // Page 5
  env.setChartPage(5);
  assert(trackListEl.innerHTML.includes('Real Chart Song 81'), 'Page 5 renders Track 81');
  assert(trackListEl.innerHTML.includes('Real Chart Song 100'), 'Page 5 renders Track 100');
  assert(paginationEl.innerHTML.includes('disabled') || paginationEl.innerHTML.includes('pointer-events: none'), 'Next button disabled on Page 5');

  // Check 5: Refresh Mechanism & Cache Invalidation
  console.log('\n--- Check 5: Refresh Mechanism & Cache Invalidation ---');
  assert(mockStorage['soko_cached_charts_Global'], 'Storage initially contains cached charts');
  
  const realBrowseFetch = env.window.fetchRealCharts;
  let fetchRealChartsCalledWithForce = false;
  env.window.fetchRealCharts = async (reg, force) => {
    if (force) fetchRealChartsCalledWithForce = true;
    return parsedTracks;
  };

  const refreshPromise = env.refreshCurrentCharts();
  
  // During refresh: icon should have spin-icon and refresh button should be disabled
  const refreshIcon = getEl('chartsRefreshIcon');
  const refreshBtn = getEl('btnRefreshCharts');
  assert(refreshIcon.classList.contains('spin-icon'), 'Spinning animation added to refresh icon');
  assert(refreshBtn.disabled === true, 'Refresh button disabled during refresh');

  await refreshPromise;

  assert(fetchRealChartsCalledWithForce, 'fetchRealCharts called with forceRefresh=true');
  assert(!refreshIcon.classList.contains('spin-icon'), 'Spinning animation removed after refresh');
  assert(refreshBtn.disabled === false, 'Refresh button re-enabled after refresh');
  assert(recordedToasts.some(t => t.msg === 'Refreshing live charts...'), 'Toast displayed to user');

  // Check 6: Offline Resilience
  console.log('\n--- Check 6: Offline Fallback Resilience ---');
  env.window.callInnerTubeApi = async () => {
    throw new Error('Network error (offline)');
  };
  env.window.fetchRealCharts = realBrowseFetch;

  // Clear in-memory
  env.window.REGIONAL_CHARTS['Global'] = [];
  const recoveredOffline = await env.window.fetchRealCharts('Global', false);
  assert.strictEqual(recoveredOffline.length, 100, 'Gracefully recovered 100 songs from cache when offline');

  // Offline without cache
  const nonCachedOffline = await env.window.fetchRealCharts('Australia', false);
  assert(Array.isArray(nonCachedOffline) && nonCachedOffline.length === 0, 'Clean empty array for un-cached region when offline');

  console.log('\n====================================================');
  console.log('🎉 ALL VERIFIER DEEP CHECKS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
})().catch(err => {
  console.error('✗ VERIFIER CHECK FAILED:', err);
  process.exit(1);
});
