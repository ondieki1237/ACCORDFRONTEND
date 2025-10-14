"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Upload, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { offlineStorage } from "@/lib/offline-storage"

export function SyncButton() {
  const [isOnline, setIsOnline] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const { toast } = useToast()

  // Update online status and pending count
  const updateStatus = async () => {
    if (typeof window === 'undefined') return
    
    const online = navigator.onLine
    setIsOnline(online)
    
    if (online) {
      const status = await offlineStorage.getOfflineStatus()
      setPendingCount(status.pendingItems || 0)
    }
  }

  // Initialize and listen for changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Set initial online status
    setIsOnline(navigator.onLine)
    updateStatus()
    
    const handleOnline = () => {
      setIsOnline(true)
      updateStatus()
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setPendingCount(0)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleSync = async () => {
    if (typeof window === 'undefined' || !isOnline) {
      toast({
        title: "No Internet Connection",
        description: "Please connect to the internet to sync your data.",
        variant: "destructive",
      })
      return
    }

    setIsSyncing(true)
    try {
      await offlineStorage.syncPendingData()
      await updateStatus()
      
      toast({
        title: "Sync Complete",
        description: "All offline data has been synchronized.",
      })
    } catch (error) {
      console.error('Sync failed:', error)
      toast({
        title: "Sync Failed",
        description: "Some data could not be synchronized. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  // Don't show if offline or no pending data
  if (!isOnline || pendingCount === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={handleSync}
        disabled={isSyncing}
        className="rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
      >
        {isSyncing ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        Sync {pendingCount > 0 && (
          <Badge variant="secondary" className="ml-1 bg-white text-blue-600">
            {pendingCount}
          </Badge>
        )}
      </Button>
    </div>
  )
}