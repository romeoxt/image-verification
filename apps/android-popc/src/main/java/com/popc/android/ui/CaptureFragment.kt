package com.popc.android.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.core.content.ContextCompat
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.fragment.findNavController
import com.popc.android.R
import com.popc.android.databinding.FragmentCaptureBinding
import kotlinx.coroutines.launch
import timber.log.Timber
import java.io.File
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class CaptureFragment : Fragment() {

    private var _binding: FragmentCaptureBinding? = null
    private val binding get() = _binding!!

    private val viewModel: CaptureViewModel by viewModels {
        ViewModelFactory(requireContext())
    }

    private var imageCapture: ImageCapture? = null
    private lateinit var cameraExecutor: ExecutorService

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            startCamera()
        } else {
            showToast("Camera permission is required")
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentCaptureBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        cameraExecutor = Executors.newSingleThreadExecutor()

        setupObservers()
        setupClickListeners()
        checkCameraPermission()
    }

    private fun setupObservers() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.state.collect { state ->
                    updateUI(state)
                }
            }
        }
    }

    private fun setupClickListeners() {
        binding.btnCapture.setOnClickListener {
            capturePhoto()
        }

        binding.btnSignVerify.setOnClickListener {
            viewModel.signAndVerify(requireContext())
        }

        binding.btnViewEvidence.setOnClickListener {
            val verificationId = viewModel.state.value.verificationId
            if (verificationId != null) {
                val action = CaptureFragmentDirections.actionCaptureToEvidence(verificationId)
                findNavController().navigate(action)
            }
        }
    }

    private fun checkCameraPermission() {
        when {
            ContextCompat.checkSelfPermission(
                requireContext(),
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED -> {
                startCamera()
            }
            else -> {
                cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
            }
        }
    }

    private fun startCamera() {
        val cameraProviderFuture = ProcessCameraProvider.getInstance(requireContext())

        cameraProviderFuture.addListener({
            val cameraProvider = cameraProviderFuture.get()

            val preview = Preview.Builder()
                .build()
                .also {
                    it.setSurfaceProvider(binding.previewView.surfaceProvider)
                }

            imageCapture = ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY)
                .build()

            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

            try {
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(
                    viewLifecycleOwner,
                    cameraSelector,
                    preview,
                    imageCapture
                )
            } catch (e: Exception) {
                Timber.e(e, "Camera binding failed")
                showToast("Failed to start camera")
            }

        }, ContextCompat.getMainExecutor(requireContext()))
    }

    private fun capturePhoto() {
        val imageCapture = imageCapture ?: return

        val photoFile = File(
            requireContext().getExternalFilesDir(null),
            "IMG_${System.currentTimeMillis()}.jpg"
        )

        val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

        imageCapture.takePicture(
            outputOptions,
            cameraExecutor,
            object : ImageCapture.OnImageSavedCallback {
                override fun onError(exc: ImageCaptureException) {
                    Timber.e(exc, "Photo capture failed")
                    requireActivity().runOnUiThread {
                        showToast("Capture failed: ${exc.message}")
                    }
                }

                override fun onImageSaved(output: ImageCapture.OutputFileResults) {
                    Timber.i("Photo saved: ${photoFile.absolutePath}")
                    requireActivity().runOnUiThread {
                        viewModel.onCaptured(photoFile.absolutePath)
                        showToast("Photo captured")
                    }
                }
            }
        )
    }

    private fun updateUI(state: CaptureUiState) {
        binding.progress.isVisible = state.loading

        // Enable sign/verify button only when image is captured
        binding.btnSignVerify.isEnabled = !state.loading && state.sha256 != null

        // Show file info
        state.capturedPath?.let {
            binding.txtFile.text = "File: ${File(it).name}"
            binding.txtFile.isVisible = true
        } ?: run {
            binding.txtFile.isVisible = false
        }

        // Show hash
        state.sha256?.let {
            binding.txtSha.text = "Hash: ${it.shortenHash()}"
            binding.txtSha.isVisible = true
        } ?: run {
            binding.txtSha.isVisible = false
        }

        // Show verification result
        if (state.verdict != null && state.mode != null) {
            binding.resultCard.isVisible = true

            val verdictText = "${state.verdict.uppercase()} (${state.mode})"
            binding.txtVerdict.text = verdictText

            // Color code verdict
            val bgColor = when (state.verdict.lowercase()) {
                "verified" -> ContextCompat.getColor(requireContext(), R.color.success_light)
                "tampered", "invalid", "revoked" -> ContextCompat.getColor(requireContext(), R.color.error_light)
                "unsigned" -> ContextCompat.getColor(requireContext(), R.color.warning_light)
                else -> ContextCompat.getColor(requireContext(), R.color.neutral_light)
            }
            binding.resultCard.setCardBackgroundColor(bgColor)

            // Show confidence if present
            state.confidence?.let {
                binding.txtConfidence.text = "Confidence: $it/100"
                binding.txtConfidence.isVisible = true
            } ?: run {
                binding.txtConfidence.isVisible = false
            }

            // Show reasons
            if (state.reasons.isNotEmpty()) {
                binding.txtReasons.text = "Reasons:\n${state.reasons.joinToString("\n• ", "• ")}"
                binding.txtReasons.isVisible = true
            } else {
                binding.txtReasons.isVisible = false
            }

            // Show evidence button
            binding.btnViewEvidence.isVisible = state.verificationId != null

        } else {
            binding.resultCard.isVisible = false
        }

        // Show error
        state.error?.let {
            showSnackbar(it)
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        cameraExecutor.shutdown()
        _binding = null
    }
}
