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

echo "🛠 Building web assets..."
npm run build

echo "🔄 Syncing with Capacitor..."
npx cap copy android
npx cap sync android

echo "📱 Building APK..."
if [ -x "./android/gradlew" ]; then
  (cd android && ./gradlew assembleDebug)
elif [ -x "./android/gradlew.bat" ]; then
  (cd android && ./gradlew.bat assembleDebug)
else
  echo "⚠️  gradlew not found or not executable. Attempting to fix..."
  chmod +x ./android/gradlew 2>/dev/null || true
  (cd android && ./gradlew assembleDebug)
fi

echo ""
echo "✅ Build finished successfully!"
echo "📦 Your APK is at:"
echo "   android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "💡 To install on device:"
echo "   adb install android/app/build/outputs/apk/debug/app-debug.apk"