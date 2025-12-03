package com.popc.android.crypto

import android.os.Build
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyInfo
import android.security.keystore.KeyProperties
import timber.log.Timber
import java.security.*
import java.security.spec.ECGenParameterSpec
import java.util.*

/**
 * Manages hardware-backed keypair generation and signing with Android Keystore
 */
class KeystoreManager(private val context: android.content.Context? = null) {
    companion object {
        private const val KEYSTORE_PROVIDER = "AndroidKeyStore"
        private const val KEY_ALIAS = "POPCKEY"
        private const val EC_CURVE = "secp256r1" // P-256
    }

    private val keyStore: KeyStore = KeyStore.getInstance(KEYSTORE_PROVIDER).apply {
        load(null)
    }

    /**
     * Generate hardware-backed EC P-256 keypair with attestation
     * Returns attestation certificate chain
     */
        fun generateKeyWithAttestation(challenge: ByteArray? = null): AttestationResult {
        try {
            // Check device capabilities first
            checkDeviceCapabilities()
            
            // Try StrongBox first, fallback to TEE
            Timber.i("Attempting StrongBox key generation...")
            val result = tryGenerateKey(useStrongBox = true, challenge = challenge)
                ?: run {
                    Timber.w("StrongBox failed, attempting TEE...")
                    tryGenerateKey(useStrongBox = false, challenge = challenge)
                }
                ?: throw SecurityException("Failed to generate hardware-backed key")

            Timber.i("✅ Generated key with security level: ${result.securityLevel}")
            return result
        } catch (e: Exception) {
            Timber.e(e, "❌ Key generation failed")
            throw e
        }
    }
    
    private fun checkDeviceCapabilities() {
        Timber.i("=== Device Security Capabilities ===")
        Timber.i("Device: ${Build.MANUFACTURER} ${Build.MODEL}")
        Timber.i("Android Version: ${Build.VERSION.SDK_INT} (${Build.VERSION.RELEASE})")
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            Timber.i("StrongBox API available: true (Android 9+)")
            
            // Check if StrongBox is actually present
            context?.let { ctx ->
                try {
                    val hasStrongBox = ctx.packageManager.hasSystemFeature(
                        android.content.pm.PackageManager.FEATURE_STRONGBOX_KEYSTORE
                    )
                    Timber.i("Device has StrongBox hardware: $hasStrongBox")
                } catch (e: Exception) {
                    Timber.w(e, "Could not check StrongBox feature")
                }
            } ?: Timber.w("Context not available, cannot check StrongBox feature")
        } else {
            Timber.i("StrongBox API available: false (requires Android 9+)")
        }
        Timber.i("===================================")
    }

    private fun tryGenerateKey(useStrongBox: Boolean, challenge: ByteArray?): AttestationResult? {
        return try {
            Timber.d("Building KeyGenParameterSpec (StrongBox=$useStrongBox)...")
            val builder = KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
            )
                .setAlgorithmParameterSpec(ECGenParameterSpec(EC_CURVE))
                .setDigests(KeyProperties.DIGEST_SHA256)
                .setUserAuthenticationRequired(false)

            // Set StrongBox if available and requested
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && useStrongBox) {
                Timber.d("Setting StrongBox-backed flag...")
                builder.setIsStrongBoxBacked(true)
            }

            // Add attestation challenge if provided
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && challenge != null) {
                Timber.d("Adding attestation challenge (${challenge.size} bytes)...")
                builder.setAttestationChallenge(challenge)
            }

            Timber.d("Initializing KeyPairGenerator...")
            val keyPairGenerator = KeyPairGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_EC,
                KEYSTORE_PROVIDER
            )
            keyPairGenerator.initialize(builder.build())

            Timber.d("Generating key pair...")
            val keyPair = keyPairGenerator.generateKeyPair()

            Timber.d("Retrieving attestation certificate chain...")
            // Get attestation chain
            val certChain = keyStore.getCertificateChain(KEY_ALIAS)
                ?: throw SecurityException("No certificate chain")

            Timber.d("Certificate chain length: ${certChain.size}")

            // Determine actual security level
            val securityLevel = getKeySecurityLevel(keyPair.private)
            Timber.d("Detected security level: $securityLevel")

            AttestationResult(
                publicKey = keyPair.public,
                certChain = certChain.toList(),
                securityLevel = securityLevel,
                algorithm = "ES256",
                curve = "P-256"
            )
        } catch (e: Exception) {
            Timber.w(e, "❌ Failed to generate key with StrongBox=$useStrongBox: ${e.javaClass.simpleName}: ${e.message}")
            null
        }
    }

    private fun getKeySecurityLevel(privateKey: PrivateKey): SecurityLevel {
        return try {
            val factory = KeyFactory.getInstance(privateKey.algorithm, KEYSTORE_PROVIDER)
            val keyInfo = factory.getKeySpec(privateKey, KeyInfo::class.java)

            when {
                Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
                        keyInfo.securityLevel == KeyProperties.SECURITY_LEVEL_STRONGBOX ->
                    SecurityLevel.STRONGBOX

                Build.VERSION.SDK_INT >= Build.VERSION_CODES.P &&
                        keyInfo.isInsideSecureHardware ->
                    SecurityLevel.TEE

                else -> SecurityLevel.SOFTWARE
            }
        } catch (e: Exception) {
            Timber.w(e, "Failed to get key security level")
            SecurityLevel.SOFTWARE
        }
    }

    /**
     * Sign data with the hardware-backed key
     */
    fun signData(data: ByteArray): ByteArray {
        val privateKey = keyStore.getKey(KEY_ALIAS, null) as? PrivateKey
            ?: throw IllegalStateException("Key not found. Please enroll first.")

        val signature = Signature.getInstance("SHA256withECDSA")
        signature.initSign(privateKey)
        signature.update(data)

        return signature.sign()
    }

    /**
     * Get public key from keystore
     */
    fun getPublicKey(): PublicKey? {
        val cert = keyStore.getCertificate(KEY_ALIAS)
        return cert?.publicKey
    }

    /**
     * Check if key exists
     */
    fun hasKey(): Boolean {
        return keyStore.containsAlias(KEY_ALIAS)
    }

    /**
     * Delete key
     */
    fun deleteKey() {
        if (hasKey()) {
            keyStore.deleteEntry(KEY_ALIAS)
        }
    }
}

data class AttestationResult(
    val publicKey: PublicKey,
    val certChain: List<java.security.cert.Certificate>,
    val securityLevel: SecurityLevel,
    val algorithm: String,
    val curve: String
)

enum class SecurityLevel {
    SOFTWARE,
    TEE,
    STRONGBOX
}
