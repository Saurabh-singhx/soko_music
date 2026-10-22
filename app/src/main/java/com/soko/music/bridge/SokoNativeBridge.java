package com.soko.music.bridge;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.util.Log;
import android.webkit.JavascriptInterface;

public class SokoNativeBridge {
    private static final String TAG = "SokoNativeBridge";

    private final Activity activity;
    private final PlayerBridge playerBridge;
    private final StorageBridge storageBridge;
    private final AuthBridge authBridge;
    private final TelemetryBridge telemetryBridge;
    private volatile boolean isOutdated = false;

    public SokoNativeBridge(Activity activity, PlayerBridge playerBridge, StorageBridge storageBridge, AuthBridge authBridge, TelemetryBridge telemetryBridge) {
        this.activity = activity;
        this.playerBridge = playerBridge;
        this.storageBridge = storageBridge;
        this.authBridge = authBridge;
        this.telemetryBridge = telemetryBridge;
    }

    @JavascriptInterface
    public String getAppVersion() {
        if (activity != null) {
            try {
                PackageInfo pInfo = activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0);
                if (pInfo.versionName != null && !pInfo.versionName.isEmpty()) {
                    return pInfo.versionName;
                }
            } catch (Exception ignored) {}
        }
        return "1.0.0";
    }

    @JavascriptInterface
    public int getAppVersionCode() {
        if (activity != null) {
            try {
                PackageInfo pInfo = activity.getPackageManager().getPackageInfo(activity.getPackageName(), 0);
                return pInfo.versionCode;
            } catch (Exception ignored) {}
        }
        return 1;
    }

    @JavascriptInterface
    public void setAppOutdated(final boolean outdated) {
        this.isOutdated = outdated;
        if (outdated && playerBridge != null) {
            try {
                playerBridge.stopAudio();
            } catch (Exception ignored) {}
        }
    }

    public boolean isAppOutdated() {
        return isOutdated;
    }

    @JavascriptInterface
    public void exitApp() {
        if (activity != null) {
            activity.runOnUiThread(() -> {
                try {
                    activity.finishAffinity();
                    System.exit(0);
                } catch (Exception e) {
                    Log.e(TAG, "Error finishing activity", e);
                }
            });
        }
    }

    @JavascriptInterface
    public void openExternalUrl(final String url) {
        if (activity != null && url != null && !url.trim().isEmpty()) {
            activity.runOnUiThread(() -> {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url.trim()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    activity.startActivity(intent);
                } catch (Exception e) {
                    Log.e(TAG, "Failed to open external url: " + url, e);
                }
            });
        }
    }

    @JavascriptInterface
    public boolean isNativeAvailable() {
        return true;
    }

    @JavascriptInterface
    public void launchGoogleLogin() {
        if (authBridge != null) authBridge.launchGoogleLogin();
    }

    @JavascriptInterface
    public void startGoogleLoginFlow() {
        if (authBridge != null) authBridge.startGoogleLoginFlow();
    }

    @JavascriptInterface
    public void fetchYtmApi(final String endpoint, final String jsonPayload, final String customCookie, final String callbackId) {
        if (authBridge != null) authBridge.fetchYtmApi(endpoint, jsonPayload, customCookie, callbackId);
    }

    @JavascriptInterface
    public String getStoredYtmCookies() {
        return authBridge != null ? authBridge.getStoredYtmCookies() : "";
    }

    @JavascriptInterface
    public void setStoredYtmCookies(final String cookies) {
        if (authBridge != null) authBridge.setStoredYtmCookies(cookies);
    }

    @JavascriptInterface
    public void clearStoredYtmCookies() {
        if (authBridge != null) authBridge.clearStoredYtmCookies();
    }

    @JavascriptInterface
    public void playAudio(final String urlOrAsset, final String title, final String artist, final String coverUrl) {
        if (playerBridge != null) playerBridge.playAudio(urlOrAsset, title, artist, coverUrl);
    }

    @JavascriptInterface
    public void pauseAudio() {
        if (playerBridge != null) playerBridge.pauseAudio();
    }

    @JavascriptInterface
    public void stopAudio() {
        if (playerBridge != null) playerBridge.stopAudio();
    }

    @JavascriptInterface
    public void setActivePlaybackId(final String videoId) {
        if (playerBridge != null) playerBridge.setActivePlaybackId(videoId);
    }

    @JavascriptInterface
    public String getActivePlaybackId() {
        return playerBridge != null ? playerBridge.getActivePlaybackId() : "";
    }

    @JavascriptInterface
    public void resumeAudio() {
        if (playerBridge != null) playerBridge.resumeAudio();
    }

    @JavascriptInterface
    public void seekAudio(final int seconds) {
        if (playerBridge != null) playerBridge.seekAudio(seconds);
    }

    @JavascriptInterface
    public void updateNativePlayer(final String title, final String artist, final boolean isPlaying, final int durationSec, final int positionSec, final String coverUrl) {
        if (playerBridge != null) playerBridge.updateNativePlayer(title, artist, isPlaying, durationSec, positionSec, coverUrl);
    }

    @JavascriptInterface
    public void downloadAndPlayTrack(final String videoId, final String title, final String artist, final String coverUrl) {
        if (storageBridge != null) storageBridge.downloadAndPlayTrack(videoId, title, artist, coverUrl);
    }

    @JavascriptInterface
    public void downloadTrack(final String videoId, final String title, final String artist, final String coverUrl) {
        if (storageBridge != null) storageBridge.downloadTrack(videoId, title, artist, coverUrl);
    }

    @JavascriptInterface
    public boolean isTrackDownloaded(final String videoId) {
        return storageBridge != null && storageBridge.isTrackDownloaded(videoId);
    }

    @JavascriptInterface
    public String getDownloadedTrackPath(final String videoId) {
        return storageBridge != null ? storageBridge.getDownloadedTrackPath(videoId) : "";
    }

    @JavascriptInterface
    public boolean deleteDownloadedTrack(final String videoId) {
        return storageBridge != null && storageBridge.deleteDownloadedTrack(videoId);
    }

    @JavascriptInterface
    public int clearAllDownloadedTracks() {
        return storageBridge != null ? storageBridge.clearAllDownloadedTracks() : 0;
    }

    @JavascriptInterface
    public long getDiskStorageUsedBytes() {
        return storageBridge != null ? storageBridge.getDiskStorageUsedBytes() : 0L;
    }

    @JavascriptInterface
    public void sendTelemetryPing(final String urlString) {
        if (telemetryBridge != null) telemetryBridge.sendTelemetryPing(urlString);
    }

    @JavascriptInterface
    public void sendAuthenticatedTelemetryPing(final String urlString, final String cookies) {
        if (telemetryBridge != null) telemetryBridge.sendAuthenticatedTelemetryPing(urlString, cookies);
    }
}
