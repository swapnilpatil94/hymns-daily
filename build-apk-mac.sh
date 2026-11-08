#!/bin/bash
# Build + install the debug APK on a Mac. Needs: Node 22, JDK 21 (brew install openjdk@21), Android SDK (Android Studio installs it).
set -e
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
npm ci && npm run build && npx cap sync android
(cd android && ./gradlew assembleDebug)
APK=android/app/build/outputs/apk/debug/app-debug.apk
echo "APK: $APK"
command -v adb >/dev/null && adb install -r "$APK" || echo "Plug in phone (USB debugging on) and run: adb install -r $APK"
