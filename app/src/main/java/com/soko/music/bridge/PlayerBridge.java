package com.soko.music.bridge;

import android.webkit.JavascriptInterface;
import com.soko.music.audio.AudioEngine;
import com.soko.music.audio.MediaNotificationManager;

public class PlayerBridge {
    private final AudioEngine audioEngine;
    private final MediaNotificationManager mediaNotificationManager;

    public PlayerBridge(AudioEngine audioEngine, MediaNotificationManager mediaNotificationManager) {
        this.audioEngine = audioEngine;
        this.mediaNotificationManager = mediaNotificationManager;
    }

    @JavascriptInterface
    public void playAudio(final String urlOrAsset, final String title, final String artist, final String coverUrl) {
        audioEngine.playNativeAudio(urlOrAsset, title, artist, coverUrl);
    }

    @JavascriptInterface
    public void pauseAudio() {
        audioEngine.pauseNativeAudio();
    }

    @JavascriptInterface
    public void stopAudio() {
        audioEngine.stopNativeAudio();
    }

    @JavascriptInterface
    public void setActivePlaybackId(final String videoId) {
        audioEngine.setActivePlaybackVideoId(videoId);
    }

    @JavascriptInterface
    public String getActivePlaybackId() {
        return audioEngine.getActivePlaybackVideoId();
    }

    @JavascriptInterface
    public void resumeAudio() {
        audioEngine.resumeNativeAudio();
    }

    @JavascriptInterface
    public void seekAudio(final int seconds) {
        audioEngine.seekNativeAudio(seconds);
    }

    @JavascriptInterface
    public boolean isAudioPlaying() {
        return audioEngine != null && audioEngine.isPlaying();
    }

    @JavascriptInterface
    public boolean hasActiveAudio() {
        return audioEngine != null && audioEngine.hasActiveAudio();
    }

    @JavascriptInterface
    public int getAudioPositionSec() {
        return audioEngine != null ? audioEngine.getCurrentPositionSec() : 0;
    }

    @JavascriptInterface
    public int getAudioDurationSec() {
        return audioEngine != null ? audioEngine.getDurationSec() : 0;
    }

    @JavascriptInterface
    public String getPlaybackStatusJson() {
        if (audioEngine == null) return "{\"isPlaying\":false}";
        boolean playing = audioEngine.isPlaying();
        int cur = audioEngine.getCurrentPositionSec();
        int dur = audioEngine.getDurationSec();
        String title = audioEngine.getCurrentTrackTitle();
        String artist = audioEngine.getCurrentTrackArtist();
        String cover = audioEngine.getCurrentCoverUrl();
        String id = audioEngine.getActivePlaybackVideoId();
        return "{\"isPlaying\":" + playing + "," +
               "\"position\":" + cur + "," +
               "\"duration\":" + dur + "," +
               "\"title\":\"" + escapeJson(title) + "\"," +
               "\"artist\":\"" + escapeJson(artist) + "\"," +
               "\"cover\":\"" + escapeJson(cover) + "\"," +
               "\"id\":\"" + escapeJson(id) + "\"}";
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "").replace("\r", "");
    }

    @JavascriptInterface
    public void updateNativePlayer(final String title, final String artist, final boolean isPlaying, final int durationSec, final int positionSec, final String coverUrl) {
        if (mediaNotificationManager != null) {
            mediaNotificationManager.updateNotificationAndSession(title, artist, isPlaying, durationSec, positionSec, coverUrl, false);
        }
    }
}
