package com.popc.android.ui

import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.content.FileProvider
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.fragment.navArgs
import com.popc.android.BuildConfig
import com.popc.android.databinding.FragmentEvidenceBinding
import kotlinx.coroutines.launch
import timber.log.Timber
import java.io.File

class EvidenceFragment : Fragment() {

    private var _binding: FragmentEvidenceBinding? = null
    private val binding get() = _binding!!

    private val args: EvidenceFragmentArgs by navArgs()

    private val viewModel: EvidenceViewModel by viewModels {
        ViewModelFactory(requireContext())
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentEvidenceBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Set verification ID from args if provided
        args.verificationId?.let { id ->
            viewModel.setVerificationId(id)
            binding.inputVerificationId.setText(id)
            // Auto-fetch if we have an ID from navigation
            viewModel.fetch(id)
        }

        setupObservers()
        setupClickListeners()
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
        binding.btnFetch.setOnClickListener {
            val id = binding.inputVerificationId.text.toString().trim()
            viewModel.fetch(id)
        }

        binding.btnShare.setOnClickListener {
            shareEvidence()
        }
    }

    private fun updateUI(state: EvidenceUiState) {
        binding.progress.isVisible = state.loading
        binding.btnFetch.isEnabled = !state.loading

        // Show JSON
        state.json?.let {
            binding.scrollView.isVisible = true
            binding.txtJson.text = it
            binding.btnShare.isEnabled = true
        } ?: run {
            binding.scrollView.isVisible = false
            binding.btnShare.isEnabled = false
        }

        // Show error
        state.error?.let {
            showSnackbar(it)
        }
    }

    private fun shareEvidence() {
        val json = viewModel.state.value.json ?: return
        val verificationId = viewModel.state.value.verificationId ?: "evidence"

        try {
            // Save to cache file
            val cacheDir = requireContext().cacheDir
            val file = File(cacheDir, "evidence_${verificationId}.json")
            file.writeText(json)

            // Create file URI using FileProvider
            val uri = FileProvider.getUriForFile(
                requireContext(),
                "${BuildConfig.APPLICATION_ID}.fileprovider",
                file
            )

            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "application/json"
                putExtra(Intent.EXTRA_STREAM, uri)
                putExtra(Intent.EXTRA_SUBJECT, "PoPC Evidence: $verificationId")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }

            startActivity(Intent.createChooser(intent, "Share Evidence"))

        } catch (e: Exception) {
            Timber.e(e, "Failed to share evidence")
            showToast("Failed to share: ${e.message}")
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
