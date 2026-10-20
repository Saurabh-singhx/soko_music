package com.soko.music.audio;

import android.app.Activity;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.WebView;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

public class AudioEngine {
    private static final String TAG = "SokoMusic";

    private final Activity activity;
    private final WebView webView;
    private final AudioFocusManager audioFocusManager;
    private final MediaNotificationManager mediaNotificationManager;

    private MediaPlayer mediaPlayer;
    private final Handler progressHandler = new Handler(Looper.getMainLooper());
    private Runnable progressRunnable;
    private String currentTrackTitle = "Soko Music";
    private String currentTrackArtist = "Offline Storage";
    private String currentCoverUrl = "";
    private volatile String currentActivePlaybackVideoId = "";

    public AudioEngine(Activity activity, WebView webView, AudioFocusManager audioFocusManager, MediaNotificationManager mediaNotificationManager) {
        this.activity = activity;
        this.webView = webView;
        this.audioFocusManager = audioFocusManager;
        this.mediaNotificationManager = mediaNotificationManager;
    }

    public void setActivePlaybackVideoId(String videoId) {
        this.currentActivePlaybackVideoId = videoId;
    }

    public String getActivePlaybackVideoId() {
        return currentActivePlaybackVideoId;
    }

    private void initMediaPlayer() {
        if (mediaPlayer == null) {
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .build());
            mediaPlayer.setVolume(1.0f, 1.0f);

            mediaPlayer.setOnCompletionListener(new MediaPlayer.OnCompletionListener() {
                @Override
                public void onCompletion(MediaPlayer mp) {
                    stopProgressUpdater();
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (webView != null) webView.evaluateJavascript("window.onNativeTrackEnded && window.onNativeTrackEnded()", null);
                        }
                    });
                }
            });

            mediaPlayer.setOnErrorListener(new MediaPlayer.OnErrorListener() {
                @Override
                public boolean onError(MediaPlayer mp, int what, int extra) {
                    Log.e(TAG, "Native MediaPlayer error: what=" + what + ", extra=" + extra);
                    stopProgressUpdater();
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (webView != null) {
                                webView.evaluateJavascript("window.onNativePlaybackError && window.onNativePlaybackError(" + what + ")", null);
                            }
                        }
                    });
                    return true;
                }
            });
        }
    }

    public void stopNativeAudio() {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    stopProgressUpdater();
                    if (mediaPlayer != null) {
                        if (mediaPlayer.isPlaying()) {
                            mediaPlayer.stop();
                        }
                        mediaPlayer.reset();
                    }
                    if (audioFocusManager != null) {
                        try { audioFocusManager.abandonAudioFocus(); } catch (Exception ignored) {}
                    }
                    if (mediaNotificationManager != null) {
                        mediaNotificationManager.release();
                    }
                    if (webView != null) {
                        webView.evaluateJavascript("window.onNativePlayerStateChange && window.onNativePlayerStateChange(false, 0)", null);
                    }
                } catch (Exception e) {
                    Log.e(TAG, "stopNativeAudio error", e);
                }
            }
        });
    }

    public void playNativeAudio(final String pathOrUrl, final String title, final String artist, final String coverUrl) {
        currentTrackTitle = title;
        currentTrackArtist = artist;
        currentCoverUrl = coverUrl;

        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    initMediaPlayer();
                    mediaPlayer.reset();
                    mediaPlayer.setVolume(1.0f, 1.0f);

                    if (audioFocusManager != null) {
                        try { audioFocusManager.requestAudioFocus(); } catch (Exception ignored) {}
                    }

                    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
                        mediaPlayer.setDataSource(pathOrUrl);
                        mediaPlayer.setOnPreparedListener(new MediaPlayer.OnPreparedListener() {
                            @Override
                            public void onPrepared(MediaPlayer mp) {
                                mp.start();
                                startProgressUpdater();
                                int durSec = mp.getDuration() > 0 ? mp.getDuration() / 1000 : 215;
                                if (mediaNotificationManager != null) {
                                    mediaNotificationManager.updateNotificationAndSession(title, artist, true, durSec, 0);
                                }
                                if (webView != null) {
                                    webView.evaluateJavascript("window.onNativePlayerStateChange && window.onNativePlayerStateChange(true, " + durSec + ")", null);
                                }
                            }
                        });
                        mediaPlayer.prepareAsync();
                    } else {
                        File directFile = new File(pathOrUrl.startsWith("file://") ? pathOrUrl.substring(7) : pathOrUrl);
                        if (directFile.exists() && directFile.length() > 0) {
                            mediaPlayer.setDataSource(directFile.getAbsolutePath());
                            mediaPlayer.prepare();
                            mediaPlayer.start();
                            startProgressUpdater();
                            int durSec = mediaPlayer.getDuration() > 0 ? mediaPlayer.getDuration() / 1000 : 215;
                            if (mediaNotificationManager != null) {
                                mediaNotificationManager.updateNotificationAndSession(title, artist, true, durSec, 0);
                            }
                            if (webView != null) {
                                webView.evaluateJavascript("window.onNativePlayerStateChange && window.onNativePlayerStateChange(true, " + durSec + ")", null);
                            }
                            return;
                        }

                        String cleanPath = pathOrUrl;
                        if (cleanPath.startsWith("file:///android_asset/")) {
                            cleanPath = cleanPath.substring("file:///android_asset/".length());
                        }
                        while (cleanPath.startsWith("/")) {
                            cleanPath = cleanPath.substring(1);
                        }

                        File musicDir = new File(activity.getCacheDir(), "music");
                        if (!musicDir.exists()) musicDir.mkdirs();

                        String fileName = new File(cleanPath).getName();
                        File localTarget = new File(musicDir, fileName);

                        if (!localTarget.exists() || localTarget.length() == 0) {
                            InputStream in = null;
                            String[] candidates = new String[]{
                                cleanPath,
                                "assets/" + cleanPath,
                                "music/" + fileName,
                                "assets/music/" + fileName
                            };
                            for (String cand : candidates) {
                                try {
                                    in = activity.getAssets().open(cand);
                                    if (in != null) break;
                                } catch (Exception ignored) {}
                            }

                            if (in != null) {
                                FileOutputStream fos = new FileOutputStream(localTarget);
                                byte[] buf = new byte[8192];
                                int len;
                                while ((len = in.read(buf)) != -1) {
                                    fos.write(buf, 0, len);
                                }
                                fos.flush();
                                fos.close();
                                in.close();
                            }
                        }

                        if (localTarget.exists() && localTarget.length() > 0) {
                            mediaPlayer.setDataSource(localTarget.getAbsolutePath());
                            mediaPlayer.prepare();
                            mediaPlayer.start();
                            startProgressUpdater();
                            int durSec = mediaPlayer.getDuration() > 0 ? mediaPlayer.getDuration() / 1000 : 215;
                            if (mediaNotificationManager != null) {
                                mediaNotificationManager.updateNotificationAndSession(title, artist, true, durSec, 0);
                            }
                            if (webView != null) {
                                webView.evaluateJavascript("window.onNativePlayerStateChange && window.onNativePlayerStateChange(true, " + durSec + ")", null);
                            }
                        } else {
                            Log.e(TAG, "Audio asset not found for " + cleanPath);
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "Error playing audio: " + pathOrUrl, e);
                }
            }
        });
    }

    public void pauseNativeAudio() {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (mediaPlayer != null && mediaPlayer.isPlaying()) {
                        mediaPlayer.pause();
                        stopProgressUpdater();
                        int cur = mediaPlayer.getCurrentPosition() / 1000;
                        int dur = mediaPlayer.getDuration() / 1000;
                        if (mediaNotificationManager != null) {
                            mediaNotificationManager.updateNotificationAndSession(currentTrackTitle, currentTrackArtist, false, dur, cur);
                        }
                        if (webView != null) {
                            webView.evaluateJavascript("window.onNativePlayerStateChange && window.onNativePlayerStateChange(false, " + dur + ")", null);
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "pauseNativeAudio error", e);
                }
            }
        });
    }

    public void resumeNativeAudio() {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (mediaPlayer != null) {
                        mediaPlayer.start();
                        startProgressUpdater();
                        int cur = mediaPlayer.getCurrentPosition() / 1000;
                        int dur = mediaPlayer.getDuration() / 1000;
                        if (mediaNotificationManager != null) {
                            mediaNotificationManager.updateNotificationAndSession(currentTrackTitle, currentTrackArtist, true, dur, cur);
                        }
                        if (webView != null) {
                            webView.evaluateJavascript("window.onNativePlayerStateChange && window.onNativePlayerStateChange(true, " + dur + ")", null);
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "resumeNativeAudio error", e);
                }
            }
        });
    }

    public void seekNativeAudio(final int seconds) {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (mediaPlayer != null) {
                        mediaPlayer.seekTo(seconds * 1000);
                        int dur = mediaPlayer.getDuration() / 1000;
                        if (mediaNotificationManager != null) {
                            mediaNotificationManager.updateNotificationAndSession(currentTrackTitle, currentTrackArtist, mediaPlayer.isPlaying(), dur, seconds);
                        }
                        if (webView != null) {
                            webView.evaluateJavascript("window.onNativePlayerProgress && window.onNativePlayerProgress(" + seconds + ", " + dur + ")", null);
                        }
                    }
                } catch (Exception e) {
                    Log.e(TAG, "seekNativeAudio error", e);
                }
            }
        });
    }

    private void startProgressUpdater() {
        stopProgressUpdater();
        progressRunnable = new Runnable() {
            @Override
            public void run() {
                try {
                    if (mediaPlayer != null && mediaPlayer.isPlaying()) {
                        final int cur = mediaPlayer.getCurrentPosition() / 1000;
                        final int dur = mediaPlayer.getDuration() / 1000;
                        if (webView != null) {
                            webView.evaluateJavascript("window.onNativePlayerProgress && window.onNativePlayerProgress(" + cur + ", " + dur + ")", null);
                        }
                        progressHandler.postDelayed(this, 500);
                    }
                } catch (Exception ignored) {}
            }
        };
        progressHandler.postDelayed(progressRunnable, 500);
    }

    private void stopProgressUpdater() {
        if (progressRunnable != null) {
            progressHandler.removeCallbacks(progressRunnable);
            progressRunnable = null;
        }
    }

    public void release() {
        stopProgressUpdater();
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) mediaPlayer.stop();
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
    }
}
