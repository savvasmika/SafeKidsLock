package com.kidstablet.lockscreen

import android.app.admin.DeviceAdminReceiver
import android.content.Context
import android.content.Intent
import android.widget.Toast

/**
 * DeviceAdminReceiver for Android 15 (API 35) Lock Task Mode (Kiosk mode).
 * Enables pinning the app so a child cannot exit without parental approval.
 */
class KidsDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Toast.makeText(context, "KidsSafe Kiosk: Προστασία Διαχειριστή Ενεργοποιήθηκε", Toast.LENGTH_SHORT).show()
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Toast.makeText(context, "KidsSafe Kiosk: Προστασία Διαχειριστή Απενεργοποιήθηκε", Toast.LENGTH_SHORT).show()
    }
}
