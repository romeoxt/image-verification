package com.popc.android.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.popc.android.BuildConfig
import com.popc.android.crypto.KeystoreManager
import com.popc.android.data.EnrollmentStore
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class SettingsUiState(
    val deviceId: String? = null,
    val securityLevel: String? = null,
    val apiKey: String = BuildConfig.API_KEY,
    val version: String = "${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})",
    val message: String? = null
)

class SettingsViewModel(
    private val keystoreManager: KeystoreManager,
    private val enrollmentStore: EnrollmentStore
) : ViewModel() {

    private val _state = MutableStateFlow(SettingsUiState())
    val state: StateFlow<SettingsUiState> = _state.asStateFlow()

    init {
        loadSettings()
    }

    private fun loadSettings() {
        val enrollment = enrollmentStore.getEnrollment()
        _state.value = _state.value.copy(
            deviceId = enrollment?.deviceId,
            securityLevel = enrollment?.securityLevel
        )
    }

    fun resetEnrollment() {
        viewModelScope.launch {
            withContext(Dispatchers.IO) {
                keystoreManager.deleteKey()
                enrollmentStore.clearEnrollment()
            }
            loadSettings()
            _state.value = _state.value.copy(message = "Enrollment reset successfully")
        }
    }

    fun clearMessage() {
        _state.value = _state.value.copy(message = null)
    }
}

