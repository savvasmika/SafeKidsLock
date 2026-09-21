package com.kidstablet.lockscreen

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.activity.ComponentActivity

/**
 * Main Mode Selection Activity in 100% Kotlin.
 * Allows choosing between Child Tablet Kiosk mode and Parent Dashboard mode.
 */
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val btnChildMode = findViewById<Button>(R.id.btnChildMode)
        val btnParentMode = findViewById<Button>(R.id.btnParentMode)
        val tvNetworkInfo = findViewById<TextView>(R.id.tvNetworkInfo)

        tvNetworkInfo.text = "📡 Αυτόματη σύνδεση δικτύου: ${NetworkPairingManager.familyCode}"

        btnChildMode.setOnClickListener {
            val intent = Intent(this, ChildKioskActivity::class.java)
            startActivity(intent)
        }

        btnParentMode.setOnClickListener {
            val intent = Intent(this, ParentDashboardActivity::class.java)
            startActivity(intent)
        }
    }
}
