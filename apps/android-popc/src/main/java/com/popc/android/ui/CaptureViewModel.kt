package com.popc.android.ui

import android.content.Context
import android.os.Build
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.popc.android.api.PopcApiClient
import com.popc.android.c2pa.ManifestBuilder
import com.popc.android.crypto.CryptoUtils
import com.popc.android.crypto.KeystoreManager
import com.popc.android.data.EnrollmentStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import timber.log.Timber
import java.io.File
import java.time.Instant

class CaptureViewModel(
    private val keystoreManager: KeystoreManager,
    private val manifestBuilder: ManifestBuilder,
    private val apiClient: PopcApiClient,
    private val enrollmentStore: EnrollmentStore
) : ViewModel() {

    private val _state = MutableStateFlow(CaptureUiState())
    val state: StateFlow<CaptureUiState> = _state.asStateFlow()

    fun onCaptured(path: String) {
        viewModelScope.launch {
            try {
                val sha256 = withContext(Dispatchers.IO) {
                    val bytes = File(path).readBytes()
                    CryptoUtils.sha256Hex(bytes)
                }

                _state.value = _state.value.copy(
                    capturedPath = path,
                    sha256 = sha256,
                    error = null
                )

                Timber.i("Captured image: $path, SHA-256: ${sha256.take(16)}...")
            } catch (e: Exception) {
                Timber.e(e, "Failed to process captured image")
                _state.value = _state.value.copy(
                    error = "Failed to process image: ${e.message}"
                )
            }
        }
    }

    fun signAndVerify(context: Context) {
        viewModelScope.launch {
            _state.value = _state.value.copy(loading = true, error = null)

            try {
                // Check enrollment
                if (!enrollmentStore.isEnrolled()) {
                    _state.value = _state.value.copy(
                        loading = false,
                        error = "Enroll this device first"
                    )
                    return@launch
                }

                val capturedPath = _state.value.capturedPath
                if (capturedPath == null) {
                    _state.value = _state.value.copy(
                        loading = false,
                        error = "No image captured"
                    )
                    return@launch
                }

                val enrollment = enrollmentStore.getEnrollment()!!
                val deviceId = enrollment.deviceId

                // Read image bytes and compute hash
                val (imageBytes, hashHex) = withContext(Dispatchers.IO) {
                    val bytes = File(capturedPath).readBytes()
                    val hash = CryptoUtils.sha256Hex(bytes)
                    bytes to hash
                }

                Timber.i("Signing image with hash: ${hashHex.take(16)}...")

                // Build assertions JSON for signing (matching C2PA verifier expectations)
                val assertionsJson = buildAssertionsJson(hashHex, deviceId)

                // Sign the assertions JSON
                val signature = withContext(Dispatchers.IO) {
                    keystoreManager.signData(assertionsJson.toByteArray())
                }

                Timber.i("Signature created: ${signature.take(20)}...")

                // Get public key
                val publicKey = keystoreManager.getPublicKey()
                    ?: throw IllegalStateException("Public key not found")

                // Build C2PA manifest
                val manifestJson = manifestBuilder.buildManifest(
                    assetHash = hashHex,
                    deviceId = deviceId,
                    publicKey = publicKey,
                    signature = signature,
                    metadata = mapOf(
                        "platform" to "android",
                        "model" to Build.MODEL,
                        "manufacturer" to Build.MANUFACTURER
                    )
                )

                // Save manifest sidecar
                val manifestPath = "$capturedPath.c2pa"
                withContext(Dispatchers.IO) {
                    File(manifestPath).writeText(manifestJson)
                }

                Timber.i("Manifest saved: $manifestPath")

                // Verify with API
                val response = withContext(Dispatchers.IO) {
                    apiClient.verify(
                        imageFile = File(capturedPath),
                        manifestFile = File(manifestPath)
                    )
                }

                Timber.i("Verification result: ${response.verdict} (${response.mode})")

                _state.value = _state.value.copy(
                    loading = false,
                    verificationId = response.verificationId,
                    mode = response.mode,
                    verdict = response.verdict,
                    confidence = response.confidence,
                    reasons = response.reasons,
                    error = null
                )

            } catch (e: Exception) {
                Timber.e(e, "Sign and verify failed")
                _state.value = _state.value.copy(
                    loading = false,
                    error = "Verification failed: ${e.message}"
                )
            }
        }
    }

    private fun buildAssertionsJson(assetHash: String, deviceId: String): String {
        // Build assertions object that matches what C2PA verifier expects
        val timestamp = Instant.now().toString()

        return """
            {
                "c2pa.hash.data": {
                    "algorithm": "sha256",
                    "hash": "$assetHash"
                },
                "popc.device.id": "$deviceId",
                "c2pa.timestamp": "$timestamp",
                "platform": "android",
                "model": "${Build.MODEL}"
            }
        """.trimIndent()
    }

    fun reset() {
        _state.value = CaptureUiState()
    }
}

data class CaptureUiState(
    val loading: Boolean = false,
    val capturedPath: String? = null,
    val sha256: String? = null,
    val verificationId: String? = null,
    val mode: String? = null,
    val verdict: String? = null,
    val confidence: Int? = null,
    val reasons: List<String> = emptyList(),
    val error: String? = null
)
