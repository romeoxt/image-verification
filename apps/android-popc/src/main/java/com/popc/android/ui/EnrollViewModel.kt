package com.popc.android.ui

import android.os.Build
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.popc.android.api.EnrollmentException
import com.popc.android.api.PopcApiClientV2
import com.popc.android.crypto.CryptoUtils.toPem
import com.popc.android.crypto.KeystoreManager
import com.popc.android.data.EnrollmentData
import com.popc.android.data.EnrollmentStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import timber.log.Timber

class EnrollViewModel(
    private val keystoreManager: KeystoreManager,
    private val apiClient: PopcApiClientV2,
    private val enrollmentStore: EnrollmentStore
) : ViewModel() {

    private val _uiState = MutableLiveData<EnrollUiState>()
    val uiState: LiveData<EnrollUiState> = _uiState

    init {
        checkEnrollmentStatus()
    }

    private fun checkEnrollmentStatus() {
        val enrollment = enrollmentStore.getEnrollment()
        _uiState.value = if (enrollment != null) {
            EnrollUiState(
                loading = false,
                enrolled = true,
                deviceId = enrollment.deviceId,
                securityLevel = enrollment.securityLevel,
                verifiedBoot = enrollment.bootState,
                attestationType = enrollment.attestationType,
                error = null
            )
        } else {
            EnrollUiState(
                loading = false,
                enrolled = false,
                deviceId = null,
                securityLevel = null,
                verifiedBoot = null,
                attestationType = null,
                error = null
            )
        }
    }

    fun enroll() {
        viewModelScope.launch {
            _uiState.value = _uiState.value?.copy(loading = true, error = null)

            try {
                // Generate key with attestation
                val attestationResult = withContext(Dispatchers.IO) {
                    keystoreManager.generateKeyWithAttestation()
                }

                Timber.i("Generated key with security level: ${attestationResult.securityLevel}")

                // Convert cert chain to PEM
                val certChainPem = attestationResult.certChain.map { it.toPem() }

                // Prepare device metadata
                val deviceMetadata = mapOf(
                    "manufacturer" to Build.MANUFACTURER,
                    "model" to Build.MODEL,
                    "osVersion" to Build.VERSION.RELEASE,
                    "clientSecurityLevel" to attestationResult.securityLevel.name.lowercase()
                )

                // Enroll with API
                val response = withContext(Dispatchers.IO) {
                    apiClient.enroll(
                        platform = "android",
                        certChainPem = certChainPem,
                        challenge = null,
                        deviceMetadata = deviceMetadata
                    )
                }

                Timber.i("Enrollment successful: ${response.deviceId}")

                // Save enrollment data
                val enrollmentData = EnrollmentData(
                    deviceId = response.deviceId,
                    enrolledAt = response.enrolledAt,
                    securityLevel = response.attestationDetails?.securityLevel
                        ?: attestationResult.securityLevel.name.lowercase(),
                    attestationType = response.attestationDetails?.attestationType ?: "android_key_attestation",
                    hardwareBacked = response.attestationDetails?.hardwareBacked ?: true,
                    bootState = response.attestationDetails?.bootState
                )

                enrollmentStore.saveEnrollment(enrollmentData)

                _uiState.value = EnrollUiState(
                    loading = false,
                    enrolled = true,
                    deviceId = response.deviceId,
                    securityLevel = enrollmentData.securityLevel,
                    verifiedBoot = enrollmentData.bootState,
                    attestationType = enrollmentData.attestationType,
                    error = null,
                    warnings = response.warnings
                )

            } catch (e: EnrollmentException) {
                Timber.e(e, "Enrollment failed")
                _uiState.value = _uiState.value?.copy(
                    loading = false,
                    error = "${e.message}\nErrors: ${e.errors.joinToString(", ")}"
                )
            } catch (e: Exception) {
                Timber.e(e, "Enrollment error")
                _uiState.value = _uiState.value?.copy(
                    loading = false,
                    error = "Enrollment failed: ${e.message}"
                )
            }
        }
    }

    fun resetEnrollment() {
        viewModelScope.launch {
            withContext(Dispatchers.IO) {
                keystoreManager.deleteKey()
                enrollmentStore.clearEnrollment()
            }
            checkEnrollmentStatus()
        }
    }
}

data class EnrollUiState(
    val loading: Boolean = false,
    val enrolled: Boolean = false,
    val deviceId: String? = null,
    val securityLevel: String? = null,
    val verifiedBoot: String? = null,
    val attestationType: String? = null,
    val error: String? = null,
    val warnings: List<String>? = null
)
