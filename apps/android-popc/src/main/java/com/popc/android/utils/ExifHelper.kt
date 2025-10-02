package com.popc.android.utils

import android.media.ExifInterface
import timber.log.Timber
import java.io.File
import java.text.SimpleDateFormat
import java.util.*

/**
 * Helper for extracting EXIF metadata from images
 */
object ExifHelper {
    /**
     * Extract DateTimeOriginal from EXIF if present
     * Returns ISO8601 formatted string or null
     */
    fun extractDateTimeOriginal(file: File): String? {
        return try {
            val exif = ExifInterface(file.absolutePath)
            val dateTime = exif.getAttribute(ExifInterface.TAG_DATETIME_ORIGINAL)
                ?: exif.getAttribute(ExifInterface.TAG_DATETIME)
                ?: return null

            // EXIF format: "YYYY:MM:DD HH:MM:SS"
            // Convert to ISO8601: "YYYY-MM-DDTHH:MM:SSZ"
            val exifFormat = SimpleDateFormat("yyyy:MM:dd HH:mm:ss", Locale.US)
            exifFormat.timeZone = TimeZone.getTimeZone("UTC")
            val date = exifFormat.parse(dateTime) ?: return null

            val iso8601Format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US)
            iso8601Format.timeZone = TimeZone.getTimeZone("UTC")
            iso8601Format.format(date)
        } catch (e: Exception) {
            Timber.w(e, "Failed to extract EXIF DateTimeOriginal")
            null
        }
    }

    /**
     * Extract camera make and model if present
     */
    fun extractCameraInfo(file: File): Pair<String?, String?> {
        return try {
            val exif = ExifInterface(file.absolutePath)
            val make = exif.getAttribute(ExifInterface.TAG_MAKE)
            val model = exif.getAttribute(ExifInterface.TAG_MODEL)
            Pair(make, model)
        } catch (e: Exception) {
            Timber.w(e, "Failed to extract camera info")
            Pair(null, null)
        }
    }
}
