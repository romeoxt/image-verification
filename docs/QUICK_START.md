# Quick Start - PoPC SDK

**Get verified photos working in your app in under 10 minutes.**

---

## 🚀 **Choose Your Path**

- [Android App](#android-quick-start) - Kotlin/Java
- [Node.js Backend](#nodejs-quick-start) - Express, Fastify, etc.
- [Web App](#web-quick-start) - React, Vue, vanilla JS
- [CLI Tool](#cli-quick-start) - For testing

---

## 📱 **Android Quick Start**

### **Step 1: Add Dependency**

In your `build.gradle.kts`:

```kotlin
dependencies {
    implementation("com.popc:android:1.0.0")
}
```

### **Step 2: Get API Key**

```bash
# Sign up at popc.dev or create via CLI
curl -X POST https://api.popc.dev/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"name": "My Android App"}'
```

Add to `build.gradle.kts`:

```kotlin
buildConfigField("String", "POPC_API_KEY", "\"pk_your_key_here\"")
```

### **Step 3: Enroll Device**

```kotlin
import com.popc.android.PoPC

class MainActivity : AppCompatActivity() {
    private lateinit var popc: PoPC
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize PoPC
        popc = PoPC(
            context = this,
            apiKey = BuildConfig.POPC_API_KEY
        )
        
        // Enroll device (one-time)
        lifecycleScope.launch {
            val enrollment = popc.enroll()
            if (enrollment.success) {
                Log.i("PoPC", "Device enrolled: ${enrollment.deviceId}")
            }
        }
    }
}
```

### **Step 4: Capture & Sign Photo**

```kotlin
// In your CameraActivity or Fragment
button.setOnClickListener {
    lifecycleScope.launch {
        // Capture photo with hardware attestation
        val result = popc.captureAndSign()
        
        when (result) {
            is CaptureResult.Success -> {
                val imageFile = result.imageFile
                val manifest = result.manifest
                
                // Upload to your backend
                uploadPhoto(imageFile, manifest)
            }
            is CaptureResult.Error -> {
                Toast.makeText(this, "Capture failed", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
```

### **Step 5: Verify Photo**

```kotlin
// Verify a photo (local or from server)
lifecycleScope.launch {
    val verification = popc.verify(imageFile, manifestFile)
    
    when (verification.verdict) {
        "verified" -> {
            textView.text = "✓ Photo is authentic!"
            textView.setTextColor(Color.GREEN)
        }
        "tampered" -> {
            textView.text = "✗ Photo has been modified"
            textView.setTextColor(Color.RED)
        }
        "invalid" -> {
            textView.text = "✗ Invalid signature"
            textView.setTextColor(Color.RED)
        }
    }
}
```

**That's it!** You now have verified photos in your Android app.

---

## 🖥️ **Node.js Quick Start**

### **Step 1: Install**

```bash
npm install @popc/node
```

### **Step 2: Initialize**

```javascript
const { PoPC } = require('@popc/node');

const popc = new PoPC({
  apiKey: process.env.POPC_API_KEY,
  apiUrl: 'https://api.popc.dev' // Optional, uses default if omitted
});
```

### **Step 3: Verify Uploaded Photos**

**Express.js Example:**

```javascript
const express = require('express');
const multer = require('multer');
const { PoPC } = require('@popc/node');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const popc = new PoPC({ apiKey: process.env.POPC_API_KEY });

// Endpoint to verify uploaded photo
app.post('/upload', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'manifest', maxCount: 1 }
]), async (req, res) => {
  try {
    const imageBuffer = req.files.image[0].buffer;
    const manifestBuffer = req.files.manifest[0].buffer;
    
    // Verify photo
    const result = await popc.verify(imageBuffer, manifestBuffer);
    
    if (result.verdict === 'verified') {
      // Photo is authentic - save to database
      await saveToDatabase({
        image: imageBuffer,
        verified: true,
        deviceId: result.deviceId,
        confidence: result.confidence
      });
      
      res.json({ 
        success: true,
        message: 'Photo verified and saved',
        verdict: result.verdict 
      });
    } else {
      // Photo is not authentic - reject
      res.status(400).json({ 
        success: false,
        message: 'Photo verification failed',
        verdict: result.verdict,
        reasons: result.reasons
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000);
```

### **Step 4: Batch Verification**

```javascript
// Verify multiple photos at once
const photos = [
  { image: buffer1, manifest: manifest1 },
  { image: buffer2, manifest: manifest2 },
  { image: buffer3, manifest: manifest3 }
];

const results = await popc.verifyBatch(photos);

// Filter only verified photos
const verifiedPhotos = results.filter(r => r.verdict === 'verified');

console.log(`${verifiedPhotos.length} / ${photos.length} photos verified`);
```

---

## 🌐 **Web Quick Start**

### **Step 1: Install**

```bash
npm install @popc/web
```

### **Step 2: Capture from Webcam**

```javascript
import { PoPC } from '@popc/web';

const popc = new PoPC({ apiKey: 'pk_your_key_here' });

// Capture photo from webcam with WebAuthn attestation
async function capturePhoto() {
  try {
    const result = await popc.captureFromCamera({
      width: 1920,
      height: 1080,
      facingMode: 'user' // or 'environment' for back camera
    });
    
    // result contains image blob and C2PA manifest
    const { image, manifest } = result;
    
    // Display preview
    const img = document.getElementById('preview');
    img.src = URL.createObjectURL(image);
    
    // Upload to your backend
    await uploadPhoto(image, manifest);
    
  } catch (error) {
    console.error('Capture failed:', error);
  }
}

document.getElementById('captureBtn').onclick = capturePhoto;
```

### **Step 3: Verify Uploaded Photo**

```javascript
// Verify a photo uploaded by user
async function verifyPhoto(imageFile, manifestFile) {
  const result = await popc.verify(imageFile, manifestFile);
  
  // Display result
  const badge = document.getElementById('verificationBadge');
  
  if (result.verdict === 'verified') {
    badge.innerHTML = '✓ Verified Photo';
    badge.className = 'badge-success';
  } else {
    badge.innerHTML = '✗ Unverified';
    badge.className = 'badge-error';
  }
  
  // Show details
  document.getElementById('deviceId').textContent = result.deviceId;
  document.getElementById('confidence').textContent = `${result.confidence}%`;
}
```

### **Step 4: React Component Example**

```jsx
import { useState } from 'react';
import { PoPC } from '@popc/web';

function PhotoUpload() {
  const [result, setResult] = useState(null);
  const popc = new PoPC({ apiKey: process.env.REACT_APP_POPC_API_KEY });
  
  async function handleCapture() {
    const { image, manifest } = await popc.captureFromCamera();
    const verification = await popc.verify(manifest);
    setResult(verification);
  }
  
  return (
    <div>
      <button onClick={handleCapture}>Capture & Verify Photo</button>
      
      {result && (
        <div className={`result ${result.verdict}`}>
          <h3>{result.verdict === 'verified' ? '✓ Verified' : '✗ Not Verified'}</h3>
          <p>Confidence: {result.confidence}%</p>
          <p>Device: {result.deviceId}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🔧 **CLI Quick Start**

### **Step 1: Install**

```bash
npm install -g @popc/cli
```

### **Step 2: Login**

```bash
popc login
# Opens browser to authenticate
```

### **Step 3: Create API Key**

```bash
popc keys create --name "My Project"
# Output: pk_a00a94a9cc00156a194564a02038ac8c79888712290c5301767e654c7652affa
```

### **Step 4: Verify a Photo**

```bash
# Verify local photo
popc verify photo.jpg photo.jpg.c2pa

# Output:
# ✓ Verdict: verified
# Confidence: 100/100
# Device: dev_android_abc123
# Security: strongbox
```

### **Step 5: Sign a Photo (Desktop)**

```bash
# Sign a photo using desktop signer
popc sign photo.jpg --output signed.jpg

# This creates:
# - signed.jpg (original image)
# - signed.jpg.c2pa (manifest file)
```

### **Step 6: Check API Usage**

```bash
# View your usage
popc usage

# Output:
# API Key: Production Mobile App
# This Month: 3,542 verifications
# Limit: 10,000 / month
# Cost: $79.00
```

---

## 🎯 **Real-World Examples**

### **Example 1: Fitness App - Before/After Photos**

```javascript
// User starts challenge
const user = await User.findById(userId);

// Capture verified "before" photo
const beforePhoto = await popc.captureAndSign();
await user.setChallengePhoto('before', beforePhoto);

// 30 days later...
// Capture verified "after" photo
const afterPhoto = await popc.captureAndSign();
await user.setChallengePhoto('after', afterPhoto);

// Verify both photos before awarding points
const beforeVerified = await popc.verify(user.beforePhoto);
const afterVerified = await popc.verify(user.afterPhoto);

if (beforeVerified.verdict === 'verified' && 
    afterVerified.verdict === 'verified') {
  // Both photos authentic - award points
  user.awardPoints(500);
  user.badge = 'Challenge Completed ✓';
}
```

### **Example 2: Marketplace - Verified Item Listings**

```javascript
// Seller creates listing
app.post('/listings', upload.array('photos'), async (req, res) => {
  const { title, price, description } = req.body;
  const photos = req.files;
  
  // Verify all photos
  const verifiedPhotos = [];
  
  for (const photo of photos) {
    const manifest = photo.manifest; // Assume uploaded alongside
    const result = await popc.verify(photo.buffer, manifest);
    
    if (result.verdict === 'verified') {
      verifiedPhotos.push({
        url: await uploadToS3(photo),
        verified: true,
        deviceId: result.deviceId,
        capturedAt: result.timestamp
      });
    }
  }
  
  // Create listing with "Verified Photos" badge
  const listing = await Listing.create({
    title,
    price,
    description,
    photos: verifiedPhotos,
    verifiedPhotosCount: verifiedPhotos.length
  });
  
  res.json({ 
    success: true, 
    listing,
    verifiedBadge: verifiedPhotos.length === photos.length 
  });
});
```

### **Example 3: Delivery App - Proof of Completion**

```javascript
// Driver completes delivery
async function completeDelivery(orderId, proofPhoto, proofManifest) {
  // Verify proof photo
  const verification = await popc.verify(proofPhoto, proofManifest);
  
  if (verification.verdict !== 'verified') {
    throw new Error('Proof photo must be verified');
  }
  
  // Update delivery status
  const delivery = await Delivery.findById(orderId);
  delivery.status = 'completed';
  delivery.proofPhoto = await uploadToS3(proofPhoto);
  delivery.proofVerified = true;
  delivery.completedAt = new Date();
  delivery.deviceId = verification.deviceId;
  await delivery.save();
  
  // Notify customer with verified proof
  await sendNotification(delivery.customerId, {
    title: 'Delivery Completed',
    body: 'Your order has been delivered (verified proof photo attached)',
    image: delivery.proofPhoto,
    verified: true
  });
  
  return delivery;
}
```

---

## 🔐 **Security Best Practices**

### **1. Store API Keys Securely**

```bash
# Environment variables (recommended)
export POPC_API_KEY=pk_your_key_here

# Or use .env file (with .gitignore)
echo "POPC_API_KEY=pk_your_key_here" > .env
```

**❌ Don't:**
```javascript
const apiKey = 'pk_hardcoded_key'; // NEVER do this!
```

**✅ Do:**
```javascript
const apiKey = process.env.POPC_API_KEY;
```

### **2. Use Different Keys for Dev/Prod**

```javascript
const apiKey = process.env.NODE_ENV === 'production'
  ? process.env.POPC_API_KEY_PROD
  : process.env.POPC_API_KEY_DEV;
```

### **3. Handle Verification Failures Gracefully**

```javascript
try {
  const result = await popc.verify(image, manifest);
  
  switch (result.verdict) {
    case 'verified':
      // All good
      break;
    case 'tampered':
      // Show warning to user
      alert('This photo appears to have been modified');
      break;
    case 'invalid':
      // Reject upload
      throw new Error('Photo signature is invalid');
  }
} catch (error) {
  // Network error, API down, etc.
  console.error('Verification failed:', error);
  // Decide: allow photo anyway, or reject?
}
```

### **4. Verify on Backend, Not Client**

**❌ Bad (client-side only):**
```javascript
// User can bypass this!
const result = await popc.verify(photo);
if (result.verified) {
  submitPhoto(photo);
}
```

**✅ Good (backend verification):**
```javascript
// Client
await uploadPhoto(photo, manifest);

// Server
app.post('/upload', async (req, res) => {
  const result = await popc.verify(req.files.image, req.files.manifest);
  if (result.verdict !== 'verified') {
    return res.status(400).json({ error: 'Photo not verified' });
  }
  // Save photo
});
```

---

## 🐛 **Troubleshooting**

### **"Device not enrolled" error**

```javascript
// Make sure to enroll device first
await popc.enroll();

// Then you can capture
await popc.captureAndSign();
```

### **"API key invalid" error**

```bash
# Check your API key
popc keys list

# Create a new one if needed
popc keys create --name "New Key"
```

### **"Verification failed" but photo is real**

- Check that manifest file matches image file
- Ensure manifest wasn't tampered with during upload
- Verify clock on device is accurate (for timestamp checks)

### **High battery drain on Android**

- Use release build, not debug (less logging)
- Only call `captureAndSign()` when user explicitly taps button
- Camera releases automatically when navigating away

---

## 📚 **Next Steps**

- [API Reference](./API_REFERENCE.md) - Full API documentation
- [Android SDK Guide](../apps/android-popc/README.md) - Android-specific docs
- [Examples Repository](https://github.com/popc-dev/examples) - More code examples
- [Dashboard](https://popc.dev/dashboard) - View your usage & devices

---

## 💬 **Need Help?**

- **Discord:** [Join our community](https://discord.gg/popc)
- **Email:** support@popc.dev
- **GitHub Issues:** [Report bugs](https://github.com/romeoxt/image-verification/issues)

---

**Happy building! 🚀**

