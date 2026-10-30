package com.soko.music.audio;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.os.Build;
import android.webkit.WebView;

public class AudioFocusManager {
    private final AudioManager audioManager;
    private final WebView webView;
    private final AudioManager.OnAudioFocusChangeListener audioFocusChangeListener;
    private AudioFocusRequest focusRequest;

    public AudioFocusManager(Context context, final WebView webView) {
        this.audioManager = (AudioManager) context.getSystemService(Context.AUDIO_SERVICE);
        this.webView = webView;
        this.audioFocusChangeListener = new AudioManager.OnAudioFocusChangeListener() {
            private boolean resumeOnFocusGain = false;

            @Override
            public void onAudioFocusChange(int focusChange) {
                if (focusChange == AudioManager.AUDIOFOCUS_LOSS) {
                    resumeOnFocusGain = false;
                    if (webView != null) {
                        webView.post(new Runnable() {
                            @Override
                            public void run() {
                                webView.evaluateJavascript("window.onNativeAudioFocusLost && window.onNativeAudioFocusLost()", null);
                            }
                        });
                    }
                } else if (focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT || focusChange == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK) {
                    resumeOnFocusGain = true;
                    if (webView != null) {
                        webView.post(new Runnable() {
                            @Override
                            public void run() {
                                webView.evaluateJavascript("window.onNativeAudioFocusTransientLost && window.onNativeAudioFocusTransientLost()", null);
                            }
                        });
                    }
                } else if (focusChange == AudioManager.AUDIOFOCUS_GAIN) {
                    if (resumeOnFocusGain) {
                        resumeOnFocusGain = false;
                        if (webView != null) {
                            webView.post(new Runnable() {
                                @Override
                                public void run() {
                                    webView.evaluateJavascript("window.onNativeAudioFocusGained && window.onNativeAudioFocusGained()", null);
                                }
                            });
                        }
                    }
                }
            }
        };

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes playbackAttributes = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();
            focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(playbackAttributes)
                .setAcceptsDelayedFocusGain(true)
                .setOnAudioFocusChangeListener(audioFocusChangeListener)
                .build();
        }
    }

    public int requestAudioFocus() {
        if (audioManager == null) return AudioManager.AUDIOFOCUS_REQUEST_FAILED;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && focusRequest != null) {
            return audioManager.requestAudioFocus(focusRequest);
        } else {
            return audioManager.requestAudioFocus(audioFocusChangeListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN);
        }
    }

    public void abandonAudioFocus() {
        if (audioManager != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && focusRequest != null) {
                audioManager.abandonAudioFocusRequest(focusRequest);
            } else {
                audioManager.abandonAudioFocus(audioFocusChangeListener);
            }
        }
    }
}
