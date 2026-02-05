"use client"

import { useEffect, useRef } from 'react'
import { Preferences } from '@capacitor/preferences'
import { useToast } from '@/hooks/use-toast'

const PENDING_VISITS_KEY = "pendingVisits"
const SYNC_INTERVAL = 30000 // 30 seconds
// ALWAYS use production API for syncing offline visits
const SYNC_API_URL = "https://app.codewithseth.co.ke/api"

/**
 * Global Offline Sync Component
 * Automatically syncs pending offline visits when connection is restored
 */
export function OfflineSyncManager() {
  const { toast } = useToast()
  const isSyncingRef = useRef(false)
  const lastSyncAttemptRef = useRef(0)

  useEffect(() => {
    async function getPendingVisits(): Promise<any[]> {
      try {
        const { value } = await Preferences.get({ key: PENDING_VISITS_KEY })
        return value ? JSON.parse(value) : []
      } catch (e) {
        console.error('Error reading pending visits:', e)
        return []
      }
    }

    async function setPendingVisits(visits: any[]) {
      await Preferences.set({ key: PENDING_VISITS_KEY, value: JSON.stringify(visits) })
    }

    async function syncVisit(visitData: any): Promise<boolean> {
      try {
        const token = localStorage.getItem('accessToken')
        
        if (!token) {
          console.warn('⚠️ No auth token for offline sync')
          return false
        }

        console.log('📤 Syncing offline visit to production:', visitData.client?.name || 'Unknown')

        const response = await fetch(`${SYNC_API_URL}/visits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(visitData),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          console.error('❌ Sync failed:', response.status, error)
          return false
        }

        console.log('✅ Visit synced:', visitData.client?.name)
        return true
      } catch (error) {
        console.error('❌ Sync error:', error)
        return false
      }
    }

    async function syncAllPending() {
      // Prevent concurrent syncs
      if (isSyncingRef.current) {
        console.log('⏳ Sync already in progress, skipping...')
        return
      }

      // Rate limit sync attempts (minimum 10 seconds between attempts)
      const now = Date.now()
      if (now - lastSyncAttemptRef.current < 10000) {
        return
      }
      lastSyncAttemptRef.current = now

      // Check if online
      if (!navigator.onLine) {
        return
      }

      const pendingVisits = await getPendingVisits()
      if (pendingVisits.length === 0) {
        return
      }

      isSyncingRef.current = true
      console.log(`🔄 Starting sync of ${pendingVisits.length} offline visit(s)...`)

      const failed: any[] = []
      const synced: any[] = []

      for (const visit of pendingVisits) {
        const success = await syncVisit(visit)
        if (success) {
          synced.push(visit)
        } else {
          failed.push(visit)
        }
        // Small delay between requests to avoid overwhelming the server
        await new Promise(r => setTimeout(r, 500))
      }

      // Update storage with only failed visits
      await setPendingVisits(failed)

      isSyncingRef.current = false

      // Show notification only if something was synced
      if (synced.length > 0) {
        toast({
          title: failed.length === 0 ? "✅ Offline Data Synced" : "⚠️ Partial Sync",
          description: failed.length === 0
            ? `${synced.length} visit(s) uploaded successfully.`
            : `${synced.length} synced, ${failed.length} failed. Will retry.`,
          variant: failed.length === 0 ? "default" : "destructive",
        })
      }

      console.log(`📊 Sync complete: ${synced.length} synced, ${failed.length} failed`)
    }

    // Initial sync on mount
    syncAllPending()

    // Sync when coming back online
    const handleOnline = () => {
      console.log('📶 Back online - triggering sync...')
      syncAllPending()
    }
    window.addEventListener('online', handleOnline)

    // Periodic sync check
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        syncAllPending()
      }
    }, SYNC_INTERVAL)

    // Also listen for page visibility changes (user returns to app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        console.log('👁️ App visible - checking for pending syncs...')
        syncAllPending()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearInterval(intervalId)
    }
  }, [toast])

  return null // This component doesn't render anything
}
