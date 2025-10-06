"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Play, Square, Navigation, MapPin, Clock, Zap, BatteryLow, Smartphone, Save, AlertCircle } from "lucide-react"
import { apiService } from "@/lib/api"
import { backgroundTracker, type TrackingSession } from "@/lib/background-tracker"
import { useToast } from "@/hooks/use-toast"

interface CreateTrailFormProps {
  onSuccess: () => void
  onCancel: () => void
  trailId?: string // Optional trailId for editing
  initialData?: TrailData // Optional initial data for editing
}

interface TrailData {
  date: string
  startTime: string
  endTime: string
  path: {
    coordinates: number[][]
  }
  stops: { name: string; coordinates: number[] }[]
  deviceInfo: {
    deviceId: string
    type: string
    userAgent?: string
    platform?: string
    pointsRecorded?: number
    backgroundTracking?: boolean
    totalDistance?: number
    averageSpeed?: number
    trackingDuration?: number
    autoSaved?: boolean
    manualSave?: boolean
  }
}

export function CreateTrailForm({ onSuccess, onCancel, trailId, initialData }: CreateTrailFormProps) {
  const [currentSession, setCurrentSession] = useState<TrackingSession | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [coordinates, setCoordinates] = useState<number[][]>(initialData?.path.coordinates || [])
  const [startTime, setStartTime] = useState<string>(initialData?.startTime || "")
  const [stops, setStops] = useState<{ name: string; coordinates: number[] }[]>(initialData?.stops || [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [trackingStats, setTrackingStats] = useState<{
    duration: number
    distance: number
    pointsRecorded: number
    averageSpeed: number
  } | null>(null)
  const [newStopName, setNewStopName] = useState("")
  const [permissionStatus, setPermissionStatus] = useState<"unknown" | "granted" | "denied">("unknown")
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [saveError, setSaveError] = useState<string | null>(null)
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Check for existing tracking session on mount
  useEffect(() => {
    const existingSession = backgroundTracker.getCurrentSession()
    if (existingSession?.isActive) {
      setCurrentSession(existingSession)
      setIsTracking(true)
      setCoordinates(existingSession.coordinates)
      setStops(existingSession.stops)
      setStartTime(new Date(existingSession.startTime).toISOString())
      
      toast({
        title: "Resumed tracking",
        description: "Found an active tracking session",
      })
    }

    // Check geolocation permission
    checkPermissions()

    // Subscribe to tracking updates
    const unsubscribe = backgroundTracker.subscribe((session) => {
      setCurrentSession(session)
      setCoordinates(session.coordinates)
      setStops(session.stops)
    })

    // Subscribe to save events
    const unsubscribeSave = backgroundTracker.subscribeSaveEvents((success, error) => {
      if (success) {
        setSaveStatus("saved")
        setSaveError(null)
        toast({
          title: "✅ Trail saved automatically",
          description: "Your trail has been saved to the database",
        })
        // Auto-navigate back to list after successful save
        setTimeout(() => onSuccess(), 2000)
      } else {
        setSaveStatus("error")
        setSaveError(error || "Unknown error")
        toast({
          title: "❌ Auto-save failed",
          description: error || "Failed to save trail automatically. You can save manually.",
          variant: "destructive",
        })
      }
    })

    // Set auto-save preference
    backgroundTracker.setAutoSave(autoSaveEnabled)

    return () => {
      unsubscribe()
      unsubscribeSave()
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current)
      }
    }
  }, [])

  // Update stats periodically during tracking
  useEffect(() => {
    if (isTracking && currentSession) {
      const updateStats = () => {
        const stats = backgroundTracker.getTrackingStats()
        setTrackingStats(stats)
      }

      updateStats() // Initial update
      statsIntervalRef.current = setInterval(updateStats, 2000) // Update every 2 seconds

      return () => {
        if (statsIntervalRef.current) {
          clearInterval(statsIntervalRef.current)
        }
      }
    }
  }, [isTracking, currentSession])

  // Populate form with initial data when editing
  useEffect(() => {
    if (initialData) {
      setCoordinates(initialData.path.coordinates || [])
      setStartTime(initialData.startTime || "")
      setStops(initialData.stops || [])
    }
  }, [initialData])

  const checkPermissions = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      setPermissionStatus(permission.state as "granted" | "denied")
      
      permission.addEventListener('change', () => {
        setPermissionStatus(permission.state as "granted" | "denied")
      })
    } catch (error) {
      console.warn('Could not check geolocation permission:', error)
    }
  }

  const startTracking = async () => {
    try {
      setIsSubmitting(true)
      
      const session = await backgroundTracker.startTracking()
      setCurrentSession(session)
      setIsTracking(true)
      setStartTime(new Date(session.startTime).toISOString())

      toast({
        title: "🚀 Background tracking started",
        description: "Your trail is being recorded even when the app is minimized",
      })
    } catch (error) {
      console.error("Failed to start tracking:", error)
      toast({
        title: "Failed to start tracking",
        description: error instanceof Error ? error.message : "Please check your GPS settings and permissions",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const stopTracking = async () => {
    try {
      setSaveStatus("saving")
      const completedSession = await backgroundTracker.stopTracking()
      if (completedSession) {
        setCurrentSession(completedSession)
        setCoordinates(completedSession.coordinates)
        setStops(completedSession.stops)
      }
      setIsTracking(false)

      if (autoSaveEnabled) {
        toast({
          title: "🛑 Tracking stopped",
          description: "Your trail is being saved automatically...",
        })
      } else {
        setSaveStatus("idle")
        toast({
          title: "🛑 Tracking stopped",
          description: "Your trail has been recorded and is ready to save",
        })
      }
    } catch (error) {
      console.error("Failed to stop tracking:", error)
      setSaveStatus("error")
      setSaveError(error instanceof Error ? error.message : "Unknown error")
      toast({
        title: "Error stopping tracking",
        description: "There was an issue stopping the tracking",
        variant: "destructive",
      })
    }
  }

  const addStop = () => {
    if (!newStopName.trim()) {
      toast({
        title: "Stop name required",
        description: "Please enter a name for this stop",
        variant: "destructive",
      })
      return
    }

    try {
      backgroundTracker.addStop(newStopName.trim())
      setNewStopName("")
      
      toast({
        title: "📍 Stop added",
        description: `Added "${newStopName}" to your trail`,
      })
    } catch (error) {
      toast({
        title: "Failed to add stop",
        description: error instanceof Error ? error.message : "Could not add stop to trail",
        variant: "destructive",
      })
    }
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
    setSaveStatus("saving")

    try {
      // If we have a completed session, try to save it directly via the tracker first
      if (currentSession && !currentSession.isActive) {
        try {
          await backgroundTracker.saveCurrentTrail()
          setSaveStatus("saved")
          toast({
            title: "✅ Trail saved",
            description: "Your trail has been successfully saved.",
          })
          onSuccess()
          return
        } catch (error) {
          console.warn("Background tracker save failed, falling back to manual save:", error)
        }
      }

      // Fallback to manual API save
      const trailData: TrailData = {
        date: new Date().toISOString().split("T")[0],
        startTime,
        endTime: new Date().toISOString(),
        path: { coordinates },
        stops,
        deviceInfo: {
          deviceId: currentSession?.id || `Manual-${Date.now()}`,
          type: currentSession ? "Background-Tracker-Manual" : "Manual-Entry",
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          pointsRecorded: coordinates.length,
          backgroundTracking: Boolean(currentSession),
          autoSaved: false,
          manualSave: true,
          ...(trackingStats && {
            totalDistance: trackingStats.distance,
            averageSpeed: trackingStats.averageSpeed,
            trackingDuration: trackingStats.duration
          })
        },
      }

      if (trailId) {
        await apiService.updateTrail(trailId, trailData)
        toast({
          title: "✅ Trail updated",
          description: "Your trail has been successfully updated.",
        })
      } else {
        await apiService.createTrail(trailData)
        toast({
          title: "✅ Trail saved",
          description: "Your trail has been successfully recorded.",
        })
      }

      setSaveStatus("saved")
      onSuccess()
    } catch (error) {
      console.error("Failed to save/update trail:", error)
      setSaveStatus("error")
      setSaveError(error instanceof Error ? error.message : "Unknown error")
      toast({
        title: trailId ? "Update failed" : "Save failed",
        description: "Could not save your trail. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  const formatDistance = (kilometers: number): string => {
    if (kilometers < 1) {
      return `${Math.round(kilometers * 1000)}m`
    } else {
      return `${kilometers.toFixed(2)}km`
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{trailId ? "Edit Trail" : "Create New Trail"}</h2>
          <p className="text-muted-foreground">
            {trailId ? "Update your field route with GPS tracking" : "Record your field route with advanced background GPS tracking"}
          </p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {/* Permission Status */}
      {permissionStatus === "denied" && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <Navigation className="h-5 w-5" />
              <span className="font-medium">Location permission denied</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Please enable location permissions in your browser settings to use GPS tracking.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Background Tracking Card */}
      <Card className={isTracking ? "border-green-500 bg-green-50" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Advanced GPS Tracking
            {isTracking && <Badge variant="secondary" className="bg-green-100 text-green-800">Live</Badge>}
          </CardTitle>
          <CardDescription>
            Background tracking continues even when the app is minimized or closed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tracking Controls */}
          <div className="flex items-center justify-center py-4">
            {!isTracking ? (
              <Button 
                onClick={startTracking} 
                size="lg" 
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                disabled={isSubmitting || permissionStatus === "denied"}
              >
                <Play className="h-5 w-5" />
                {isSubmitting ? "Starting..." : "Start Background Tracking"}
              </Button>
            ) : (
              <Button 
                onClick={stopTracking} 
                variant="destructive" 
                size="lg" 
                className="flex items-center gap-2"
              >
                <Square className="h-5 w-5" />
                Stop Tracking
              </Button>
            )}
          </div>

          {/* Real-time Stats */}
          {isTracking && trackingStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Duration
                </div>
                <div className="text-lg font-bold">
                  {formatDuration(trackingStats.duration)}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Navigation className="h-4 w-4" />
                  Distance
                </div>
                <div className="text-lg font-bold">
                  {formatDistance(trackingStats.distance)}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Points
                </div>
                <div className="text-lg font-bold">
                  {trackingStats.pointsRecorded}
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  Avg Speed
                </div>
                <div className="text-lg font-bold">
                  {trackingStats.averageSpeed.toFixed(1)} km/h
                </div>
              </div>
            </div>
          )}

          {/* Basic Progress Display for non-tracking */}
          {coordinates.length > 0 && !isTracking && (
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
                {stops.length > 0 && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span>Stops Recorded:</span>
                    <span className="font-medium">{stops.length}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add Stops Section */}
          {isTracking && (
            <div className="space-y-3">
              <Label>Add Stop/Waypoint</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Stop name (e.g., 'Client Meeting', 'Lunch Break')"
                  value={newStopName}
                  onChange={(e) => setNewStopName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addStop()}
                />
                <Button onClick={addStop} variant="outline" disabled={!newStopName.trim()}>
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Stops List */}
          {stops.length > 0 && (
            <div className="space-y-2">
              <Label>Recorded Stops ({stops.length})</Label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {stops.map((stop, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="flex-1">{stop.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {stop.coordinates[0].toFixed(4)}, {stop.coordinates[1].toFixed(4)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Background Tracking Info */}
          {isTracking && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-800 text-sm">
                <Smartphone className="h-4 w-4" />
                <span className="font-medium">Background tracking is active</span>
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Your trail continues to be recorded even if you minimize the app or switch to other apps. 
                The tracking will continue until you return and stop it manually.
              </p>
            </div>
          )}

          {/* Auto-save Settings */}
          <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
            <Checkbox
              id="auto-save"
              checked={autoSaveEnabled}
              onCheckedChange={(checked) => {
                setAutoSaveEnabled(Boolean(checked))
                backgroundTracker.setAutoSave(Boolean(checked))
              }}
            />
            <Label htmlFor="auto-save" className="text-sm">
              Automatically save trail when tracking stops
            </Label>
          </div>

          {/* Save Status Display */}
          {saveStatus !== "idle" && (
            <div className={`p-3 rounded-lg border ${
              saveStatus === "saving" ? "bg-blue-50 border-blue-200" :
              saveStatus === "saved" ? "bg-green-50 border-green-200" :
              "bg-red-50 border-red-200"
            }`}>
              <div className={`flex items-center gap-2 text-sm ${
                saveStatus === "saving" ? "text-blue-800" :
                saveStatus === "saved" ? "text-green-800" :
                "text-red-800"
              }`}>
                {saveStatus === "saving" && <Clock className="h-4 w-4 animate-spin" />}
                {saveStatus === "saved" && <Save className="h-4 w-4" />}
                {saveStatus === "error" && <AlertCircle className="h-4 w-4" />}
                <span className="font-medium">
                  {saveStatus === "saving" && "Saving trail..."}
                  {saveStatus === "saved" && "Trail saved successfully!"}
                  {saveStatus === "error" && "Failed to save trail"}
                </span>
              </div>
              {saveStatus === "error" && saveError && (
                <p className="text-xs text-red-700 mt-1">{saveError}</p>
              )}
            </div>
          )}

          {/* Save Button */}
          {coordinates.length >= 2 && !isTracking && (
            <div className="space-y-2">
              {saveStatus === "error" && (
                <Button 
                  onClick={handleSubmit} 
                  className="w-full" 
                  disabled={isSubmitting}
                  variant="outline"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Retrying..." : "Retry Save"}
                </Button>
              )}
              {saveStatus !== "saved" && (
                <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting || saveStatus === "saving"}>
                  {isSubmitting ? (trailId ? "Updating Trail..." : "Saving Trail...") : (trailId ? "Update Trail" : "Save Trail Manually")}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Entry Card (simplified) */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Entry</CardTitle>
          <CardDescription>For trails recorded with external GPS devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Manual coordinate entry and GPX file import coming soon...
          </div>
        </CardContent>
      </Card>
    </div>
  )
}