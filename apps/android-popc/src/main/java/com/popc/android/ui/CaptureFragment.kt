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
import androidx.camera.video.FileOutputOptions
import androidx.camera.video.Quality
import androidx.camera.video.QualitySelector
import androidx.camera.video.Recorder
import androidx.camera.video.Recording
import androidx.camera.video.VideoCapture
import androidx.camera.video.VideoRecordEvent
import androidx.core.content.ContextCompat
import androidx.core.content.PermissionChecker
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
    private var videoCapture: VideoCapture<Recorder>? = null
    private var recording: Recording? = null
    private lateinit var cameraExecutor: ExecutorService

    private var isVideoMode = false

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false
        val audioGranted = permissions[Manifest.permission.RECORD_AUDIO] ?: false
        
        if (cameraGranted) {
            startCamera()
        } else {
            showToast("Camera permission is required")
        }
        
        if (!audioGranted && isVideoMode) {
             showToast("Audio permission is recommended for video")
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
            if (isVideoMode) {
                captureVideo()
            } else {
                capturePhoto()
            }
        }

        binding.toggleMode.addOnButtonCheckedListener { _, checkedId, isChecked ->
            if (isChecked) {
                when (checkedId) {
                    R.id.btn_mode_photo -> {
                        isVideoMode = false
                        binding.btnCapture.text = getString(R.string.btn_capture)
                        binding.btnCapture.setIconResource(android.R.drawable.ic_menu_camera)
                        startCamera() // Rebind for photo
                    }
                    R.id.btn_mode_video -> {
                        isVideoMode = true
                        binding.btnCapture.text = getString(R.string.btn_record)
                        binding.btnCapture.setIconResource(android.R.drawable.ic_media_play)
                        checkAudioPermission()
                        startCamera() // Rebind for video
                    }
                }
            }
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
        val permissions = mutableListOf(Manifest.permission.CAMERA)
        // Request audio permission upfront if we might need it, or just wait until mode switch
        
        if (ContextCompat.checkSelfPermission(
                requireContext(),
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            startCamera()
        } else {
            cameraPermissionLauncher.launch(permissions.toTypedArray())
        }
    }

    private fun checkAudioPermission() {
        if (ContextCompat.checkSelfPermission(
                requireContext(),
                Manifest.permission.RECORD_AUDIO
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            cameraPermissionLauncher.launch(arrayOf(Manifest.permission.RECORD_AUDIO))
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

            val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

            try {
                cameraProvider.unbindAll()

                if (isVideoMode) {
                    val recorder = Recorder.Builder()
                        .setQualitySelector(QualitySelector.from(Quality.HIGHEST))
                        .build()
                    videoCapture = VideoCapture.withOutput(recorder)

                    cameraProvider.bindToLifecycle(
                        viewLifecycleOwner,
                        cameraSelector,
                        preview,
                        videoCapture
                    )
                } else {
                    imageCapture = ImageCapture.Builder()
                        .setCaptureMode(ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY)
                        .build()

                    cameraProvider.bindToLifecycle(
                        viewLifecycleOwner,
                        cameraSelector,
                        preview,
                        imageCapture
                    )
                }

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

    private fun captureVideo() {
        val videoCapture = this.videoCapture ?: return

        // If currently recording, stop it
        val curRecording = recording
        if (curRecording != null) {
            curRecording.stop()
            recording = null
            return
        }

        // Start new recording
        val videoFile = File(
            requireContext().getExternalFilesDir(null),
            "VID_${System.currentTimeMillis()}.mp4"
        )

        val outputOptions = FileOutputOptions.Builder(videoFile).build()

        // Check audio permission
        val hasAudioPermission = PermissionChecker.checkSelfPermission(
            requireContext(), Manifest.permission.RECORD_AUDIO
        ) == PermissionChecker.PERMISSION_GRANTED

        var pendingRecording = videoCapture.output
            .prepareRecording(requireContext(), outputOptions)

        if (hasAudioPermission) {
            pendingRecording = pendingRecording.withAudioEnabled()
        }

        recording = pendingRecording.start(ContextCompat.getMainExecutor(requireContext())) { recordEvent ->
            when(recordEvent) {
                is VideoRecordEvent.Start -> {
                    binding.btnCapture.text = getString(R.string.btn_stop_recording)
                    binding.btnCapture.setIconResource(android.R.drawable.ic_media_pause)
                    binding.toggleMode.isEnabled = false
                }
                is VideoRecordEvent.Finalize -> {
                    if (!recordEvent.hasError()) {
                        val msg = "Video capture succeeded: ${videoFile.absolutePath}"
                        Timber.d(msg)
                        viewModel.onCaptured(videoFile.absolutePath)
                        showToast("Video captured")
                    } else {
                        recording?.close()
                        recording = null
                        Timber.e("Video capture ends with error: ${recordEvent.error}")
                        showToast("Video capture failed")
                    }
                    binding.btnCapture.text = getString(R.string.btn_record)
                    binding.btnCapture.setIconResource(android.R.drawable.ic_media_play)
                    binding.toggleMode.isEnabled = true
                    recording = null
                }
            }
        }
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
