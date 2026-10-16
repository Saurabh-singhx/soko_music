# Architecture: Audio & Playback Engine

> **Objective**: Bit-perfect, seekable audio playback utilizing native OS decoders (ExoPlayer / Media3 / HTML5 Audio) with lock-screen media controls and low-power hardware offloading.

---

## 1. Format Selection: Why 160 kbps Opus (Format 251)?

YouTube delivers two primary audio-only streams:
- **Format 251 (Opus / WebM)**: ~160 kbps VBR (Variable Bitrate), 48 kHz stereo.
- **Format 140 (AAC / MP4)**: ~128 kbps CBR (Constant Bitrate), 44.1 kHz stereo.

Soko Music prioritizes **Format 251 Opus**:
- Opus matches or exceeds the acoustic transparency of 256–320 kbps MP3 while using ~40% less bandwidth and disk storage (~3.2 MB per 3.5 minute track).
- Modern Android devices (Android 5.0+) decode Opus in hardware DSPs with virtually zero battery impact.

---

## 2. Lock-Screen MediaSession Integration

The playback engine binds to Android's native `MediaSessionManager`:

```javascript
if ('mediaSession' in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: 'Soko Music Library',
    artwork: [
      { src: track.coverUrl, sizes: '512x512', type: 'image/jpeg' }
    ]
  });

  navigator.mediaSession.setActionHandler('play', () => player.play());
  navigator.mediaSession.setActionHandler('pause', () => player.pause());
  navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
  navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
  navigator.mediaSession.setActionHandler('seekto', (details) => {
    if (details.seekTime) player.currentTime = details.seekTime;
  });
}
```

---

## 3. Audio Equalizer & Crossfade Engine

- **Crossfade**: Smooth 1.5s volume ramp-down and ramp-up when transitioning between tracks.
- **Equalizer**: 5-band WebAudio BiquadFilter node chain (Bass 60Hz, Mid-Low 250Hz, Mid 1kHz, Mid-High 4kHz, Treble 12kHz) with custom presets (Bass Boost, Vocal, Electronic, Flat).
