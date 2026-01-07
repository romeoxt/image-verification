package com.popc.android.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.popc.android.api.PopcApiClientV2
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import timber.log.Timber

class EvidenceViewModel(
    private val apiClient: PopcApiClientV2
) : ViewModel() {

    private val _state = MutableStateFlow(EvidenceUiState())
    val state: StateFlow<EvidenceUiState> = _state.asStateFlow()

    fun fetch(verificationId: String) {
        if (verificationId.isBlank()) {
            _state.value = _state.value.copy(error = "Verification ID is required")
            return
        }

        viewModelScope.launch {
            _state.value = _state.value.copy(
                loading = true,
                verificationId = verificationId,
                error = null
            )

            try {
                val jsonObject = withContext(Dispatchers.IO) {
                    apiClient.getEvidence(verificationId)
                }

                val prettyJson = jsonObject.toString(2) // 2-space indent

                Timber.i("Evidence fetched for $verificationId: ${prettyJson.length} chars")

                _state.value = _state.value.copy(
                    loading = false,
                    json = prettyJson,
                    error = null
                )

            } catch (e: Exception) {
                Timber.e(e, "Failed to fetch evidence")
                _state.value = _state.value.copy(
                    loading = false,
                    error = com.popc.android.utils.ErrorMessageUtils.getFriendlyErrorMessage(e)
                )
            }
        }
    }

    fun setVerificationId(id: String) {
        _state.value = _state.value.copy(verificationId = id)
    }
}

data class EvidenceUiState(
    val loading: Boolean = false,
    val verificationId: String? = null,
    val json: String? = null,
    val error: String? = null
)
