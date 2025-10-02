package com.popc.android.crypto

import android.util.Base64
import java.io.ByteArrayOutputStream
import java.security.MessageDigest
import java.security.PublicKey
import java.security.cert.Certificate
import java.security.cert.X509Certificate

/**
 * Cryptographic utility functions
 */
object CryptoUtils {

    /**
     * Compute SHA-256 hash of data
     */
    fun sha256(data: ByteArray): ByteArray {
        val digest = MessageDigest.getInstance("SHA-256")
        return digest.digest(data)
    }

    /**
     * Compute SHA-256 hash and return as hex string
     */
    fun sha256Hex(data: ByteArray): String {
        return sha256(data).toHexString()
    }

    /**
     * Convert byte array to hex string
     */
    fun ByteArray.toHexString(): String {
        return joinToString("") { "%02x".format(it) }
    }

    /**
     * Convert certificate to PEM format
     */
    fun Certificate.toPem(): String {
        val encoded = Base64.encodeToString(this.encoded, Base64.NO_WRAP)
        return buildString {
            appendLine("-----BEGIN CERTIFICATE-----")
            encoded.chunked(64).forEach { appendLine(it) }
            appendLine("-----END CERTIFICATE-----")
        }
    }

    /**
     * Convert public key to PEM format (SPKI)
     */
    fun PublicKey.toPem(): String {
        val encoded = Base64.encodeToString(this.encoded, Base64.NO_WRAP)
        return buildString {
            appendLine("-----BEGIN PUBLIC KEY-----")
            encoded.chunked(64).forEach { appendLine(it) }
            appendLine("-----END PUBLIC KEY-----")
        }
    }

    /**
     * Compute certificate fingerprint (SHA-256 of DER encoding)
     */
    fun Certificate.fingerprint(): String {
        return sha256Hex(this.encoded)
    }

    /**
     * Extract certificate subject DN
     */
    fun Certificate.subject(): String? {
        return (this as? X509Certificate)?.subjectDN?.name
    }

    /**
     * Extract certificate issuer DN
     */
    fun Certificate.issuer(): String? {
        return (this as? X509Certificate)?.issuerDN?.name
    }

    /**
     * Get certificate validity dates
     */
    fun Certificate.validity(): Pair<String, String>? {
        val x509 = this as? X509Certificate ?: return null
        return x509.notBefore.toInstant().toString() to x509.notAfter.toInstant().toString()
    }

    /**
     * Encode bytes to Base64
     */
    fun ByteArray.toBase64(): String {
        return Base64.encodeToString(this, Base64.NO_WRAP)
    }

    /**
     * Decode Base64 to bytes
     */
    fun String.fromBase64(): ByteArray {
        return Base64.decode(this, Base64.NO_WRAP)
    }
}
