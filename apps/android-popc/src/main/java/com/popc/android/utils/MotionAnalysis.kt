package com.popc.android.utils

import kotlin.math.pow
import kotlin.math.sqrt

data class MotionFeatures(
    val accMean: Triple<Float, Float, Float>,
    val accStd: Triple<Float, Float, Float>,
    val accEnergy: Triple<Float, Float, Float>,
    val gyroMean: Triple<Float, Float, Float>,
    val gyroStd: Triple<Float, Float, Float>,
    val gyroEnergy: Triple<Float, Float, Float>,
    val accMagMean: Float,
    val accMagStd: Float,
    val gyroMagMean: Float,
    val gyroMagStd: Float
)

object MotionAnalysis {

    fun extractFeatures(
        accelData: List<List<Float>>,
        gyroData: List<List<Float>>
    ): MotionFeatures {
        // Accelerometer Features
        val (accMean, accStd, accEnergy) = computeAxisStats(accelData)
        val (accMagMean, accMagStd) = computeMagnitudeStats(accelData)

        // Gyroscope Features
        val (gyroMean, gyroStd, gyroEnergy) = computeAxisStats(gyroData)
        val (gyroMagMean, gyroMagStd) = computeMagnitudeStats(gyroData)

        return MotionFeatures(
            accMean = accMean,
            accStd = accStd,
            accEnergy = accEnergy,
            gyroMean = gyroMean,
            gyroStd = gyroStd,
            gyroEnergy = gyroEnergy,
            accMagMean = accMagMean,
            accMagStd = accMagStd,
            gyroMagMean = gyroMagMean,
            gyroMagStd = gyroMagStd
        )
    }

    /**
     * Classifies motion based on simple heuristics (Baseline for Phase 1).
     * Returns a string label: "STATIONARY", "HANDHELD", "ACTIVE_MOVEMENT"
     */
    fun classifyMotion(features: MotionFeatures): String {
        // Thresholds (tuned for typical phone sensors)
        // Stationary usually has very low gyro magnitude (just noise)
        // Handheld has micro-tremors
        // Active movement has high variance

        val gyroMagMean = features.gyroMagMean
        val accMagStd = features.accMagStd

        return when {
            // Very low rotation = Stationary (Tripod/Table)
            gyroMagMean < 0.05 -> "STATIONARY" 
            
            // Moderate movement = Handheld (Micro-jitter)
            gyroMagMean < 0.5 && accMagStd < 0.5 -> "HANDHELD"
            
            // High movement = Walking/Active
            else -> "ACTIVE_MOVEMENT"
        }
    }

    private fun computeAxisStats(data: List<List<Float>>): Triple<Triple<Float, Float, Float>, Triple<Float, Float, Float>, Triple<Float, Float, Float>> {
        if (data.isEmpty()) {
            val zero = Triple(0f, 0f, 0f)
            return Triple(zero, zero, zero)
        }

        val n = data.size.toFloat()
        
        // Mean
        val sumX = data.map { it[0] }.sum()
        val sumY = data.map { it[1] }.sum()
        val sumZ = data.map { it[2] }.sum()
        val mean = Triple(sumX / n, sumY / n, sumZ / n)

        // Variance / Std / Energy
        var sumSqDiffX = 0f
        var sumSqDiffY = 0f
        var sumSqDiffZ = 0f
        var sumEnergyX = 0f
        var sumEnergyY = 0f
        var sumEnergyZ = 0f

        data.forEach {
            val dx = it[0] - mean.first
            val dy = it[1] - mean.second
            val dz = it[2] - mean.third
            sumSqDiffX += dx * dx
            sumSqDiffY += dy * dy
            sumSqDiffZ += dz * dz
            
            sumEnergyX += it[0] * it[0]
            sumEnergyY += it[1] * it[1]
            sumEnergyZ += it[2] * it[2]
        }

        val std = Triple(
            sqrt(sumSqDiffX / n),
            sqrt(sumSqDiffY / n),
            sqrt(sumSqDiffZ / n)
        )

        val energy = Triple(
            sumEnergyX / n,
            sumEnergyY / n,
            sumEnergyZ / n
        )

        return Triple(mean, std, energy)
    }

    private fun computeMagnitudeStats(data: List<List<Float>>): Pair<Float, Float> {
        if (data.isEmpty()) return Pair(0f, 0f)

        val magnitudes = data.map { 
            sqrt(it[0].pow(2) + it[1].pow(2) + it[2].pow(2)) 
        }

        val mean = magnitudes.average().toFloat()
        
        var sumSqDiff = 0f
        magnitudes.forEach { 
            val diff = it - mean
            sumSqDiff += diff * diff 
        }
        val std = sqrt(sumSqDiff / magnitudes.size)

        return Pair(mean, std)
    }
}

