"use client"

import { useState, useEffect } from "react"
import { MapPin, Radio, Upload } from "lucide-react"
import { aggressiveTracker } from "@/lib/aggressive-tracker"

export function LocationTrackerStatus() {
  const [isTracking, setIsTracking] = useState(false)
  const [bufferSize, setBufferSize] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    // Update status every 2 seconds
    const interval = setInterval(() => {
      setIsTracking(aggressiveTracker.isCurrentlyTracking())
      setBufferSize(aggressiveTracker.getBufferSize())
      if (aggressiveTracker.isCurrentlyTracking()) {
        setLastUpdate(new Date())
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  if (!isTracking) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-green-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium animate-pulse">
      <Radio className="h-3 w-3" />
      <span>Tracking Active</span>
      {bufferSize > 0 && (
        <>
          <Upload className="h-3 w-3 ml-1" />
          <span>{bufferSize}</span>
        </>
      )}
    </div>
  )
}
