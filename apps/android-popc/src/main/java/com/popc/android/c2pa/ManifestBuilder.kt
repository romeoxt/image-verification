package com.popc.android.c2pa

import com.popc.android.crypto.CryptoUtils.toBase64
import com.popc.android.crypto.CryptoUtils.toPem
import org.json.JSONArray
import org.json.JSONObject
import java.security.PublicKey
import java.time.Instant
import java.util.*

/**
 * C2PA manifest builder for PoPC
 */
class ManifestBuilder {

    fun buildManifest(
        assetHash: String,
        deviceId: String,
        publicKey: PublicKey,
        signature: ByteArray,
        metadata: Map<String, Any> = emptyMap()
    ): String {
        val timestamp = Instant.now().toString()
        val instanceId = UUID.randomUUID().toString()

        val manifest = JSONObject().apply {
            put("version", "1.0")

            // Claims
            put("claims", JSONArray().apply {
                put(JSONObject().apply {
                    put("claimGenerator", "PoPC Android")
                    put("instanceId", instanceId)
                    put("assertions", JSONArray().apply {
                        put(JSONObject().apply {
                            put("label", "c2pa.hash.data")
                            put("data", JSONObject().apply {
                                put("algorithm", "sha256")
                                put("hash", assetHash)
                            })
                        })
                    })
                })
            })

            // Signature
            put("signature", JSONObject().apply {
                put("algorithm", "ES256")
                put("publicKey", publicKey.toPem())
                put("signature", signature.toBase64())
            })

            // Assertions
            put("assertions", JSONObject().apply {
                put("c2pa.hash.data", JSONObject().apply {
                    put("algorithm", "sha256")
                    put("hash", assetHash)
                })
                put("popc.device.id", deviceId)
                put("c2pa.timestamp", timestamp)

                // Add metadata
                metadata.forEach { (key, value) ->
                    put(key, value)
                }
            })
        }

        return manifest.toString(2) // Pretty print with 2-space indent
    }

    /**
     * Parse manifest to extract device ID and hash
     */
    fun parseManifest(manifestJson: String): ManifestInfo {
        val json = JSONObject(manifestJson)
        val assertions = json.getJSONObject("assertions")

        val hashData = assertions.getJSONObject("c2pa.hash.data")
        val assetHash = hashData.getString("hash")

        val deviceId = assertions.optString("popc.device.id", "")
        val timestamp = assertions.optString("c2pa.timestamp", "")

        return ManifestInfo(
            assetHash = assetHash,
            deviceId = deviceId,
            timestamp = timestamp
        )
    }
}

data class ManifestInfo(
    val assetHash: String,
    val deviceId: String,
    val timestamp: String
)
