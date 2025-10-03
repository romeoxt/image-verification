# PoPC Android App

Android SDK and pilot application for hardware-attested image capture and verification.

## Features

- **Hardware-Backed Keys**: StrongBox → TEE → Software fallback
- **At-Capture Signing**: Sign images immediately with hardware key
- **Gallery Import**: Verify existing images (heuristic or post-sign)
- **Device Enrollment**: X.509 certificate chain extraction and submission
- **Evidence Viewer**: Display full verification results with sharing
- **Material3 Design**: Modern Android UI with color-coded verdicts

## Quick Start

### Prerequisites

- **Android Studio** (latest stable)
- **Java 17+** (bundled with Android Studio)
- **Physical Android Device** (recommended for hardware attestation)
  - Emulators will fallback to software keys

### Build & Install

```bash
cd apps/android-popc

# Build debug APK
./gradlew assembleDebug

# Install on connected device
./gradlew installDebug

# Or run directly
./gradlew installDebug && adb shell am start -n com.popc.android/.ui.MainActivity
```

### Using Android Studio

1. **Open Project**: `File > Open > apps/android-popc`
2. **Sync Gradle**: Should happen automatically
3. **Select Device**: Physical device or emulator
4. **Run**: Click green "Run" button or `Shift+F10`

## App Workflow

### 1. Enrollment Screen

First-time setup:

```
┌─────────────────────────────────┐
│     Device Not Enrolled          │
│                                  │
│  Generate a hardware-backed key  │
│  and enroll with PoPC service    │
│                                  │
│  [Generate Key & Enroll]         │
└─────────────────────────────────┘
```

**What happens:**
1. Generates EC P-256 keypair in Android Keystore
2. Attempts StrongBox → TEE → Software fallback
3. Extracts X.509 certificate chain
4. Sends to API via `POST /v1/enroll`
5. Stores device ID in encrypted storage

**Success:**
```
┌─────────────────────────────────┐
│     Device Enrolled ✓            │
│                                  │
│  Device ID: 550e8400-...         │
│  Security Level: StrongBox       │
│  Verified Boot: GREEN            │
│  Attestation: Basic              │
│                                  │
│  [Continue to Capture]           │
│  [Reset Enrollment]              │
└─────────────────────────────────┘
```

### 2. Capture Screen

Take photos with hardware-backed signing:

```
┌─────────────────────────────────┐
│  [Camera Preview]                │
│                                  │
│  [Capture]                       │
│  [Sign & Verify]  (disabled)     │
└─────────────────────────────────┘
```

**Workflow:**
1. Tap "Capture" → Takes photo with CameraX
2. Tap "Sign & Verify":
   - Computes SHA-256 hash
   - Builds assertions JSON
   - Signs with Keystore key (hardware-backed)
   - Creates C2PA manifest
   - Uploads to API `POST /v1/verify`

**Result:**
```
┌─────────────────────────────────┐
│  Result: VERIFIED ✓              │
│  Mode: CERTIFIED                 │
│  Confidence: 95%                 │
│                                  │
│  Reasons:                        │
│  • Content binding valid         │
│  • Signature valid               │
│  • Device enrolled               │
│                                  │
│  [View Evidence]                 │
└─────────────────────────────────┘
```

### 3. Import Screen

Verify existing images from gallery:

```
┌─────────────────────────────────┐
│  [Pick Image]                    │
│                                  │
│  [Verify (Heuristic)]            │
│  [Sign & Verify (Not PoPC)]      │
│   ⚠️ Not PoPC - Signed after     │
└─────────────────────────────────┘
```

**Options:**

**A) Heuristic Verification:**
- No signature required
- Analyzes EXIF metadata, file structure
- Returns confidence score + signals
- Mode: `HEURISTIC`

**B) Post-Sign Verification:**
- Signs image after capture (not at capture time)
- Adds `popc.capture.kind: "post_signed"` assertion
- Extracts EXIF DateTimeOriginal if present
- Mode: `CERTIFIED` (but lower trust than at-capture)

### 4. Evidence Screen

View full verification results:

