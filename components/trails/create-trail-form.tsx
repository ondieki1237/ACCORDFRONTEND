"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Square, Navigation } from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface CreateTrailFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface TrailData {
  date: string
  startTime: string
  endTime: string
  path: {
    coordinates: number[][]
  }
  stops: any[]
  deviceInfo: any
}

export function CreateTrailForm({ onSuccess, onCancel }: CreateTrailFormProps) {
  const [isTracking, setIsTracking] = useState(false)
  const [coordinates, setCoordinates] = useState<number[][]>([])
  const [startTime, setStartTime] = useState<string>("")
  const [watchId, setWatchId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your device doesn't support GPS tracking.",
        variant: "destructive",
      })
      return
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCoordinates((prev) => [...prev, [latitude, longitude]])
      },
      (error) => {
        console.error("Geolocation error:", error)
        toast({
          title: "GPS Error",
          description: "Could not get your location. Please check your GPS settings.",
          variant: "destructive",
        })
      },
      options,
    )

    setWatchId(id)
    setIsTracking(true)
    setStartTime(new Date().toISOString())

    toast({
      title: "Tracking started",
      description: "Your trail is being recorded.",
    })
  }

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setIsTracking(false)

    toast({
      title: "Tracking stopped",
      description: "Your trail has been recorded.",
    })
  }

  const handleSubmit = async () => {
    if (coordinates.length < 2) {
      toast({
        title: "Insufficient data",
        description: "Please record at least 2 GPS points for your trail.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const trailData: TrailData = {
        date: new Date().toISOString().split("T")[0],
        startTime,
        endTime: new Date().toISOString(),
        path: { coordinates },
        stops: [],
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          pointsRecorded: coordinates.length,
        },
      }

      await apiService.createTrail(trailData)

      toast({
        title: "Trail saved",
        description: "Your trail has been successfully recorded.",
      })

      onSuccess()
    } catch (error) {
      console.error("Failed to save trail:", error)
      toast({
        title: "Save failed",
        description: "Could not save your trail. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Create New Trail</h2>
          <p className="text-muted-foreground">Record your field route with GPS tracking</p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            GPS Tracking
          </CardTitle>
          <CardDescription>Use your device's GPS to automatically record your trail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center py-8">
            {!isTracking ? (
              <Button onClick={startTracking} size="lg" className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Start Tracking
              </Button>
            ) : (
              <Button onClick={stopTracking} variant="destructive" size="lg" className="flex items-center gap-2">
                <Square className="h-5 w-5" />
                Stop Tracking
              </Button>
            )}
          </div>

          {coordinates.length > 0 && (
            <div className="space-y-2">
              <Label>Trail Progress</Label>
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span>GPS Points Recorded:</span>
                  <span className="font-medium">{coordinates.length}</span>
                </div>
                {startTime && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span>Started:</span>
                    <span className="font-medium">{new Date(startTime).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {coordinates.length >= 2 && !isTracking && (
            <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving Trail..." : "Save Trail"}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Entry</CardTitle>
          <CardDescription>Alternatively, you can manually enter trail coordinates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">Manual coordinate entry coming soon...</div>
        </CardContent>
      </Card>
    </div>
  )
}
