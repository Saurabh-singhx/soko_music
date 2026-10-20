package com.soko.music.util;

import java.security.MessageDigest;

public final class CryptoUtil {
    private CryptoUtil() {}

    public static String generateSapisidHash(String sapisid) {
        try {
            long timestamp = System.currentTimeMillis() / 1000L;
            String origin = "https://music.youtube.com";
            String raw = timestamp + " " + sapisid + " " + origin;
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] bytes = md.digest(raw.getBytes("UTF-8"));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return "SAPISIDHASH " + timestamp + "_" + sb.toString();
        } catch (Exception e) {
            return "";
        }
    }
}
