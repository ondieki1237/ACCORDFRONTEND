#!/bin/bash

# iOS Build Script for ACCORD App
# NOTE: This must be run on macOS with Xcode installed

set -e  # Exit on error

echo "🍎 ACCORD iOS Build Script"
echo "=========================="
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: iOS builds can only be created on macOS"
    echo "   Please run this script on a Mac with Xcode installed"
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Error: Xcode is not installed"
    echo "   Please install Xcode from the App Store"
    exit 1
fi

# Check if Capacitor CLI is available
if ! command -v cap &> /dev/null; then
    echo "📦 Installing Capacitor CLI..."
    npm install -g @capacitor/cli
fi

# Check if ios folder exists
if [ ! -d "ios" ]; then
    echo "📱 iOS platform not found. Adding iOS platform..."
    npx cap add ios
else
    echo "📁 ios folder exists — preserving native changes"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build web assets
echo "🛠 Building web assets..."
npm run build

# Sync web assets to iOS
echo "📲 Syncing to iOS..."
npx cap sync ios

echo ""
echo "✅ Build preparation complete!"
echo ""
echo "Next steps:"
echo "1. Open the iOS project in Xcode:"
echo "   npx cap open ios"
echo ""
echo "2. In Xcode:"
echo "   - Select your development team in Signing & Capabilities"
echo "   - Choose a target device or simulator"
echo "   - Click the 'Play' button to build and run"
echo ""
echo "3. To create an archive for App Store:"
echo "   - Product > Archive"
echo "   - Follow the distribution workflow"
echo ""

