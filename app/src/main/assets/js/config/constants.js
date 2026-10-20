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
    title: 'My Supermix',
    subtitle: 'Infinite Personalized Mix',
    badge: 'Supermix',
    gradient: 'linear-gradient(135deg, #FF0055, #7A00FF)',
    songIds: ['kPa7bsKwL-c', 'yJg-Y5byMMw', '4HVhnhpJxr0', 'EW9opRK1MPk', 'XI3JGDHduR4', 'ZCRL8V0ZkEA']
  },
  {
    id: 'mix_discover',
    title: 'Discover Mix',
    subtitle: 'Updated Weekly • Fresh Picks',
    badge: 'Discover',
    gradient: 'linear-gradient(135deg, #00C6FF, #0072FF)',
    songIds: ['s_SN6KDYjKY', 'S4uPiw9rnbY', '7Fq2ArrUU9c', '8TfP90KODxo', 'jLHyFkCKEzg']
  },
  {
    id: 'mix_chill',
    title: 'Chill Mix',
    subtitle: 'Mellow Acoustics & Lo-Fi',
    badge: 'Chill',
    gradient: 'linear-gradient(135deg, #43E97B, #38F9D7)',
    songIds: ['4HVhnhpJxr0', 'Io_Z3HxgJGs', 'ZUL-ivsl_Fs', 'Qo4-4388R3g', 'tXi15CFnFws']
  },
  {
    id: 'mix_energy',
    title: 'Energy Mix',
    subtitle: 'High Tempo & Workout Hype',
    badge: 'Energy',
    gradient: 'linear-gradient(135deg, #FA709A, #FEE140)',
    songIds: ['yJg-Y5byMMw', 'XI3JGDHduR4', 'cK9h5PVzRpk', 'iKopExw_3Zg', 'ppcVqfsekIs']
  },
  {
    id: 'mix_focus',
    title: 'Focus Mix',
    subtitle: 'Instrumental Concentration',
    badge: 'Focus',
    gradient: 'linear-gradient(135deg, #667EEA, #764BA2)',
    songIds: ['EW9opRK1MPk', 'ZCRL8V0ZkEA', 'yiJ5k2vBtlw', 'SxkHNou0uiM', '4HVhnhpJxr0']
  },
  {
    id: 'mix_forgotten',
    title: 'Forgotten Favorites Mix',
    subtitle: 'Timeless Throwbacks',
    badge: 'Favorites',
    gradient: 'linear-gradient(135deg, #F83600, #F9D423)',
    songIds: ['Io_Z3HxgJGs', 'ZUL-ivsl_Fs', '4HVhnhpJxr0', 'EW9opRK1MPk', 'kPa7bsKwL-c']
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
