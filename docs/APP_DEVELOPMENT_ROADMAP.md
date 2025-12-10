# App Development Roadmap

**Goal:** Polish Android app and build iOS app for standalone use and SDK distribution.

---

## 📱 **ANDROID APP - Polish Items**

### **Priority 1: User Experience**

#### **1. Onboarding Flow** (NEW)
**What it does:** First-time user tutorial
- Welcome screen explaining PoPC
- "What is verified capture?" explainer
- Step-by-step enrollment guide
- Permission requests with explanations

**Files to create:**
- `OnboardingActivity.kt`
- `fragment_onboarding.xml` (multiple screens)
- SharedPreferences flag for "first_time_user"

#### **2. Error Messages** (IMPROVE)
**Current:** Technical errors ("Failed to connect to /127.0.0.1:3000")
**Needed:** User-friendly errors ("Network error. Please check your connection.")

**Files to modify:**
- All ViewModels (EnrollViewModel, CaptureViewModel, etc.)
- Create `ErrorMessages.kt` utility

#### **3. Empty States** (NEW)
**What it shows:** When no photos captured yet
- Empty state illustrations
- Helpful prompts ("Take your first verified photo!")

**Files to create:**
- Empty state layouts for Capture, Import, Evidence screens

#### **4. Loading States** (IMPROVE)
**Current:** Basic progress bars
**Needed:** Better feedback (percentage, estimated time)

**Files to modify:**
- `fragment_capture.xml`
- `CaptureViewModel.kt`

---

### **Priority 2: Features**

#### **5. Settings Screen** (NEW)
**What it includes:**
- View/change API key
- View device info (security level, device ID)
- Clear enrollment (for re-enrollment)
- App version, build info

**Files to create:**
- `SettingsFragment.kt`
- `fragment_settings.xml`
- Add to navigation graph

#### **6. About Screen** (NEW)
**What it includes:**
- What is PoPC?
- How does it work?
- Privacy policy link
- Terms of service link
- Contact/support

**Files to create:**
- `AboutFragment.kt`
- `fragment_about.xml`

#### **7. Photo Gallery** (NEW)
**What it does:** View all captured photos
- List of verified photos
- Tap to view full image
- Show verification status
- Re-verify option

**Files to create:**
- `GalleryFragment.kt`
- `fragment_gallery.xml`
- `GalleryAdapter.kt`

#### **8. Share Functionality** (NEW)
**What it does:** Share verified photos
- Share image + manifest together
- Copy verification link
- Share to social media

**Files to modify:**
- `CaptureFragment.kt`
- `ImportFragment.kt`

#### **9. Better Camera UI** (IMPROVE)
**Add:**
- Grid lines (rule of thirds)
- Flash control
- Focus indicator
- Exposure controls
- Front/back camera switch

**Files to modify:**
- `fragment_capture.xml`
- `CaptureFragment.kt`

---

### **Priority 3: Polish**

#### **10. App Icon** (IMPROVE)
**Current:** Generic icons
**Needed:** Professional branded icon

**Files to create:**
- `ic_launcher.png` (all densities)
- Vector drawable version

#### **11. Splash Screen** (NEW)
**What it shows:** Branded splash on app launch

**Files to create:**
- `SplashActivity.kt`
- `activity_splash.xml`

#### **12. Animations** (NEW)
**Add smooth transitions:**
- Fragment transitions
- Button click feedback
- Loading animations

---

## 🍎 **iOS APP - Build from Scratch**

### **Phase 1: Core Setup**

#### **1. Xcode Project Setup**
```
PoPC-iOS/
├── PoPC/
│   ├── Info.plist
│   ├── ContentView.swift
│   └── PopcApp.swift
├── PoPC.xcodeproj
└── Podfile (for dependencies)
```

#### **2. Core Infrastructure**
**Files to create:**
- `SecureEnclaveManager.swift` (iOS equivalent of KeystoreManager)
- `DeviceCheckManager.swift` (iOS attestation)
- `ManifestBuilder.swift` (C2PA manifest)
- `PopcApiClient.swift` (API client)
- `CryptoUtils.swift` (signing/hashing)

#### **3. Key iOS Technologies:**
- **Secure Enclave** (iOS equivalent of StrongBox)
- **DeviceCheck API** (iOS attestation)
- **CryptoKit** (signing)
- **AVFoundation** (camera)

---

### **Phase 2: UI Screens**

#### **Screens to Build:**
1. **EnrollmentView** (device enrollment)
2. **CaptureView** (camera + signing)
3. **VerifyView** (verify photos)
4. **GalleryView** (photo history)
5. **SettingsView** (config)

**SwiftUI vs. UIKit:**
- Recommend: **SwiftUI** (modern, easier)
- Alternative: UIKit (if targeting older iOS)

---

### **Phase 3: Backend Integration**

**Same API as Android:**
- POST /v1/enroll (with iOS attestation format)
- POST /v1/verify
- GET /v1/evidence/:id

**Backend changes needed:**
- Support iOS attestation format
- Support DeviceCheck tokens
- Support Secure Enclave certificates

---

## ⏱️ **Time Estimates**

### **Android Polish:**
```
Priority 1 (UX):        2-3 weeks
Priority 2 (Features):  2-3 weeks  
Priority 3 (Polish):    1 week

Total: 5-7 weeks for fully polished Android app
```

### **iOS Development:**
```
Phase 1 (Core):         3-4 weeks
Phase 2 (UI):           2-3 weeks
Phase 3 (Integration):  1-2 weeks

Total: 6-9 weeks for MVP iOS app
```

### **Both Apps Fully Polished:**
```
~12-16 weeks (3-4 months) working solo
~6-8 weeks with 2 developers
```

---

## 🎯 **Recommended Priority:**

### **Option A: Polish Android First** ✅ RECOMMENDED
**Reasoning:**
- Android is functional - get it to market faster
- Learn from real users before building iOS
- iOS users expect higher polish anyway
- Validate product-market fit first

**Timeline:**
1. Polish Android (5-7 weeks)
2. Launch on Play Store
3. Get user feedback
4. Build iOS with lessons learned

---

### **Option B: Basic Polish + Start iOS in Parallel**
**Reasoning:**
- Get both platforms out faster
- More potential users

**Timeline:**
1. Basic Android polish (2 weeks)
2. Start iOS development
3. Finish both together (6-8 weeks)

---

## 📋 **What Do You Want to Tackle First?**

**Quick wins (1-2 days each):**
1. Better error messages
2. Settings screen
3. About screen
4. Improved app icon

**Bigger features (1 week each):**
1. Onboarding flow
2. Photo gallery
3. Share functionality
4. Better camera UI

**iOS (6-9 weeks):**
1. Full iOS app from scratch

---

## 🎯 **My Recommendation:**

**Start with Android polish:**
1. ✅ Better error messages (1 day)
2. ✅ Settings screen (1 day)
3. ✅ About screen (1 day)
4. ✅ Onboarding flow (2-3 days)
5. ✅ Photo gallery (3-4 days)

**Get Android to "App Store Ready"** in 2-3 weeks.

**Then tackle iOS** with a polished Android app as reference.

---

**What would you like to work on first?** 

Options:
1. Polish Android app (which features?)
2. Start iOS app (from scratch)
3. Publish current Android app as-is (it's functional!)
4. Something else?

Let me know and I'll get started! 🚀
