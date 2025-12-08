# PoPC - Proof of Physical Capture

**The easiest way to prove a photo or video is real.**

A developer-first SDK built on C2PA, StrongBox, and hardware attestation. Add trusted capture to any app in minutes.

---

## 🎯 **What is PoPC?**

PoPC is a lightweight SDK and API that lets developers cryptographically verify that photos and videos were captured on a real device, not generated or tampered with.

Think **Stripe for payments**, but for **verified media**.

### **Perfect for:**
- 📱 Fitness apps (verified before/after photos)
- 🏠 Marketplace apps (verified item photos)
- 🚚 Delivery apps (verified completion photos)
- 🏢 Property apps (verified walkthrough photos)
- 💪 Gig economy apps (verified job start/end photos)
- 🎨 Creator platforms (verified original content)

### **NOT for:**
- ❌ Enterprise inspection workflows
- ❌ Insurance case management  
- ❌ Closed ecosystems
- ❌ Agent dashboards

---

## ⚡ **Quick Start**

### **Install the SDK:**

```bash
npm install @popc/web
```

### **Capture & Sign (3 lines):**

```javascript
import { PoPC } from '@popc/web';

const popc = new PoPC({ apiKey: 'your_api_key' });
const result = await popc.capture(); // Captures photo with hardware attestation
const verified = await popc.verify(result.manifest); // Verify signature

console.log(verified.verdict); // 'verified', 'tampered', or 'invalid'
```

### **Verify an Image (1 API call):**

```bash
curl -X POST https://api.popc.dev/v1/verify \
  -H "Authorization: Bearer your_api_key" \
  -F "image=@photo.jpg" \
  -F "manifest=@photo.jpg.c2pa"
```

**Response:**
```json
{
  "verdict": "verified",
  "confidence": 100,
  "mode": "certified",
  "deviceId": "dev_abc123",
  "securityLevel": "strongbox",
  "reasons": ["hardware_attestation_present", "signature_valid"]
}
```

---

## 🏗️ **Three Core Features**

### **1. Capture & Sign**
Cryptographically sign photos/videos at the moment of capture.

- ✅ Hardware-backed keys (StrongBox, TEE)
- ✅ C2PA manifest packaging
- ✅ Device attestation
- ✅ Android SDK (iOS coming soon)

### **2. Verify Authenticity**
One API endpoint to verify if media is real or tampered.

- ✅ REST API
- ✅ JSON response (real/not real)
- ✅ Evidence metadata
- ✅ Confidence scoring

### **3. Developer Dashboard**
Simple portal to manage devices and view verification logs.

- ✅ Enrolled devices
- ✅ Recent verifications
- ✅ API key management
- ✅ Usage analytics

---

## 📦 **Available SDKs**

| Platform | Package | Status |
|----------|---------|--------|
| **Android** | `com.popc.android` | ✅ Available |
| **Node.js** | `@popc/node` | ✅ Available |
| **Web/React** | `@popc/web` | 🚧 Coming Soon |
| **iOS/Swift** | `PoPC-iOS` | 🚧 Coming Soon |
| **CLI** | `@popc/cli` | ✅ Available |

---

## 🎬 **Live Demo**

