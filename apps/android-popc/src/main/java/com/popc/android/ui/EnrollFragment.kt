package com.popc.android.ui

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.core.view.isVisible
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.navigation.fragment.findNavController
import com.popc.android.R
import com.popc.android.databinding.FragmentEnrollBinding

class EnrollFragment : Fragment() {

    private var _binding: FragmentEnrollBinding? = null
    private val binding get() = _binding!!

    private val viewModel: EnrollViewModel by viewModels {
        ViewModelFactory(requireContext())
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentEnrollBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        setupObservers()
        setupClickListeners()
    }

    private fun setupObservers() {
        viewModel.uiState.observe(viewLifecycleOwner) { state ->
            updateUI(state)
        }
    }

    private fun setupClickListeners() {
        binding.btnEnroll.setOnClickListener {
            android.util.Log.d("EnrollFragment", "Enroll button clicked!")
            viewModel.enroll()
        }

        binding.btnContinue.setOnClickListener {
            findNavController().navigate(R.id.action_enroll_to_capture)
        }

        binding.btnReset.setOnClickListener {
            viewModel.resetEnrollment()
        }
    }

    private fun updateUI(state: EnrollUiState) {
        binding.progressBar.isVisible = state.loading
        binding.btnEnroll.isEnabled = !state.loading && !state.enrolled

        if (state.enrolled) {
            showEnrolledUI(state)
        } else {
            showNotEnrolledUI(state)
        }

        state.error?.let {
            binding.tvError.text = it
            binding.tvError.isVisible = true
        } ?: run {
            binding.tvError.isVisible = false
        }

        state.warnings?.takeIf { it.isNotEmpty() }?.let { warnings ->
            binding.tvWarnings.text = "System Info:\n${warnings.joinToString("\n• ", "• ")}"
            binding.tvWarnings.isVisible = true
        } ?: run {
            binding.tvWarnings.isVisible = false
        }
    }

    private fun showEnrolledUI(state: EnrollUiState) {
        binding.enrollmentCard.isVisible = true
        binding.notEnrolledCard.isVisible = false

        binding.tvDeviceId.text = state.deviceId?.let { "Device ID: ${it.shortenHash()}" } ?: ""
        binding.tvSecurityLevel.text = "Security: ${state.securityLevel?.uppercase() ?: "Unknown"}"
        binding.tvAttestationType.text = "Type: ${state.attestationType ?: "Unknown"}"

        state.verifiedBoot?.let {
            binding.tvVerifiedBoot.text = "Boot State: $it"
            binding.tvVerifiedBoot.isVisible = true
        } ?: run {
            binding.tvVerifiedBoot.isVisible = false
        }

        binding.btnContinue.isVisible = true
        binding.btnReset.isVisible = true
    }

    private fun showNotEnrolledUI(state: EnrollUiState) {
        binding.enrollmentCard.isVisible = false
        binding.notEnrolledCard.isVisible = true
        binding.btnContinue.isVisible = false
        binding.btnReset.isVisible = false
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
