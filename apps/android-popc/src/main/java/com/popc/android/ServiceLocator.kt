package com.popc.android

import android.content.Context
import com.popc.android.api.PopcApiClientV2
import com.popc.android.c2pa.ManifestBuilder
import com.popc.android.crypto.KeystoreManager
import com.popc.android.data.EnrollmentStore

/**
 * Simple service locator for dependency injection
 */
object ServiceLocator {
    private var keystoreManager: KeystoreManager? = null
    private var manifestBuilder: ManifestBuilder? = null
    private var apiClient: PopcApiClientV2? = null
    private var enrollmentStore: EnrollmentStore? = null

    fun provideKeystoreManager(context: Context? = null): KeystoreManager {
        return keystoreManager ?: KeystoreManager(context?.applicationContext).also { keystoreManager = it }
    }

    fun provideManifestBuilder(): ManifestBuilder {
        return manifestBuilder ?: ManifestBuilder().also { manifestBuilder = it }
    }

    fun provideApiClient(baseUrl: String = BuildConfig.BASE_URL): PopcApiClientV2 {
        return apiClient ?: PopcApiClientV2(baseUrl).also { apiClient = it }
    }

    fun provideEnrollmentStore(context: Context): EnrollmentStore {
        return enrollmentStore ?: EnrollmentStore(context.applicationContext).also {
            enrollmentStore = it
        }
    }

    fun reset() {
        keystoreManager = null
        manifestBuilder = null
        apiClient = null
        enrollmentStore = null
    }
}
