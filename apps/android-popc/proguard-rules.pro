# Add project specific ProGuard rules here.
# Battery optimization rules for PoPC Android App

# Keep line numbers for crash reporting
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Remove all logging in release builds
-assumenosideeffects class timber.log.Timber* {
    public static *** v(...);
    public static *** d(...);
    public static *** i(...);
    public static *** w(...);
}

# Keep Timber errors for crash reporting
-keep class timber.log.Timber$Tree {
    public protected *;
}

# Keep Android components
-keep public class * extends android.app.Activity
-keep public class * extends android.app.Application
-keep public class * extends android.app.Service
-keep public class * extends android.content.BroadcastReceiver
-keep public class * extends android.content.ContentProvider

# Keep ViewModels
-keep class * extends androidx.lifecycle.ViewModel {
    <init>(...);
}

# Keep data classes used in API
-keepclassmembers class com.popc.android.api.** {
    <init>(...);
    <fields>;
}

# OkHttp3 rules
-dontwarn okhttp3.**
-dontwarn okio.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep ViewBinding
-keep class * implements androidx.viewbinding.ViewBinding {
    public static *** bind(android.view.View);
    public static *** inflate(android.view.LayoutInflater);
}

# Keep Parcelable implementations
-keepclassmembers class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator CREATOR;
}

# CameraX rules
-keep class androidx.camera.** { *; }
-keepclassmembers class androidx.camera.** { *; }

# Optimization: Aggressive optimization for battery
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-verbose

# Remove unused code
-dontwarn java.lang.management.**
-dontwarn javax.management.**
-dontwarn org.slf4j.**

# Strip debug info
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
    public static *** w(...);
}

