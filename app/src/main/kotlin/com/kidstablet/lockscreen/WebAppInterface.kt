package com.kidstablet.lockscreen

import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.BatteryManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.webkit.JavascriptInterface
import android.widget.Toast

class WebAppInterface(private val activity: Activity) {

    private val dpm = activity.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager
    private val adminComponent = ComponentName(activity, KidsDeviceAdminReceiver::class.java)

    @JavascriptInterface
    fun isNativeAndroid(): Boolean {
        return true
    }

    @JavascriptInterface
    fun getAndroidVersion(): String {
        return "Android ${Build.VERSION.RELEASE} (API ${Build.VERSION.SDK_INT})"
    }

    @JavascriptInterface
    fun showToast(message: String) {
        activity.runOnUiThread {
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun vibrate(durationMs: Long) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = activity.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                val vibrator = vibratorManager?.defaultVibrator
                vibrator?.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                val vibrator = activity.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
                @Suppress("DEPRECATION")
                vibrator?.vibrate(durationMs)
            }
        } catch (_: Exception) {}
    }

    @JavascriptInterface
    fun lockDevice(reason: String?) {
        activity.runOnUiThread {
            try {
                if (dpm != null && dpm.isAdminActive(adminComponent)) {
                    dpm.lockNow()
                } else if (dpm != null && dpm.isLockTaskPermitted(activity.packageName)) {
                    activity.startLockTask()
                }
                Toast.makeText(activity, "🔒 Τάμπλετ κλειδώθηκε: ${reason ?: "Αυτόματο κλείδωμα"}", Toast.LENGTH_SHORT).show()
            } catch (e: Exception) {
                Toast.makeText(activity, "Κλείδωμα: ${e.message}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    @JavascriptInterface
    fun unlockDevice() {
        activity.runOnUiThread {
            try {
                activity.stopLockTask()
            } catch (_: Exception) {}
            Toast.makeText(activity, "✨ Τάμπλετ ξεκλείδωσε!", Toast.LENGTH_SHORT).show()
        }
    }

    @JavascriptInterface
    fun openExternalUrl(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            activity.startActivity(intent)
        } catch (e: Exception) {
            showToast("Αδυναμία ανοίγματος συνδέσμου: ${e.message}")
        }
    }

    @JavascriptInterface
    fun getBatteryLevel(): Int {
        val bm = activity.getSystemService(Context.BATTERY_SERVICE) as? BatteryManager
        return bm?.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY) ?: 100
    }
}
