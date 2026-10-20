package com.soko.music.bridge;

import android.webkit.JavascriptInterface;
import com.soko.music.util.CryptoUtil;
import java.net.HttpURLConnection;
import java.net.URL;

public class TelemetryBridge {
    @JavascriptInterface
    public void sendTelemetryPing(final String urlString) {
        sendAuthenticatedTelemetryPing(urlString, null);
    }

    @JavascriptInterface
    public void sendAuthenticatedTelemetryPing(final String urlString, final String cookies) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    URL url = new URL(urlString);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("GET");
                    conn.setConnectTimeout(5000);
                    conn.setReadTimeout(5000);
                    conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Linux; Android 14; Pixel 8)");
                    conn.setRequestProperty("X-YouTube-Client-Name", "67");
                    conn.setRequestProperty("X-YouTube-Client-Version", "1.20240101.01.00");
                    conn.setRequestProperty("X-Origin", "https://music.youtube.com");

                    if (cookies != null && !cookies.isEmpty()) {
                        conn.setRequestProperty("Cookie", cookies);
                        String sapisid = "";
                        for (String part : cookies.split(";")) {
                            String trimmed = part.trim();
                            if (trimmed.startsWith("SAPISID=")) {
                                sapisid = trimmed.substring("SAPISID=".length());
                                break;
                            } else if (trimmed.startsWith("__Secure-3PAPISID=")) {
                                sapisid = trimmed.substring("__Secure-3PAPISID=".length());
                            }
                        }
                        if (!sapisid.isEmpty()) {
                            String authHeader = CryptoUtil.generateSapisidHash(sapisid);
                            if (authHeader != null && !authHeader.isEmpty()) {
                                conn.setRequestProperty("Authorization", authHeader);
                            }
                        }
                    }

                    conn.getInputStream().close();
                    conn.disconnect();
                } catch (Exception ignored) {}
            }
        }).start();
    }
}
