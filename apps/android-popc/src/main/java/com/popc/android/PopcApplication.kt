package com.popc.android

import android.app.Application
import timber.log.Timber

class PopcApplication : Application() {
    override fun onCreate() {
        super.onCreate()

        // Initialize Timber for logging
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        }

        Timber.i("PoPC Application started")
    }
}
