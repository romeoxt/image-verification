package com.popc.android.ui

import android.content.Context
import android.widget.Toast
import androidx.fragment.app.Fragment
import com.google.android.material.snackbar.Snackbar
import java.text.SimpleDateFormat
import java.util.*

/**
 * UI utility extensions
 */

fun Fragment.showToast(message: String, duration: Int = Toast.LENGTH_SHORT) {
    Toast.makeText(requireContext(), message, duration).show()
}

fun Fragment.showSnackbar(message: String, duration: Int = Snackbar.LENGTH_LONG) {
    view?.let { Snackbar.make(it, message, duration).show() }
}

fun String.shortenHash(prefixLen: Int = 8, suffixLen: Int = 8): String {
    return if (length > prefixLen + suffixLen + 3) {
        "${take(prefixLen)}…${takeLast(suffixLen)}"
    } else {
        this
    }
}

fun String.formatIsoDate(): String {
    return try {
        val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        val displayFormat = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
        val date = isoFormat.parse(this)
        date?.let { displayFormat.format(it) } ?: this
    } catch (e: Exception) {
        this
    }
}
