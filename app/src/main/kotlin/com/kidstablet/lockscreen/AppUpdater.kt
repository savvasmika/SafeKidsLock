package com.kidstablet.lockscreen

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Handler
import android.os.Looper
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

/**
 * AppUpdater: Checks GitHub Repository for newer commits, releases, and APK builds.
 */
object AppUpdater {

    const val DEFAULT_REPO = "savvasmika/SafeKidsLock"
    const val CURRENT_VERSION = "v1.0.0"

    interface UpdateCheckCallback {
        fun onUpdateAvailable(latestCommitMsg: String, shortSha: String, commitUrl: String, apkUrl: String?)
        fun onUpToDate(currentVersion: String)
        fun onError(message: String)
    }

    fun checkForUpdates(
        context: Context,
        repo: String = DEFAULT_REPO,
        callback: UpdateCheckCallback
    ) {
        val mainHandler = Handler(Looper.getMainLooper())

        thread {
            try {
                val cleanRepo = repo.trim().removePrefix("https://github.com/").removeSuffix(".git")
                val url = URL("https://api.github.com/repos/$cleanRepo/commits?per_page=1")
                val connection = url.openConnection() as HttpURLConnection
                connection.requestMethod = "GET"
                connection.setRequestProperty("Accept", "application/vnd.github.v3+json")
                connection.setRequestProperty("User-Agent", "KidsSafeKiosk-App")
                connection.connectTimeout = 8000
                connection.readTimeout = 8000

                if (connection.responseCode == 200) {
                    val reader = BufferedReader(InputStreamReader(connection.inputStream))
                    val response = reader.readText()
                    reader.close()

                    val jsonArray = JSONArray(response)
                    if (jsonArray.length() > 0) {
                        val firstCommit = jsonArray.getJSONObject(0)
                        val sha = firstCommit.getString("sha")
                        val shortSha = sha.take(7)
                        val commitObj = firstCommit.getJSONObject("commit")
                        val message = commitObj.getString("message").lines().firstOrNull() ?: "Update available"
                        val commitUrl = firstCommit.optString("html_url", "https://github.com/$cleanRepo")

                        // Try to check latest release APK
                        var apkDownloadUrl: String? = null
                        try {
                            val relUrl = URL("https://api.github.com/repos/$cleanRepo/releases/latest")
                            val relConn = relUrl.openConnection() as HttpURLConnection
                            relConn.requestMethod = "GET"
                            relConn.setRequestProperty("Accept", "application/vnd.github.v3+json")
                            relConn.setRequestProperty("User-Agent", "KidsSafeKiosk-App")
                            if (relConn.responseCode == 200) {
                                val relReader = BufferedReader(InputStreamReader(relConn.inputStream))
                                val relResp = relReader.readText()
                                relReader.close()
                                val relObj = JSONObject(relResp)
                                val assets = relObj.optJSONArray("assets")
                                if (assets != null) {
                                    for (i in 0 until assets.length()) {
                                        val asset = assets.getJSONObject(i)
                                        val name = asset.optString("name", "")
                                        if (name.endsWith(".apk")) {
                                            apkDownloadUrl = asset.optString("browser_download_url")
                                            break
                                        }
                                    }
                                }
                            }
                        } catch (_: Exception) {}

                        mainHandler.post {
                            callback.onUpdateAvailable(
                                latestCommitMsg = message,
                                shortSha = shortSha,
                                commitUrl = commitUrl,
                                apkUrl = apkDownloadUrl
                            )
                        }
                    } else {
                        mainHandler.post { callback.onUpToDate(CURRENT_VERSION) }
                    }
                } else if (connection.responseCode == 404) {
                    mainHandler.post {
                        callback.onError("Το αποθετήριο '$cleanRepo' δεν βρέθηκε στο GitHub.")
                    }
                } else {
                    mainHandler.post {
                        callback.onError("Σφάλμα GitHub API (HTTP ${connection.responseCode})")
                    }
                }
            } catch (e: Exception) {
                mainHandler.post {
                    callback.onError(e.localizedMessage ?: "Αποτυχία σύνδεσης στο διαδίκτυο.")
                }
            }
        }
    }

    fun openBrowserUrl(context: Context, url: String) {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        context.startActivity(intent)
    }
}
