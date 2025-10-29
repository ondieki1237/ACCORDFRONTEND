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
  
  // Configuration
  private readonly API_BASE = "https://app.codewithseth.co.ke/api"
  private readonly UPLOAD_INTERVAL = 60000 // Upload every 60 seconds
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
   * Check if current time is within working hours (8 AM - 5 PM EAT)
   */
  private isWithinWorkingHours(): boolean {
    const now = new Date()
    // Convert to EAT (UTC+3)
    const eatOffset = 3 * 60 // minutes
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
    const eatTime = new Date(utcTime + (eatOffset * 60000))
    
    const hours = eatTime.getHours()
    return hours >= 8 && hours < 17 // 8 AM to 5 PM
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
    if (this.isTracking) {
      return
    }

    // Check if within working hours
    if (!this.isWithinWorkingHours()) {
      return // Silent - outside working hours
    }

    if (!navigator.geolocation) {
      return
    }

    try {
      // Request wake lock to prevent device from sleeping
      await this.requestWakeLock()

      // Start watching position with high accuracy
      this.watchId = navigator.geolocation.watchPosition(
        this.handleLocationUpdate.bind(this),
        this.handleLocationError.bind(this),
        this.HIGH_ACCURACY_OPTIONS
      )

      this.isTracking = true
      this.saveTrackingState()

      // Start periodic upload
      this.startUploadInterval()
    } catch (error) {
      // Silent
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
      if (!token && user?._id) {
        payload.userId = user._id
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
      this.wakeLock.addEventListener('release', () => {
        if (this.isTracking) {
          setTimeout(() => this.acquireWakeLock(), 1000)
        }
      })
    } catch (error) {
      // Silent failure
    }
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
      if (!token && user?._id) {
        payload.userId = user._id
      }

      // Skip if no authentication method available
      if (!token && !user?._id) return

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
