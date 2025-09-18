"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye } from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"

interface Visit {
  _id: string
  date: string
  client: {
    name: string
  }
  status?: "scheduled" | "in-progress" | "completed" | "cancelled"
  revisitRequired?: boolean
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
        setVisits([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyVisits()
  }, [toast, currentUser])

  const getVisitStatus = (visit: Visit) => {
    if (visit.status === "completed") return "Completed"
    if (visit.revisitRequired) return "Revisit Required"
    return "Pending"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "Revisit Required":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-xl bg-gray-100 shadow-inner animate-pulse"
            style={{ boxShadow: "inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff" }}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-gray-700">My Visits</h2>
        <Button
          onClick={onCreateVisit}
          size="sm"
          className="rounded-xl px-4 py-2 bg-[#00aeef] text-white shadow-md hover:shadow-lg transition"
          style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
        >
          + New Visit
        </Button>
      </div>

      {visits.length === 0 ? (
        <Card
          className="rounded-2xl bg-gray-50 p-4"
          style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
        >
          <CardContent className="flex flex-col items-center justify-center py-6">
            <p className="text-gray-500 mb-2">No visits scheduled</p>
            <Button
              onClick={onCreateVisit}
              size="sm"
              className="rounded-xl bg-[#00aeef] text-white px-4 py-2 hover:shadow-lg transition"
              style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
            >
              Schedule Visit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {visits.map((visit) => {
            const status = getVisitStatus(visit)
            return (
              <Card
                key={visit._id}
                className="px-4 py-3 rounded-2xl bg-gray-50 flex items-center justify-between"
                style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
              >
                <div className="flex items-center justify-between w-full">
                  {/* Left: Date, Client Name, Status */}
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-base text-gray-700">
                      {new Date(visit.date).toLocaleDateString()}
                    </span>
                    <span className="text-gray-500 text-sm">
                      {visit.client?.name || "Unknown Client"}
                    </span>
                    <Badge
                      className={`rounded-full px-2 py-1 text-xs mt-1 w-fit ${getStatusColor(status)}`}
                    >
                      {status}
                    </Badge>
                  </div>
                  {/* Right: View Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewVisit(visit)}
                    className="rounded-xl px-4 py-2 flex items-center gap-1 text-[#00aeef] bg-gray-50 hover:bg-gray-100 transition"
                    style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}