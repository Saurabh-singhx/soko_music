#!/usr/bin/env bash
set -e

# ==============================================================================
# Soko Music Standalone Android APK Generator
# Builds production-ready, signed, zipalign-verified Android APK.
# ==============================================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${PROJECT_ROOT}/build_apk_tmp"
OUTPUT_DIR="${PROJECT_ROOT}"

# Detect Android SDK Home
SDK_HOME="${ANDROID_HOME:-/home/saurabh/Android/Sdk}"
if [ ! -d "${SDK_HOME}" ] && [ -d "/usr/local/lib/android/sdk" ]; then
  SDK_HOME="/usr/local/lib/android/sdk"
fi

# Detect Build Tools
BUILD_TOOLS_DIR="${SDK_HOME}/build-tools"
if [ -d "${BUILD_TOOLS_DIR}" ]; then
  BUILD_TOOLS="$(find "${BUILD_TOOLS_DIR}" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -n 1)"
else
  BUILD_TOOLS="${SDK_HOME}/build-tools/35.0.0"
fi

# Detect Platform JAR
PLATFORMS_DIR="${SDK_HOME}/platforms"
if [ -d "${PLATFORMS_DIR}" ]; then
  PLATFORM_DIR="$(find "${PLATFORMS_DIR}" -mindepth 1 -maxdepth 1 -type d | sort -V | tail -n 1)"
  PLATFORM_JAR="${PLATFORM_DIR}/android.jar"
else
  PLATFORM_JAR="${SDK_HOME}/platforms/android-35/android.jar"
fi

AAPT2="${BUILD_TOOLS}/aapt2"
D8="${BUILD_TOOLS}/d8"
ZIPALIGN="${BUILD_TOOLS}/zipalign"
APKSIGNER="${BUILD_TOOLS}/apksigner"

VERSION_CODE="1"
VERSION_NAME="1.0.0"

echo "=== Soko Music Mobile APK Generator ==="
echo "Project Root: ${PROJECT_ROOT}"
echo "Android SDK: ${SDK_HOME}"
echo "Build Tools: ${BUILD_TOOLS}"
echo "Target Platform: ${PLATFORM_JAR}"

# Generate launcher icons
python3 "${PROJECT_ROOT}/scripts/generate_icons.py"

# Clean and prepare workspace
rm -rf "${BUILD_DIR}"
WORK="${BUILD_DIR}/work"
mkdir -p "${WORK}/res/values"
mkdir -p "${WORK}/res/drawable"
mkdir -p "${WORK}/src/com/soko/music"
mkdir -p "${WORK}/gen"
mkdir -p "${WORK}/obj"
mkdir -p "${WORK}/dex"
mkdir -p "${WORK}/assets"

# Copy mipmap icons
cp -r "${PROJECT_ROOT}/res/"* "${WORK}/res/"

# Copy web assets
cp "${PROJECT_ROOT}/apps/mobile/index.html" "${WORK}/assets/"
mkdir -p "${WORK}/assets/assets"
cp -r "${PROJECT_ROOT}/assets/"* "${WORK}/assets/assets/"
mkdir -p "${WORK}/assets/music"
cp -r "${PROJECT_ROOT}/assets/music/"* "${WORK}/assets/music/"

# 1. Strings & Styles
cat <<EOF > "${WORK}/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Soko Music</string>
</resources>
EOF

cat <<EOF > "${WORK}/res/values/styles.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="@android:style/Theme.NoTitleBar">
        <item name="android:windowBackground">@android:color/black</item>
    </style>
</resources>
EOF

# 2. AndroidManifest.xml
cat <<EOF > "${WORK}/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.soko.music"
    android:versionCode="${VERSION_CODE}"
    android:versionName="${VERSION_NAME}">

    <uses-sdk android:minSdkVersion="26" android:targetSdkVersion="35" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/AppTheme"
        android:hardwareAccelerated="true"
        android:largeHeap="true"
        android:usesCleartextTraffic="true">

        <activity
            android:name="com.soko.music.MainActivity"
            android:label="@string/app_name"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# 3. MainActivity.java
cat <<EOF > "${WORK}/src/com/soko/music/MainActivity.java"
package com.soko.music;

