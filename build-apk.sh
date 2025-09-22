#!/bin/bash
set -e

echo "🗑 Removing existing Android folder..."
rm -rf android

echo "📦 Installing dependencies..."
npm install

echo "➕ Adding Android platform..."
npx cap add android

echo "🛠 Building web assets..."
npm run build

echo "🔄 Syncing with Capacitor..."
npx cap copy
npx cap sync android

echo "📱 Building APK..."
cd android
./gradlew assembleDebug
cd ..

echo "✅ Build finished! Find your APK at:"
echo "   android/app/build/outputs/apk/debug/app-debug.apk"
