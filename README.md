# ACCORD Business Management App

A mobile-first business management application built with Next.js and designed for field sales teams. Features trail tracking, visit management, and comprehensive analytics.

## Features

- **Authentication System**: Secure login/registration with JWT tokens
- **Dashboard Overview**: Real-time analytics and performance metrics
- **Trail Management**: GPS-enabled route tracking and visualization
- **Visit Management**: Client visit scheduling and follow-up tracking
- **Mobile Optimization**: PWA capabilities, touch gestures, and offline support

## Mobile App Deployment

This app is optimized for mobile deployment using Capacitor CLI.

### Prerequisites

\`\`\`bash
npm install -g @capacitor/cli
\`\`\`

### Build and Deploy

1. **Build the Next.js app**:
\`\`\`bash
npm run build
\`\`\`

2. **Initialize Capacitor** (first time only):
\`\`\`bash
npx cap init
\`\`\`

3. **Add mobile platforms**:
\`\`\`bash
# For Android
npx cap add android

# For iOS
npx cap add ios
\`\`\`

4. **Sync web assets**:
\`\`\`bash
npx cap sync
\`\`\`

5. **Open in native IDE**:
\`\`\`bash
# For Android (Android Studio)
npx cap open android

# For iOS (Xcode)
npx cap open ios
\`\`\`

### PWA Installation

The app includes Progressive Web App (PWA) capabilities:
- Install prompt for supported browsers
- Offline functionality
- App-like experience on mobile devices
- Push notification support (when configured)

### Mobile Features

- **Touch Gestures**: Swipe navigation between pages
- **GPS Tracking**: Real-time location tracking for trails
- **Offline Support**: Basic functionality when disconnected
- **Safe Area Support**: Proper handling of device notches and home indicators
- **Optimized Touch Targets**: 44px minimum touch targets for accessibility

## API Integration

The app connects to the ACCORD backend API at `https://accordbackend.onrender.com/api` with endpoints for:
- Authentication (`/auth/*`)
- Dashboard data (`/dashboard/*`)
- Trail management (`/trails`)
- Visit management (`/visits`)

## Development

\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
\`\`\`

## Color Scheme

- Primary: #00aeef (ACCORD Blue)
- Secondary: Red accents for alerts and notifications
- Background: White with soft gray cards
- Text: Dark gray for optimal readability

## Browser Support

- Chrome/Edge 88+
- Safari 14+
- Firefox 85+
- Mobile browsers with PWA support