```
┌─────────────────────────────────┐
│  Verification ID: ver_abc123     │
│                                  │
│  [Fetch Evidence]                │
│                                  │
│  {                               │
│    "verdict": "verified",        │
│    "mode": "certified",          │
│    "asset": { ... },             │
│    "signature": { ... },         │
│    ...                           │
│  }                               │
│                                  │
│  [Share]                         │
└─────────────────────────────────┘
```

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                      UI Layer                            │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐    │
│  │  Enroll    │  │  Capture   │  │  Import        │    │
│  │  Fragment  │  │  Fragment  │  │  Fragment      │    │
│  └────────────┘  └────────────┘  └────────────────┘    │
│        ↓               ↓                  ↓              │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐    │
│  │  Enroll    │  │  Capture   │  │  Import        │    │
│  │  ViewModel │  │  ViewModel │  │  ViewModel     │    │
│  └────────────┘  └────────────┘  └────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Business Logic                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Keystore    │  │  Manifest    │  │  PopcApi     │  │
│  │  Manager     │  │  Builder     │  │  Client      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Platform APIs                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Android     │  │  CameraX     │  │  OkHttp      │  │
│  │  Keystore    │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Key Classes

**KeystoreManager.kt**
- Generates EC P-256 keypair in Keystore
- Attempts StrongBox, falls back to TEE, then Software
- Extracts certificate chain for attestation
- Signs data with hardware-backed key

**ManifestBuilder.kt**
- Builds C2PA JSON manifests
- Supports custom assertions (e.g., `popc.capture.kind`)
- Embeds content binding hash

**PopcApiClient.kt**
- `enroll()`: POST /v1/enroll
- `verify()`: POST /v1/verify (with manifest)
- `verifyHeuristic()`: POST /v1/verify (no manifest)
- `getEvidence()`: GET /v1/evidence/{id}

**EnrollmentStore.kt**
- Encrypted storage using EncryptedSharedPreferences
- Stores device ID, security level, attestation details

**ExifHelper.kt**
- Extracts DateTimeOriginal from EXIF
- Converts to ISO8601 format for assertions

**MimeTypeHelper.kt**
- Detects MIME type from file extension
- Supports JPEG, PNG, HEIC, WebP, GIF, BMP, TIFF

## Configuration

### Build Configuration

`build.gradle.kts`:
```kotlin
android {
    namespace = "com.popc.android"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.popc.android"
        minSdk = 26  // Android 8.0 (Keystore attestation)
        targetSdk = 34
        versionCode = 1
        versionName = "0.1.0"

        // API base URL
        buildConfigField("String", "BASE_URL",
            "\"https://image-verification-production.up.railway.app\"")
    }
}
```

### Permissions

`AndroidManifest.xml`:
```xml
<uses-feature android:name="android.hardware.camera" android:required="true" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.INTERNET" />
```

### Dependencies

```kotlin
// Core
implementation("androidx.core:core-ktx:1.12.0")
implementation("androidx.appcompat:appcompat:1.6.1")
implementation("com.google.android.material:material:1.11.0")

// Lifecycle
implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")

// Navigation
implementation("androidx.navigation:navigation-fragment-ktx:2.7.6")
implementation("androidx.navigation:navigation-ui-ktx:2.7.6")

// CameraX
implementation("androidx.camera:camera-core:1.3.1")
implementation("androidx.camera:camera-camera2:1.3.1")
implementation("androidx.camera:camera-lifecycle:1.3.1")
implementation("androidx.camera:camera-view:1.3.1")

// Networking
implementation("com.squareup.okhttp3:okhttp:4.12.0")

// JSON
implementation("com.squareup.moshi:moshi-kotlin:1.15.0")

// Security
implementation("androidx.security:security-crypto:1.1.0-alpha06")

// Logging
implementation("com.jakewharton.timber:timber:5.0.1")
```

## Hardware Attestation

### Security Levels

| Level | Description | Trust |
|-------|-------------|-------|
| **StrongBox** | Dedicated secure element (Titan M, etc.) | ⭐⭐⭐ Highest |
| **TEE** | Trusted Execution Environment (ARM TrustZone) | ⭐⭐ High |
| **Software** | Keys stored in app memory | ⭐ Low |

### Attestation Flow

