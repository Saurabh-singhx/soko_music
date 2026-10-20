package com.soko.music.cache;

import android.content.Context;
import android.util.Log;
import java.io.File;

public class DiskCacheManager {
    private static final String TAG = "SokoMusic";
    private final Context context;

    public DiskCacheManager(Context context) {
        this.context = context;
    }

    public File getMusicDir() {
        File musicDir = new File(context.getFilesDir(), "music");
        if (!musicDir.exists()) {
            musicDir.mkdirs();
        }
        return musicDir;
    }

    public boolean isTrackDownloaded(final String videoId) {
        File targetFile = new File(getMusicDir(), videoId + ".m4a");
        return targetFile.exists() && targetFile.length() > 50000;
    }

    public String getDownloadedTrackPath(final String videoId) {
        File targetFile = new File(getMusicDir(), videoId + ".m4a");
        if (targetFile.exists() && targetFile.length() > 50000) {
            return targetFile.getAbsolutePath();
        }
        return "";
    }

    public boolean deleteDownloadedTrack(final String videoId) {
        try {
            File musicDir = getMusicDir();
            File targetFile = new File(musicDir, videoId + ".m4a");
            File partFile = new File(musicDir, videoId + ".part");
            boolean deleted = false;
            if (targetFile.exists()) {
                deleted = targetFile.delete();
            }
            if (partFile.exists()) {
                partFile.delete();
            }
            Log.d(TAG, "deleteDownloadedTrack: " + videoId + " -> " + deleted);
            return deleted;
        } catch (Exception e) {
            Log.e(TAG, "Error deleting track: " + videoId, e);
            return false;
        }
    }

    public int clearAllDownloadedTracks() {
        int count = 0;
        try {
            File musicDir = getMusicDir();
            if (musicDir.exists() && musicDir.isDirectory()) {
                File[] files = musicDir.listFiles();
                if (files != null) {
                    for (File f : files) {
                        if (f.isFile() && (f.getName().endsWith(".m4a") || f.getName().endsWith(".part"))) {
                            if (f.delete()) count++;
                        }
                    }
                }
            }
            Log.d(TAG, "clearAllDownloadedTracks: removed " + count + " files");
        } catch (Exception e) {
            Log.e(TAG, "Error clearing downloaded tracks", e);
        }
        return count;
    }

    public long getDiskStorageUsedBytes() {
        long total = 0;
        try {
            File musicDir = getMusicDir();
            if (musicDir.exists() && musicDir.isDirectory()) {
                File[] files = musicDir.listFiles();
                if (files != null) {
                    for (File f : files) {
                        if (f.isFile()) total += f.length();
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error calculating storage used", e);
        }
        return total;
    }
}
