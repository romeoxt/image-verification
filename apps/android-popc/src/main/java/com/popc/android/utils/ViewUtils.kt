package com.popc.android.utils

import android.content.Context
import androidx.core.content.ContextCompat
import com.popc.android.R

fun Context.getColorForVerdict(verdict: String): Int {
    return when (verdict.uppercase()) {
        "VERIFIED" -> ContextCompat.getColor(this, R.color.success)
        "TAMPERED" -> ContextCompat.getColor(this, R.color.error)
        "UNSIGNED" -> ContextCompat.getColor(this, R.color.warning)
        else -> ContextCompat.getColor(this, R.color.neutral)
    }
}

