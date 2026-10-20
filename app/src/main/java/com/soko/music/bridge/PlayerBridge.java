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
    public void updateNativePlayer(final String title, final String artist, final boolean isPlaying, final int durationSec, final int positionSec, final String coverUrl) {
        if (mediaNotificationManager != null) {
            mediaNotificationManager.updateNotificationAndSession(title, artist, isPlaying, durationSec, positionSec, coverUrl, false);
        }
    }
}