Try the verification portal: [https://popc.dev/verify](https://image-verification-production.up.railway.app/verify)

Upload any photo with a `.c2pa` manifest to see instant verification.

---

## 🚀 **Get Started**

### **Step 1: Get an API Key**

Sign up at [popc.dev](https://image-verification-production.up.railway.app) or create one via CLI:

```bash
npm install -g @popc/cli
popc login
popc keys create --name "My App"
```

### **Step 2: Choose Your Platform**

#### **Android App:**
```gradle
implementation 'com.popc:android:1.0.0'
```

```kotlin
val popc = PoPC(apiKey = "pk_xxx")
val manifest = popc.captureAndSign(photo)
val result = popc.verify(manifest)
```

#### **Node.js Backend:**
```bash
npm install @popc/node
```

```javascript
const { PoPC } = require('@popc/node');

const popc = new PoPC({ apiKey: process.env.POPC_API_KEY });

// Verify uploaded photo
const result = await popc.verify(imageBuffer, manifestBuffer);

if (result.verdict === 'verified') {
  console.log('Photo is authentic!');
}
```

#### **Web App:**
```bash
npm install @popc/web
```

```javascript
import { PoPC } from '@popc/web';

const popc = new PoPC({ apiKey: 'pk_xxx' });

// Capture via webcam
const { image, manifest } = await popc.captureFromCamera();

// Verify
const result = await popc.verify(manifest);
```

### **Step 3: Test It**

Use the CLI to test your integration:

```bash
popc verify photo.jpg photo.jpg.c2pa
```

---

## 💰 **Pricing**

### **Starter** - $19/mo
- 1,000 verifications/month
- Basic dashboard
- Android & Web SDK
- Community support

### **Growth** - $79/mo
- 10,000 verifications/month
- Team dashboard
- Device revocation API
- Email support

### **Pro** - $199/mo
- 50,000 verifications/month
- Audit logs
- Custom device types
- Priority support

### **Enterprise** - Custom
- Unlimited verifications
- On-premise deployment
- SLA
- Dedicated support

**Free tier:** 100 verifications/month forever.

---

## 🔐 **How It Works**

```
┌─────────────────┐
│   Your App      │
│  (iOS/Android)  │
└────────┬────────┘
         │
         │ 1. Capture photo
         ↓
┌─────────────────┐
│  PoPC SDK       │  2. Sign with device's secure hardware
│  (StrongBox)    │     (TEE, StrongBox, Secure Enclave)
└────────┬────────┘
         │
         │ 3. Upload image + C2PA manifest
         ↓
┌─────────────────┐
│  PoPC API       │  4. Verify signature & attestation
│  (Railway)      │     5. Return verdict (verified/tampered)
└────────┬────────┘
         │
         │ 6. Store evidence
         ↓
┌─────────────────┐
│  Dashboard      │  View all verifications
│  (Next.js)      │
└─────────────────┘
```

**Security Model:**
1. **Device Enrollment** - Device generates hardware-backed keypair
2. **Attestation** - Android Key Attestation or Apple DeviceCheck
3. **Signing** - Each photo signed with device's private key
4. **C2PA Manifest** - Industry-standard content credentials
5. **Verification** - Backend verifies signature + attestation chain

---

## 📚 **Documentation**

- [Quick Start Guide](./docs/QUICK_START.md)
- [API Reference](./docs/API_REFERENCE.md)
- [Android SDK Docs](./apps/android-popc/README.md)
- [Node.js SDK Docs](./packages/desktop-signer/README.md)
- [C2PA Integration Guide](./packages/c2pa/README.md)

Full docs: [docs.popc.dev](https://github.com/romeoxt/image-verification)

---

## 🎯 **Use Cases**

### **Fitness Apps**
```javascript
// User uploads before/after transformation photos
const before = await popc.verify(beforeImage);
const after = await popc.verify(afterImage);

if (before.verdict === 'verified' && after.verdict === 'verified') {
  // Award challenge points
  user.awardPoints(100);
}
```

### **Marketplace Apps**
```javascript
// Seller lists item with verified photos
const listing = await createListing({
  title: "iPhone 15 Pro",
  photos: verifiedPhotos, // Only accept PoPC-verified photos
  verified: true
});

// Show "Verified Photos ✓" badge
```

### **Delivery Apps**
```javascript
// Driver completes delivery with proof photo
const delivery = await completeDelivery({
  orderId: '12345',
  proofPhoto: verifiedImage,
  location: gpsCoords
});

// Customer sees verified completion photo
```

---

## 🛠️ **Tech Stack**

- **Mobile:** Kotlin (Android), Swift (iOS - coming soon)
- **Backend:** Node.js + Fastify + PostgreSQL
- **Dashboard:** Next.js + React
- **Crypto:** Android Keystore, StrongBox, C2PA
- **Hosting:** Railway (API), Vercel (Dashboard)

---

## 🌟 **Why PoPC vs. Alternatives?**

| Feature | PoPC | Truepic | DIY Solution |
|---------|------|---------|--------------|
| **Developer-first** | ✅ SDK + API | ❌ Enterprise only | ⚠️ Build it yourself |
| **Self-serve onboarding** | ✅ Sign up + go | ❌ Sales required | N/A |
| **Pricing** | ✅ $19/mo starter | ❌ Enterprise contracts | ✅ Free (but months of work) |
| **Hardware attestation** | ✅ StrongBox + TEE | ✅ Yes | ⚠️ Complex to implement |
| **C2PA compliant** | ✅ Yes | ✅ Yes | ⚠️ Must implement yourself |
| **Open source** | ✅ Core is open | ❌ Closed | ✅ Yes (if you build) |
| **Time to integrate** | ⚡ 10 minutes | 🐌 Months | 🐌 3-6 months |

---

## 🚧 **Roadmap**

### **Q1 2026**
- ✅ Android SDK (StrongBox)
- ✅ Verification API
- ✅ Developer Dashboard
- 🚧 Web SDK (WebAuthn)
- 🚧 iOS SDK (Secure Enclave)

### **Q2 2026**
- Video verification
- Batch verification API
- Webhooks
- Advanced analytics

### **Q3 2026**
- Zero-knowledge proofs (privacy mode)
- Multi-device sync
- Team collaboration

### **Future**
- Blockchain anchoring (optional)
- Advanced privacy extensions
- Enterprise trust extensions

---

## 🤝 **Community**

- **GitHub:** [romeoxt/image-verification](https://github.com/romeoxt/image-verification)
- **Discord:** [Join our community](https://discord.gg/popc)
- **Twitter:** [@popc_dev](https://twitter.com/popc_dev)
- **Email:** hello@popc.dev

---

## 📄 **License**

MIT License - See [LICENSE](./LICENSE) for details.

Core libraries are open source. Hosted API requires subscription.

---

## 🎉 **Built by Developers, for Developers**

PoPC was built because we were frustrated that "verified photos" required:
- ❌ Enterprise sales calls
- ❌ 6-month contracts
- ❌ Custom integrations
- ❌ Closed ecosystems

We wanted the **Stripe experience** for verified media:
- ✅ Sign up in 30 seconds
- ✅ Install SDK in 1 minute
- ✅ Integrate in 10 lines of code
- ✅ Pay-as-you-grow pricing

**If you're building an app that needs to trust photos or videos, PoPC is for you.**

---

**Get started today:** [popc.dev](https://image-verification-production.up.railway.app)

**Questions?** Open an issue or email hello@popc.dev
