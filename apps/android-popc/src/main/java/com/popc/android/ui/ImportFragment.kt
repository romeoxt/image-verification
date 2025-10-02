package com.popc.android.ui

import android.net.Uri
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.google.android.material.snackbar.Snackbar
import com.popc.android.databinding.FragmentImportBinding
import com.popc.android.utils.getColorForVerdict
import kotlinx.coroutines.launch
import timber.log.Timber
import java.io.File

class ImportFragment : Fragment() {

    private var _binding: FragmentImportBinding? = null
    private val binding get() = _binding!!

    private val viewModel: ImportViewModel by viewModels {
        ViewModelFactory(requireContext())
    }

    private val pickImageLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { handleImagePicked(it) }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentImportBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupListeners()
        observeState()
    }

    private fun setupListeners() {
        binding.btnPickImage.setOnClickListener {
            pickImageLauncher.launch("image/*")
        }

        binding.btnVerifyHeuristic.setOnClickListener {
            viewModel.verifyHeuristic()
        }

        binding.btnSignVerify.setOnClickListener {
            viewModel.signAndVerifyPostSigned()
        }

        binding.btnOpenEvidence.setOnClickListener {
            val verificationId = viewModel.state.value.verificationId ?: return@setOnClickListener
            val action = ImportFragmentDirections.actionImportToEvidence(verificationId)
            findNavController().navigate(action)
        }
    }

    private fun observeState() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewModel.state.collect { state ->
                updateUI(state)
            }
        }
    }

    private fun updateUI(state: ImportUiState) {
        // Progress
        binding.progressBar.isVisible = state.loading

        // File info
        binding.txtFilePath.isVisible = state.path != null
        binding.txtFilePath.text = "Path: ${state.path}"

        binding.txtSha256.isVisible = state.sha256 != null
        binding.txtSha256.text = "SHA-256: ${state.sha256?.take(16)}..."

        // Enable verification buttons
        binding.btnVerifyHeuristic.isEnabled = state.path != null && !state.loading
        binding.btnSignVerify.isEnabled = state.path != null && !state.loading

        // Result card
        binding.resultCard.isVisible = state.verificationId != null

        if (state.verificationId != null) {
            binding.txtMode.text = "Mode: ${state.mode?.uppercase()}"

            binding.txtVerdict.text = state.verdict?.uppercase()
            binding.txtVerdict.setTextColor(
                requireContext().getColorForVerdict(state.verdict ?: "")
            )

            binding.txtConfidence.text = "Confidence: ${state.confidence}%"

            binding.txtReasons.text = if (state.reasons.isNotEmpty()) {
                "Reasons:\n" + state.reasons.joinToString("\n") { "• $it" }
            } else {
                "No additional information"
            }
        }

        // Error handling
        state.error?.let { error ->
            if (error == "Enroll this device first") {
                showEnrollmentRequiredDialog()
            } else {
                Snackbar.make(binding.root, error, Snackbar.LENGTH_LONG).show()
            }
            viewModel.clearError()
        }
    }

    private fun handleImagePicked(uri: Uri) {
        try {
            // Copy to app-private file
            val inputStream = requireContext().contentResolver.openInputStream(uri)
                ?: throw IllegalStateException("Cannot open input stream")

            val fileName = "imported_${System.currentTimeMillis()}.jpg"
            val destFile = File(requireContext().filesDir, fileName)

            inputStream.use { input ->
                destFile.outputStream().use { output ->
                    input.copyTo(output)
                }
            }

            Timber.d("Image copied to: ${destFile.absolutePath}")
            viewModel.onPicked(destFile.absolutePath)

        } catch (e: Exception) {
            Timber.e(e, "Failed to handle picked image")
            Snackbar.make(
                binding.root,
                "Failed to load image: ${e.message}",
                Snackbar.LENGTH_LONG
            ).show()
        }
    }

    private fun showEnrollmentRequiredDialog() {
        AlertDialog.Builder(requireContext())
            .setTitle("Enrollment Required")
            .setMessage("You must enroll this device before signing images. Go to enrollment now?")
            .setPositiveButton("Go to Enroll") { _, _ ->
                findNavController().navigate(ImportFragmentDirections.actionImportToEvidence(null))
                findNavController().navigateUp()
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
