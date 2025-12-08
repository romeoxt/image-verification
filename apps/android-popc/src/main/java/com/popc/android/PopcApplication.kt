package com.popc.android

import android.app.Application
import com.popc.android.utils.ReleaseTree
import timber.log.Timber

class PopcApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        // Initialize Timber for logging - Minimize logging to save battery
        if (BuildConfig.DEBUG) {
            // Development: Log important events only (not VERBOSE)
            Timber.plant(object : Timber.DebugTree() {
                override fun log(priority: Int, tag: String?, message: String, t: Throwable?) {
                    // Skip VERBOSE and DEBUG logs to reduce battery drain
                    if (priority >= android.util.Log.INFO) {
                        super.log(priority, tag, message, t)
                    }
                }
            })
            Timber.i("PoPC Application started (DEBUG MODE - INFO+ only)")
        } else {
            // Production: Only log errors and warnings, save battery
            Timber.plant(ReleaseTree())
        }
    }
}
