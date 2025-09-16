"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Calendar, Plus, Edit, Trash2, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"
import { canEditRecords, canDeleteRecords } from "@/lib/permissions"

interface Trail {
  _id: string
  path: { coordinates: number[][] }
  totalDistance?: number
  totalDuration?: number
  createdAt: string
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

    const fetchMyTrails = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("accessToken")
        const response = await fetch("http://localhost:5000/api/dashboard/my-trails", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        })
        const data = await response.json()
        const trailsData = data?.data || []
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

    fetchMyTrails()
  }, [toast, currentUser])

  const calculateDistance = (distance?: number) => {
    if (!distance) return "0 km"
    return `${distance.toFixed(1)} km`
  }

  const calculateDuration = (duration?: number) => {
    if (!duration) return "0m"
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    return `${hours}h ${minutes}m`
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
          <h2 className="text-2xl font-bold">My Trails</h2>
          <p className="text-muted-foreground">Your recorded field routes</p>
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
            <Card key={trail._id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Trail {trail._id.slice(-6)}</CardTitle>
                  <Badge variant="outline">
                    <MapPin className="h-3 w-3 mr-1" />
                    {trail.path?.coordinates?.length || 0} points
                  </Badge>
                </div>
                <CardDescription>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(trail.createdAt).toLocaleDateString()}
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duration:</span>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {calculateDuration(trail.totalDuration)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Distance:</span>
                    <span>{calculateDistance(trail.totalDistance)}</span>
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
                        onClick={(e) => {
                          e.stopPropagation()
                          // Implement delete if needed
                        }}
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
