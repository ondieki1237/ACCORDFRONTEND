"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, WifiOff } from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { authService } from "@/lib/auth"
import CreateEngineeringServiceForm from "@/components/visits/engineer/engineervisitform"

interface Visit {
  _id: string
  date: string
  client: {
    name: string
  }
  status?: "scheduled" | "in-progress" | "completed" | "cancelled"
  revisitRequired?: boolean
  _createdOffline?: boolean
}

interface VisitListProps {
  onCreateVisit: () => void
  onCreateEngineerVisit: () => void
  onViewVisit: (visit: Visit) => void
  onViewEngineeringServices?: () => void
  showActions?: boolean
}

const PAGE_SIZE = 8

export function VisitList({ onCreateVisit, onCreateEngineerVisit, onViewVisit, onViewEngineeringServices, showActions = true }: VisitListProps) {
  const [visits, setVisits] = useState<Visit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUserSync())
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [showEngineerForm, setShowEngineerForm] = useState(false)
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
        const response = await fetch("https://app.codewithseth.co.ke/api/dashboard/my-visits", {
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

  const visibleVisits = visits.slice(0, visibleCount)
  const hasMore = visits.length > visibleCount

  return (
    <div className="space-y-4">
      {/* Header - Only show if showActions is true */}
      {showActions && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-700">My Visits</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowEngineerForm(true)
                  onCreateEngineerVisit && onCreateEngineerVisit()
                }}
                size="sm"
                className="rounded-xl px-4 py-2 bg-orange-500 text-white shadow-md hover:shadow-lg transition hover:bg-orange-600"
                style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
              >
                🔧 Engineer Visit
              </Button>
              <Button
                onClick={onCreateVisit}
                size="sm"
                className="rounded-xl px-4 py-2 bg-[#00aeef] text-white shadow-md hover:shadow-lg transition"
                style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
              >
                + Sales Visit
              </Button>
            </div>
          </div>
          
          {/* Engineering Services Button */}
          {onViewEngineeringServices && (
            <Button
              onClick={onViewEngineeringServices}
              className="w-full rounded-xl px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:shadow-lg transition font-semibold"
              style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
            >
              🔧 View My Engineering Services
            </Button>
          )}
        </div>
      )}

      {visits.length === 0 ? (
        <Card
          className="rounded-2xl bg-gray-50 p-4"
          style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
        >
          <CardContent className="flex flex-col items-center justify-center py-6">
            <p className="text-gray-500 mb-2">No visits Recorded</p>
            {showActions && (
              <div className="flex gap-2">
                {/* <Button
                    onClick={() => {
                      setShowEngineerForm(true)
                      onCreateEngineerVisit && onCreateEngineerVisit()
                    }}
                  size="sm"
                  className="rounded-xl bg-orange-500 text-white px-4 py-2 hover:shadow-lg transition hover:bg-orange-600"
                  style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
                >
                  🔧 Engineer Visit
                </Button> */}
                {/* <Button
                  onClick={onCreateVisit}
                  size="sm"
                  className="rounded-xl bg-[#00aeef] text-white px-4 py-2 hover:shadow-lg transition"
                  style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
                >
                  Schedule Visit
                </Button> */}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3">
            {visibleVisits.map((visit) => {
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
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className={`rounded-full px-2 py-1 text-xs w-fit ${getStatusColor(status)}`}
                        >
                          {status}
                        </Badge>
                        {visit._createdOffline && (
                          <Badge
                            variant="outline"
                            className="rounded-full px-2 py-1 text-xs w-fit border-orange-300 text-orange-600 bg-orange-50 flex items-center gap-1"
                          >
                            <WifiOff className="h-3 w-3" />
                            Offline
                          </Badge>
                        )}
                      </div>
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
          {hasMore && showActions && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="rounded-xl px-6 py-2"
              >
                View More
              </Button>
            </div>
          )}
        </>
      )}

      {/* Engineer Visit Form Modal */}
      {showEngineerForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowEngineerForm(false)} />
          <div className="relative w-full max-w-3xl mx-4">
            <CreateEngineeringServiceForm
              onSuccess={() => {
                toast({ title: "Service recorded", description: "Engineering service saved." })
                setShowEngineerForm(false)
              }}
              onCancel={() => setShowEngineerForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function EngineerVisitsPage() {
  return (
    <div>
      <CreateEngineeringServiceForm
        onSuccess={() => {
          // Handle success
        }}
        onCancel={() => {
          // Handle cancel
        }}
      />
    </div>
  )
}