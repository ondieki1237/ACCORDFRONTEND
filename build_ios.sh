bash
#!/bin/bash

# Set the platform to iOS
PLATFORM=iOS

# Set the iOS project directory
cd ios

# Build the iOS app using Capacitor
npx @capacitor/cli build ios

# Archive the iOS app (optional)
archiver -o AccordFrontend.ipa
