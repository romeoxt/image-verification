package com.popc.android.utils

import java.net.ConnectException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

object ErrorMessageUtils {

    fun getFriendlyErrorMessage(throwable: Throwable): String {
        return when (throwable) {
            is UnknownHostException -> "No internet connection. Please check your network."
            is ConnectException -> "Could not connect to the verification server. Please try again later."
            is SocketTimeoutException -> "Connection timed out. The server took too long to respond."
            is IllegalStateException -> "App state error: ${throwable.message}"
            is SecurityException -> "Security error: ${throwable.message}"
            else -> "An unexpected error occurred: ${throwable.localizedMessage ?: "Unknown error"}"
        }
    }
}

