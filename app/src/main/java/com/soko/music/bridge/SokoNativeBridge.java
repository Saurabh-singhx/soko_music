package com.soko.music.bridge;

import android.webkit.JavascriptInterface;

public class SokoNativeBridge {
    private final PlayerBridge playerBridge;
    private final StorageBridge storageBridge;
    private final AuthBridge authBridge;
    private final TelemetryBridge telemetryBridge;

    public SokoNativeBridge(PlayerBridge playerBridge, StorageBridge storageBridge, AuthBridge authBridge, TelemetryBridge telemetryBridge) {
        this.playerBridge = playerBridge;
        this.storageBridge = storageBridge;
        this.authBridge = authBridge;
        this.telemetryBridge = telemetryBridge;
    }

    @JavascriptInterface
    public String getAppVersion() {
        return "1.0.0";
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
