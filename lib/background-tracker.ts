/**
 * Background Location Tracking Service
 * Provides continuous GPS tracking similar to Google Maps
 */

import { apiService } from './api'
import { authService } from './auth'

export interface TrackingSession {
  id: string
  startTime: number
  coordinates: number[][]
  isActive: boolean
  stops: { name: string; coordinates: number[]; timestamp: number }[]
}

export interface LocationPoint {
  latitude: number
  longitude: number
  timestamp: number
  accuracy?: number
  altitude?: number
  speed?: number
  heading?: number
}

class BackgroundTrackingService {
  private watchId: number | null = null
  private currentSession: TrackingSession | null = null
  private wakeLock: WakeLockSentinel | null = null
  private isTracking = false
  private listeners: Set<(session: TrackingSession) => void> = new Set()
  private saveListeners: Set<(success: boolean, error?: string) => void> = new Set()
  private autoSaveEnabled = true
  private trackingOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000 // Allow 30 second old positions to save battery
  }

  // Tracking intervals (in milliseconds)
  private static readonly TRACKING_INTERVALS = {
    HIGH_ACCURACY: 5000,    // 5 seconds for active tracking
    BATTERY_SAVE: 15000,    // 15 seconds for background
    STATIONARY: 30000       // 30 seconds when not moving
  }

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      this.restoreSession()
      this.setupVisibilityHandlers()
      this.setupBeforeUnloadHandler()
    }
  }

  /**
   * Start background location tracking
   */
  async startTracking(): Promise<TrackingSession> {
    if (this.isTracking) {
      throw new Error('Tracking is already active')
    }

    // Request permissions
    await this.requestPermissions()

    // Acquire wake lock to prevent device sleep
    await this.acquireWakeLock()

    // Create new tracking session
    this.currentSession = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      coordinates: [],
      isActive: true,
      stops: []
    }

    // Start GPS tracking
    this.startGPSTracking()
    this.isTracking = true

    // Save to localStorage for persistence
    this.saveSession()

    // Register service worker for background processing
    await this.registerServiceWorker()

    console.log('🚀 Background tracking started:', this.currentSession.id)
    this.notifyListeners()

    return this.currentSession
  }

  /**
   * Stop tracking and save trail
   */
  async stopTracking(skipAutoSave = false): Promise<TrackingSession | null> {
    if (!this.isTracking || !this.currentSession) {
      return null
    }

    // Stop GPS tracking
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }

    // Release wake lock
    await this.releaseWakeLock()

    // Mark session as complete
    this.currentSession.isActive = false
    this.isTracking = false

    const completedSession = { ...this.currentSession }

    // Auto-save to database if enabled and sufficient data
    if (this.autoSaveEnabled && !skipAutoSave && completedSession.coordinates.length >= 2) {
      try {
        await this.saveTrailToDatabase(completedSession)
        console.log('✅ Trail automatically saved to database')
        this.notifySaveListeners(true)
      } catch (error) {
        console.error('❌ Failed to auto-save trail:', error)
        this.notifySaveListeners(false, error instanceof Error ? error.message : 'Unknown error')
        // Don't throw error, let user handle manually
      }
    }

    // Clear current session
    this.currentSession = null
    this.clearStoredSession()

    console.log('🛑 Background tracking stopped')
    this.notifyListeners()

    return completedSession
  }

  /**
   * Add a stop/waypoint to current trail
   */
  addStop(name: string, coordinates?: number[]): void {
    if (!this.currentSession || !this.isTracking) {
      throw new Error('No active tracking session')
    }

    const stopCoordinates = coordinates || this.getLastKnownLocation()
    if (!stopCoordinates) {
      throw new Error('Unable to determine current location for stop')
    }

    this.currentSession.stops.push({
      name,
      coordinates: stopCoordinates,
      timestamp: Date.now()
    })

    this.saveSession()
    this.notifyListeners()
  }

  /**
   * Get current tracking session
   */
  getCurrentSession(): TrackingSession | null {
    return this.currentSession
  }

  /**
   * Check if tracking is active
   */
  isActivelyTracking(): boolean {
    return this.isTracking && this.currentSession?.isActive === true
  }

  /**
   * Subscribe to tracking updates
   */
  subscribe(listener: (session: TrackingSession) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Get tracking statistics
   */
  getTrackingStats(): {
    duration: number
    distance: number
    pointsRecorded: number
    averageSpeed: number
  } | null {
    if (!this.currentSession) return null

    const duration = Date.now() - this.currentSession.startTime
    const distance = this.calculateTotalDistance(this.currentSession.coordinates)
    const pointsRecorded = this.currentSession.coordinates.length
    const averageSpeed = distance > 0 ? distance / (duration / 1000 / 3600) : 0 // km/h

    return {
      duration,
      distance,
      pointsRecorded,
      averageSpeed
    }
  }

  // Private Methods

  private async requestPermissions(): Promise<void> {
    // Only run in browser environment
    if (typeof window === 'undefined' || !navigator.geolocation) {
      throw new Error('Geolocation is not supported by this device')
    }

    // For web apps, we need to request permission
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      if (permission.state === 'denied') {
        throw new Error('Geolocation permission denied')
      }
    } catch (error) {
      console.warn('Could not check geolocation permission:', error)
    }

    // Test geolocation access
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(),
        (error) => reject(new Error(`Geolocation error: ${error.message}`)),
        this.trackingOptions
      )
    })
  }

  private async acquireWakeLock(): Promise<void> {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return

    try {
      this.wakeLock = await (navigator.wakeLock as any).request('screen')
      console.log('🔋 Wake lock acquired')
    } catch (error) {
      console.warn('Could not acquire wake lock:', error)
    }
  }

  private async releaseWakeLock(): Promise<void> {
    if (this.wakeLock) {
      await this.wakeLock.release()
      this.wakeLock = null
      console.log('🔋 Wake lock released')
    }
  }

  private startGPSTracking(): void {
    const options = { ...this.trackingOptions }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handleLocationUpdate(position),
      (error) => this.handleLocationError(error),
      options
    )
  }

  private handleLocationUpdate(position: GeolocationPosition): void {
    if (!this.currentSession || !this.isTracking) return

    const { latitude, longitude } = position.coords
    const newPoint: number[] = [latitude, longitude]

    // Add timestamp and accuracy info
    const locationPoint: LocationPoint = {
      latitude,
      longitude,
      timestamp: Date.now(),
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined
    }

    // Filter out low accuracy readings
    if (position.coords.accuracy > 100) {
      console.warn('Low accuracy GPS reading, skipping:', position.coords.accuracy)
      return
    }

    // Avoid duplicate points (less than 5 meters apart)
    const lastPoint = this.currentSession.coordinates[this.currentSession.coordinates.length - 1]
    if (lastPoint && this.calculateDistance(lastPoint, newPoint) < 0.005) { // ~5 meters
      return
    }

    this.currentSession.coordinates.push(newPoint)
    this.saveSession()
    this.notifyListeners()

    console.log(`📍 Location updated: ${latitude.toFixed(6)}, ${longitude.toFixed(6)} (${this.currentSession.coordinates.length} points)`)
  }

  private handleLocationError(error: GeolocationPositionError): void {
    console.error('Location tracking error:', error.message)
    
    // Continue tracking for temporary errors
    if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
      console.log('Temporary GPS error, continuing tracking...')
      return
    }

    // Stop tracking for permission denied
    if (error.code === error.PERMISSION_DENIED) {
      console.error('Location permission denied, stopping tracking')
      this.stopTracking()
    }
  }

  private setupVisibilityHandlers(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return

    // Handle app going to background/foreground
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.isTracking) {
        console.log('📱 App went to background, continuing tracking...')
        // Could adjust tracking frequency here
      } else if (!document.hidden && this.isTracking) {
        console.log('📱 App returned to foreground')
        this.restoreSession()
      }
    })

    // Handle page focus/blur
    window.addEventListener('blur', () => {
      if (this.isTracking) {
        console.log('🔄 Window blurred, background tracking active')
      }
    })

    window.addEventListener('focus', () => {
      if (this.isTracking) {
        console.log('🔄 Window focused, refreshing tracking state')
        this.restoreSession()
      }
    })
  }

  private setupBeforeUnloadHandler(): void {
    if (typeof window === 'undefined') return

    window.addEventListener('beforeunload', (event) => {
      if (this.isTracking) {
        // Save current state
        this.saveSession()
        
        // Warn user about closing during tracking
        event.preventDefault()
        event.returnValue = 'Trail recording is active. Are you sure you want to close?'
        return event.returnValue
      }
    })
  }

  private async registerServiceWorker(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    try {
      const registration = await navigator.serviceWorker.register('/trail-sw.js')
      console.log('🔧 Service worker registered:', registration)
    } catch (error) {
      console.warn('Service worker registration failed:', error)
    }
  }

  private saveSession(): void {
    if (typeof window !== 'undefined' && this.currentSession) {
      try {
        localStorage.setItem('accord_tracking_session', JSON.stringify(this.currentSession))
      } catch (error) {
        console.warn('Failed to save session to localStorage:', error)
      }
    }
  }

  private restoreSession(): void {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('accord_tracking_session')
      if (stored) {
        this.currentSession = JSON.parse(stored)
        if (this.currentSession?.isActive) {
          this.isTracking = true
          console.log('📂 Restored tracking session:', this.currentSession.id)
        }
      }
    } catch (error) {
      console.error('Failed to restore session:', error)
      this.clearStoredSession()
    }
  }

  private clearStoredSession(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('accord_tracking_session')
      } catch (error) {
        console.warn('Failed to clear stored session:', error)
      }
    }
  }

  private notifyListeners(): void {
    if (this.currentSession) {
      this.listeners.forEach(listener => listener(this.currentSession!))
    }
  }

  private generateSessionId(): string {
    return `trail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getLastKnownLocation(): number[] | null {
    if (this.currentSession && this.currentSession.coordinates.length > 0) {
      return this.currentSession.coordinates[this.currentSession.coordinates.length - 1]
    }
    return null
  }

  private calculateDistance(point1: number[], point2: number[]): number {
    const [lat1, lon1] = point1
    const [lat2, lon2] = point2
    
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  }

  private calculateTotalDistance(coordinates: number[][]): number {
    if (coordinates.length < 2) return 0
    
    let total = 0
    for (let i = 1; i < coordinates.length; i++) {
      total += this.calculateDistance(coordinates[i-1], coordinates[i])
    }
    return total
  }

  /**
   * Save trail to database
   */
  private async saveTrailToDatabase(session: TrackingSession): Promise<void> {
    if (session.coordinates.length < 2) {
      throw new Error('Insufficient GPS points for trail (minimum 2 required)')
    }

    // Check if user is authenticated
    const isAuthenticated = authService.isAuthenticated()
    if (!isAuthenticated) {
      throw new Error('User not authenticated - cannot save trail')
    }

    const trailData = {
      date: new Date(session.startTime).toISOString().split("T")[0],
      startTime: new Date(session.startTime).toISOString(),
      endTime: new Date().toISOString(),
      path: { coordinates: session.coordinates },
      stops: session.stops.map(stop => ({
        name: stop.name,
        coordinates: stop.coordinates
      })),
      deviceInfo: {
        deviceId: session.id,
        type: "Background-Tracker-Auto",
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        pointsRecorded: session.coordinates.length,
        backgroundTracking: true,
        autoSaved: true,
        trackingDuration: Date.now() - session.startTime,
        ...(this.getTrackingStats() && {
          totalDistance: this.calculateTotalDistance(session.coordinates),
          averageSpeed: this.getTrackingStats()?.averageSpeed || 0
        })
      },
    }

    console.log('💾 Saving trail to database...', {
      points: session.coordinates.length,
      stops: session.stops.length,
      duration: Date.now() - session.startTime
    })

    await apiService.createTrail(trailData)
  }

  /**
   * Subscribe to save events
   */
  subscribeSaveEvents(listener: (success: boolean, error?: string) => void): () => void {
    this.saveListeners.add(listener)
    return () => this.saveListeners.delete(listener)
  }

  /**
   * Enable or disable auto-save
   */
  setAutoSave(enabled: boolean): void {
    this.autoSaveEnabled = enabled
    console.log(`🔄 Auto-save ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Manually save current session
   */
  async saveCurrentTrail(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active tracking session to save')
    }

    if (this.currentSession.isActive) {
      throw new Error('Cannot save active trail - stop tracking first')
    }

    await this.saveTrailToDatabase(this.currentSession)
  }

  /**
   * Notify save event listeners
   */
  private notifySaveListeners(success: boolean, error?: string): void {
    this.saveListeners.forEach(listener => listener(success, error))
  }
}

// Singleton instance
export const backgroundTracker = new BackgroundTrackingService()