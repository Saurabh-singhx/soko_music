package com.soko.music.bridge;

import android.webkit.JavascriptInterface;
import java.net.HttpURLConnection;
import java.net.URL;

public class TelemetryBridge {
    @JavascriptInterface
    public void sendTelemetryPing(final String urlString) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    URL url = new URL(urlString);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setConnectTimeout(4000);
                    conn.setReadTimeout(4000);
                    conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Pixel 8)");
                    conn.getInputStream().close();
                    conn.disconnect();
                } catch (Exception ignored) {}
            }
        }).start();
    }
}
