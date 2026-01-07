package com.popc.android.ui

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.popc.android.api.PopcApiClientV2
import com.popc.android.c2pa.ManifestBuilder
import com.popc.android.crypto.CryptoUtils
import com.popc.android.crypto.KeystoreManager
import com.popc.android.data.EnrollmentStore
import com.popc.android.utils.ExifHelper
import com.popc.android.utils.ImageUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import timber.log.Timber
import java.io.File

data class ImportUiState(
    val loading: Boolean = false,
    val path: String? = null,
    val sha256: String? = null,
    val verificationId: String? = null,
    val mode: String? = null,
    val verdict: String? = null,
    val confidence: Int? = null,
    val reasons: List<String> = emptyList(),
    val error: String? = null
)

class ImportViewModel(
    private val context: Context,
    private val keystoreManager: KeystoreManager,
    private val manifestBuilder: ManifestBuilder,
    private val apiClient: PopcApiClientV2,
    private val enrollmentStore: EnrollmentStore
) : ViewModel() {

    private val _state = MutableStateFlow(ImportUiState())
    val state: StateFlow<ImportUiState> = _state.asStateFlow()

    fun onPicked(path: String) {
        viewModelScope.launch {
            try {
                _state.value = _state.value.copy(loading = true, error = null)

                val sha256 = withContext(Dispatchers.IO) {
                    val file = File(path)
                    val bytes = file.readBytes()
                    CryptoUtils.sha256Hex(bytes)
                }

                _state.value = _state.value.copy(
                    loading = false,
                    path = path,
                    sha256 = sha256,
                    verificationId = null,
                    mode = null,
                    verdict = null,
                    confidence = null,
                    reasons = emptyList()
                )
            } catch (e: Exception) {
                Timber.e(e, "Failed to process picked image")
                _state.value = _state.value.copy(
                    loading = false,
                    error = com.popc.android.utils.ErrorMessageUtils.getFriendlyErrorMessage(e)
                )
            }
        }
    }

    fun verifyHeuristic() {
        val imagePath = _state.value.path ?: return

        viewModelScope.launch {
            try {
                _state.value = _state.value.copy(loading = true, error = null)

                // Compress image for upload
                val compressedFile = withContext(Dispatchers.IO) {
                    ImageUtils.compressForUpload(
                        sourceFile = File(imagePath),
                        context = context
                    )
                }

                val response = withContext(Dispatchers.IO) {
                    apiClient.verifyHeuristic(compressedFile)
                }

                // Clean up compressed temp file if different from original
                if (compressedFile.absolutePath != imagePath) {
                    withContext(Dispatchers.IO) {
                        compressedFile.delete()
                    }
                }

                _state.value = _state.value.copy(
                    loading = false,
                    verificationId = response.verificationId,
                    mode = response.mode,
                    verdict = response.verdict,
                    confidence = response.confidence,
                    reasons = response.reasons
                )

                Timber.i("Heuristic verification complete: ${response.verdict}")
            } catch (e: Exception) {
                Timber.e(e, "Heuristic verification failed")
                _state.value = _state.value.copy(
                    loading = false,
                    error = com.popc.android.utils.ErrorMessageUtils.getFriendlyErrorMessage(e)
                )
            }
        }
    }

    fun signAndVerifyPostSigned() {
        val imagePath = _state.value.path ?: return

        viewModelScope.launch {
            try {
                _state.value = _state.value.copy(loading = true, error = null)

                // Check enrollment
                val enrollmentData = enrollmentStore.getEnrollment()
                if (enrollmentData == null) {
                    _state.value = _state.value.copy(
                        loading = false,
                        error = "Enroll this device first"
                    )
                    return@launch
                }

                val imageFile = File(imagePath)

                // Read bytes and compute SHA-256
                val (imageBytes, sha256Hex) = withContext(Dispatchers.IO) {
                    val bytes = imageFile.readBytes()
                    val hash = CryptoUtils.sha256Hex(bytes)
                    Pair(bytes, hash)
                }

                // Extract EXIF DateTimeOriginal if present
                val originalTime = withContext(Dispatchers.IO) {
                    ExifHelper.extractDateTimeOriginal(imageFile)
                }

                // Build custom assertions for post-signed
                val customAssertions = mutableMapOf<String, Any>(
                    "popc.capture.kind" to "post_signed"
                )
                originalTime?.let {
                    customAssertions["popc.capture.original_time"] = it
                }

                // Build assertions object using ManifestBuilder
                val assertionsObj = manifestBuilder.createAssertions(
                    assetHash = sha256Hex,
                    deviceId = enrollmentData.deviceId,
                    metadata = mapOf(
                        "platform" to "android",
                        "model" to android.os.Build.MODEL
                    ),
                    customAssertions = customAssertions
                )

                Timber.d("Signing assertions: $assertionsObj")

                // Sign the assertions JSON (minified)
                val assertionsJson = assertionsObj.toString()
                val signature = withContext(Dispatchers.IO) {
                    keystoreManager.signData(assertionsJson.toByteArray(Charsets.UTF_8))
                }

                // Get public key
                val publicKey = keystoreManager.getPublicKey()
                    ?: throw IllegalStateException("Public key not found")

                // Build manifest
                val manifestJson = manifestBuilder.buildManifest(
                    assertions = assertionsObj,
                    assetHash = sha256Hex,
                    publicKey = publicKey,
                    signature = signature
                )

                // Save manifest sidecar
                val manifestFile = File("${imagePath}.c2pa")
                withContext(Dispatchers.IO) {
                    manifestFile.writeText(manifestJson)
                }

                Timber.d("Manifest saved to: ${manifestFile.absolutePath}")

                // Compress image for upload
                val compressedImageFile = withContext(Dispatchers.IO) {
                    ImageUtils.compressForUpload(
                        sourceFile = imageFile,
                        context = context
                    )
                }

                // Verify with API (using compressed image)
                val response = withContext(Dispatchers.IO) {
                    apiClient.verify(compressedImageFile, manifestFile)
                }

                // Clean up compressed temp file if different from original
                if (compressedImageFile.absolutePath != imageFile.absolutePath) {
                    withContext(Dispatchers.IO) {
                        compressedImageFile.delete()
                    }
                }

                _state.value = _state.value.copy(
                    loading = false,
                    verificationId = response.verificationId,
                    mode = response.mode,
                    verdict = response.verdict,
                    confidence = response.confidence,
                    reasons = response.reasons
                )

                Timber.i("Post-signed verification complete: ${response.verdict}")
            } catch (e: Exception) {
                Timber.e(e, "Post-signed verification failed")
                _state.value = _state.value.copy(
                    loading = false,
                    error = com.popc.android.utils.ErrorMessageUtils.getFriendlyErrorMessage(e)
                )
            }
        }
    }

    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }
}
