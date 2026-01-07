package com.popc.android.utils

import com.popc.android.api.EnrollmentException
import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException
import java.io.IOException

object ErrorMessageUtils {

    fun getFriendlyErrorMessage(throwable: Throwable): String {
        return when (throwable) {
            is UnknownHostException -> "No internet connection. Please check your network and try again."
            is ConnectException -> "Could not connect to the verification server. Please check your internet connection or try again later."
            is SocketTimeoutException -> "The connection timed out. The server took too long to respond. Please try again."
            is EnrollmentException -> {
                val details = if (throwable.errors.isNotEmpty()) "\nDetails: ${throwable.errors.joinToString(", ")}" else ""
                "Enrollment failed: ${throwable.message}$details"
            }
            is IOException -> {
                if (throwable.message?.contains("HTTP 401") == true) {
                    "Authentication failed. Please check your API key."
                } else if (throwable.message?.contains("HTTP 403") == true) {
                    "Access denied. You don't have permission to perform this action."
                } else if (throwable.message?.contains("HTTP 404") == true) {
                    "Resource not found on the server."
                } else if (throwable.message?.contains("HTTP 5") == true) { // 500, 502, etc.
                    "Server error. Our engineers are working on it. Please try again later."
                } else {
                    "Network error: ${throwable.localizedMessage}"
                }
            }
            is IllegalStateException -> "App state error: ${throwable.message}"
            is SecurityException -> "Security error: ${throwable.message}"
            else -> "An unexpected error occurred: ${throwable.localizedMessage ?: "Unknown error"}"
        }
    }
}
