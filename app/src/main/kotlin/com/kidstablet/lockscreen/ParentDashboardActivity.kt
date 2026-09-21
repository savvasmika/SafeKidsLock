package com.kidstablet.lockscreen

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.ComponentActivity

/**
 * Parent Controller Dashboard in 100% Kotlin.
 * Receives unlock requests in real time from child tablet and manages screen time.
 */
class ParentDashboardActivity : ComponentActivity(), NetworkPairingManager.UnlockEventListener {

    private lateinit var tvParentNetworkStatus: TextView
    private lateinit var cardIncomingRequest: View
    private lateinit var tvIncomingChildName: TextView
    private lateinit var tvMatchingPin: TextView
    private lateinit var btnApproveRemoteUnlock: Button
    private lateinit var btnRemoteLock: Button
    private lateinit var btnExtendTime15: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_parent_dashboard)

        tvParentNetworkStatus = findViewById(R.id.tvParentNetworkStatus)
        cardIncomingRequest = findViewById(R.id.cardIncomingRequest)
        tvIncomingChildName = findViewById(R.id.tvIncomingChildName)
        tvMatchingPin = findViewById(R.id.tvMatchingPin)
        btnApproveRemoteUnlock = findViewById(R.id.btnApproveRemoteUnlock)
        btnRemoteLock = findViewById(R.id.btnRemoteLock)
        btnExtendTime15 = findViewById(R.id.btnExtendTime15)

        tvParentNetworkStatus.text = "🟢 Συνδεδεμένο στο δίκτυο (${NetworkPairingManager.familyCode})"

        btnApproveRemoteUnlock.setOnClickListener {
            NetworkPairingManager.approveUnlock(
                requestId = null,
                autoUnlock = true,
                durationMinutes = 30,
                onDone = {
                    Toast.makeText(this, "✨ Το τάμπλετ ξεκλείδωσε απομακρυσμένα!", Toast.LENGTH_SHORT).show()
                    cardIncomingRequest.visibility = View.GONE
                }
            )
        }

        btnRemoteLock.setOnClickListener {
            NetworkPairingManager.remoteLockTablet {
                Toast.makeText(this, "🔒 Εντολή κλειδώματος στάλθηκε στο τάμπλετ!", Toast.LENGTH_SHORT).show()
            }
        }

        btnExtendTime15.setOnClickListener {
            NetworkPairingManager.notifyRemoteExtend(15)
            Toast.makeText(this, "⏳ Προστέθηκαν +15 λεπτά στο τάμπλετ!", Toast.LENGTH_SHORT).show()
        }

        NetworkPairingManager.addListener(this)
    }

    override fun onDestroy() {
        super.onDestroy()
        NetworkPairingManager.removeListener(this)
    }

    override fun onUnlockRequested(childName: String, pin: String, durationMinutes: Int) {
        runOnUiThread {
            cardIncomingRequest.visibility = View.VISIBLE
            tvIncomingChildName.text = "Το παιδί ($childName) ζητάει ξεκλείδωμα ($durationMinutes λεπτά)."
            tvMatchingPin.text = pin
            Toast.makeText(this, "🔔 Νέο αίτημα ξεκλειδώματος! PIN: $pin", Toast.LENGTH_LONG).show()
        }
    }

    override fun onUnlockApproved(autoUnlock: Boolean, pin: String) {
        runOnUiThread {
            cardIncomingRequest.visibility = View.GONE
        }
    }

    override fun onRemoteLock() {
        // Handled on tablet
    }

    override fun onRemoteExtend(additionalMinutes: Int) {
        // Handled on tablet
    }
}
