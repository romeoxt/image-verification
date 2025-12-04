package com.popc.android.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import androidx.exifinterface.media.ExifInterface
import timber.log.Timber
import java.io.File
import java.io.FileOutputStream
import kotlin.math.sqrt

object ImageUtils {
    
    /**
     * Compress an image file for upload while maintaining quality
     * Target: ~1MB max for upload efficiency
     * 
     * @param sourceFile Original image file
     * @param context Android context for cache directory
     * @param maxSizeBytes Maximum file size in bytes (default 1MB)
     * @param initialQuality Starting JPEG quality (default 85)
     * @return Compressed file (may be same as source if already small)
     */
    fun compressForUpload(
        sourceFile: File,
        context: Context,
        maxSizeBytes: Long = 1_000_000, // 1MB
        initialQuality: Int = 85
    ): File {
        val sourceSize = sourceFile.length()
        
        Timber.i("Image compression: source size = ${sourceSize / 1024}KB")
        
        // If already small enough, return original
        if (sourceSize <= maxSizeBytes) {
            Timber.i("Image already small enough, skipping compression")
            return sourceFile
        }
        
        return try {
            // Read EXIF orientation
            val exif = ExifInterface(sourceFile.absolutePath)
            val orientation = exif.getAttributeInt(
                ExifInterface.TAG_ORIENTATION,
                ExifInterface.ORIENTATION_NORMAL
            )
            
            // Decode with inSampleSize for memory efficiency
            val options = BitmapFactory.Options().apply {
                inJustDecodeBounds = true
            }
            BitmapFactory.decodeFile(sourceFile.absolutePath, options)
            
            val originalWidth = options.outWidth
            val originalHeight = options.outHeight
            
            Timber.i("Original dimensions: ${originalWidth}x${originalHeight}")
            
            // Calculate sample size to reduce memory usage
            // Target max dimension: 2048px (good balance of quality and size)
            val maxDimension = 2048
            val sampleSize = calculateSampleSize(originalWidth, originalHeight, maxDimension)
            
            Timber.i("Using sample size: $sampleSize")
            
            // Decode with sample size
            options.inJustDecodeBounds = false
            options.inSampleSize = sampleSize
            options.inPreferredConfig = Bitmap.Config.RGB_565 // Reduce memory further
            
            var bitmap = BitmapFactory.decodeFile(sourceFile.absolutePath, options)
                ?: throw IllegalStateException("Failed to decode image")
            
            // Apply EXIF orientation
            bitmap = rotateBitmap(bitmap, orientation)
            
            Timber.i("Decoded dimensions: ${bitmap.width}x${bitmap.height}")
            
            // Create temp file for compressed output
            val compressedFile = File.createTempFile(
                "compressed_",
                ".jpg",
                context.cacheDir
            )
            
            // Compress with quality adjustment
            var quality = initialQuality
            var compressedSize: Long
            
            do {
                FileOutputStream(compressedFile).use { out ->
                    bitmap.compress(Bitmap.CompressFormat.JPEG, quality, out)
                }
                compressedSize = compressedFile.length()
                
                Timber.d("Compressed at quality $quality: ${compressedSize / 1024}KB")
                
                // If still too large, reduce quality
                if (compressedSize > maxSizeBytes && quality > 50) {
                    quality -= 10
                } else {
                    break
                }
            } while (compressedSize > maxSizeBytes && quality >= 50)
            
            bitmap.recycle()
            
            val compressionRatio = (sourceSize.toFloat() / compressedSize * 100).toInt()
            Timber.i("Compression complete: ${compressedSize / 1024}KB (${compressionRatio}% reduction), quality=$quality")
            
            compressedFile
            
        } catch (e: Exception) {
            Timber.e(e, "Compression failed, using original file")
            sourceFile // Fallback to original
        }
    }
    
    /**
     * Calculate sample size for efficient bitmap decoding
     * Reduces both dimensions by the sample size factor
     */
    private fun calculateSampleSize(width: Int, height: Int, maxDimension: Int): Int {
        val maxCurrentDimension = maxOf(width, height)
        
        if (maxCurrentDimension <= maxDimension) {
            return 1
        }
        
        // Calculate power-of-2 sample size
        var sampleSize = 1
        while (maxCurrentDimension / (sampleSize * 2) > maxDimension) {
            sampleSize *= 2
        }
        
        return sampleSize
    }
    
    /**
     * Rotate bitmap according to EXIF orientation
     */
    private fun rotateBitmap(bitmap: Bitmap, orientation: Int): Bitmap {
        val matrix = Matrix()
        
        when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
            ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
            ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.postScale(1f, -1f)
            ExifInterface.ORIENTATION_TRANSPOSE -> {
                matrix.postRotate(90f)
                matrix.postScale(-1f, 1f)
            }
            ExifInterface.ORIENTATION_TRANSVERSE -> {
                matrix.postRotate(-90f)
                matrix.postScale(-1f, 1f)
            }
            else -> return bitmap // No rotation needed
        }
        
        val rotated = Bitmap.createBitmap(
            bitmap,
            0, 0,
            bitmap.width,
            bitmap.height,
            matrix,
            true
        )
        
        if (rotated != bitmap) {
            bitmap.recycle()
        }
        
        return rotated
    }
}

