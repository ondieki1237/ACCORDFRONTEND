import type { User } from "./auth"
import { Capacitor } from '@capacitor/core'

export const hasAdminAccess = (user: User | null): boolean => {
  return user?.role === "admin"
}

export const hasManagerAccess = (user: User | null): boolean => {
  return user?.role === "admin" || user?.role === "manager"
}

export const canViewHeatmap = (user: User | null): boolean => {
  return hasAdminAccess(user)
}

export const canDeleteRecords = (user: User | null): boolean => {
  return hasAdminAccess(user)
}

export const canEditRecords = (user: User | null): boolean => {
  return hasAdminAccess(user)
}

export const canViewAllRecords = (user: User | null): boolean => {
  return hasAdminAccess(user)
}

export const canAccessSuperUserFeatures = (user: User | null): boolean => {
  return hasAdminAccess(user)
}

/**
 * Request background location permission for Android
 * This is critical for location tracking to work when app is closed
 * 
 * Note: The actual permission request is handled by the background-geolocation plugin
 * This function provides guidance to users
 */
export async function requestBackgroundLocationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.log('Not a native platform, skipping background permission')
    return true
  }

  try {
    console.log('📍 Background location tracking requires:')
    console.log('1. Location permission set to "Allow all the time"')
    console.log('2. Battery optimization disabled for this app')
    console.log('3. Autostart enabled (on some devices)')
    
    // The background-geolocation plugin will automatically request permissions
    // when it starts tracking. No manual request needed here.
    
    await requestIgnoreBatteryOptimizations()
    
    return true
  } catch (error) {
    console.error('❌ Failed to setup background location:', error)
    return false
  }
}

/**
 * Request to disable battery optimizations for the app
 * This prevents Android from killing the background tracking service
 */
async function requestIgnoreBatteryOptimizations(): Promise<void> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return
  }

  try {
    // Show user a message about battery optimization
    console.log('💡 For reliable background tracking:')
    console.log('📋 Go to Settings > Apps > ACCORD > Battery > Unrestricted')
    console.log('📋 Enable "Allow background activity"')
    console.log('📋 Disable "Battery optimization"')
  } catch (error) {
    console.error('Failed to show battery optimization guide:', error)
  }
}

/**
 * Check if background location permission is granted
 * Note: This is a simplified check - actual permission status comes from the plugin
 */
export async function hasBackgroundLocationPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return true
  }

  try {
    // The background-geolocation plugin handles permission checks internally
    // This is just a placeholder for future implementation
    return true
  } catch (error) {
    console.error('Failed to check background location permission:', error)
    return false
  }
}
