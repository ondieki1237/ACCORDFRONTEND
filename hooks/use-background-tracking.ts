/**
 * React Hook for Background Trail Tracking
 * Provides easy integration with the background tracking service
 */

import { useState, useEffect, useCallback } from 'react'
import { backgroundTracker, type TrackingSession } from '@/lib/background-tracker'

export interface UseBackgroundTrackingReturn {
  isTracking: boolean
  currentSession: TrackingSession | null
  trackingStats: {
    duration: number
    distance: number
    pointsRecorded: number
    averageSpeed: number
  } | null
  startTracking: () => Promise<void>
  stopTracking: () => Promise<TrackingSession | null>
  addStop: (name: string) => Promise<void>
  error: string | null
  isLoading: boolean
}

export function useBackgroundTracking(): UseBackgroundTrackingReturn {
  const [isTracking, setIsTracking] = useState(false)
  const [currentSession, setCurrentSession] = useState<TrackingSession | null>(null)
  const [trackingStats, setTrackingStats] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize and check for existing session
  useEffect(() => {
    const existingSession = backgroundTracker.getCurrentSession()
    if (existingSession?.isActive) {
      setCurrentSession(existingSession)
      setIsTracking(true)
    }

    // Subscribe to tracking updates
    const unsubscribe = backgroundTracker.subscribe((session) => {
      setCurrentSession(session)
      setIsTracking(session.isActive)
    })

    return unsubscribe
  }, [])

  // Update stats periodically
  useEffect(() => {
    if (isTracking) {
      const updateStats = () => {
        const stats = backgroundTracker.getTrackingStats()
        setTrackingStats(stats)
      }

      updateStats()
      const interval = setInterval(updateStats, 2000)

      return () => clearInterval(interval)
    }
  }, [isTracking])

  const startTracking = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const session = await backgroundTracker.startTracking()
      setCurrentSession(session)
      setIsTracking(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start tracking'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const stopTracking = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const completedSession = await backgroundTracker.stopTracking()
      setCurrentSession(completedSession)
      setIsTracking(false)
      return completedSession
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop tracking'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addStop = useCallback(async (name: string) => {
    if (!currentSession || !isTracking) {
      throw new Error('No active tracking session')
    }

    try {
      backgroundTracker.addStop(name)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add stop'
      setError(errorMessage)
      throw err
    }
  }, [currentSession, isTracking])

  return {
    isTracking,
    currentSession,
    trackingStats,
    startTracking,
    stopTracking,
    addStop,
    error,
    isLoading
  }
}