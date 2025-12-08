package com.popc.android.utils

import android.util.Log
import timber.log.Timber

/**
 * Release-optimized Timber tree that:
 * 1. Only logs ERROR and WTF levels (production crash reporting)
 * 2. Strips out verbose logs completely
 * 3. Reduces battery drain from excessive logging
 */
class ReleaseTree : Timber.Tree() {
    
    override fun isLoggable(tag: String?, priority: Int): Boolean {
        // Only log errors in production
        return priority >= Log.ERROR
    }
    
    override fun log(priority: Int, tag: String?, message: String, t: Throwable?) {
        if (!isLoggable(tag, priority)) {
            return
        }
        
        // In production, you'd send these to crash reporting (Firebase Crashlytics, Sentry, etc.)
        // For now, just use Android's Log.e for errors
        if (priority == Log.ERROR || priority == Log.ASSERT) {
            if (t != null) {
                Log.e(tag, message, t)
            } else {
                Log.e(tag, message)
            }
        }
    }
}

