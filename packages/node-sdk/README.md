# @popc/node

**Official Node.js SDK for PoPC (Proof of Physical Capture)**

Verify photos and videos cryptographically in your Node.js application.

---

## 📦 **Installation**

```bash
npm install @popc/node
```

---

## 🚀 **Quick Start**

```javascript
const { PoPC } = require('@popc/node');
const fs = require('fs');

// Initialize
const popc = new PoPC({ apiKey: process.env.POPC_API_KEY });

// Verify a photo
const imageBuffer = fs.readFileSync('photo.jpg');
const manifestBuffer = fs.readFileSync('photo.jpg.c2pa');

const result = await popc.verify(imageBuffer, manifestBuffer);

console.log(result.verdict); // 'verified', 'tampered', or 'invalid'
console.log(result.confidence); // 0-100
console.log(result.deviceId); // Device that captured it
```

---

## 📚 **API Reference**

### **`new PoPC(config)`**

Create a new PoPC client.

```javascript
const popc = new PoPC({
  apiKey: 'pk_your_key_here',
  apiUrl: 'https://api.popc.dev' // Optional
});
```

### **`verify(image, manifest)`**

Verify a photo or video.

**Parameters:**
- `image` - Image file as Buffer, Blob, or File
- `manifest` - C2PA manifest file as Buffer, Blob, or File

**Returns:** `Promise<VerificationResult>`

```javascript
const result = await popc.verify(imageBuffer, manifestBuffer);

// Result:
{
  verdict: 'verified',
  confidence: 100,
  mode: 'certified',
  deviceId: 'dev_android_abc123',
  securityLevel: 'strongbox',
  reasons: ['hardware_attestation_present', 'signature_valid'],
  verificationId: '5c536b8e-192e-4617-8b39-0094c6dcfdf6',
  timestamp: '2025-12-04T22:38:55Z'
}
```

### **`verifyBatch(items)`**

Verify multiple photos/videos in parallel.

```javascript
const results = await popc.verifyBatch([
  { image: buffer1, manifest: manifest1 },
  { image: buffer2, manifest: manifest2 },
  { image: buffer3, manifest: manifest3 }
]);

const verifiedCount = results.filter(r => r.verdict === 'verified').length;
```

### **`getEvidence(verificationId)`**

Get detailed evidence for a verification.

```javascript
const evidence = await popc.getEvidence('5c536b8e-...');

console.log(evidence.deviceId);
console.log(evidence.capturedAt);
console.log(evidence.signatureValid);
```

### **`listDevices()`**

List all enrolled devices.

```javascript
const devices = await popc.listDevices();

devices.forEach(device => {
  console.log(`${device.id} - ${device.platform} - ${device.securityLevel}`);
});
```

### **`revokeDevice(deviceId)`**

Revoke a device (disable future verifications from it).

```javascript
await popc.revokeDevice('dev_android_abc123');
```

### **`getKeyInfo()`**

Get API key info and usage stats.

```javascript
const info = await popc.getKeyInfo();

console.log(`Used ${info.usage.total} verifications`);
console.log(`Rate limit: ${info.rateLimit.perDay}/day`);
```

---

## 💡 **Examples**

### **Express.js API**

```javascript
const express = require('express');
const multer = require('multer');
const { PoPC } = require('@popc/node');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const popc = new PoPC({ apiKey: process.env.POPC_API_KEY });

app.post('/upload', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'manifest', maxCount: 1 }
]), async (req, res) => {
  const imageBuffer = req.files.image[0].buffer;
  const manifestBuffer = req.files.manifest[0].buffer;
  
  const result = await popc.verify(imageBuffer, manifestBuffer);
  
  if (result.verdict === 'verified') {
    res.json({ success: true, verified: true });
  } else {
    res.status(400).json({ success: false, reason: result.verdict });
  }
});

app.listen(3000);
```

### **Fastify API**

```javascript
const fastify = require('fastify')();
const { PoPC } = require('@popc/node');

const popc = new PoPC({ apiKey: process.env.POPC_API_KEY });

fastify.post('/verify', async (request, reply) => {
  const data = await request.file();
  const image = await data.toBuffer();
  
  const manifestData = await request.file();
  const manifest = await manifestData.toBuffer();
  
  const result = await popc.verify(image, manifest);
  
  return { verified: result.verdict === 'verified', result };
});

fastify.listen({ port: 3000 });
```

### **Batch Processing**

```javascript
const fs = require('fs/promises');
const { PoPC } = require('@popc/node');

const popc = new PoPC({ apiKey: process.env.POPC_API_KEY });

async function verifyDirectory(dir) {
  const files = await fs.readdir(dir);
  const images = files.filter(f => f.endsWith('.jpg'));
  
  const items = await Promise.all(
    images.map(async (img) => ({
      image: await fs.readFile(`${dir}/${img}`),
      manifest: await fs.readFile(`${dir}/${img}.c2pa`)
    }))
  );
  
  const results = await popc.verifyBatch(items);
  
  console.log(`Verified ${results.filter(r => r.verdict === 'verified').length}/${results.length} photos`);
  
  return results;
}

verifyDirectory('./uploads');
```

---

## 🔐 **Error Handling**

```javascript
const { PoPC, PopcError } = require('@popc/node');

try {
  const result = await popc.verify(image, manifest);
} catch (error) {
  if (error instanceof PopcError) {
    console.error(`PoPC Error: ${error.message}`);
    console.error(`Status: ${error.statusCode}`);
    console.error(`Details:`, error.details);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

## 📖 **TypeScript Support**

Full TypeScript support included:

```typescript
import { PoPC, VerificationResult, DeviceInfo } from '@popc/node';

const popc = new PoPC({ apiKey: process.env.POPC_API_KEY! });

const result: VerificationResult = await popc.verify(image, manifest);

if (result.verdict === 'verified') {
  console.log(`Device ${result.deviceId} verified at ${result.timestamp}`);
}
```

---

## 📚 **Learn More**

- [Quick Start Guide](../../docs/QUICK_START.md)
- [API Reference](../../docs/API_REFERENCE.md)
- [Example Apps](https://github.com/popc-dev/examples)
- [Dashboard](https://popc.dev/dashboard)

---

## 📄 **License**

MIT License - See [LICENSE](../../LICENSE) for details.

---

## 💬 **Support**

- **Email:** support@popc.dev
- **Discord:** [Join community](https://discord.gg/popc)
- **Issues:** [GitHub Issues](https://github.com/romeoxt/image-verification/issues)

---

**Built with ❤️ by the PoPC team**

