"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { aggressiveTracker } from "@/lib/aggressive-tracker"
import { MapPin, Radio, Upload, X, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function TrackingControls() {
  const [isTracking, setIsTracking] = useState(false)
  const [bufferSize, setBufferSize] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTracking(aggressiveTracker.isCurrentlyTracking())
      setBufferSize(aggressiveTracker.getBufferSize())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleStartTracking = async () => {
    try {
      await aggressiveTracker.startTracking()
      toast({
        title: "✅ Tracking Started",
        description: "Location tracking is now active in the background",
      })
    } catch (error) {
      toast({
        title: "❌ Failed to start tracking",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  const handleStopTracking = () => {
    aggressiveTracker.stopTracking()
    toast({
      title: "🛑 Tracking Stopped",
      description: "Location tracking has been disabled",
    })
  }

  const handleForceUpload = () => {
    aggressiveTracker.forceUpload()
    toast({
      title: "📤 Uploading...",
      description: "Forcing upload of buffered locations",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5" />
          Aggressive Location Tracking
        </CardTitle>
        <CardDescription>
          Continuous background GPS tracking with automatic uploads every 60 seconds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
            <div>
              <p className="font-medium">Status</p>
              <p className="text-sm text-muted-foreground">
                {isTracking ? 'Actively Tracking' : 'Not Tracking'}
              </p>
            </div>
          </div>
          {isTracking ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <X className="h-5 w-5 text-gray-400" />
          )}
        </div>

        {isTracking && (
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Buffer</p>
                <p className="text-sm text-muted-foreground">
                  {bufferSize} location{bufferSize !== 1 ? 's' : ''} pending upload
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleForceUpload}
              disabled={bufferSize === 0}
            >
              Upload Now
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          {!isTracking ? (
            <Button onClick={handleStartTracking} className="flex-1">
              <MapPin className="h-4 w-4 mr-2" />
              Start Tracking
            </Button>
          ) : (
            <Button onClick={handleStopTracking} variant="destructive" className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Stop Tracking
            </Button>
          )}
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-sm">
          <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">⚠️ Note</p>
          <ul className="text-yellow-700 dark:text-yellow-300 space-y-1 text-xs">
            <li>• Tracking starts automatically on login</li>
            <li>• Location updates sent every 60 seconds</li>
            <li>• Uses high accuracy GPS (may drain battery)</li>
            <li>• Continues tracking even when app is in background</li>
            <li>• Requires location permission to be granted</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
