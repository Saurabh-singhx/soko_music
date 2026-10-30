// Configuration constants and storage keys
const MAX_ALLOWED_DURATION_SECONDS = 600; // 10 minutes maximum
const CHARTS_PER_PAGE = 20;
const LIBRARY_PER_PAGE = 25;

const STORAGE_KEY_DOWNLOADED_IDS = 'soko_downloaded_ids_v2';
const STORAGE_KEY_CUSTOM_TRACKS = 'soko_custom_tracks_v2';
const STORAGE_KEY_PLAYLISTS = 'soko_user_playlists_v2';
const STORAGE_KEY_MAX_CACHE = 'soko_max_cache_gb_v2';
const STORAGE_KEY_LAST_PLAYED = 'soko_last_played_track_v1';

const CURATED_MIXES = [
  {
    id: 'mix_supermix',
    videoId: 'kPa7bsKwL-c',
    playlistId: 'RDAMVMkPa7bsKwL-c',
    title: 'My Supermix',
    subtitle: 'Infinite Personalized Mix',
    cover: 'https://i.ytimg.com/vi/kPa7bsKwL-c/hqdefault.jpg',
    badge: 'Supermix',
    gradient: 'linear-gradient(135deg, #FF0055, #7A00FF)',
    songIds: ['kPa7bsKwL-c']
  },
  {
    id: 'mix_discover',
    videoId: 'yJg-Y5byMMw',
    playlistId: 'RDAMVMyJg-Y5byMMw',
    title: 'Discover Mix',
    subtitle: 'Updated Weekly • Fresh Picks',
    cover: 'https://i.ytimg.com/vi/yJg-Y5byMMw/hqdefault.jpg',
    badge: 'Discover',
    gradient: 'linear-gradient(135deg, #00C6FF, #0072FF)',
    songIds: ['yJg-Y5byMMw']
  },
  {
    id: 'mix_chill',
    videoId: '2Vv-BfVoq4g',
    playlistId: 'RDAMVM2Vv-BfVoq4g',
    title: 'Chill Mix',
    subtitle: 'Mellow Acoustics & Lo-Fi',
    cover: 'https://i.ytimg.com/vi/2Vv-BfVoq4g/hqdefault.jpg',
    badge: 'Chill',
    gradient: 'linear-gradient(135deg, #43E97B, #38F9D7)',
    songIds: ['2Vv-BfVoq4g']
  },
  {
    id: 'mix_energy',
    videoId: 'fJ9rUzIMcZQ',
    playlistId: 'RDAMVMfJ9rUzIMcZQ',
    title: 'Energy Mix',
    subtitle: 'High Tempo & Workout Hype',
    cover: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg',
    badge: 'Energy',
    gradient: 'linear-gradient(135deg, #FA709A, #FEE140)',
    songIds: ['fJ9rUzIMcZQ']
  },
  {
    id: 'mix_focus',
    videoId: 'hT_nvWreIhg',
    playlistId: 'RDAMVMhT_nvWreIhg',
    title: 'Focus Mix',
    subtitle: 'Deep Work & Concentration',
    cover: 'https://i.ytimg.com/vi/hT_nvWreIhg/hqdefault.jpg',
    badge: 'Focus',
    gradient: 'linear-gradient(135deg, #667EEA, #764BA2)',
    songIds: ['hT_nvWreIhg']
  },
  {
    id: 'mix_forgotten',
    videoId: '4NRXx6U8ABQ',
    playlistId: 'RDAMVM4NRXx6U8ABQ',
    title: 'Forgotten Favorites Mix',
    subtitle: 'Timeless Throwbacks',
    cover: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    badge: 'Favorites',
    gradient: 'linear-gradient(135deg, #F83600, #F9D423)',
    songIds: ['4NRXx6U8ABQ']
  }
];

// Attach to window
window.MAX_ALLOWED_DURATION_SECONDS = MAX_ALLOWED_DURATION_SECONDS;
window.CHARTS_PER_PAGE = CHARTS_PER_PAGE;
window.LIBRARY_PER_PAGE = LIBRARY_PER_PAGE;
window.STORAGE_KEY_DOWNLOADED_IDS = STORAGE_KEY_DOWNLOADED_IDS;
window.STORAGE_KEY_CUSTOM_TRACKS = STORAGE_KEY_CUSTOM_TRACKS;
window.STORAGE_KEY_PLAYLISTS = STORAGE_KEY_PLAYLISTS;
window.STORAGE_KEY_MAX_CACHE = STORAGE_KEY_MAX_CACHE;
window.STORAGE_KEY_LAST_PLAYED = STORAGE_KEY_LAST_PLAYED;
window.CURATED_MIXES = CURATED_MIXES;
