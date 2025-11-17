#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

# Parse command line arguments
RECREATE=0
if [[ "${1:-}" == "--recreate" ]]; then
  RECREATE=1
  echo "⚠️  --recreate flag detected: Will remove and recreate android folder"
fi

# Optional: Check for uncommitted changes
if command -v git &> /dev/null && [ -d .git ]; then
  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    echo "⚠️  You have uncommitted changes."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "❌ Build cancelled. Please commit your changes first."
      exit 1
    fi
  fi
fi

# Handle android folder
if [ "$RECREATE" -eq 1 ]; then
  echo "🗑 Removing existing Android folder..."
  rm -rf android
  echo "➕ Adding Android platform..."
  npx cap add android
elif [ -d "android" ]; then
  echo "📁 android folder exists — preserving native changes"
else
  echo "➕ Adding Android platform (first time)..."
  npx cap add android
fi

echo "📦 Installing dependencies..."
npm install

echo "🧹 Cleaning Next.js cache..."
rm -rf .next
rm -rf out

echo "🛠 Building web assets..."
npm run build

echo "🔄 Generating native icons from public/accord-icon.png and syncing with Capacitor..."
if [ -x "./scripts/generate-native-icons.sh" ]; then
  ./scripts/generate-native-icons.sh
else
  # Make sure the script is executable and then run
  chmod +x ./scripts/generate-native-icons.sh 2>/dev/null || true
  ./scripts/generate-native-icons.sh
fi
npx cap copy android
npx cap sync android

# Ensure Android SDK is configured for Gradle builds (writes android/local.properties if missing)
check_android_sdk() {
  ANDROID_DIR="$PWD/android"
  LOCAL_PROPERTIES_PATH="$ANDROID_DIR/local.properties"

  if [ -f "$LOCAL_PROPERTIES_PATH" ]; then
    echo "ℹ️  local.properties already exists. Skipping SDK auto-detection."
    return 0
  fi

  if [ -n "${ANDROID_SDK_ROOT:-}" ]; then
    SDK_DIR="$ANDROID_SDK_ROOT"
  elif [ -n "${ANDROID_HOME:-}" ]; then
    SDK_DIR="$ANDROID_HOME"
  elif [ -d "$HOME/Android/Sdk" ]; then
    SDK_DIR="$HOME/Android/Sdk"
  elif [ -d "/usr/lib/android-sdk" ]; then
    SDK_DIR="/usr/lib/android-sdk"
  else
    echo "⚠️  Android SDK not found. Please set ANDROID_SDK_ROOT or ANDROID_HOME or install the SDK."
    return 1
  fi

  echo "sdk.dir=$SDK_DIR" > "$LOCAL_PROPERTIES_PATH"
  echo "✅ Wrote android/local.properties using sdk.dir=$SDK_DIR"
  return 0
}

check_android_sdk || true

echo "🧹 Cleaning previous builds..."
if [ -x "./android/gradlew" ]; then
  (cd android && ./gradlew clean)
elif [ -x "./android/gradlew.bat" ]; then
  (cd android && ./gradlew.bat clean)
else
  chmod +x ./android/gradlew 2>/dev/null || true
  (cd android && ./gradlew clean)
fi

echo "📱 Building APK..."
if [ -x "./android/gradlew" ]; then
  (cd android && ./gradlew assembleDebug --no-build-cache)
elif [ -x "./android/gradlew.bat" ]; then
  (cd android && ./gradlew.bat assembleDebug --no-build-cache)
else
  echo "⚠️  gradlew not found or not executable. Attempting to fix..."
  chmod +x ./android/gradlew 2>/dev/null || true
  (cd android && ./gradlew assembleDebug --no-build-cache)
fi

echo ""
echo "✅ Build finished successfully!"
echo "📦 Your APK is at:"
echo "   android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "💡 To install on device:"
echo "   adb install android/app/build/outputs/apk/debug/app-debug.apk"