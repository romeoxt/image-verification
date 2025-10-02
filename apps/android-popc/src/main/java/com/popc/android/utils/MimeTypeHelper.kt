package com.popc.android.utils

import android.webkit.MimeTypeMap
import java.io.File

/**
 * Helper for determining MIME types from file extensions
 */
object MimeTypeHelper {
    /**
     * Get MIME type from file extension, defaults to application/octet-stream
     */
    fun getMimeType(file: File): String {
        val extension = file.extension.lowercase()
        return when (extension) {
            "jpg", "jpeg" -> "image/jpeg"
            "png" -> "image/png"
            "heic", "heif" -> "image/heic"
            "webp" -> "image/webp"
            "gif" -> "image/gif"
            "bmp" -> "image/bmp"
            "tiff", "tif" -> "image/tiff"
            else -> {
                // Fallback to Android's MimeTypeMap
                MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension)
                    ?: "application/octet-stream"
            }
        }
    }

    /**
     * Get file extension for a MIME type
     */
    fun getExtensionForMimeType(mimeType: String?): String {
        return when (mimeType?.lowercase()) {
            "image/jpeg" -> "jpg"
            "image/png" -> "png"
            "image/heic", "image/heif" -> "heic"
            "image/webp" -> "webp"
            "image/gif" -> "gif"
            "image/bmp" -> "bmp"
            "image/tiff" -> "tiff"
            else -> {
                mimeType?.let {
                    MimeTypeMap.getSingleton().getExtensionFromMimeType(it)
                } ?: "bin"
            }
        }
    }
}
