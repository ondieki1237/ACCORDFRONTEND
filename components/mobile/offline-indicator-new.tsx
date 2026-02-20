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

    // Listen for custom online/offline events (removed toast notifications)
    const handleOnline = () => {
      // Silently handle - indicator will update automatically
      console.log('📶 Connection restored')
    }

    const handleOffline = () => {
      // Silently handle - indicator will update automatically
      console.log('📵 Now offline')
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
      try {
        toast({
          title: "🔄 Syncing data...",
          description: "Attempting to sync offline data",
        })

        await offlineStorage.syncPendingData()

        toast({
          title: "✅ Sync Successful",
          description: "All pending data has been synchronized",
        })
      } catch (error) {
        console.error('Manual sync failed:', error)
        toast({
          title: "⚠️ Sync Incomplete",
          description: "Some items could not be synced. They will remain saved locally.",
          variant: "destructive",
        })
      }
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
        className={`cursor-pointer transition-all duration-300 rounded-2xl border-0 shadow-xl ${status.isOffline
            ? 'bg-gradient-to-r from-red-50 to-red-100'
            : 'bg-gradient-to-r from-amber-50 to-amber-100'
          }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${status.isOffline ? 'bg-red-500' : 'bg-amber-500'
              }`}>
              {status.isOffline ? (
                <WifiOff className="h-4 w-4 text-white" />
              ) : (
                <Upload className="h-4 w-4 text-white animate-pulse" />
              )}
            </div>

            <div className="flex-1">
              <div className={`font-semibold text-sm ${status.isOffline ? 'text-red-800' : 'text-amber-800'
                }`}>
                {status.isOffline ? 'You are offline' : 'Syncing data'}
              </div>

              {status.pendingItems > 0 && (
                <div className="text-xs text-gray-600">
                  {status.pendingItems} item{status.pendingItems > 1 ? 's' : ''} waiting to sync
                </div>
              )}
            </div>

            <Badge
              variant={status.isOffline ? "destructive" : "secondary"}
              className={`text-xs font-semibold ${status.isOffline
                  ? 'bg-red-600 text-white'
                  : 'bg-amber-600 text-white'
                }`}
            >
              {status.isOffline ? 'OFFLINE' : 'SYNCING'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Expanded details */}
      {showDetails && (
        <Card className="mt-2 bg-white border-0 shadow-2xl rounded-2xl overflow-hidden">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base text-gray-800">Connection Status</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDetails(false)}
                className="h-7 w-7 p-0 rounded-full hover:bg-gray-100"
              >
                ×
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <div className={`flex items-center gap-3 p-3 rounded-xl ${status.isOffline ? 'bg-red-50' : 'bg-green-50'
                }`}>
                {status.isOffline ? (
                  <WifiOff className="h-5 w-5 text-red-600" />
                ) : (
                  <Wifi className="h-5 w-5 text-green-600" />
                )}
                <span className={`font-medium ${status.isOffline ? 'text-red-700' : 'text-green-700'
                  }`}>
                  {status.isOffline ? 'No internet connection' : 'Connected to internet'}
                </span>
              </div>

              {status.isOffline && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-600">Last online: {formatLastOnlineTime(status.lastOnlineTime)}</span>
                </div>
              )}

              {status.pendingItems > 0 && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span className="font-medium text-amber-700">
                    {status.pendingItems} item{status.pendingItems > 1 ? 's' : ''} waiting to sync
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                {status.isOffline
                  ? "🔒 Your data is safe. You can continue working offline and everything will sync automatically when you're back online."
                  : "✅ Your offline changes are being synced automatically."
                }
              </p>

              {status.pendingItems > 0 && !status.isOffline && (
                <Button
                  size="sm"
                  onClick={handleRetrySync}
                  className="w-full text-sm bg-gradient-to-r from-[#00aeef] to-[#0096d6] hover:from-[#0096d6] hover:to-[#00aeef] text-white rounded-xl"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
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