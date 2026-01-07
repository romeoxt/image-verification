package com.popc.android.ui

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.android.material.button.MaterialButton
import com.popc.android.R

class OnboardingActivity : AppCompatActivity() {

    private lateinit var titleTv: TextView
    private lateinit var descriptionTv: TextView
    private lateinit var actionBtn: MaterialButton
    private lateinit var imageIv: ImageView

    private var currentStep = 0

    // Permissions needed
    private val requiredPermissions = arrayOf(
        Manifest.permission.CAMERA,
        Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.ACCESS_COARSE_LOCATION
    )

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false
        val locationGranted = (permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false) ||
                              (permissions[Manifest.permission.ACCESS_COARSE_LOCATION] ?: false)

        if (cameraGranted && locationGranted) {
            advanceStep()
        } else {
            Toast.makeText(this, "Camera and Location are required for PoPC verification.", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_onboarding)

        titleTv = findViewById(R.id.tv_onboarding_title)
        descriptionTv = findViewById(R.id.tv_onboarding_description)
        actionBtn = findViewById(R.id.btn_onboarding_action)
        imageIv = findViewById(R.id.iv_onboarding_image)

        setupStep(0)

        actionBtn.setOnClickListener {
            handleAction()
        }
    }

    private fun handleAction() {
        when (currentStep) {
            0 -> advanceStep() // Welcome -> Permissions
            1 -> requestPermissions() // Request Permissions
            2 -> finishOnboarding() // Ready -> Finish
        }
    }

    private fun requestPermissions() {
        if (allPermissionsGranted()) {
            advanceStep()
        } else {
            requestPermissionLauncher.launch(requiredPermissions)
        }
    }

    private fun allPermissionsGranted() = requiredPermissions.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    private fun advanceStep() {
        currentStep++
        setupStep(currentStep)
    }

    private fun setupStep(step: Int) {
        when (step) {
            0 -> {
                titleTv.text = "Welcome to PoPC"
                descriptionTv.text = "Proof of Physical Capture (PoPC) helps you capture verified photos and videos that courts, insurers, and news agencies can trust."
                actionBtn.text = "Get Started"
                imageIv.setImageResource(R.drawable.ic_launcher_foreground) // Use logo if available
            }
            1 -> {
                titleTv.text = "Trust Requires Context"
                descriptionTv.text = "To verify your photos, we need access to your Camera (to capture) and Location (to prove where it happened). Your data is signed securely on-device."
                actionBtn.text = "Grant Permissions"
                // imageIv.setImageResource(R.drawable.ic_lock) // Placeholder for lock icon
            }
            2 -> {
                titleTv.text = "You're Ready"
                descriptionTv.text = "Your device is now set up to capture signed, verifiable media. Let's take your first verified photo."
                actionBtn.text = "Start Capturing"
                // imageIv.setImageResource(R.drawable.ic_check) // Placeholder for check icon
            }
            else -> finishOnboarding()
        }
    }

    private fun finishOnboarding() {
        // Save flag
        val sharedPref = getSharedPreferences("popc_prefs", Context.MODE_PRIVATE)
        with(sharedPref.edit()) {
            putBoolean("COMPLETED_ONBOARDING", true)
            apply()
        }

        // Go to Main
        val intent = Intent(this, MainActivity::class.java)
        startActivity(intent)
        finish()
    }
}

