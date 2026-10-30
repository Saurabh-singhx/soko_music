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
                    conn.setRequestProperty("User-Agent", AuthBridge.APP_USER_AGENT);
                    conn.setRequestProperty("X-YouTube-Client-Name", "67");
                    conn.setRequestProperty("X-YouTube-Client-Version", "1.20261020.10.00");
                    conn.setRequestProperty("Origin", "https://music.youtube.com");
                    conn.setRequestProperty("Referer", "https://music.youtube.com/");
                    conn.setRequestProperty("X-Origin", "https://music.youtube.com");

                    if (cookies != null && !cookies.isEmpty()) {
                        conn.setRequestProperty("Cookie", cookies);
                        String sapisid = "";
                        for (String part : cookies.split(";")) {
                            String trimmed = part.trim();
                            if (trimmed.startsWith("SAPISID=")) {
                                sapisid = trimmed.substring("SAPISID=".length());
                                break;
                            }
                        }
                        if (sapisid.isEmpty()) {
                            for (String part : cookies.split(";")) {
                                String trimmed = part.trim();
                                if (trimmed.startsWith("__Secure-3PAPISID=")) {
                                    sapisid = trimmed.substring("__Secure-3PAPISID=".length());
                                    break;
                                } else if (trimmed.startsWith("__Secure-1PAPISID=")) {
                                    sapisid = trimmed.substring("__Secure-1PAPISID=".length());
                                    break;
                                }
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
