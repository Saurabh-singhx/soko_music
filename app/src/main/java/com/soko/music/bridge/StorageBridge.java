package com.soko.music.bridge;

import android.webkit.JavascriptInterface;
import com.soko.music.cache.DiskCacheManager;
import com.soko.music.cache.TrackDownloader;

public class StorageBridge {
    private final TrackDownloader trackDownloader;
    private final DiskCacheManager diskCacheManager;

    public StorageBridge(TrackDownloader trackDownloader, DiskCacheManager diskCacheManager) {
        this.trackDownloader = trackDownloader;
        this.diskCacheManager = diskCacheManager;
    }

    @JavascriptInterface
    public void downloadAndPlayTrack(final String videoId, final String title, final String artist, final String coverUrl) {
        trackDownloader.downloadAndPlayTrack(videoId, title, artist, coverUrl, true);
    }

    @JavascriptInterface
    public void downloadTrack(final String videoId, final String title, final String artist, final String coverUrl) {
        trackDownloader.downloadAndPlayTrack(videoId, title, artist, coverUrl, false);
    }

    @JavascriptInterface
    public boolean isTrackDownloaded(final String videoId) {
        return diskCacheManager.isTrackDownloaded(videoId);
    }

    @JavascriptInterface
    public String getDownloadedTrackPath(final String videoId) {
        return diskCacheManager.getDownloadedTrackPath(videoId);
    }

    @JavascriptInterface
    public boolean deleteDownloadedTrack(final String videoId) {
        return diskCacheManager.deleteDownloadedTrack(videoId);
    }

    @JavascriptInterface
    public int clearAllDownloadedTracks() {
        return diskCacheManager.clearAllDownloadedTracks();
    }

    @JavascriptInterface
    public long getDiskStorageUsedBytes() {
        return diskCacheManager.getDiskStorageUsedBytes();
    }
}
