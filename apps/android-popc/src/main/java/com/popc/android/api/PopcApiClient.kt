package com.popc.android.api

import com.popc.android.BuildConfig
import com.popc.android.utils.MimeTypeHelper
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.logging.HttpLoggingInterceptor
import org.json.JSONArray
import org.json.JSONObject
import timber.log.Timber
import java.io.File
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * API client for PoPC verification service
 */
class PopcApiClientV2(
    baseUrl: String = BuildConfig.BASE_URL // Use production Railway URL from build config
) {
    private val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .addInterceptor(HttpLoggingInterceptor { message ->
            Timber.tag("OkHttp").d(message)
        }.apply {
            level = HttpLoggingInterceptor.Level.BASIC
        })
        .build()

    private val baseUrl: String = baseUrl.trimEnd('/')

    /**
     * Enroll device with hardware attestation
     */
    fun enroll(
        platform: String,
        certChainPem: List<String>,
        challenge: String? = null,
        deviceMetadata: Map<String, String>? = null
    ): EnrollmentResponse {
        val json = JSONObject().apply {
            put("platform", platform)
            put("certChainPem", JSONArray(certChainPem))
            challenge?.let { put("challenge", it) }
            deviceMetadata?.let {
                put("deviceMetadata", JSONObject(it))
            }
        }

        val request = Request.Builder()
            .url("$baseUrl/v1/enroll")
            .post(json.toString().toRequestBody("application/json".toMediaType()))
            .build()

        client.newCall(request).execute().use { response ->
            val body = response.body?.string() ?: throw IOException("Empty response")

            if (!response.isSuccessful) {
                val error = try {
                    JSONObject(body)
                } catch (e: Exception) {
                    JSONObject().put("error", "unknown").put("message", body)
                }
                throw EnrollmentException(
                    error.optString("error", "unknown"),
                    error.optString("message", "Enrollment failed"),
                    error.optJSONArray("errors")?.let { arr ->
                        List(arr.length()) { arr.getString(it) }
                    } ?: emptyList()
                )
            }

            return parseEnrollmentResponse(JSONObject(body))
        }
    }

    /**
     * Verify image with manifest
     */
    fun verify(imageFile: File, manifestFile: File): VerificationResponse {
        val mimeType = MimeTypeHelper.getMimeType(imageFile)

        val requestBody = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart(
                "asset",
                imageFile.name,
                imageFile.asRequestBody(mimeType.toMediaType())
            )
            .addFormDataPart(
                "manifest",
                manifestFile.name,
                manifestFile.asRequestBody("application/json".toMediaType())
            )
            .build()

        val request = Request.Builder()
            .url("$baseUrl/v1/verify")
            .post(requestBody)
            .build()

        client.newCall(request).execute().use { response ->
            val body = response.body?.string() ?: throw IOException("Empty response")

            if (!response.isSuccessful) {
                throw IOException("Verification failed: HTTP ${response.code}")
            }

            return parseVerificationResponse(JSONObject(body))
        }
    }

    /**
     * Verify image only (heuristic mode, no manifest)
     */
    fun verifyHeuristic(imageFile: File): VerificationResponse {
        val mimeType = MimeTypeHelper.getMimeType(imageFile)

        val requestBody = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart(
                "asset",
                imageFile.name,
                imageFile.asRequestBody(mimeType.toMediaType())
            )
            .build()

        val request = Request.Builder()
            .url("$baseUrl/v1/verify")
            .post(requestBody)
            .build()

        client.newCall(request).execute().use { response ->
            val body = response.body?.string() ?: throw IOException("Empty response")

            if (!response.isSuccessful) {
                throw IOException("Verification failed: HTTP ${response.code}")
            }

            return parseVerificationResponse(JSONObject(body))
        }
    }

    /**
     * Get evidence package
     */
    fun getEvidence(verificationId: String): JSONObject {
        val request = Request.Builder()
            .url("$baseUrl/v1/evidence/$verificationId")
            .get()
            .build()

        client.newCall(request).execute().use { response ->
            val body = response.body?.string() ?: throw IOException("Empty response")

            if (!response.isSuccessful) {
                throw IOException("Failed to fetch evidence: HTTP ${response.code}")
            }

            return JSONObject(body)
        }
    }

    private fun parseEnrollmentResponse(json: JSONObject): EnrollmentResponse {
        return EnrollmentResponse(
            deviceId = json.getString("deviceId"),
            enrolledAt = json.getString("enrolledAt"),
            status = json.optString("status", "active"),
            attestationVerified = json.optBoolean("attestationVerified", false),
            attestationDetails = json.optJSONObject("attestationDetails")?.let {
                AttestationDetails(
                    attestationType = it.optString("attestationType"),
                    hardwareBacked = it.optBoolean("hardwareBacked", false),
                    securityLevel = it.optString("securityLevel"),
                    bootState = it.optString("bootState")
                )
            },
            warnings = json.optJSONArray("warnings")?.let { arr ->
                List(arr.length()) { arr.getString(it) }
            } ?: emptyList()
        )
    }

    private fun parseVerificationResponse(json: JSONObject): VerificationResponse {
        return VerificationResponse(
            verificationId = json.getString("verificationId"),
            mode = json.getString("mode"),
            verdict = json.getString("verdict"),
            confidence = json.optInt("confidence_score", 0),
            assetSha256 = json.getString("assetSha256"),
            reasons = json.getJSONArray("reasons").let { arr ->
                List(arr.length()) { arr.getString(it) }
            },
            metadata = json.optJSONObject("metadata"),
            evidencePackageUrl = json.optString("evidencePackageUrl").takeIf { it.isNotEmpty() },
            verifiedAt = json.getString("verifiedAt")
        )
    }
}

data class EnrollmentResponse(
    val deviceId: String,
    val enrolledAt: String,
    val status: String,
    val attestationVerified: Boolean,
    val attestationDetails: AttestationDetails?,
    val warnings: List<String>
)

data class AttestationDetails(
    val attestationType: String,
    val hardwareBacked: Boolean,
    val securityLevel: String,
    val bootState: String?
)

data class VerificationResponse(
    val verificationId: String,
    val mode: String,
    val verdict: String,
    val confidence: Int,
    val assetSha256: String,
    val reasons: List<String>,
    val metadata: JSONObject?,
    val evidencePackageUrl: String?,
    val verifiedAt: String
)

class EnrollmentException(
    val error: String,
    override val message: String,
    val errors: List<String>
) : Exception(message)
