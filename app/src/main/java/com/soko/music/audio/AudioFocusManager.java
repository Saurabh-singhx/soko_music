package com.soko.music.audio;

import android.content.Context;
import android.media.AudioManager;
import android.webkit.WebView;

public class AudioFocusManager {
    private final AudioManager audioManager;
    private final WebView webView;
    private final AudioManager.OnAudioFocusChangeListener audioFocusChangeListener;

    public AudioFocusManager(Context context, final WebView webView) {
        this.audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        this.webView = webView;
        this.audioFocusChangeListener = new AudioManager.OnAudioFocusChangeListener() {
            @Override
            public void onAudioFocusChange(int focusChange) {
                if (focusChange == AudioManager.AUDIOFOCUS_LOSS ||
                    focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
                    if (webView != null) {
                        webView.post(new Runnable() {
                            @Override
                            public void run() {
                                webView.evaluateJavascript("window.onNativeAudioFocusLost && window.onNativeAudioFocusLost()", null);
                            }
                        });
                    }
                }
            }
        };
    }

    public int requestAudioFocus() {
        if (audioManager == null) return AudioManager.AUDIOFOCUS_REQUEST_FAILED;
        return audioManager.requestAudioFocus(audioFocusChangeListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
    }

    public void abandonAudioFocus() {
        if (audioManager != null) {
            audioManager.abandonAudioFocus(audioFocusChangeListener);
        }
    }
}
