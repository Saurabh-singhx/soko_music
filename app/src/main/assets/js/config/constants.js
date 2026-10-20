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
    playlistId: 'RDTMAK5uy_kset8DisdE7LSD4TNJEVnkflThQVSoNys',
    title: 'My Supermix',
    subtitle: 'Infinite Personalized Mix',
    badge: 'Supermix',
    gradient: 'linear-gradient(135deg, #FF0055, #7A00FF)',
    songIds: []
  },
  {
    id: 'mix_discover',
    playlistId: 'RDTMAK5uy_n7FqZ-7aI2b4p-j5eJc5g5h5e',
    title: 'Discover Mix',
    subtitle: 'Updated Weekly • Fresh Picks',
    badge: 'Discover',
    gradient: 'linear-gradient(135deg, #00C6FF, #0072FF)',
    songIds: []
  },
  {
    id: 'mix_chill',
    playlistId: 'RDTMAK5uy_m01Z',
    title: 'Chill Mix',
    subtitle: 'Mellow Acoustics & Lo-Fi',
    badge: 'Chill',
    gradient: 'linear-gradient(135deg, #43E97B, #38F9D7)',
    songIds: []
  },
  {
    id: 'mix_energy',
    playlistId: 'RDTMAK5uy_k23Z',
    title: 'Energy Mix',
    subtitle: 'High Tempo & Workout Hype',
    badge: 'Energy',
    gradient: 'linear-gradient(135deg, #FA709A, #FEE140)',
    songIds: []
  },
  {
    id: 'mix_focus',
    playlistId: 'RDTMAK5uy_l45Z',
    title: 'Focus Mix',
    subtitle: 'Instrumental Concentration',
    badge: 'Focus',
    gradient: 'linear-gradient(135deg, #667EEA, #764BA2)',
    songIds: []
  },
  {
    id: 'mix_forgotten',
    playlistId: 'RDTMAK5uy_f001',
    title: 'Forgotten Favorites Mix',
    subtitle: 'Timeless Throwbacks',
    badge: 'Favorites',
    gradient: 'linear-gradient(135deg, #F83600, #F9D423)',
    songIds: []
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
