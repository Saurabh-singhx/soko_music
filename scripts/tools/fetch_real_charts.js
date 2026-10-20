const https = require('https');
const fs = require('fs');
const path = require('path');

function callApi(endpoint, payload) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(payload);
    const req = https.request({
      hostname: 'music.youtube.com',
      path: '/' + endpoint + '?prettyPrint=false',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://music.youtube.com'
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.write(postData);
    req.end();
  });
}

function findResponsiveItems(obj, out = []) {
  if (!obj || typeof obj !== 'object') return out;
  if (obj.musicResponsiveListItemRenderer) {
    out.push(obj.musicResponsiveListItemRenderer);
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) findResponsiveItems(obj[i], out);
  } else {
    for (const k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        findResponsiveItems(obj[k], out);
      }
    }
  }
  return out;
}

function extractVideoId(obj) {
  if (!obj || typeof obj !== 'object') return null;
  if (obj.watchEndpoint?.videoId && typeof obj.watchEndpoint.videoId === 'string' && obj.watchEndpoint.videoId.length === 11) {
    return obj.watchEndpoint.videoId;
  }
  if (obj.videoId && typeof obj.videoId === 'string' && obj.videoId.length === 11) {
    return obj.videoId;
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const r = extractVideoId(obj[i]);
      if (r) return r;
    }
  } else {
    for (const k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        const r = extractVideoId(obj[k]);
        if (r) return r;
      }
    }
  }
  return null;
}

async function searchTracks(query, regionGl = 'US') {
  const payload = {
    context: {
      client: {
        clientName: 'WEB_REMIX',
        clientVersion: '1.20240101.01.00',
        hl: 'en',
        gl: regionGl
      }
    },
    query: query
  };
  const data = await callApi('youtubei/v1/search', payload);
  const items = findResponsiveItems(data);
  const list = [];
  for (const item of items) {
    const vid = extractVideoId(item);
    if (!vid) continue;
    const cols = item.flexColumns || [];
    if (cols.length === 0) continue;
    const col0 = cols[0]?.musicResponsiveListItemFlexColumnRenderer;
    const tRuns = col0?.text?.runs || col0?.title?.runs || [];
    const title = tRuns[0]?.text || '';
    if (!title) continue;
    let artist = 'Various Artists';
    if (cols.length > 1) {
      const col1 = cols[1]?.musicResponsiveListItemFlexColumnRenderer;
      const aRuns = col1?.text?.runs || col1?.title?.runs || [];
      const candidates = aRuns.map(r => r.text?.trim()).filter(t => t && t !== '•' && t !== 'Song' && t !== 'Video' && t !== 'Album' && t !== 'Single');
      if (candidates.length > 0) artist = candidates[0];
    }
    const thumbs = item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
    const cover = thumbs.length > 0 ? thumbs[thumbs.length - 1].url : `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
    list.push({ id: vid, title, artist, cover, duration: 215 });
  }
  return list;
}

async function buildRegionTracks(queries, gl) {
  const map = new Map();
  for (const q of queries) {
    console.log(`Searching for "${q}" [${gl}]...`);
    const results = await searchTracks(q, gl);
    for (const t of results) {
      if (!map.has(t.id)) {
        map.set(t.id, t);
      }
    }
    console.log(`  Current pool: ${map.size}`);
    if (map.size >= 100) break;
  }
  return Array.from(map.values()).slice(0, 100);
}

async function main() {
  const globalQueries = [
    'Top Hits Global 2024', 'Billboard Hot 100', 'Global Viral Hits',
    'Pop Hits 2024', 'Today Top Hits', 'Global Dance Hits',
    'Trending Songs Global', 'Hit Music 2024'
  ];
  const indiaQueries = [
    'Bollywood Top 50', 'Latest Hindi Hits 2024', 'Punjabi Top Hits 2024',
    'Arijit Singh Hits', 'Trending India Songs', 'India Viral 50',
    'South Indian Hits', 'Bollywood Dance Hits'
  ];
  const usQueries = [
    'US Top 50 Songs', 'Billboard Top Hits', 'American Pop Hits',
    'Rap Top Hits 2024', 'Country Hits 2024', 'Today Top Hits US',
    'Hip Hop Hits 2024', 'Top Billboard 2024'
  ];
  const ukQueries = [
    'UK Top 40 Hits 2024', 'Official UK Chart', 'British Pop Hits',
    'UK Dance Hits 2024', 'Ed Sheeran Dua Lipa', 'UK Viral Top',
    'London Hits 2024', 'Top British Songs'
  ];

  const charts = {};
  console.log('=== Collecting Global Tracks ===');
  charts['Global'] = await buildRegionTracks(globalQueries, 'US');
  console.log('=== Collecting India Tracks ===');
  charts['India'] = await buildRegionTracks(indiaQueries, 'IN');
  console.log('=== Collecting US Tracks ===');
  charts['United States'] = await buildRegionTracks(usQueries, 'US');
  console.log('=== Collecting UK Tracks ===');
  charts['United Kingdom'] = await buildRegionTracks(ukQueries, 'GB');

  console.log('\nCounts:', {
    Global: charts['Global'].length,
    India: charts['India'].length,
    US: charts['United States'].length,
    UK: charts['United Kingdom'].length
  });

  const outPath = path.resolve(__dirname, '../assets/regional_charts.json');
  fs.writeFileSync(outPath, JSON.stringify(charts, null, 2), 'utf8');
  console.log('Saved genuine charts to:', outPath);
}

main();
