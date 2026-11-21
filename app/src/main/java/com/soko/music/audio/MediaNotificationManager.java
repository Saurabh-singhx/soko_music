package com.soko.music.audio;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.util.Log;
import android.util.LruCache;
import android.webkit.WebView;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class MediaNotificationManager {
    private static final String TAG = "SokoMusic";
    public static final String MEDIA_CHANNEL_ID = "soko_music_channel_v2";
    public static final int MEDIA_NOTIF_ID = 9101;
    private static final LruCache<String, Bitmap> sArtCache = new LruCache<String, Bitmap>(20);

    private final Activity activity;
    private final WebView webView;
    private AudioEngine audioEngine;
    private MediaSession mediaSession;
    private boolean isReceiverRegistered = false;
    private Bitmap currentAlbumArt = null;
    private String currentCoverUrl = "";

    private final BroadcastReceiver mediaActionReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent == null || intent.getAction() == null) return;
            String action = intent.getAction();
            final String mappedAction;
            if ("com.soko.music.ACTION_TOGGLE".equals(action)) {
                mappedAction = "toggle";
            } else if ("com.soko.music.ACTION_NEXT".equals(action)) {
                mappedAction = "next";
            } else if ("com.soko.music.ACTION_PREV".equals(action)) {
                mappedAction = "prev";
            } else {
                return;
            }
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (webView != null) webView.evaluateJavascript("handleNativeMediaAction('" + mappedAction + "')", null);
                }
            });
        }
    };

    public MediaNotificationManager(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
        createMediaNotificationChannel();
        initMediaSession();
    }

    public void setAudioEngine(AudioEngine audioEngine) {
        this.audioEngine = audioEngine;
    }

    private void createMediaNotificationChannel() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            NotificationManager nm = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                try { nm.deleteNotificationChannel("soko_music_playback"); } catch (Exception ignored) {}
                NotificationChannel channel = new NotificationChannel(
                    MEDIA_CHANNEL_ID,
                    "Soko Music Playback",
                    NotificationManager.IMPORTANCE_LOW
                );
                channel.setDescription("Controls for music playback");
                channel.setShowBadge(false);
                channel.setSound(null, null);
                channel.enableVibration(false);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                nm.createNotificationChannel(channel);
            }
        }
    }

    private void initMediaSession() {
        if (mediaSession != null) return;
        try {
            mediaSession = new MediaSession(activity, "SokoMusicSession");

            Intent contentIntent = new Intent(activity, activity.getClass());
            contentIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (android.os.Build.VERSION.SDK_INT >= 23) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pContent = PendingIntent.getActivity(activity, 0, contentIntent, flags);
            mediaSession.setSessionActivity(pContent);

            mediaSession.setCallback(new MediaSession.Callback() {
                @Override
                public void onPlay() {
                    activity.runOnUiThread(new Runnable() {
                        @Override public void run() { if (webView != null) webView.evaluateJavascript("window.togglePlayPause && window.togglePlayPause()", null); }
                    });
                }
                @Override
                public void onPause() {
                    activity.runOnUiThread(new Runnable() {
                        @Override public void run() { if (webView != null) webView.evaluateJavascript("window.togglePlayPause && window.togglePlayPause()", null); }
                    });
                }
                @Override
                public void onSkipToNext() {
                    activity.runOnUiThread(new Runnable() {
                        @Override public void run() { if (webView != null) webView.evaluateJavascript("window.playNextTrack && window.playNextTrack()", null); }
                    });
                }
                @Override
                public void onSkipToPrevious() {
                    activity.runOnUiThread(new Runnable() {
                        @Override public void run() { if (webView != null) webView.evaluateJavascript("window.playPreviousTrack && window.playPreviousTrack()", null); }
                    });
                }
                @Override
                public void onSeekTo(final long pos) {
                    final int sec = (int) (pos / 1000L);
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (audioEngine != null) {
                                audioEngine.seekNativeAudio(sec);
                            }
                            if (webView != null) {
                                webView.evaluateJavascript("window.seekToSeconds && window.seekToSeconds(" + sec + ")", null);
                            }
                        }
                    });
                }
                @Override
                public void onStop() {
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (audioEngine != null) {
                                audioEngine.stopNativeAudio();
                            }
                        }
                    });
                }
            });
            mediaSession.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS | MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
            mediaSession.setActive(true);
        } catch (Exception e) {
            Log.e(TAG, "MediaSession init error", e);
        }
    }

    public void registerActionReceiver() {
        if (!isReceiverRegistered) {
            IntentFilter filter = new IntentFilter();
            filter.addAction("com.soko.music.ACTION_TOGGLE");
            filter.addAction("com.soko.music.ACTION_NEXT");
            filter.addAction("com.soko.music.ACTION_PREV");
            if (android.os.Build.VERSION.SDK_INT >= 33) {
                activity.registerReceiver(mediaActionReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
            } else {
                activity.registerReceiver(mediaActionReceiver, filter);
            }
            isReceiverRegistered = true;
        }
    }

    public void unregisterActionReceiver() {
        if (isReceiverRegistered) {
            try {
                activity.unregisterReceiver(mediaActionReceiver);
            } catch (Exception ignored) {}
            isReceiverRegistered = false;
        }
    }

    public void updateNotificationAndSession(final String title, final String artist, final boolean isPlaying, final int durationSec, final int positionSec) {
        String cover = (audioEngine != null && !audioEngine.getCurrentCoverUrl().isEmpty())
            ? audioEngine.getCurrentCoverUrl()
            : currentCoverUrl;
        updateNotificationAndSession(title, artist, isPlaying, durationSec, positionSec, cover, false);
    }

    public void updateNotificationAndSession(final String title, final String artist, final boolean isPlaying, final int durationSec, final int positionSec, final String coverUrl, final boolean isStreaming) {
        final String targetCover = (coverUrl != null && !coverUrl.trim().isEmpty()) ? coverUrl.trim() : "";
        final boolean isNewCover = !targetCover.equals(currentCoverUrl);

        if (isNewCover) {
            currentCoverUrl = targetCover;
            // Check in-memory LRU cache first for instant synchronous thumbnail display
            Bitmap cachedBmp = sArtCache.get(targetCover);
            if (cachedBmp != null && !cachedBmp.isRecycled()) {
                currentAlbumArt = cachedBmp;
            } else {
                currentAlbumArt = null;
                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        final Bitmap bmp = loadBitmap(targetCover);
                        if (bmp != null && targetCover.equals(currentCoverUrl)) {
                            currentAlbumArt = bmp;
                            activity.runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    if (targetCover.equals(currentCoverUrl)) {
                                        renderNotification(title, artist, isPlaying, durationSec, positionSec, isStreaming);
                                    }
                                }
                            });
                        }
                    }
                }).start();
            }
        }

        renderNotification(title, artist, isPlaying, durationSec, positionSec, isStreaming);
    }

    private Bitmap loadBitmap(String url) {
        if (url == null || url.trim().isEmpty()) return null;
        String u = url.trim();

        // 1. Check in-memory cache
        Bitmap cached = sArtCache.get(u);
        if (cached != null && !cached.isRecycled()) return cached;

        Bitmap bmp = null;
        try {
            // Case A: file:// URI
            if (u.startsWith("file://")) {
                String filePath = u.substring(7);
                File f = new File(filePath);
                if (f.exists() && f.length() > 0) {
                    bmp = decodeScaledBitmap(f.getAbsolutePath(), 512, 512);
                }
            }
            // Case B: Absolute file path /...
            else if (u.startsWith("/")) {
                File f = new File(u);
                if (f.exists() && f.length() > 0) {
                    bmp = decodeScaledBitmap(f.getAbsolutePath(), 512, 512);
                }
            }
            // Case C: artworks/... relative path
            else if (u.startsWith("artworks/")) {
                File f = new File(activity.getFilesDir(), u);
                if (f.exists() && f.length() > 0) {
                    bmp = decodeScaledBitmap(f.getAbsolutePath(), 512, 512);
                }
            }
            // Case D: HTTP or HTTPS
            else if (u.startsWith("http://") || u.startsWith("https://")) {
                HttpURLConnection conn = (HttpURLConnection) new URL(u).openConnection();
                conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36");
                conn.setConnectTimeout(7000);
                conn.setReadTimeout(7000);
                conn.setInstanceFollowRedirects(true);
                if (conn.getResponseCode() == 200) {
                    InputStream in = conn.getInputStream();
                    byte[] bytes = readAllBytes(in);
                    in.close();
                    if (bytes != null && bytes.length > 0) {
                        bmp = decodeScaledBitmap(bytes, 512, 512);
                    }
                }
                conn.disconnect();
            }
            // Case E: Asset path (assets/...)
            else {
                String assetPath = u;
                if (assetPath.startsWith("assets/")) assetPath = assetPath.substring(7);
                try {
                    InputStream in = activity.getAssets().open(assetPath);
                    byte[] bytes = readAllBytes(in);
                    in.close();
                    if (bytes != null && bytes.length > 0) {
                        bmp = decodeScaledBitmap(bytes, 512, 512);
                    }
                } catch (Exception ignored) {}
            }
        } catch (Exception e) {
            Log.w(TAG, "Failed loading notification art: " + u, e);
        }

        // Case F: Check diskCacheManager by videoId if still null
        if (bmp == null && audioEngine != null) {
            String vid = audioEngine.getActivePlaybackVideoId();
            if (vid != null && !vid.isEmpty()) {
                File cf = new File(new File(activity.getFilesDir(), "artworks"), vid + ".jpg");
                if (cf.exists() && cf.length() > 0) {
                    bmp = decodeScaledBitmap(cf.getAbsolutePath(), 512, 512);
                }
            }
        }

        if (bmp != null) {
            sArtCache.put(u, bmp);
        }
        return bmp;
    }

    private static byte[] readAllBytes(InputStream in) {
        if (in == null) return null;
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) != -1) {
                baos.write(buf, 0, n);
            }
            return baos.toByteArray();
        } catch (Exception e) {
            return null;
        }
    }

    private static Bitmap decodeScaledBitmap(byte[] data, int maxW, int maxH) {
        if (data == null || data.length == 0) return null;
        try {
            BitmapFactory.Options opts = new BitmapFactory.Options();
            opts.inJustDecodeBounds = true;
            BitmapFactory.decodeByteArray(data, 0, data.length, opts);
            int inSample = 1;
            if (opts.outWidth > maxW || opts.outHeight > maxH) {
                int halfW = opts.outWidth / 2;
                int halfH = opts.outHeight / 2;
                while ((halfW / inSample) >= maxW && (halfH / inSample) >= maxH) {
                    inSample *= 2;
                }
            }
            opts.inJustDecodeBounds = false;
            opts.inSampleSize = inSample;
            opts.inPreferredConfig = Bitmap.Config.RGB_565;
            return BitmapFactory.decodeByteArray(data, 0, data.length, opts);
        } catch (Exception e) {
            return null;
        }
    }

    private static Bitmap decodeScaledBitmap(String path, int maxW, int maxH) {
        if (path == null || path.isEmpty()) return null;
        try {
            BitmapFactory.Options opts = new BitmapFactory.Options();
            opts.inJustDecodeBounds = true;
            BitmapFactory.decodeFile(path, opts);
            int inSample = 1;
            if (opts.outWidth > maxW || opts.outHeight > maxH) {
                int halfW = opts.outWidth / 2;
                int halfH = opts.outHeight / 2;
                while ((halfW / inSample) >= maxW && (halfH / inSample) >= maxH) {
                    inSample *= 2;
                }
            }
            opts.inJustDecodeBounds = false;
            opts.inSampleSize = inSample;
            opts.inPreferredConfig = Bitmap.Config.RGB_565;
            return BitmapFactory.decodeFile(path, opts);
        } catch (Exception e) {
            return null;
        }
    }

    private void renderNotification(final String title, final String artist, final boolean isPlaying, final int durationSec, final int positionSec, final boolean isStreaming) {
        if (mediaSession != null) {
            try {
                PlaybackState.Builder stateBuilder = new PlaybackState.Builder();
                stateBuilder.setActions(
                    PlaybackState.ACTION_PLAY |
                    PlaybackState.ACTION_PAUSE |
                    PlaybackState.ACTION_PLAY_PAUSE |
                    PlaybackState.ACTION_SKIP_TO_NEXT |
                    PlaybackState.ACTION_SKIP_TO_PREVIOUS |
                    PlaybackState.ACTION_SEEK_TO |
                    PlaybackState.ACTION_STOP
                );
                stateBuilder.setState(
                    isPlaying ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED,
                    positionSec * 1000L,
                    isPlaying ? 1.0f : 0.0f
                );
                mediaSession.setPlaybackState(stateBuilder.build());

                MediaMetadata.Builder metaBuilder = new MediaMetadata.Builder();
                metaBuilder.putString(MediaMetadata.METADATA_KEY_TITLE, title);
                metaBuilder.putString(MediaMetadata.METADATA_KEY_ARTIST, artist);
                metaBuilder.putString(MediaMetadata.METADATA_KEY_ALBUM, isStreaming ? "Cloud Audio Stream" : "Soko Music Library");
                metaBuilder.putLong(MediaMetadata.METADATA_KEY_DURATION, durationSec * 1000L);
                if (currentAlbumArt != null && !currentAlbumArt.isRecycled()) {
                    metaBuilder.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, currentAlbumArt);
                    metaBuilder.putBitmap(MediaMetadata.METADATA_KEY_ART, currentAlbumArt);
                } else {
                    metaBuilder.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, null);
                    metaBuilder.putBitmap(MediaMetadata.METADATA_KEY_ART, null);
                }
                mediaSession.setMetadata(metaBuilder.build());
                mediaSession.setActive(true);
            } catch (Exception e) {
                Log.e(TAG, "MediaSession update error", e);
            }
        }

        try {
            Intent toggleIntent = new Intent("com.soko.music.ACTION_TOGGLE");
            toggleIntent.setPackage(activity.getPackageName());
            Intent nextIntent = new Intent("com.soko.music.ACTION_NEXT");
            nextIntent.setPackage(activity.getPackageName());
            Intent prevIntent = new Intent("com.soko.music.ACTION_PREV");
            prevIntent.setPackage(activity.getPackageName());

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (android.os.Build.VERSION.SDK_INT >= 23) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pToggle = PendingIntent.getBroadcast(activity, 1, toggleIntent, flags);
            PendingIntent pNext = PendingIntent.getBroadcast(activity, 2, nextIntent, flags);
            PendingIntent pPrev = PendingIntent.getBroadcast(activity, 3, prevIntent, flags);

            Intent contentIntent = new Intent(activity, activity.getClass());
            contentIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pContent = PendingIntent.getActivity(activity, 0, contentIntent, flags);

            Notification.Builder nb;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                nb = new Notification.Builder(activity, MEDIA_CHANNEL_ID);
            } else {
                nb = new Notification.Builder(activity);
            }

            String subtitle = artist + (isStreaming ? " • Streaming Online" : " • Soko Offline");
            nb.setContentTitle(title)
              .setContentText(subtitle)
              .setSmallIcon(android.R.drawable.ic_media_play)
              .setContentIntent(pContent)
              .setOngoing(isPlaying)
              .setCategory(Notification.CATEGORY_TRANSPORT)
              .setVisibility(Notification.VISIBILITY_PUBLIC)
              .addAction(android.R.drawable.ic_media_previous, "Prev", pPrev)
              .addAction(isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play, isPlaying ? "Pause" : "Play", pToggle)
              .addAction(android.R.drawable.ic_media_next, "Next", pNext);

            if (currentAlbumArt != null && !currentAlbumArt.isRecycled()) {
                nb.setLargeIcon(currentAlbumArt);
            } else {
                nb.setLargeIcon((Bitmap) null);
            }

            if (android.os.Build.VERSION.SDK_INT >= 21) {
                Notification.MediaStyle style = new Notification.MediaStyle();
                if (mediaSession != null) {
                    style.setMediaSession(mediaSession.getSessionToken());
                }
                style.setShowActionsInCompactView(0, 1, 2);
                nb.setStyle(style);
            }

            Notification notification = nb.build();
            NotificationManager nm = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.notify(MEDIA_NOTIF_ID, notification);
            }

            MediaPlaybackService service = MediaPlaybackService.getInstance();
            if (isPlaying) {
                if (service != null) {
                    service.updateForegroundNotification(MEDIA_NOTIF_ID, notification, true);
                } else {
                    MediaPlaybackService.startService(activity, notification);
                }
            } else {
                if (service != null) {
                    service.updateForegroundNotification(MEDIA_NOTIF_ID, notification, false);
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Notification post error: " + e.getMessage());
        }
    }

    public void updatePlaybackStateOnly(final boolean isPlaying, final int positionSec) {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (mediaSession != null) {
                        PlaybackState.Builder stateBuilder = new PlaybackState.Builder();
                        stateBuilder.setActions(PlaybackState.ACTION_PLAY | PlaybackState.ACTION_PAUSE |
                                               PlaybackState.ACTION_SKIP_TO_NEXT | PlaybackState.ACTION_SKIP_TO_PREVIOUS |
                                               PlaybackState.ACTION_SEEK_TO);
                        stateBuilder.setState(isPlaying ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED,
                                              positionSec * 1000L, isPlaying ? 1.0f : 0.0f);
                        mediaSession.setPlaybackState(stateBuilder.build());
                    }
                } catch (Exception ignored) {}
            }
        });
    }

    public void clearNotification() {
        if (mediaSession != null) {
            try {
                PlaybackState.Builder stateBuilder = new PlaybackState.Builder();
                stateBuilder.setState(PlaybackState.STATE_STOPPED, 0, 0.0f);
                mediaSession.setPlaybackState(stateBuilder.build());
            } catch (Exception ignored) {}
        }
        MediaPlaybackService service = MediaPlaybackService.getInstance();
        if (service != null) {
            service.stopForegroundState(true);
            MediaPlaybackService.stopService(activity);
        }
        try {
            NotificationManager nm = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(MEDIA_NOTIF_ID);
            }
        } catch (Exception ignored) {}
    }

    public void release() {
        unregisterActionReceiver();
        clearNotification();
        if (mediaSession != null) {
            try {
                mediaSession.setActive(false);
                mediaSession.release();
            } catch (Exception ignored) {}
            mediaSession = null;
        }
    }
}
