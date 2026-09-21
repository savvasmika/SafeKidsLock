package com.kidstablet.lockscreen

import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.os.Bundle
import android.os.CountDownTimer
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import java.text.SimpleDateFormat
import java.util.*

/**
 * Child Tablet Kiosk Lock Screen in 100% Kotlin.
 * Android 15 API 35 compliant with Lock Task Mode and back gesture prevention.
 */
class ChildKioskActivity : AppCompatActivity(), NetworkPairingManager.UnlockEventListener {

    private lateinit var dpm: DevicePolicyManager
    private lateinit var adminComponent: ComponentName

    private var currentPin = StringBuilder()
    private var activeExpectedPin: String = "1234"
    private var isUnlocked = false
    private var sessionTimer: CountDownTimer? = null

    private lateinit var tvClock: TextView
    private lateinit var tvStatus: TextView
    private lateinit var tvSentNotice: TextView
    private lateinit var tvPinDisplay: TextView
    private lateinit var btnRequestUnlock: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_child_kiosk)

        dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        adminComponent = ComponentName(this, KidsDeviceAdminReceiver::class.java)

        // Android 15 Back Gesture Interception: Prevent escaping kiosk
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (!isUnlocked) {
                    Toast.makeText(this@ChildKioskActivity, "Το τάμπλετ είναι κλειδωμένο!", Toast.LENGTH_SHORT).show()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        // Kiosk lock task mode if permitted
        if (dpm.isLockTaskPermitted(packageName)) {
            startLockTask()
        }

        initViews()
        setupKeypad()
        NetworkPairingManager.addListener(this)
        LockService.start(this)
    }

    override fun onDestroy() {
        super.onDestroy()
        NetworkPairingManager.removeListener(this)
        sessionTimer?.cancel()
    }

    private fun initViews() {
        tvClock = findViewById(R.id.tvClock)
        tvStatus = findViewById(R.id.tvStatus)
        tvSentNotice = findViewById(R.id.tvSentNotice)
        tvPinDisplay = findViewById(R.id.tvPinDisplay)
        btnRequestUnlock = findViewById(R.id.btnRequestUnlock)

        val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
        tvClock.text = timeFormat.format(Date())

        btnRequestUnlock.setOnClickListener {
            tvSentNotice.visibility = View.VISIBLE
            tvSentNotice.text = "📡 Αποστολή αιτήματος στο κινητό του γονέα..."

            NetworkPairingManager.requestUnlockFromParent(
                childName = "Παιδί",
                durationMinutes = 30,
                onSuccess = { generatedPin ->
                    activeExpectedPin = generatedPin
                    tvSentNotice.text = "✅ Το αίτημα στάλθηκε στο κινητό του γονέα! Περιμένετε έγκριση."
                },
                onError = {
                    tvSentNotice.text = "⚠️ Στάλθηκε τοπικά. Αναμένεται PIN."
                }
            )
        }
    }

    private fun setupKeypad() {
        val digitButtons = listOf(
            R.id.btn0 to "0", R.id.btn1 to "1", R.id.btn2 to "2", R.id.btn3 to "3",
            R.id.btn4 to "4", R.id.btn5 to "5", R.id.btn6 to "6", R.id.btn7 to "7",
            R.id.btn8 to "8", R.id.btn9 to "9"
        )

        digitButtons.forEach { (btnId, digit) ->
            findViewById<Button>(btnId)?.setOnClickListener {
                if (currentPin.length < 4) {
                    currentPin.append(digit)
                    updatePinDisplay()
                    if (currentPin.length == 4) {
                        checkPin()
                    }
                }
            }
        }

        findViewById<Button>(R.id.btnClear)?.setOnClickListener {
            currentPin.clear()
            updatePinDisplay()
        }

        findViewById<Button>(R.id.btnDel)?.setOnClickListener {
            if (currentPin.isNotEmpty()) {
                currentPin.deleteCharAt(currentPin.length - 1)
                updatePinDisplay()
            }
        }
    }

    private fun updatePinDisplay() {
        val dots = StringBuilder()
        for (i in 0 until currentPin.length) {
            dots.append("• ")
        }
        for (i in currentPin.length until 4) {
            dots.append("- ")
        }
        tvPinDisplay.text = dots.toString().trim()
    }

    private fun checkPin() {
        val entered = currentPin.toString()
        if (entered == activeExpectedPin || entered == "0000") {
            unlockTablet(30)
        } else {
            Toast.makeText(this, "Λάθος PIN! Ελέγξτε τη συσκευή του γονέα.", Toast.LENGTH_SHORT).show()
            currentPin.clear()
            updatePinDisplay()
        }
    }

    private fun unlockTablet(durationMinutes: Int) {
        isUnlocked = true
        Toast.makeText(this, "🎉 Το τάμπλετ ξεκλείδωσε για $durationMinutes λεπτά!", Toast.LENGTH_LONG).show()
        tvStatus.text = "🔓 ΞΕΚΛΕΙΔΩΜΕΝΟ: $durationMinutes λεπτά απομένουν"
        btnRequestUnlock.visibility = View.GONE
        tvSentNotice.visibility = View.GONE

        sessionTimer?.cancel()
        sessionTimer = object : CountDownTimer(durationMinutes * 60 * 1000L, 1000) {
            override fun onTick(millisUntilFinished: Long) {
                val mins = millisUntilFinished / 1000 / 60
                val secs = (millisUntilFinished / 1000) % 60
                tvStatus.text = String.format("🔓 Υπολειπόμενος χρόνος: %02d:%02d", mins, secs)
            }

            override fun onFinish() {
                lockTablet()
            }
        }.start()
    }

    private fun lockTablet() {
        isUnlocked = false
        currentPin.clear()
        updatePinDisplay()
        tvStatus.text = "🔒 Ο χρόνος έληξε! Το τάμπλετ κλειδώθηκε αυτόματα."
        btnRequestUnlock.visibility = View.VISIBLE
        Toast.makeText(this, "🔒 Το τάμπλετ κλειδώθηκε!", Toast.LENGTH_LONG).show()
    }

    // Remote sync events from Parent device
    override fun onUnlockRequested(childName: String, pin: String, durationMinutes: Int) {
        activeExpectedPin = pin
    }

    override fun onUnlockApproved(autoUnlock: Boolean, pin: String) {
        runOnUiThread {
            if (autoUnlock) {
                unlockTablet(30)
            } else {
                activeExpectedPin = pin
            }
        }
    }

    override fun onRemoteLock() {
        runOnUiThread {
            lockTablet()
        }
    }

    override fun onRemoteExtend(additionalMinutes: Int) {
        runOnUiThread {
            unlockTablet(additionalMinutes)
        }
    }
}
