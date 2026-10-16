# Architecture: Storage & SQLite Relational Schema

> **Objective**: Dual-tier storage architecture providing sub-millisecond local track retrieval, smart offline playlists, and zero-permission Android file storage.

---

## 1. Storage Tiers

```
Mobile Device
├── Layer 1: App Sandboxed File System (Flash Memory)
│   ├── /music/[id].opus    (Audio binary, ~3–4 MB)
│   └── /music/[id].jpg     (Thumbnail art, ~80 KB)
│
└── Layer 2: Embedded Database (SQLite / IndexedDB)
    ├── Table: downloaded_songs
    ├── Table: play_history
    └── Table: user_playlists
```

---

## 2. Relational Schema & Indexes

```sql
CREATE TABLE IF NOT EXISTS downloaded_songs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    duration INTEGER NOT NULL,
    bitrate TEXT DEFAULT '160k Opus',
    audio_path TEXT NOT NULL,
    cover_path TEXT,
    file_size_bytes INTEGER,
    is_favorite INTEGER DEFAULT 0,
    downloaded_at INTEGER NOT NULL,
    last_played_at INTEGER,
    play_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_songs_play_count ON downloaded_songs(play_count DESC);
CREATE INDEX IF NOT EXISTS idx_songs_last_played ON downloaded_songs(last_played_at DESC);
CREATE INDEX IF NOT EXISTS idx_songs_favorite ON downloaded_songs(is_favorite);

CREATE TABLE IF NOT EXISTS play_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    track_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    listened_duration_seconds INTEGER,
    completed INTEGER DEFAULT 0,
    FOREIGN KEY(track_id) REFERENCES downloaded_songs(id) ON DELETE CASCADE
);
```

---

## 3. LRU Cache Eviction Algorithm

When available storage falls below the user threshold (e.g. 500 MB remaining or total cache exceeds 4 GB):
1. User-favorited tracks (`is_favorite = 1`) are locked and exempt from deletion.
2. The oldest un-favorited song is queried:
   ```sql
   SELECT id, audio_path, cover_path FROM downloaded_songs 
   WHERE is_favorite = 0 
   ORDER BY last_played_at ASC 
   LIMIT 1;
   ```
3. Audio and artwork files are unlinked from disk.
4. The database row is deleted and the in-memory `Set` is updated.
