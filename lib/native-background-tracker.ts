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
  private API_BASE = "https://app.codewithseth.co.ke/api"; // Will be updated from config
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
      debug: true, // Enable debug mode
      logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
      stopOnTerminate: false, // Continue tracking when app is terminated
      startOnBoot: true, // Start automatically on device boot
      enableHeadless: true, // Enable headless mode (tracking without UI)
      
      // HTTP / SQLite config
      url: `${this.API_BASE}/location/track`,
      batchSync: true, // Batch multiple locations
      autoSync: true, // Automatically sync to server when online
      autoSyncThreshold: 0, // Sync immediately (don't wait to accumulate)
      maxBatchSize: 50, // Max locations per batch
      maxDaysToPersist: 14, // Keep offline data for 14 days
      maxRecordsToPersist: 50000, // Max records in local database (increased)
      persistMode: BackgroundGeolocation.PERSIST_MODE_LOCATION, // Store all locations
      
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
      
      // Android-specific - Persistent notification (required for background tracking)
      notification: {
        title: "Location Tracking Active",
        text: "Recording your field visits",
        color: "#00aeef",
        smallIcon: "mipmap/ic_launcher",
        largeIcon: "mipmap/ic_launcher",
        priority: BackgroundGeolocation.NOTIFICATION_PRIORITY_DEFAULT,
        channelName: "Location Tracking",
        sticky: true, // Make notification persistent
        actions: [] // No actions needed
      },
      foregroundService: true, // Required for Android 8+
      notificationPriority: BackgroundGeolocation.NOTIFICATION_PRIORITY_DEFAULT,
      
      // Battery optimization
      locationUpdateInterval: 5000, // 5 seconds (very frequent updates)
      fastestLocationUpdateInterval: 5000, // 5 seconds minimum
      deferTime: 0, // Don't defer location updates
      
      // Prevent battery optimization from killing the service
      preventSuspend: true,
      heartbeatInterval: 60, // Check every 60 seconds even when stationary
      scheduleSync: false, // Don't use schedule-based sync (use real-time)
      
      // Network - Enhanced for offline support
      maxRetries: 5, // Retry failed uploads 5 times
      retryDelay: 30000, // Wait 30 seconds between retries
      timeout: 60, // HTTP timeout in seconds
      
      // Location authorization
      locationAuthorizationRequest: 'Always', // Request "Always" permission
      backgroundPermissionRationale: {
        title: "Allow location access all the time",
        message: "This app needs to track your location even when closed to record field visits.",
        positiveAction: "Change to 'Allow all the time'",
        instructionMessage: "Tap 'Settings' > 'Permissions' > 'Location' > 'Allow all the time'"
      }
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
        console.log('[BackgroundGeolocation] Plugin not available');
        return; // Plugin not available
      }

      // Only start if within working hours
      if (!this.isWithinWorkingHours()) {
        console.log('[BackgroundGeolocation] Outside working hours');
        return; // Silent - outside working hours
      }

      const state = await BackgroundGeolocation.start();
      console.log('[BackgroundGeolocation] Tracking started successfully', state);
    } catch (error) {
      console.error('[BackgroundGeolocation] Failed to start tracking:', error);
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
  private async onLocation(location: any) {
    console.log('[BackgroundGeolocation] Location received:', {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      timestamp: location.timestamp,
      uuid: location.uuid
    });

    // Filter redundant locations - only process if user moved significantly
    if (!this.shouldStoreLocation(location.coords.latitude, location.coords.longitude)) {
      console.log('[BackgroundGeolocation] Location skipped (less than 5m movement)');
      return;
    }

    // Update last stored location
    this.lastStoredLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    console.log('[BackgroundGeolocation] Location accepted and will be sent to server');
    
    // Try manual POST if plugin HTTP fails
    try {
      const token = authService.getAccessToken();
      const user = authService.getCurrentUserSync();
      
      const payload = {
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          speed: location.coords.speed,
          heading: location.coords.heading,
          timestamp: new Date(location.timestamp).toISOString()
        },
        userId: user?.id,
        activity: location.activity?.type || 'unknown',
        battery: location.battery?.level || null
      };
      
      console.log('[BackgroundGeolocation] Sending manual POST:', payload);
      
      const response = await fetch(`${this.API_BASE}/location/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        console.log('[BackgroundGeolocation] Manual POST successful');
      } else {
        const errorText = await response.text();
        console.error('[BackgroundGeolocation] Manual POST failed:', response.status, errorText);
      }
    } catch (error) {
      console.error('[BackgroundGeolocation] Manual POST error:', error);
    }
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
    console.log('[BackgroundGeolocation] HTTP Response:', {
      success: event.success,
      status: event.status,
      responseText: event.responseText
    });

    if (event.success) {
      console.log('[BackgroundGeolocation] Successfully synced to server');
    } else {
      console.error('[BackgroundGeolocation] Failed to sync:', event.status, event.responseText);
    }
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
   * Get current tracking state with detailed info for debugging
   */
  async getTrackingInfo() {
    if (!BackgroundGeolocation) {
      return { available: false, error: 'Plugin not available' };
    }

    try {
      const state = await BackgroundGeolocation.getState();
      const count = await BackgroundGeolocation.getCount();
      
      console.log('[BackgroundGeolocation] Current state:', {
        enabled: state.enabled,
        isMoving: state.isMoving,
        trackingMode: state.trackingMode,
        desiredAccuracy: state.desiredAccuracy,
        odometer: state.odometer,
        locationsInQueue: count,
        url: state.url
      });
      
      return {
        available: true,
        enabled: state.enabled,
        isMoving: state.isMoving,
        trackingMode: state.trackingMode,
        locationsInQueue: count,
        odometer: state.odometer,
        url: state.url
      };
    } catch (error) {
      console.error('[BackgroundGeolocation] Failed to get state:', error);
      return { available: false, error: String(error) };
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
