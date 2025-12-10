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
    private var cameraProvider: ProcessCameraProvider? = null

    private var isVideoMode = false

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val cameraGranted = permissions[Manifest.permission.CAMERA] ?: false
        val audioGranted = permissions[Manifest.permission.RECORD_AUDIO] ?: false
        val locationGranted = permissions[Manifest.permission.ACCESS_FINE_LOCATION] ?: false
        
        if (cameraGranted) {
            startCamera()
        } else {
            showToast("Camera permission is required")
        }
        
        if (!audioGranted && isVideoMode) {
             showToast("Audio permission is recommended for video")
        }

        if (!locationGranted) {
            showToast("Location permission is recommended for proof of location")
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
        checkPermissions()
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

        binding.btnSignVerify.setOnClickListener {
            viewModel.signAndVerify(requireContext())
        }
    }

    private fun checkPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.CAMERA,
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        )
        // Request audio permission upfront if we might need it, or just wait until mode switch
        
        if (ContextCompat.checkSelfPermission(
                requireContext(),
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(
                requireContext(),
                Manifest.permission.ACCESS_FINE_LOCATION
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
            try {
                cameraProvider = cameraProviderFuture.get()

                val preview = Preview.Builder()
                    .build()
                    .also {
                        it.setSurfaceProvider(binding.previewView.surfaceProvider)
                    }

                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

                // Unbind all previous use cases
                cameraProvider?.unbindAll()

                if (isVideoMode) {
                    val recorder = Recorder.Builder()
                        .setQualitySelector(QualitySelector.from(Quality.HIGHEST))
                        .build()
                    videoCapture = VideoCapture.withOutput(recorder)

                    cameraProvider?.bindToLifecycle(
                        viewLifecycleOwner,
                        cameraSelector,
                        preview,
                        videoCapture
                    )
                } else {
                    imageCapture = ImageCapture.Builder()
                        .setCaptureMode(ImageCapture.CAPTURE_MODE_MAXIMIZE_QUALITY)
                        .build()

                    cameraProvider?.bindToLifecycle(
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
                        // showToast("Photo captured") // Removed toast to reduce noise
                        binding.btnSignVerify.isEnabled = true
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
                    // binding.btnCapture.text = getString(R.string.btn_stop_recording) // Removed text update
                    binding.btnCapture.setImageResource(android.R.drawable.ic_media_pause)
                    // binding.toggleMode.isEnabled = false // Removed toggle mode
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
                    // binding.btnCapture.text = getString(R.string.btn_record)
                    binding.btnCapture.setImageResource(android.R.drawable.ic_menu_camera) // Revert to camera icon for now
                    // binding.toggleMode.isEnabled = true
                    recording = null
                }
            }
        }
    }

    private fun updateUI(state: CaptureUiState) {
        // Loading State
        binding.loadingContainer.isVisible = state.loading
        binding.actionsContainer.isVisible = !state.loading

        // Enable sign/verify button only when image is captured and not loading
        binding.btnSignVerify.isEnabled = !state.loading && state.sha256 != null
        
        // Show verification result
        if (state.verdict != null) {
            binding.resultCard.isVisible = true

            val isVerified = state.verdict.lowercase() == "verified"
            
            // Verdict Text
            binding.txtVerdict.text = if (isVerified) "Verified Authentic" else "Verification Failed"
            
            // Icon
            binding.imgVerdictIcon.setImageResource(
                if (isVerified) android.R.drawable.ic_lock_idle_lock else android.R.drawable.ic_delete
            )
            val iconColor = if (isVerified) R.color.success else R.color.error
            binding.imgVerdictIcon.setColorFilter(
                ContextCompat.getColor(requireContext(), iconColor)
            )

            // Confidence
            state.confidence?.let {
                binding.txtConfidence.text = "$it% Confidence"
                binding.txtConfidence.isVisible = true
            } ?: run {
                binding.txtConfidence.isVisible = false
            }

            // Reasons
            if (state.reasons.isNotEmpty()) {
                binding.txtReasons.text = state.reasons.joinToString("\n• ", "• ")
                binding.txtReasons.isVisible = true
            } else {
                binding.txtReasons.isVisible = false
            }

        } else {
            binding.resultCard.isVisible = false
        }

        // Show error
        state.error?.let {
            showSnackbar(it)
        }
    }

    override fun onPause() {
        super.onPause()
        cameraProvider?.unbindAll()
        Timber.d("Camera released (onPause) - saving battery")
    }

    override fun onResume() {
        super.onResume()
        if (ContextCompat.checkSelfPermission(
                requireContext(),
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED && 
            cameraProvider != null
        ) {
            startCamera()
            Timber.d("Camera restarted (onResume)")
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        recording?.stop()
        recording = null
        cameraProvider?.unbindAll()
        cameraProvider = null
        imageCapture = null
        videoCapture = null
        cameraExecutor.shutdown()
        _binding = null
        Timber.d("Camera resources released")
    }
}