import android.app.Activity;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.JavascriptInterface;
import android.view.Window;
import android.view.WindowManager;
import android.graphics.Color;
import android.content.Intent;
import android.content.Context;
import android.util.Log;
import android.media.MediaPlayer;
import android.media.AudioAttributes;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.media.MediaMetadata;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.IntentFilter;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.FileOutputStream;
import java.io.File;
import java.io.ByteArrayOutputStream;

public class MainActivity extends Activity {
    private static final String TAG = "SokoMusic";
    private static final String MEDIA_CHANNEL_ID = "soko_music_playback";
    private static final int MEDIA_NOTIF_ID = 9101;
    private WebView webView;
    private MediaSession mediaSession;
    private MediaPlayer mediaPlayer;
    private Handler progressHandler = new Handler(Looper.getMainLooper());
    private Runnable progressRunnable;
    private String currentTrackTitle = "Soko Music";
    private String currentTrackArtist = "Offline Storage";
    private String currentCoverUrl = "";

    private BroadcastReceiver mediaActionReceiver = new BroadcastReceiver() {
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
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (webView != null) webView.evaluateJavascript("handleNativeMediaAction('" + mappedAction + "')", null);
                }
            });
        }
    };

    private void createMediaNotificationChannel() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                MEDIA_CHANNEL_ID,
                "Soko Music Playback",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Controls for active offline music playback.");
            channel.setShowBadge(false);
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
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
                    runOnUiThread(new Runnable() {
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
                    return true;
                }
            });
        }
    }

    public void playNativeAudio(final String pathOrUrl, final String title, final String artist, final String coverUrl) {
        currentTrackTitle = title;
        currentTrackArtist = artist;
        currentCoverUrl = coverUrl;

        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    initMediaPlayer();
                    mediaPlayer.reset();
                    mediaPlayer.setVolume(1.0f, 1.0f);

                    if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
                        mediaPlayer.setDataSource(pathOrUrl);
                        mediaPlayer.setOnPreparedListener(new MediaPlayer.OnPreparedListener() {
                            @Override
                            public void onPrepared(MediaPlayer mp) {
                                mp.start();
                                startProgressUpdater();
                                int durSec = mp.getDuration() > 0 ? mp.getDuration() / 1000 : 215;
                                updateNotificationAndSession(title, artist, true, durSec, 0);
                                if (webView != null) {
                                    webView.evaluateJavascript("window.onNativePlayerStateChange && window.onNativePlayerStateChange(true, " + durSec + ")", null);
                                }
                            }
                        });
                        mediaPlayer.prepareAsync();
                    } else {
                        String cleanPath = pathOrUrl;
                        if (cleanPath.startsWith("file:///android_asset/")) {
                            cleanPath = cleanPath.substring("file:///android_asset/".length());
                        }
                        while (cleanPath.startsWith("/")) {
                            cleanPath = cleanPath.substring(1);
                        }

                        File musicDir = new File(getCacheDir(), "music");
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
                                    in = getAssets().open(cand);
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
                            updateNotificationAndSession(title, artist, true, durSec, 0);
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
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (mediaPlayer != null && mediaPlayer.isPlaying()) {
                        mediaPlayer.pause();
                        stopProgressUpdater();
                        int cur = mediaPlayer.getCurrentPosition() / 1000;
                        int dur = mediaPlayer.getDuration() / 1000;
                        updateNotificationAndSession(currentTrackTitle, currentTrackArtist, false, dur, cur);
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
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (mediaPlayer != null) {
                        mediaPlayer.start();
                        startProgressUpdater();
                        int cur = mediaPlayer.getCurrentPosition() / 1000;
                        int dur = mediaPlayer.getDuration() / 1000;
                        updateNotificationAndSession(currentTrackTitle, currentTrackArtist, true, dur, cur);
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
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (mediaPlayer != null) {
                        mediaPlayer.seekTo(seconds * 1000);
                        int dur = mediaPlayer.getDuration() / 1000;
                        updateNotificationAndSession(currentTrackTitle, currentTrackArtist, mediaPlayer.isPlaying(), dur, seconds);
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

    private void updateNotificationAndSession(final String title, final String artist, final boolean isPlaying, final int durationSec, final int positionSec) {
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
                metaBuilder.putString(MediaMetadata.METADATA_KEY_ALBUM, "Soko Offline Storage");
                metaBuilder.putLong(MediaMetadata.METADATA_KEY_DURATION, durationSec * 1000L);
                mediaSession.setMetadata(metaBuilder.build());
                mediaSession.setActive(true);
            } catch (Exception e) {
                Log.e(TAG, "MediaSession update error", e);
            }
        }

        try {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                Intent toggleIntent = new Intent("com.soko.music.ACTION_TOGGLE");
                Intent nextIntent = new Intent("com.soko.music.ACTION_NEXT");
                Intent prevIntent = new Intent("com.soko.music.ACTION_PREV");

                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (android.os.Build.VERSION.SDK_INT >= 23) {
                    flags |= PendingIntent.FLAG_IMMUTABLE;
                }

                PendingIntent pToggle = PendingIntent.getBroadcast(this, 1, toggleIntent, flags);
                PendingIntent pNext = PendingIntent.getBroadcast(this, 2, nextIntent, flags);
                PendingIntent pPrev = PendingIntent.getBroadcast(this, 3, prevIntent, flags);

                Intent contentIntent = new Intent(this, MainActivity.class);
                PendingIntent pContent = PendingIntent.getActivity(this, 0, contentIntent, flags);

                Notification.Builder nb;
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                    nb = new Notification.Builder(this, MEDIA_CHANNEL_ID);
                } else {
                    nb = new Notification.Builder(this);
                }

                nb.setContentTitle(title)
                  .setContentText(artist + " • Soko Offline")
                  .setSmallIcon(android.R.drawable.ic_media_play)
                  .setContentIntent(pContent)
                  .setOngoing(isPlaying)
                  .setVisibility(Notification.VISIBILITY_PUBLIC)
                  .addAction(android.R.drawable.ic_media_previous, "Prev", pPrev)
                  .addAction(isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play, isPlaying ? "Pause" : "Play", pToggle)
                  .addAction(android.R.drawable.ic_media_next, "Next", pNext);

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

    public class SokoNativeBridge {
        @JavascriptInterface
        public String getAppVersion() {
            return "${VERSION_NAME} (Build ${VERSION_CODE})";
        }

        @JavascriptInterface
        public boolean isNativeAvailable() {
            return true;
        }

        @JavascriptInterface
        public void playAudio(final String urlOrAsset, final String title, final String artist, final String coverUrl) {
            playNativeAudio(urlOrAsset, title, artist, coverUrl);
        }

        @JavascriptInterface
        public void pauseAudio() {
            pauseNativeAudio();
        }

        @JavascriptInterface
        public void resumeAudio() {
            resumeNativeAudio();
        }

        @JavascriptInterface
        public void seekAudio(final int seconds) {
            seekNativeAudio(seconds);
        }

        @JavascriptInterface
        public void updateNativePlayer(final String title, final String artist, final boolean isPlaying, final int durationSec, final int positionSec, final String coverUrl) {
            updateNotificationAndSession(title, artist, isPlaying, durationSec, positionSec);
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS | WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            getWindow().setStatusBarColor(Color.parseColor("#07090E"));
            getWindow().setNavigationBarColor(Color.parseColor("#07090E"));
        }

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        createMediaNotificationChannel();

        try {
            IntentFilter filter = new IntentFilter();
            filter.addAction("com.soko.music.ACTION_TOGGLE");
            filter.addAction("com.soko.music.ACTION_NEXT");
            filter.addAction("com.soko.music.ACTION_PREV");
            if (android.os.Build.VERSION.SDK_INT >= 33) {
                registerReceiver(mediaActionReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
            } else {
                registerReceiver(mediaActionReceiver, filter);
            }
        } catch (Exception e) {
            Log.w(TAG, "Receiver error: " + e.getMessage());
        }

        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
            try {
                mediaSession = new MediaSession(this, "SokoMusicStandalone");
                mediaSession.setCallback(new MediaSession.Callback() {
                    @Override
                    public void onPlay() {
                        runOnUiThread(new Runnable() {
                            @Override public void run() { if (webView != null) webView.evaluateJavascript("togglePlayPause()", null); }
                        });
                    }
                    @Override
                    public void onPause() {
                        runOnUiThread(new Runnable() {
                            @Override public void run() { if (webView != null) webView.evaluateJavascript("togglePlayPause()", null); }
                        });
                    }
                    @Override
                    public void onSkipToNext() {
                        runOnUiThread(new Runnable() {
                            @Override public void run() { if (webView != null) webView.evaluateJavascript("playNextTrack()", null); }
                        });
                    }
                    @Override
                    public void onSkipToPrevious() {
                        runOnUiThread(new Runnable() {
                            @Override public void run() { if (webView != null) webView.evaluateJavascript("playPreviousTrack()", null); }
                        });
                    }
                });
            } catch (Exception e) {
                Log.e(TAG, "MediaSession init error", e);
            }
        }

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);

        webView.addJavascriptInterface(new SokoNativeBridge(), "SokoNative");
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        try {
            InputStream is = getAssets().open("index.html");
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            int read;
            while ((read = is.read(buf)) != -1) {
                baos.write(buf, 0, read);
            }
            is.close();
            String htmlContent = baos.toString("UTF-8");
            webView.loadDataWithBaseURL("file:///android_asset/", htmlContent, "text/html", "UTF-8", null);
        } catch (Exception e) {
            webView.loadUrl("file:///android_asset/index.html");
        }

        setContentView(webView);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopProgressUpdater();
        try {
            unregisterReceiver(mediaActionReceiver);
        } catch (Exception ignored) {}
        if (mediaPlayer != null) {
            try {
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
        if (mediaSession != null) {
            mediaSession.release();
            mediaSession = null;
        }
    }
}
EOF

# 4. Keystore
KEYSTORE="${PROJECT_ROOT}/scripts/soko_music.keystore"
KEY_PASS="sokomusic123"
if [ ! -f "${KEYSTORE}" ]; then
  echo "Generating persistent keystore at ${KEYSTORE}..."
  keytool -genkeypair -v \
    -keystore "${KEYSTORE}" \
    -alias "soko-music-key" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "${KEY_PASS}" \
    -keypass "${KEY_PASS}" \
    -dname "CN=SokoMusic, OU=Mobile, O=Soko, L=San Francisco, ST=CA, C=US"
fi

# 5. Compile Resources with AAPT2
echo "[1/5] Compiling resources with AAPT2..."
"${AAPT2}" compile --dir "${WORK}/res" -o "${WORK}/res.zip"
"${AAPT2}" link -I "${PLATFORM_JAR}" \
  --auto-add-overlay \
  -0 opus -0 mp3 -0 m4a -0 webm -0 ogg -0 jpg -0 png \
  -R "${WORK}/res.zip" \
  --manifest "${WORK}/AndroidManifest.xml" \
  -A "${WORK}/assets" \
  --java "${WORK}/gen" \
  -o "${WORK}/unaligned.apk"

# 6. Compile Java Sources
echo "[2/5] Compiling Java classes..."
javac -source 8 -target 8 -d "${WORK}/obj" \
  -cp "${PLATFORM_JAR}" \
  "${WORK}/gen/com/soko/music/R.java" \
  $(find "${WORK}/src" -name "*.java")

# 7. Convert Classes to DEX with D8
echo "[3/5] Converting to DEX bytecode..."
"${D8}" --min-api 26 \
  --lib "${PLATFORM_JAR}" \
  --output "${WORK}/dex" \
  $(find "${WORK}/obj" -name "*.class")

# 8. Add DEX to APK
cd "${WORK}/dex"
zip -u "${WORK}/unaligned.apk" classes.dex

# 9. Align APK with Zipalign
echo "[4/5] Zipaligning APK..."
cd "${WORK}"
"${ZIPALIGN}" -p -f 4 "${WORK}/unaligned.apk" "${WORK}/aligned.apk"

# 10. Sign APK with apksigner
echo "[5/5] Signing APK with apksigner..."
FINAL_APK="${OUTPUT_DIR}/soko-music.apk"
"${APKSIGNER}" sign \
  --ks "${KEYSTORE}" \
  --ks-key-alias "soko-music-key" \
  --ks-pass "pass:${KEY_PASS}" \
  --key-pass "pass:${KEY_PASS}" \
  --out "${FINAL_APK}" \
  "${WORK}/aligned.apk"

# 11. Verify signature
"${APKSIGNER}" verify "${FINAL_APK}"

# Also copy to dist directory
mkdir -p "${PROJECT_ROOT}/dist"
cp "${FINAL_APK}" "${PROJECT_ROOT}/dist/soko-music.apk"

echo "=========================================================="
echo "🎉 SUCCESS: Soko Music APK generated at:"
echo "${FINAL_APK} ($(du -h "${FINAL_APK}" | cut -f1))"
echo "=========================================================="

rm -rf "${BUILD_DIR}"
