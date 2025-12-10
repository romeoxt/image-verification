package com.popc.android.utils

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.take
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.withTimeoutOrNull
import timber.log.Timber

class SensorHelper(context: Context) {

    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    private val accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    private val gyroscope = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)

    // Capture 2 seconds of data for feature extraction
    // At SENSOR_DELAY_GAME (~50Hz), this is approx 100 samples
    suspend fun captureSensorSnapshot(durationMs: Long = 2000): SensorSnapshot {
        val accelData = collectSensorData(accelerometer, durationMs)
        val gyroData = collectSensorData(gyroscope, durationMs)

        return SensorSnapshot(
            accelerometer = accelData,
            gyroscope = gyroData
        )
    }

    private suspend fun collectSensorData(sensor: Sensor?, durationMs: Long): List<List<Float>> {
        if (sensor == null) return emptyList()

        return withTimeoutOrNull(durationMs + 100) { // Add buffer time
            callbackFlow {
                val listener = object : SensorEventListener {
                    override fun onSensorChanged(event: SensorEvent?) {
                        event?.let {
                            trySend(it.values.toList())
                        }
                    }

                    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}
                }

                // SENSOR_DELAY_GAME is approx 50Hz (20ms)
                sensorManager.registerListener(listener, sensor, SensorManager.SENSOR_DELAY_GAME)

                awaitClose {
                    sensorManager.unregisterListener(listener)
                }
            }.take(100).toList() // Take max 100 samples (2s @ 50Hz)
        } ?: emptyList()
    }
}

data class SensorSnapshot(
    val accelerometer: List<List<Float>>,
    val gyroscope: List<List<Float>>
)

