/**
 * Aggressive Background Location Tracking
 * Tracks location continuously without user interaction
 * Sends location updates to backend every minute
 */

import { authService } from './auth'

interface LocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
  speed?: number | null
  heading?: number | null
  altitude?: number | null
}

class AggressiveLocationTracker {
  private watchId: number | null = null
  private isTracking: boolean = false
  private locationBuffer: LocationData[] = []
  private uploadInterval: NodeJS.Timeout | null = null
  private wakeLock: WakeLockSentinel | null = null
  private scheduleCheckInterval: NodeJS.Timeout | null = null
  private lastStoredLocation: { latitude: number; longitude: number } | null = null
  private readonly MIN_DISTANCE_METERS = 5 // Minimum 5 meters movement to store
  
  // Configuration - imported dynamically to avoid circular deps
  private API_BASE = "https://app.codewithseth.co.ke/api" // Will be updated in constructor
  private readonly UPLOAD_INTERVAL = 20000 // Upload every 20 seconds
  private readonly MAX_BUFFER_SIZE = 50 // Max locations to buffer before forced upload
  private readonly HIGH_ACCURACY_OPTIONS: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0 // Always get fresh location
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.restoreTrackingState()
      this.setupVisibilityHandlers()
      this.startAutomaticTracking()
      this.startScheduleChecker()
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in meters
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  /**
   * Check if location should be stored (moved more than MIN_DISTANCE_METERS)
   */
  private shouldStoreLocation(latitude: number, longitude: number): boolean {
    if (!this.lastStoredLocation) {
      return true // Always store first location
    }

    const distance = this.calculateDistance(
      this.lastStoredLocation.latitude,
      this.lastStoredLocation.longitude,
      latitude,
      longitude
    )

    return distance >= this.MIN_DISTANCE_METERS
  }

  /**
   * Check if current time is within working hours (8 AM - 5 PM EAT)
   */
  private isWithinWorkingHours(): boolean {
    // Track 24/7 for testing
    return true
    
    /* Original time-based logic (commented out for 24/7 tracking):
    const now = new Date()
    // Convert to EAT (UTC+3)
    const eatOffset = 3 * 60 // minutes
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
    const eatTime = new Date(utcTime + (eatOffset * 60000))
    
    const hours = eatTime.getHours()
    return hours >= 8 && hours < 17 // 8 AM to 5 PM
    */
  }

  /**
   * Start schedule checker that runs every minute
   */
  private startScheduleChecker() {
    // Check every minute if we should be tracking
    this.scheduleCheckInterval = setInterval(() => {
      this.checkAndUpdateTracking()
    }, 60000) // 60 seconds

    // Initial check
    this.checkAndUpdateTracking()
  }

  /**
   * Check time and start/stop tracking accordingly
   */
  private checkAndUpdateTracking() {
    if (!authService.isAuthenticated()) {
      return
    }

    const shouldTrack = this.isWithinWorkingHours()

    if (shouldTrack && !this.isTracking) {
      this.startTracking().catch(() => {})
    } else if (!shouldTrack && this.isTracking) {
      this.stopTracking()
    }
  }

  /**
   * Start automatic location tracking
   * This runs immediately when the app loads
   */
  private async startAutomaticTracking() {
    // Check if user is authenticated
    if (!authService.isAuthenticated()) {
      return
    }

    // Check if within working hours
    if (!this.isWithinWorkingHours()) {
      return
    }

    // Auto-start tracking after short delay
    setTimeout(() => {
      this.startTracking().catch(() => {
        // Silent failure
      })
    }, 2000)
  }

  /**
   * Start aggressive location tracking
   */
  async startTracking(): Promise<void> {
    console.log('[AggressiveTracker] startTracking called')
    
    if (this.isTracking) {
      console.log('[AggressiveTracker] Already tracking, skipping')
      return
    }

    // Check if within working hours
    if (!this.isWithinWorkingHours()) {
      console.log('[AggressiveTracker] Outside working hours (24/7 tracking disabled)')
      return // Silent - outside working hours
    }

    if (!navigator.geolocation) {
      console.error('[AggressiveTracker] Geolocation not supported')
      return
    }

    try {
      console.log('[AggressiveTracker] Requesting location permission...')
      // Ensure we have location permission first
      await this.requestLocationPermission()

      console.log('[AggressiveTracker] Permission granted, starting GPS watch...')
      // Request wake lock to prevent device from sleeping
      await this.acquireWakeLock()

      // Start watching position with high accuracy
      this.watchId = navigator.geolocation.watchPosition(
        this.handleLocationUpdate.bind(this),
        this.handleLocationError.bind(this),
        this.HIGH_ACCURACY_OPTIONS
      )

      this.isTracking = true
      this.saveTrackingState()

      console.log('[AggressiveTracker] Tracking started successfully, watchId:', this.watchId)

      // Start periodic upload
      this.startUploadInterval()
    } catch (error) {
      // Surface errors to console for easier debugging
      console.error('[AggressiveTracker] Failed to start:', error)
    }
  }

