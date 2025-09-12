"use client"

import { useState, useEffect } from "react"
import { WifiOff } from "lucide-react"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    setIsOnline(navigator.onLine)

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground p-2">
      <div className="container mx-auto flex items-center justify-center gap-2 text-sm">
        <WifiOff className="h-4 w-4" />
        <span>You're offline. Some features may be limited.</span>
      </div>
    </div>
  )
}
