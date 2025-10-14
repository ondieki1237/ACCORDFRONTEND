/**
 * Offline Indicator Component
 * Shows offline status and pending sync information
 */

"use client"

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WifiOff, Wifi, Clock, Upload, AlertTriangle, RefreshCw } from 'lucide-react'
import { offlineStorage, type OfflineStatus } from '@/lib/offline-storage'
import { useToast } from '@/hooks/use-toast'

export function OfflineIndicator() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOffline: false,
    lastOnlineTime: Date.now(),
    pendingItems: 0
  })
  const [showDetails, setShowDetails] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Initialize offline storage
    offlineStorage.initialize()

    // Get initial status
    offlineStorage.getOfflineStatus().then(setStatus)

    // Subscribe to status updates
    const unsubscribe = offlineStorage.subscribeToStatus(setStatus)

    // Listen for custom online/offline events
    const handleOnline = () => {
      toast({
        title: "📶 Connection restored",
        description: "Syncing offline data...",
      })
    }

    const handleOffline = () => {
      toast({
        title: "📵 You are now offline",
        description: "Some features will be limited. Data will sync when back online.",
        variant: "destructive",
      })
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)
    }

    return () => {
      unsubscribe()
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }
  }, [toast])

  const formatLastOnlineTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const handleRetrySync = async () => {
    if (navigator.onLine) {
      // Trigger manual sync
      if (typeof window !== 'undefined') {
        const pending = await offlineStorage.getPendingSync()
        window.dispatchEvent(new CustomEvent('accord:manual-sync', {
          detail: pending
        }))
      }
      
      toast({
        title: "🔄 Syncing data...",
        description: "Attempting to sync offline data",
      })
    } else {
      toast({
        title: "❌ Still offline",
        description: "Please check your internet connection",
        variant: "destructive",
      })
    }
  }

  // Don't show if online and no pending items
  if (!status.isOffline && status.pendingItems === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      {/* Compact indicator */}
      <Card 
        className={`cursor-pointer transition-all duration-300 ${
          status.isOffline 
            ? 'bg-red-50 border-red-200 shadow-lg' 
            : 'bg-amber-50 border-amber-200 shadow-md'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            {status.isOffline ? (
              <WifiOff className="h-4 w-4 text-red-600" />
            ) : (
              <Upload className="h-4 w-4 text-amber-600 animate-pulse" />
            )}
            
            <div className="flex-1 text-sm">
              <div className={`font-medium ${
                status.isOffline ? 'text-red-800' : 'text-amber-800'
              }`}>
                {status.isOffline ? 'Offline Mode' : 'Sync Pending'}
              </div>
              
              {status.pendingItems > 0 && (
                <div className="text-xs text-muted-foreground">
                  {status.pendingItems} item{status.pendingItems > 1 ? 's' : ''} pending
                </div>
              )}
            </div>

            <Badge variant={status.isOffline ? "destructive" : "secondary"} className="text-xs">
              {status.isOffline ? 'OFFLINE' : 'PENDING'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Expanded details */}
      {showDetails && (
        <Card className="mt-2 bg-white border shadow-lg">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Connection Status</h3>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setShowDetails(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {status.isOffline ? (
                  <WifiOff className="h-4 w-4 text-red-500" />
                ) : (
                  <Wifi className="h-4 w-4 text-green-500" />
                )}
                <span className={status.isOffline ? 'text-red-700' : 'text-green-700'}>
                  {status.isOffline ? 'No internet connection' : 'Connected to internet'}
                </span>
              </div>

              {status.isOffline && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Last online: {formatLastOnlineTime(status.lastOnlineTime)}</span>
                </div>
              )}

              {status.pendingItems > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-amber-700">
                    {status.pendingItems} item{status.pendingItems > 1 ? 's' : ''} waiting to sync
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                {status.isOffline 
                  ? "You can still view cached data and create new entries. They'll sync when back online."
                  : "Your offline changes will sync automatically."
                }
              </p>
              
              {status.pendingItems > 0 && !status.isOffline && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetrySync}
                  className="w-full text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry Sync Now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}