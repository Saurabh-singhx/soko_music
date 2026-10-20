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
import android.webkit.WebView;
import java.io.InputStream;
import java.net.URL;

public class MediaNotificationManager {
    private static final String TAG = "SokoMusic";
    public static final String MEDIA_CHANNEL_ID = "soko_music_playback";
    public static final int MEDIA_NOTIF_ID = 9101;

    private final Activity activity;
    private final WebView webView;
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

    private void createMediaNotificationChannel() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                MEDIA_CHANNEL_ID,
                "Soko Music Playback",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Controls for active offline music playback.");
            channel.setShowBadge(false);
            channel.setSound(null, null);
            channel.enableVibration(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            NotificationManager nm = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private void initMediaSession() {
        try {
            mediaSession = new MediaSession(activity, "SokoMusicSession");
            mediaSession.setCallback(new MediaSession.Callback() {
                @Override
                public void onPlay() {
                    activity.runOnUiThread(new Runnable() {
                        @Override public void run() { if (webView != null) webView.evaluateJavascript("togglePlayPause()", null); }
                    });
                }
                @Override
                public void onPause() {
                    activity.runOnUiThread(new Runnable() {
                        @Override public void run() { if (webView != null) webView.evaluateJavascript("togglePlayPause()", null); }
                    });
                }
                @Override
                public void onSkipToNext() {
                    activity.runOnUiThread(new Runnable() {
                        @Override public void run() { if (webView != null) webView.evaluateJavascript("playNextTrack()", null); }
                    });
                }
                @Override
                public void onSkipToPrevious() {
                    activity.runOnUiThread(new Runnable() {
                        @Override public void run() { if (webView != null) webView.evaluateJavascript("playPreviousTrack()", null); }
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
        updateNotificationAndSession(title, artist, isPlaying, durationSec, positionSec, currentCoverUrl, false);
    }

    public void updateNotificationAndSession(final String title, final String artist, final boolean isPlaying, final int durationSec, final int positionSec, final String coverUrl, final boolean isStreaming) {
        if (coverUrl != null && !coverUrl.isEmpty() && !coverUrl.equals(currentCoverUrl)) {
            currentCoverUrl = coverUrl;
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Bitmap bmp = null;
                        if (coverUrl.startsWith("http://") || coverUrl.startsWith("https://")) {
                            InputStream in = new URL(coverUrl).openStream();
                            bmp = BitmapFactory.decodeStream(in);
                            in.close();
                        } else if (coverUrl.startsWith("/")) {
                            bmp = BitmapFactory.decodeFile(coverUrl);
                        }
                        if (bmp != null) {
                            currentAlbumArt = bmp;
                            activity.runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    renderNotification(title, artist, isPlaying, durationSec, positionSec, isStreaming);
                                }
                            });
                        }
                    } catch (Exception ignored) {}
                }
            }).start();
        }
        renderNotification(title, artist, isPlaying, durationSec, positionSec, isStreaming);
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
                    PlaybackState.ACTION_SEEK_TO
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
                metaBuilder.putString(MediaMetadata.METADATA_KEY_ALBUM, isStreaming ? "YouTube Music Stream" : "Soko Offline Storage");
                metaBuilder.putLong(MediaMetadata.METADATA_KEY_DURATION, durationSec * 1000L);
                if (currentAlbumArt != null) {
                    metaBuilder.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, currentAlbumArt);
                }
                mediaSession.setMetadata(metaBuilder.build());
                mediaSession.setActive(true);
            } catch (Exception e) {
                Log.e(TAG, "MediaSession update error", e);
            }
        }

        try {
            NotificationManager nm = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
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
                  .setVisibility(Notification.VISIBILITY_PUBLIC)
                  .addAction(android.R.drawable.ic_media_previous, "Prev", pPrev)
                  .addAction(isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play, isPlaying ? "Pause" : "Play", pToggle)
                  .addAction(android.R.drawable.ic_media_next, "Next", pNext);

                if (currentAlbumArt != null) {
                    nb.setLargeIcon(currentAlbumArt);
                }

                if (android.os.Build.VERSION.SDK_INT >= 21) {
                    Notification.MediaStyle style = new Notification.MediaStyle();
                    if (mediaSession != null) {
                        style.setMediaSession(mediaSession.getSessionToken());
                    }
                    style.setShowActionsInCompactView(0, 1, 2);
                    nb.setStyle(style);
                }

                nm.notify(MEDIA_NOTIF_ID, nb.build());
            }
        } catch (Exception e) {
            Log.w(TAG, "Notification post error: " + e.getMessage());
        }
    }

    public void release() {
        unregisterActionReceiver();
        if (mediaSession != null) {
            try {
                mediaSession.setActive(false);
                mediaSession.release();
            } catch (Exception ignored) {}
            mediaSession = null;
        }
        try {
            NotificationManager nm = (NotificationManager) activity.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(MEDIA_NOTIF_ID);
            }
        } catch (Exception ignored) {}
    }
}
