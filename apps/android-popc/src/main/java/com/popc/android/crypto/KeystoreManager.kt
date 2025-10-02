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
class KeystoreManager {
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
            // Try StrongBox first, fallback to TEE
            val result = tryGenerateKey(useStrongBox = true, challenge = challenge)
                ?: tryGenerateKey(useStrongBox = false, challenge = challenge)
                ?: throw SecurityException("Failed to generate hardware-backed key")

            Timber.i("Generated key with security level: ${result.securityLevel}")
            return result
        } catch (e: Exception) {
            Timber.e(e, "Key generation failed")
            throw e
        }
    }

    private fun tryGenerateKey(useStrongBox: Boolean, challenge: ByteArray?): AttestationResult? {
        return try {
            val builder = KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
            )
                .setAlgorithmParameterSpec(ECGenParameterSpec(EC_CURVE))
                .setDigests(KeyProperties.DIGEST_SHA256)
                .setUserAuthenticationRequired(false)

            // Set StrongBox if available and requested
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P && useStrongBox) {
                builder.setIsStrongBoxBacked(true)
            }

            // Add attestation challenge if provided
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && challenge != null) {
                builder.setAttestationChallenge(challenge)
            }

            val keyPairGenerator = KeyPairGenerator.getInstance(
                KeyProperties.KEY_ALGORITHM_EC,
                KEYSTORE_PROVIDER
            )
            keyPairGenerator.initialize(builder.build())

            val keyPair = keyPairGenerator.generateKeyPair()

            // Get attestation chain
            val certChain = keyStore.getCertificateChain(KEY_ALIAS)
                ?: throw SecurityException("No certificate chain")

            // Determine actual security level
            val securityLevel = getKeySecurityLevel(keyPair.private)

            AttestationResult(
                publicKey = keyPair.public,
                certChain = certChain.toList(),
                securityLevel = securityLevel,
                algorithm = "ES256",
                curve = "P-256"
            )
        } catch (e: Exception) {
            Timber.w(e, "Failed to generate key with strongBox=$useStrongBox")
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
