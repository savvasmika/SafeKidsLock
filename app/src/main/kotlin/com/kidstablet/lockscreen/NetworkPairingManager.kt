package com.kidstablet.lockscreen

import android.os.Handler
import android.os.Looper
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Kotlin Network & Pairing Manager.
 * Connects Parent and Child devices over the local network using family room codes.
 */
object NetworkPairingManager {

    var familyCode: String = "FAMILY-1001"
    var serverBaseUrl: String = "http://localhost:3000"

    private val client = OkHttpClient.Builder()
        .connectTimeout(10, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.SECONDS) // For SSE
        .build()

    private val JSON = "application/json; charset=utf-8".toMediaType()
    private val mainHandler = Handler(Looper.getMainLooper())

    interface UnlockEventListener {
        fun onUnlockRequested(childName: String, pin: String, durationMinutes: Int)
        fun onUnlockApproved(autoUnlock: Boolean, pin: String)
        fun onRemoteLock()
        fun onRemoteExtend(additionalMinutes: Int)
    }

    private val listeners = mutableListOf<UnlockEventListener>()

    fun addListener(listener: UnlockEventListener) {
        listeners.add(listener)
    }

    fun removeListener(listener: UnlockEventListener) {
        listeners.remove(listener)
    }

    /**
     * Child requests unlock code from parent
     */
    fun requestUnlockFromParent(
        childName: String,
        durationMinutes: Int,
        onSuccess: (pin: String) -> Unit,
        onError: (String) -> Unit
    ) {
        val payload = JSONObject().apply {
            put("familyCode", familyCode)
            put("childName", childName)
            put("durationMinutes", durationMinutes)
        }

        val request = Request.Builder()
            .url("$serverBaseUrl/api/pair/request-unlock")
            .post(payload.toString().toRequestBody(JSON))
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                // Generate local fallback matching PIN
                val fallbackPin = (1000..9999).random().toString()
                mainHandler.post {
                    notifyUnlockRequested(childName, fallbackPin, durationMinutes)
                    onSuccess(fallbackPin)
                }
            }

            override fun onResponse(call: Call, response: Response) {
                response.use {
                    if (it.isSuccessful) {
                        val bodyStr = it.body?.string() ?: "{}"
                        val json = JSONObject(bodyStr)
                        val pin = json.optString("pin", "1234")
                        mainHandler.post {
                            onSuccess(pin)
                        }
                    } else {
                        val fallbackPin = (1000..9999).random().toString()
                        mainHandler.post { onSuccess(fallbackPin) }
                    }
                }
            }
        })
    }

    /**
     * Parent approves unlock
     */
    fun approveUnlock(
        requestId: String?,
        autoUnlock: Boolean = true,
        durationMinutes: Int = 30,
        onDone: () -> Unit
    ) {
        val payload = JSONObject().apply {
            put("familyCode", familyCode)
            put("requestId", requestId ?: "default")
            put("autoUnlock", autoUnlock)
            put("durationMinutes", durationMinutes)
        }

        val request = Request.Builder()
            .url("$serverBaseUrl/api/pair/approve-unlock")
            .post(payload.toString().toRequestBody(JSON))
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                mainHandler.post {
                    notifyUnlockApproved(autoUnlock, "0000")
                    onDone()
                }
            }

            override fun onResponse(call: Call, response: Response) {
                mainHandler.post {
                    notifyUnlockApproved(autoUnlock, "0000")
                    onDone()
                }
            }
        })
    }

    /**
     * Parent triggers remote lock
     */
    fun remoteLockTablet(onDone: () -> Unit) {
        val payload = JSONObject().apply {
            put("familyCode", familyCode)
        }
        val request = Request.Builder()
            .url("$serverBaseUrl/api/pair/remote-action")
            .post(payload.toString().toRequestBody(JSON))
            .build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                mainHandler.post {
                    notifyRemoteLock()
                    onDone()
                }
            }
            override fun onResponse(call: Call, response: Response) {
                mainHandler.post {
                    notifyRemoteLock()
                    onDone()
                }
            }
        })
    }

    fun notifyUnlockRequested(childName: String, pin: String, durationMinutes: Int) {
        listeners.forEach { it.onUnlockRequested(childName, pin, durationMinutes) }
    }

    fun notifyUnlockApproved(autoUnlock: Boolean, pin: String) {
        listeners.forEach { it.onUnlockApproved(autoUnlock, pin) }
    }

    fun notifyRemoteLock() {
        listeners.forEach { it.onRemoteLock() }
    }

    fun notifyRemoteExtend(additionalMinutes: Int) {
        listeners.forEach { it.onRemoteExtend(additionalMinutes) }
    }
}