  /**
   * Stop location tracking
   */
  stopTracking(): void {
    if (!this.isTracking) return

    // Stop GPS watching
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }

    // Stop upload interval
    if (this.uploadInterval) {
      clearInterval(this.uploadInterval)
      this.uploadInterval = null
    }

    // Release wake lock
    this.releaseWakeLock()

    // Upload any remaining buffered locations
    if (this.locationBuffer.length > 0) {
      this.uploadLocations()
    }

    this.isTracking = false
    this.clearTrackingState()
  }

  /**
   * Get immediate current location
   */
  private getCurrentLocation(): void {
    navigator.geolocation.getCurrentPosition(
      (position) => this.handleLocationUpdate(position),
      () => {}, // Silent error
      this.HIGH_ACCURACY_OPTIONS
    )
  }

  /**
   * Handle location update from GPS
   */
  private handleLocationUpdate(position: GeolocationPosition): void {
    console.log('[AggressiveTracker] Location received:', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: Date.now()
    })

    // Filter redundant locations - only store if user moved significantly
    if (!this.shouldStoreLocation(position.coords.latitude, position.coords.longitude)) {
      console.log('[AggressiveTracker] Location skipped (less than 5m movement)')
      return
    }

    // Update last stored location
    this.lastStoredLocation = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    }

    console.log('[AggressiveTracker] Location accepted, adding to buffer')

    const locationData: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: Date.now(),
      speed: position.coords.speed,
      heading: position.coords.heading,
      altitude: position.coords.altitude
    }

    this.locationBuffer.push(locationData)

    // Force upload if buffer is full
    if (this.locationBuffer.length >= this.MAX_BUFFER_SIZE) {
      this.uploadLocations()
    }

    // Save to localStorage as backup
    this.saveLocationBuffer()
  }

  /**
   * Handle location error
   */
  private handleLocationError(error: GeolocationPositionError): void {
    // Silent - just continue tracking
  }

  /**
   * Upload buffered locations to backend
   * Supports both authenticated (JWT) and unauthenticated (userId in body) modes
   */
  private async uploadLocations(): Promise<void> {
    if (this.locationBuffer.length === 0) {
      return
    }

    const locationsToUpload = [...this.locationBuffer]
    this.locationBuffer = [] // Clear buffer immediately

    try {
      const token = authService.getAccessToken()
      const user = authService.getCurrentUserSync()
      
      // Build headers - add Authorization if token exists
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      // Build payload with proper structure
      const payload: any = {
        locations: locationsToUpload.map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
          timestamp: loc.timestamp, // Original capture timestamp preserved
          speed: loc.speed !== undefined ? loc.speed : null,
          heading: loc.heading !== undefined ? loc.heading : null,
          altitude: loc.altitude !== undefined ? loc.altitude : null
        })),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: Date.now() // Sync timestamp - when data is being sent
        }
      }

      // If no token but we have user ID, include it in body for unauthenticated mode
      if (!token && (user as any)?._id) {
        payload.userId = (user as any)._id
      }

      const response = await fetch(`${this.API_BASE}/location/track`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`)
      }

      // Clear backup after successful upload
      this.clearLocationBuffer()

    } catch (error) {
      // Re-add failed locations to buffer (keep trying)
      this.locationBuffer.unshift(...locationsToUpload)
      
      // Prevent buffer from growing too large
      if (this.locationBuffer.length > this.MAX_BUFFER_SIZE * 2) {
        this.locationBuffer = this.locationBuffer.slice(0, this.MAX_BUFFER_SIZE)
      }
    }
  }

  /**
   * Request location permission
   */
  private async requestLocationPermission(): Promise<void> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported')
    }

    // Test location access
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(),
        (error) => reject(new Error(`Permission denied: ${error.message}`)),
        { timeout: 10000 }
      )
    })
  }

  /**
   * Acquire wake lock to prevent device sleep
   */
  private async acquireWakeLock(): Promise<void> {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
      return
    }

    try {
      this.wakeLock = await (navigator.wakeLock as any).request('screen')

      // Re-acquire wake lock if it's released
      if (this.wakeLock) {
        this.wakeLock.addEventListener('release', () => {
          if (this.isTracking) {
            setTimeout(() => this.acquireWakeLock(), 1000)
          }
        })
      }
    } catch (error) {
      // Silent failure
    }
  }

  /**
   * Start the periodic upload interval for buffered locations
   */
  private startUploadInterval(): void {
    // Clear existing interval if present
    if (this.uploadInterval) {
      clearInterval(this.uploadInterval)
      this.uploadInterval = null
    }

    // Immediate upload schedule
    this.uploadInterval = setInterval(() => {
      try {
        this.uploadLocations()
      } catch (err) {
        console.warn('Failed to upload locations in interval:', err)
      }
    }, this.UPLOAD_INTERVAL)
  }

  /**
   * Release wake lock
   */
  private async releaseWakeLock(): Promise<void> {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release()
        this.wakeLock = null
      } catch (error) {
        // Silent failure
      }
    }
  }

  /**
   * Setup visibility handlers to keep tracking in background
   */
  private setupVisibilityHandlers(): void {
    if (typeof document === 'undefined') return

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isTracking) {
        // Force location update when returning to foreground
        this.getCurrentLocation()
      }
    })

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      // Upload remaining locations before page closes
      if (this.locationBuffer.length > 0) {
        // Use synchronous XMLHttpRequest for guaranteed delivery
        this.uploadLocationsSync()
      }
    })
  }

  /**
   * Synchronous upload for page unload (guaranteed delivery)
   * Supports both authenticated and unauthenticated modes
   */
  private uploadLocationsSync(): void {
    if (this.locationBuffer.length === 0) return

    try {
      const token = authService.getAccessToken()
      const user = authService.getCurrentUserSync()

      // Build payload with proper structure
      const payload: any = {
        locations: this.locationBuffer.map(loc => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
          timestamp: loc.timestamp, // Original capture timestamp preserved
          speed: loc.speed !== undefined ? loc.speed : null,
          heading: loc.heading !== undefined ? loc.heading : null,
          altitude: loc.altitude !== undefined ? loc.altitude : null
        })),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp: Date.now() // Sync timestamp
        }
      }

      // Include userId if no token but have user ID
      if (!token && (user as any)?._id) {
        payload.userId = (user as any)._id
      }

  // Skip if no authentication method available
  if (!token && !(user as any)?._id) return

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${this.API_BASE}/location/track`, false) // false = synchronous
      xhr.setRequestHeader('Content-Type', 'application/json')
      
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }
      
      xhr.send(JSON.stringify(payload))
    } catch (error) {
      // Silent failure
    }
  }

  /**
   * Save tracking state to localStorage
   */
  private saveTrackingState(): void {
    try {
      localStorage.setItem('aggressiveTracking', JSON.stringify({
        isTracking: this.isTracking,
        startTime: Date.now()
      }))
    } catch (error) {
      // Silent failure
    }
  }

  /**
   * Save location buffer to localStorage
   */
  private saveLocationBuffer(): void {
    try {
      localStorage.setItem('locationBuffer', JSON.stringify(this.locationBuffer))
    } catch (error) {
      // Silent failure
    }
  }

  /**
   * Restore tracking state from localStorage
   */
  private restoreTrackingState(): void {
    try {
      // Restore location buffer
      const buffer = localStorage.getItem('locationBuffer')
      if (buffer) {
        this.locationBuffer = JSON.parse(buffer)
      }
    } catch (error) {
      // Silent failure
    }
  }

  /**
   * Clear tracking state from localStorage
   */
  private clearTrackingState(): void {
    try {
      localStorage.removeItem('aggressiveTracking')
    } catch (error) {
      // Silent failure
    }
  }

  /**
   * Clear location buffer from localStorage
   */
  private clearLocationBuffer(): void {
    try {
      localStorage.removeItem('locationBuffer')
    } catch (error) {
      // Silent failure
    }
  }

  /**
   * Get current tracking status
   */
  isCurrentlyTracking(): boolean {
    return this.isTracking
  }

  /**
   * Get buffered location count
   */
  getBufferSize(): number {
    return this.locationBuffer.length
  }

  /**
   * Manual force upload
   */
  forceUpload(): void {
    this.uploadLocations()
  }
}

// Export singleton instance
export const aggressiveTracker = new AggressiveLocationTracker()
