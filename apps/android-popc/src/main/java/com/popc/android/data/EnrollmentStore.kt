package com.popc.android.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey

/**
 * Secure storage for enrollment data
 */
class EnrollmentStore(context: Context) {

    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs: SharedPreferences = try {
        EncryptedSharedPreferences.create(
            context,
            "popc_enrollment",
            masterKey,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    } catch (e: Exception) {
        // Fallback to regular SharedPreferences if encrypted fails
        context.getSharedPreferences("popc_enrollment", Context.MODE_PRIVATE)
    }

    fun saveEnrollment(enrollment: EnrollmentData) {
        prefs.edit().apply {
            putString(KEY_DEVICE_ID, enrollment.deviceId)
            putString(KEY_ENROLLED_AT, enrollment.enrolledAt)
            putString(KEY_SECURITY_LEVEL, enrollment.securityLevel)
            putString(KEY_ATTESTATION_TYPE, enrollment.attestationType)
            putBoolean(KEY_HARDWARE_BACKED, enrollment.hardwareBacked)
            enrollment.bootState?.let { putString(KEY_BOOT_STATE, it) }
            apply()
        }
    }

    fun getEnrollment(): EnrollmentData? {
        val deviceId = prefs.getString(KEY_DEVICE_ID, null) ?: return null

        return EnrollmentData(
            deviceId = deviceId,
            enrolledAt = prefs.getString(KEY_ENROLLED_AT, "") ?: "",
            securityLevel = prefs.getString(KEY_SECURITY_LEVEL, "software") ?: "software",
            attestationType = prefs.getString(KEY_ATTESTATION_TYPE, "") ?: "",
            hardwareBacked = prefs.getBoolean(KEY_HARDWARE_BACKED, false),
            bootState = prefs.getString(KEY_BOOT_STATE, null)
        )
    }

    fun isEnrolled(): Boolean {
        return prefs.contains(KEY_DEVICE_ID)
    }

    fun clearEnrollment() {
        prefs.edit().clear().apply()
    }

    companion object {
        private const val KEY_DEVICE_ID = "device_id"
        private const val KEY_ENROLLED_AT = "enrolled_at"
        private const val KEY_SECURITY_LEVEL = "security_level"
        private const val KEY_ATTESTATION_TYPE = "attestation_type"
        private const val KEY_HARDWARE_BACKED = "hardware_backed"
        private const val KEY_BOOT_STATE = "boot_state"
    }
}

data class EnrollmentData(
    val deviceId: String,
    val enrolledAt: String,
    val securityLevel: String,
    val attestationType: String,
    val hardwareBacked: Boolean,
    val bootState: String?
)