```kotlin
fun generateKeyWithAttestation(challenge: ByteArray?): AttestationResult {
    // 1. Try StrongBox
    val result = tryGenerateKey(useStrongBox = true, challenge)
        // 2. Fallback to TEE
        ?: tryGenerateKey(useStrongBox = false, challenge)
        // 3. Throw if both fail
        ?: throw SecurityException("Hardware key generation failed")

    return result
}

private fun tryGenerateKey(
    useStrongBox: Boolean,
    challenge: ByteArray?
): AttestationResult? {
    try {
        val keyGenSpec = KeyGenParameterSpec.Builder(
            KEY_ALIAS,
            KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
        )
        .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
        .setDigests(KeyProperties.DIGEST_SHA256)
        .setAttestationChallenge(challenge)
        .apply {
            if (useStrongBox && Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                setIsStrongBoxBacked(true)
            }
        }
        .build()

        val keyPairGenerator = KeyPairGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_EC,
            "AndroidKeyStore"
        )
        keyPairGenerator.initialize(keyGenSpec)
        keyPairGenerator.generateKeyPair()

        // Extract certificate chain
        val certChain = keyStore.getCertificateChain(KEY_ALIAS)

        return AttestationResult(
            certChain = certChain.toList(),
            securityLevel = if (useStrongBox) "strongbox" else "tee"
        )
    } catch (e: Exception) {
        return null  // Try next level
    }
}
```

### Certificate Chain

```
Root CA (Google)
    ↓
Intermediate CA
    ↓
Attestation Certificate (Contains:)
    - Public Key
    - Attestation Extension (ASN.1)
        - Security Level
        - Attestation Challenge
        - Verified Boot State
        - Key Purpose
```

## Color-Coded Verdicts

```kotlin
fun getColorForVerdict(verdict: String): Int {
    return when (verdict.uppercase()) {
        "VERIFIED" -> {
            // Check if certified or heuristic
            when (mode.uppercase()) {
                "CERTIFIED" -> {
                    // Check for post-sign
                    if (assertions["popc.capture.kind"] == "post_signed") {
                        Color.BLUE  // Post-signed (medium trust)
                    } else {
                        Color.GREEN  // At-capture (highest trust)
                    }
                }
                "HEURISTIC" -> Color.YELLOW  // No signature
                else -> Color.GRAY
            }
        }
        "TAMPERED" -> Color.RED
        "UNSIGNED" -> Color.YELLOW
        else -> Color.GRAY
    }
}
```

## Testing

### Unit Tests

```bash
./gradlew test
```

### Instrumented Tests

```bash
./gradlew connectedAndroidTest
```

### Manual Testing

1. **Enrollment**:
   - Enroll device
   - Check security level (StrongBox/TEE/Software)
   - Verify device ID stored

2. **Capture**:
   - Take photo
   - Sign & Verify
   - Check verdict = VERIFIED
   - View evidence

3. **Import (Heuristic)**:
   - Pick image from gallery
   - Verify (Heuristic)
   - Check confidence score

4. **Import (Post-Sign)**:
   - Pick image
   - Sign & Verify (Not PoPC)
   - Check verdict = VERIFIED
   - Verify `popc.capture.kind: "post_signed"` in evidence

## Troubleshooting

### StrongBox not available
- Most devices don't have StrongBox (Pixel 3+, Samsung S9+)
- App will automatically fall back to TEE
- Check logs: "StrongBox key generation failed, trying TEE"

### TEE key generation fails
- Rare, but possible on some custom ROMs
- Falls back to software keys
- Security level: `software`

### Camera permission denied
- Check `AndroidManifest.xml` has `CAMERA` permission
- Request at runtime in `MainActivity`

### Verification returns "device_unknown"
- Device not enrolled
- Go to Enrollment screen and enroll first

### "Signature invalid"
- Check that signing and verification use same device
- Verify assertions JSON matches what was signed
- Check `KeystoreManager` signing logic

## Build Variants

```kotlin
buildTypes {
    debug {
        isDebuggable = true
        buildConfigField("String", "BASE_URL",
            "\"http://10.0.2.2:3000\"")  // Local API
    }

    release {
        isMinifyEnabled = true
        proguardFiles(
            getDefaultProguardFile("proguard-android-optimize.txt"),
            "proguard-rules.pro"
        )
        buildConfigField("String", "BASE_URL",
            "\"https://image-verification-production.up.railway.app\"")
    }
}
```

## ProGuard Rules

`proguard-rules.pro`:
```
-keep class com.popc.android.api.** { *; }
-keep class com.popc.android.crypto.** { *; }
-keepattributes Signature
-keepattributes *Annotation*
```

## Future Enhancements

- [ ] Video capture with Merkle-tree chunking
- [ ] Batch import and verification
- [ ] Certificate pinning for API
- [ ] User authentication for key usage
- [ ] Key rotation support
- [ ] Offline queue for verifications
- [ ] Background sync for evidence packages

## License

Proprietary - All rights reserved
