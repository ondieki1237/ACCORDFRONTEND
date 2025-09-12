"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Calendar, Plus, Edit, Trash2, Eye } from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"
import { canEditRecords, canDeleteRecords } from "@/lib/permissions"

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
  duration?: number
  distance?: number
}

interface TrailListProps {
  onCreateTrail: () => void
  onViewTrail: (trail: Trail) => void
}

export function TrailList({ onCreateTrail, onViewTrail }: TrailListProps) {
  const [trails, setTrails] = useState<Trail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUserSync())
  const { toast } = useToast()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await authService.getCurrentUser()
        setCurrentUser(user)
      } catch (error) {
        console.error("Failed to get current user:", error)
      }
    }

    if (!currentUser) {
      fetchUser()
    }

    const fetchTrails = async () => {
      try {
        setIsLoading(true)
        const response = await apiService.getTrails(1, 20)

        // Handle different response formats
        const trailsData = response.trails || response.data || response || []
        setTrails(Array.isArray(trailsData) ? trailsData : [])
      } catch (error) {
        console.error("Failed to fetch trails:", error)
        toast({
          title: "Error loading trails",
          description: "Could not load trail data. Please try again later.",
          variant: "destructive",
        })
        setTrails([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrails()
  }, [toast, currentUser])

  const handleDeleteTrail = async (trailId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!canDeleteRecords(currentUser)) {
      toast({
        title: "Access denied",
        description: "You don't have permission to delete trails.",
        variant: "destructive",
      })
      return
    }

    if (confirm("Are you sure you want to delete this trail?")) {
      try {
        await apiService.deleteTrail(trailId)
        setTrails(trails.filter((trail) => trail.id !== trailId))
        toast({
          title: "Trail deleted",
          description: "The trail has been successfully deleted.",
        })
      } catch (error) {
        toast({
          title: "Delete failed",
          description: "Could not delete the trail. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

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

    // Simple distance calculation (Haversine formula approximation)
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trail Management</h2>
          <p className="text-muted-foreground">Track and manage your field routes</p>
        </div>
        <Button onClick={onCreateTrail} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Trail
        </Button>
      </div>

      {trails.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No trails recorded</h3>
            <p className="text-muted-foreground text-center mb-4">Start tracking your field routes to see them here</p>
            <Button onClick={onCreateTrail}>Create Your First Trail</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trails.map((trail) => (
            <Card key={trail.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Trail {trail.id}</CardTitle>
                  <Badge variant="outline">
                    <MapPin className="h-3 w-3 mr-1" />
                    {trail.stops?.length || 0} stops
                  </Badge>
                </div>
                <CardDescription>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(trail.date).toLocaleDateString()}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {calculateDuration(trail.startTime, trail.endTime)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Distance:</span>
                    <span>{calculateDistance(trail.path?.coordinates || [])}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Start:</span>
                    <span>{new Date(trail.startTime).toLocaleTimeString()}</span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewTrail(trail)}
                      className="flex items-center gap-1 flex-1"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                    {canEditRecords(currentUser) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          // TODO: Implement edit functionality
                          toast({
                            title: "Edit feature",
                            description: "Edit functionality coming soon.",
                          })
                        }}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    )}
                    {canDeleteRecords(currentUser) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => handleDeleteTrail(trail.id, e)}
                        className="flex items-center gap-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
