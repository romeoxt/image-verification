package com.popc.android.ui

import android.content.Context
import android.os.Build
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.popc.android.api.PopcApiClientV2
import com.popc.android.c2pa.ManifestBuilder
import com.popc.android.crypto.CryptoUtils
import com.popc.android.crypto.KeystoreManager
import com.popc.android.data.EnrollmentStore
import com.popc.android.utils.ErrorMessageUtils
import com.popc.android.utils.ImageUtils
import com.popc.android.utils.LocationHelper
import com.popc.android.utils.MotionAnalysis
import com.popc.android.utils.SensorHelper
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import timber.log.Timber
import java.io.File

class CaptureViewModel(
    private val keystoreManager: KeystoreManager,
    private val manifestBuilder: ManifestBuilder,
    private val apiClient: PopcApiClientV2,
    private val enrollmentStore: EnrollmentStore,
    private val locationHelper: LocationHelper,
    private val sensorHelper: SensorHelper
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

                // Determine if it's a video or image
                val isVideo = capturedPath.endsWith(".mp4", ignoreCase = true)
                val mimeType = if (isVideo) "video/mp4" else "image/jpeg"

                // Prepare file for upload/signing
                val fileToUpload = if (isVideo) {
                    // For video, use the original file (no compression for now)
                    File(capturedPath)
                } else {
                    // For image, compress BEFORE signing so hash matches
                    withContext(Dispatchers.IO) {
                        ImageUtils.compressForUpload(
                            sourceFile = File(capturedPath),
                            context = context
                        )
                    }
                }
                
                // Read bytes and compute hash
                val fileHash = withContext(Dispatchers.IO) {
                    val bytes = fileToUpload.readBytes()
                    CryptoUtils.sha256Hex(bytes)
                }

                Timber.i("Signing ${if (isVideo) "video" else "image"} with hash: ${fileHash.take(16)}...")

                // Get location
                val location = locationHelper.getCurrentLocation()
                val locationData = if (location != null) {
                    mapOf(
                        "latitude" to location.latitude,
                        "longitude" to location.longitude,
                        "altitude" to location.altitude,
                        "accuracy" to location.accuracy,
                        "time" to location.time
                    )
                } else {
                    emptyMap()
                }

                Timber.i("Location captured: $locationData")

                // Capture sensor data (accelerometer/gyroscope) for anti-fraud
                val sensorSnapshot = sensorHelper.captureSensorSnapshot()
                
                // Extract motion features and classify
                val motionFeatures = MotionAnalysis.extractFeatures(
                    sensorSnapshot.accelerometer,
                    sensorSnapshot.gyroscope
                )
                val motionLabel = MotionAnalysis.classifyMotion(motionFeatures)
                
                val sensorData = mapOf(
                    "accelerometer" to sensorSnapshot.accelerometer,
                    "gyroscope" to sensorSnapshot.gyroscope,
                    "features" to mapOf(
                        "accMagMean" to motionFeatures.accMagMean,
                        "accMagStd" to motionFeatures.accMagStd,
                        "gyroMagMean" to motionFeatures.gyroMagMean,
                        "gyroMagStd" to motionFeatures.gyroMagStd
                    ),
                    "label" to motionLabel
                )
                
                Timber.i("Sensor data captured: ${sensorSnapshot.accelerometer.size} samples. Classification: $motionLabel")

                // Create assertions JSON object using ManifestBuilder
                val assertionsObj = manifestBuilder.createAssertions(
                    assetHash = fileHash,
                    deviceId = deviceId,
                    metadata = mapOf(
                        "format" to mimeType, // Explicit format assertion
                        "platform" to "android",
                        "model" to Build.MODEL,
                        "manufacturer" to Build.MANUFACTURER,
                        "location" to locationData,
                        "sensors" to sensorData,
                        "motion_label" to motionLabel
                    )
                )

                // Sign the assertions JSON string (minified)
                val assertionsJson = assertionsObj.toString()
                Timber.i("Signing assertions: $assertionsJson")

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
                    assertions = assertionsObj,
                    assetHash = fileHash,
                    publicKey = publicKey,
                    signature = signature
                )

                // Save manifest sidecar
                val manifestPath = "${fileToUpload.absolutePath}.c2pa"
                withContext(Dispatchers.IO) {
                    File(manifestPath).writeText(manifestJson)
                }

                Timber.i("Manifest saved: $manifestPath")

                // Verify with API
                val response = withContext(Dispatchers.IO) {
                    apiClient.verify(
                        imageFile = fileToUpload, // Use the correct file (video or compressed image)
                        manifestFile = File(manifestPath)
                    )
                }
                
                // Clean up temporary files
                withContext(Dispatchers.IO) {
                    // Only delete fileToUpload if it was a temporary compressed image
                    if (!isVideo) {
                        fileToUpload.delete()
                    }
                    File(manifestPath).delete()
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
                    error = ErrorMessageUtils.getFriendlyErrorMessage(e)
                )
            }
        }
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
