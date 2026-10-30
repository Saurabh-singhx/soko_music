package com.soko.music.util;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class HttpUtil {
    private static volatile String cachedVisitorData = "";
    private static volatile int cachedSts = 20739;
    private static volatile long lastVisitorDataTime = 0;

    private HttpUtil() {}

    public static String getCachedVisitorData() {
        return cachedVisitorData;
    }

    public static int getCachedSts() {
        return cachedSts;
    }

    public static synchronized void ensureVisitorDataAndSts(String videoId) {
        String visitorData = cachedVisitorData;
        long nowTime = System.currentTimeMillis();

        if (visitorData.isEmpty() || (nowTime - lastVisitorDataTime > 4 * 3600 * 1000L)) {
            try {
                String pageUrl = "https://www.youtube.com/watch?v=" + videoId;
                HttpURLConnection pageConn = (HttpURLConnection) new URL(pageUrl).openConnection();
                pageConn.setRequestMethod("GET");
                pageConn.setConnectTimeout(8000);
                pageConn.setReadTimeout(8000);
                pageConn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0");

                BufferedReader reader = new BufferedReader(new InputStreamReader(pageConn.getInputStream()));
                StringBuilder pageSb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    pageSb.append(line);
                }
                reader.close();
                String pageHtml = pageSb.toString();

                Matcher mVis = Pattern.compile("\"visitorData\":\\s*\"([^\"]+)\"").matcher(pageHtml);
                if (mVis.find()) {
                    cachedVisitorData = mVis.group(1);
                }

                Matcher mSts = Pattern.compile("\"signatureTimestamp\":\\s*(\\d+)").matcher(pageHtml);
                if (mSts.find()) {
                    cachedSts = Integer.parseInt(mSts.group(1));
                }
                lastVisitorDataTime = nowTime;
            } catch (Exception ignored) {}
        }
    }
}
