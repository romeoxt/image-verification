package com.popc.android.ui

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.popc.android.ServiceLocator

/**
 * Factory for creating ViewModels with dependencies
 */
class ViewModelFactory(
    private val context: Context
) : ViewModelProvider.Factory {

    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        return when {
            modelClass.isAssignableFrom(EnrollViewModel::class.java) -> {
                EnrollViewModel(
                    keystoreManager = ServiceLocator.provideKeystoreManager(context),
                    apiClient = ServiceLocator.provideApiClient(),
                    enrollmentStore = ServiceLocator.provideEnrollmentStore(context)
                ) as T
            }
            modelClass.isAssignableFrom(CaptureViewModel::class.java) -> {
                CaptureViewModel(
                    keystoreManager = ServiceLocator.provideKeystoreManager(context),
                    manifestBuilder = ServiceLocator.provideManifestBuilder(),
                    apiClient = ServiceLocator.provideApiClient(),
                    enrollmentStore = ServiceLocator.provideEnrollmentStore(context),
                    locationHelper = ServiceLocator.provideLocationHelper(context),
                    sensorHelper = ServiceLocator.provideSensorHelper(context)
                ) as T
            }
            modelClass.isAssignableFrom(EvidenceViewModel::class.java) -> {
                EvidenceViewModel(
                    apiClient = ServiceLocator.provideApiClient()
                ) as T
            }
            modelClass.isAssignableFrom(ImportViewModel::class.java) -> {
                ImportViewModel(
                    context = context,
                    keystoreManager = ServiceLocator.provideKeystoreManager(context),
                    manifestBuilder = ServiceLocator.provideManifestBuilder(),
                    apiClient = ServiceLocator.provideApiClient(),
                    enrollmentStore = ServiceLocator.provideEnrollmentStore(context)
                ) as T
            }
            else -> throw IllegalArgumentException("Unknown ViewModel class: ${modelClass.name}")
        }
    }
}
