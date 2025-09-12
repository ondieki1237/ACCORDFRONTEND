"use client"

import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Calendar, ArrowLeft, Navigation, Route } from "lucide-react"

interface Trail {
  id: string
  date: string
  startTime: string
  endTime: string
  path: {
    coordinates: number[][]
  }
  stops: any[]
  deviceInfo: any
}

interface TrailDetailProps {
  trail: Trail
  onBack: () => void
}

export function TrailDetail({ trail, onBack }: TrailDetailProps) {
  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffHours}h ${diffMinutes}m`
  }

  const calculateDistance = (coordinates: number[][]) => {
    if (!coordinates || coordinates.length < 2) return "0 km"

    let totalDistance = 0
    for (let i = 1; i < coordinates.length; i++) {
      const [lat1, lon1] = coordinates[i - 1]
      const [lat2, lon2] = coordinates[i]

      const R = 6371 // Earth's radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180
      const dLon = ((lon2 - lon1) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      totalDistance += R * c
    }

    return `${totalDistance.toFixed(1)} km`
  }

  const getStartLocation = () => {
    if (!trail.path?.coordinates || trail.path.coordinates.length === 0) return "Unknown"
    const [lat, lon] = trail.path.coordinates[0]
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  }

  const getEndLocation = () => {
    if (!trail.path?.coordinates || trail.path.coordinates.length === 0) return "Unknown"
    const [lat, lon] = trail.path.coordinates[trail.path.coordinates.length - 1]
    return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">Trail {trail.id}</h2>
          <p className="text-muted-foreground">Detailed trail information</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Trail Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{new Date(trail.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Start Time:</span>
              <span className="font-medium">{new Date(trail.startTime).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">End Time:</span>
              <span className="font-medium">{new Date(trail.endTime).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {calculateDuration(trail.startTime, trail.endTime)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Route Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Distance:</span>
              <span className="font-medium">{calculateDistance(trail.path?.coordinates || [])}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">GPS Points:</span>
              <span className="font-medium">{trail.path?.coordinates?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Stops:</span>
              <Badge variant="outline">
                <MapPin className="h-3 w-3 mr-1" />
                {trail.stops?.length || 0}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Location Details
          </CardTitle>
          <CardDescription>Start and end coordinates of your trail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Location</Label>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm font-mono">{getStartLocation()}</div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">End Location</Label>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-sm font-mono">{getEndLocation()}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {trail.path?.coordinates && trail.path.coordinates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Trail Map</CardTitle>
            <CardDescription>Visual representation of your route</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-8 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Interactive map visualization coming soon...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Trail contains {trail.path.coordinates.length} GPS coordinates
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
