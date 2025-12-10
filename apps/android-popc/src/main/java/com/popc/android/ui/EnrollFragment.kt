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
import com.popc.android.utils.ErrorMessageUtils

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
        binding.btnAction.setOnClickListener {
            val state = viewModel.uiState.value ?: return@setOnClickListener
            if (state.enrolled) {
                // Continue to capture
                findNavController().navigate(R.id.action_enroll_to_capture)
            } else {
                // Enroll
                viewModel.enroll()
            }
        }

        binding.btnSecondaryAction.setOnClickListener {
            viewModel.resetEnrollment()
        }
    }

    private fun updateUI(state: EnrollUiState) {
        // Loading State
        if (state.loading) {
            binding.loadingState.isVisible = true
            binding.notEnrolledState.isVisible = false
            binding.enrolledState.isVisible = false
            binding.btnAction.isEnabled = false
            return
        }
        
        binding.loadingState.isVisible = false
        binding.btnAction.isEnabled = true

        if (state.enrolled) {
            showEnrolledUI(state)
        } else {
            showNotEnrolledUI(state)
        }

        state.error?.let {
            binding.tvError.text = it // Use friendly error? ViewModel might already provide string
            binding.tvError.isVisible = true
        } ?: run {
            binding.tvError.isVisible = false
        }
    }

    private fun showEnrolledUI(state: EnrollUiState) {
        binding.enrolledState.isVisible = true
        binding.notEnrolledState.isVisible = false
        
        binding.tvSecurityLevel.text = "Security: ${state.securityLevel?.uppercase() ?: "Unknown"}\nDevice ID: ${state.deviceId?.take(8)}..."

        binding.btnAction.text = "Start Capturing"
        binding.btnSecondaryAction.isVisible = true
    }

    private fun showNotEnrolledUI(state: EnrollUiState) {
        binding.enrolledState.isVisible = false
        binding.notEnrolledState.isVisible = true
        
        binding.btnAction.text = "Register Device"
        binding.btnSecondaryAction.isVisible = false
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
