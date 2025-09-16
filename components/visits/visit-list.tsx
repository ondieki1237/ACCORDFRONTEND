"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Clock, Calendar, Plus, Building, FileText, Edit, Trash2, Eye } from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"
import { canEditRecords, canDeleteRecords } from "@/lib/permissions"

interface Visit {
  _id: string
  date: string
  startTime: string
  endTime?: string
  client: {
    name: string
  }
  contacts: any[]
  requestedEquipment?: any[]
  notes?: string
  status?: "scheduled" | "in-progress" | "completed" | "cancelled"
}

interface VisitListProps {
  onCreateVisit: () => void
  onViewVisit: (visit: Visit) => void
}

export function VisitList({ onCreateVisit, onViewVisit }: VisitListProps) {
  const [visits, setVisits] = useState<Visit[]>([])
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

    const fetchMyVisits = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem("accessToken")
        const response = await fetch("http://localhost:5000/api/dashboard/my-visits", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
        })
        if (!response.ok) throw new Error("Failed to fetch visits")
        const data = await response.json()
        const visitsData = data?.data || []
        setVisits(Array.isArray(visitsData) ? visitsData : [])
      } catch (error) {
        console.error("Failed to fetch visits:", error)
        toast({
          title: "Error loading visits",
          description: "Could not load visit data. Please try again later.",
          variant: "destructive",
        })
        setVisits([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyVisits()
  }, [toast, currentUser])

  const handleDeleteVisit = async (visitId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!canDeleteRecords(currentUser)) {
      toast({
        title: "Access denied",
        description: "You don't have permission to delete visits.",
        variant: "destructive",
      })
      return
    }

    if (confirm("Are you sure you want to delete this visit?")) {
      try {
        await apiService.deleteVisit(visitId)
        setVisits(visits.filter((visit) => visit._id !== visitId))
        toast({
          title: "Visit deleted",
          description: "The visit has been successfully deleted.",
        })
      } catch (error) {
        toast({
          title: "Delete failed",
          description: "Could not delete the visit. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const calculateDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return "N/A"
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffHours}h ${diffMinutes}m`
  }

  const getVisitStatus = (visit: Visit) => {
    const now = new Date()
    const visitStart = new Date(visit.startTime)
    const visitEnd = visit.endTime ? new Date(visit.endTime) : visitStart

    if (visit.status) return visit.status

    if (now < visitStart) return "scheduled"
    if (now >= visitStart && now <= visitEnd) return "in-progress"
    return "completed"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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
          <h2 className="text-2xl font-bold">My Visits</h2>
          <p className="text-muted-foreground">Your scheduled and completed client visits</p>
        </div>
        <Button onClick={onCreateVisit} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Visit
        </Button>
      </div>

      {visits.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No visits scheduled</h3>
            <p className="text-muted-foreground text-center mb-4">Start scheduling client visits to see them here</p>
            <Button onClick={onCreateVisit}>Schedule Your First Visit</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visits.map((visit) => {
            const status = getVisitStatus(visit)
            return (
              <Card key={visit._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {visit.client?.name || "Unknown Client"}
                    </CardTitle>
                    <Badge className={getStatusColor(status)}>{status}</Badge>
                  </div>
                  <CardDescription>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(visit.date).toLocaleDateString()}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Duration:</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {calculateDuration(visit.startTime, visit.endTime)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Start:</span>
                      <span>{new Date(visit.startTime).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Contacts:</span>
                      <span>{visit.contacts?.length || 0}</span>
                    </div>
                    {visit.notes && (
                      <div className="flex items-start gap-2 text-sm">
                        <FileText className="h-3 w-3 mt-0.5 text-muted-foreground" />
                        <span className="text-muted-foreground truncate">{visit.notes}</span>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onViewVisit(visit)}
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
                          onClick={(e) => handleDeleteVisit(visit._id, e)}
                          className="flex items-center gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
