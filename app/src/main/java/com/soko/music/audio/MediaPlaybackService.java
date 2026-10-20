package com.soko.music.audio;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;

public class MediaPlaybackService extends Service {
    private static final String TAG = "SokoMusic";
    public static final String ACTION_START = "com.soko.music.action.START";
    public static final String ACTION_STOP = "com.soko.music.action.STOP";

    private static volatile MediaPlaybackService sInstance = null;
    private static volatile Notification sPendingNotification = null;

    public static MediaPlaybackService getInstance() {
        return sInstance;
    }

    public static void startService(Context context, Notification notif) {
        sPendingNotification = notif;
        try {
            Intent intent = new Intent(context, MediaPlaybackService.class);
            intent.setAction(ACTION_START);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent);
            } else {
                context.startService(intent);
            }
        } catch (Exception e) {
            Log.e(TAG, "Failed to start MediaPlaybackService", e);
        }
    }

    public static void stopService(Context context) {
        sPendingNotification = null;
        try {
            Intent intent = new Intent(context, MediaPlaybackService.class);
            intent.setAction(ACTION_STOP);
            context.stopService(intent);
        } catch (Exception e) {
            Log.e(TAG, "Failed to stop MediaPlaybackService", e);
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        sInstance = this;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            stopForegroundState(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        Notification notif = sPendingNotification;
        if (notif == null) {
            notif = createFallbackNotification();
        }

        updateForegroundNotification(MediaNotificationManager.MEDIA_NOTIF_ID, notif, true);
        return START_STICKY;
    }

    public void updateForegroundNotification(int notifId, Notification notification, boolean isPlaying) {
        try {
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (isPlaying) {
                if (Build.VERSION.SDK_INT >= 29) {
                    startForeground(notifId, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
                } else {
                    startForeground(notifId, notification);
                }
            } else {
                if (Build.VERSION.SDK_INT >= 24) {
                    stopForeground(STOP_FOREGROUND_DETACH);
                } else {
                    stopForeground(false);
                }
            }
            if (nm != null) {
                nm.notify(notifId, notification);
            }
        } catch (Exception e) {
            Log.e(TAG, "updateForegroundNotification error", e);
        }
    }

    public void stopForegroundState(boolean removeNotification) {
        try {
            if (Build.VERSION.SDK_INT >= 24) {
                stopForeground(removeNotification ? STOP_FOREGROUND_REMOVE : STOP_FOREGROUND_DETACH);
            } else {
                stopForeground(removeNotification);
            }
        } catch (Exception e) {
            Log.e(TAG, "stopForegroundState error", e);
        }
    }

    private Notification createFallbackNotification() {
        Notification.Builder nb;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            nb = new Notification.Builder(this, MediaNotificationManager.MEDIA_CHANNEL_ID);
        } else {
            nb = new Notification.Builder(this);
        }
        nb.setContentTitle("Soko Music")
          .setContentText("Playback active")
          .setSmallIcon(android.R.drawable.ic_media_play)
          .setOngoing(true)
          .setCategory(Notification.CATEGORY_TRANSPORT)
          .setVisibility(Notification.VISIBILITY_PUBLIC);
        return nb.build();
    }

    private final android.os.Binder binder = new android.os.Binder();

    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    @Override
    public void onDestroy() {
        sInstance = null;
        sPendingNotification = null;
        super.onDestroy();
    }
}
