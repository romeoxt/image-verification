package com.popc.android.crypto

import android.content.Context
import android.content.SharedPreferences
import android.util.Base64
import timber.log.Timber

/**
 * Certificate Pinning Manager
 * 
 * Caches the device's public key after enrollment and verifies it hasn't
 * changed on the backend (which would indicate a compromise).
 */
class CertificatePinning(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(
        "cert_pinning",
        Context.MODE_PRIVATE
    )
    
    companion object {
        private const val KEY_PINNED_PUBLIC_KEY = "pinned_public_key"
        private const val KEY_DEVICE_ID = "pinned_device_id"
        private const val KEY_PIN_TIMESTAMP = "pin_timestamp"
    }
    
    /**
     * Pin a public key for a device
     * Called after successful enrollment
     */
    fun pinPublicKey(deviceId: String, publicKeyPem: String) {
        prefs.edit().apply {
            putString(KEY_PINNED_PUBLIC_KEY, publicKeyPem)
            putString(KEY_DEVICE_ID, deviceId)
            putLong(KEY_PIN_TIMESTAMP, System.currentTimeMillis())
            apply()
        }
        Timber.i("Public key pinned for device: $deviceId")
    }
    
    /**
     * Get the pinned public key for the current device
     */
    fun getPinnedPublicKey(deviceId: String): String? {
        val pinnedDeviceId = prefs.getString(KEY_DEVICE_ID, null)
        if (pinnedDeviceId != deviceId) {
            Timber.w("Device ID mismatch. Pinned: $pinnedDeviceId, Current: $deviceId")
            return null
        }
        return prefs.getString(KEY_PINNED_PUBLIC_KEY, null)
    }
    
    /**
     * Verify that the backend's public key matches our pinned key
     * 
     * Returns:
     * - true: Public key matches (safe)
     * - false: Public key mismatch (SECURITY ALERT!)
     * - null: No pinned key yet (first enrollment)
     */
    fun verifyPublicKey(deviceId: String, backendPublicKeyPem: String): Boolean? {
        val pinnedKey = getPinnedPublicKey(deviceId)
        
        if (pinnedKey == null) {
            Timber.i("No pinned key found for $deviceId (first enrollment)")
            return null // No pin yet, can't verify
        }
        
        val matches = pinnedKey == backendPublicKeyPem
        
        if (!matches) {
            Timber.e("PUBLIC KEY MISMATCH DETECTED!")
            Timber.e("Pinned key:  ${pinnedKey.take(100)}...")
            Timber.e("Backend key: ${backendPublicKeyPem.take(100)}...")
            Timber.e("This could indicate a backend compromise or man-in-the-middle attack!")
        } else {
            Timber.d("Public key verification passed")
        }
        
        return matches
    }
    
    /**
     * Clear pinned keys (e.g., when device is unenrolled)
     */
    fun clearPin() {
        prefs.edit().clear().apply()
        Timber.i("Certificate pin cleared")
    }
    
    /**
     * Check if we have a pinned key for the given device
     */
    fun hasPinnedKey(deviceId: String): Boolean {
        val pinnedDeviceId = prefs.getString(KEY_DEVICE_ID, null)
        return pinnedDeviceId == deviceId && prefs.contains(KEY_PINNED_PUBLIC_KEY)
    }
}

