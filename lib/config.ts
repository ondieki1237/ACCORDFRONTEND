/**
 * Centralized configuration for API endpoints
 * 
 * Development: Uses localhost (npm run dev)
 * Production: Uses deployed API (npm run build)
 */

const isDevelopment = process.env.NODE_ENV === 'development'

// API Base URLs
const DEV_API_URL = 'http://localhost:4500/api'
const PROD_API_URL = 'https://app.codewithseth.co.ke/api'

// Export the appropriate URL based on environment
export const API_BASE_URL = isDevelopment 
  ? (process.env.NEXT_PUBLIC_API_BASE_URL || DEV_API_URL)
  : PROD_API_URL

// Update check endpoint
export const UPDATE_CHECK_URL = isDevelopment
  ? `${DEV_API_URL}/app-updates/check`
  : 'https://app.codewithseth.co.ke/api/app-updates/check'

// Current app version (single source of truth)
export const APP_VERSION = '1.2.6'

// APK download URL (always production - no local APK)
export const APK_DOWNLOAD_URL = 'https://app.codewithseth.co.ke/downloads/app-debug.apk'

// Admin panel URL
export const ADMIN_PANEL_URL = 'https://app.codewithseth.co.ke/admin'

// Helper to get full API URL
export function getApiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

// Log current environment on load (dev only)
if (isDevelopment && typeof window !== 'undefined') {
  console.log('🔧 Development mode - API:', API_BASE_URL)
}
