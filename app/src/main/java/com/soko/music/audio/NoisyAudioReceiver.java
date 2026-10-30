package com.soko.music.audio;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.media.AudioManager;
import android.webkit.WebView;

public class NoisyAudioReceiver extends BroadcastReceiver {
    private final WebView webView;
    private boolean isRegistered = false;

    public NoisyAudioReceiver(WebView webView) {
        this.webView = webView;
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent != null && AudioManager.ACTION_AUDIO_BECOMING_NOISY.equals(intent.getAction())) {
            if (webView != null) {
                webView.post(new Runnable() {
                    @Override
                    public void run() {
                        webView.evaluateJavascript("window.handleBecomingNoisy && window.handleBecomingNoisy()", null);
                    }
                });
            }
        }
    }

    public void register(Context context) {
        if (!isRegistered && context != null) {
            IntentFilter filter = new IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY);
            if (android.os.Build.VERSION.SDK_INT >= 33) {
                context.registerReceiver(this, filter, Context.RECEIVER_EXPORTED);
            } else {
                context.registerReceiver(this, filter);
            }
            isRegistered = true;
        }
    }

    public void unregister(Context context) {
        if (isRegistered && context != null) {
            try {
                context.unregisterReceiver(this);
            } catch (Exception ignored) {}
            isRegistered = false;
        }
    }
}
