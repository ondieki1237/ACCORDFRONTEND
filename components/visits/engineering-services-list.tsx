"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Calendar, MapPin, Wrench, AlertCircle } from "lucide-react"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

interface EngineeringService {
  _id: string
  date: string
  facility: {
    name: string
    location: string
  }
  serviceType: string
  engineerInCharge: {
    _id: string
    name: string
    phone: string
  }
  machineDetails: string
  conditionBefore: string
  conditionAfter: string
  status: "pending" | "assigned" | "in-progress" | "completed" | "cancelled"
  notes: string
  scheduledDate: string
  createdAt: string
  updatedAt: string
}

interface EngineeringServicesListProps {
  onViewService: (service: EngineeringService) => void
}

const API_BASE = "https://app.codewithseth.co.ke/api"

export function EngineeringServicesList({ onViewService }: EngineeringServicesListProps) {
  const [services, setServices] = useState<EngineeringService[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchMyServices()
  }, [filter])

  const fetchMyServices = async () => {
    try {
      setIsLoading(true)
      const token = authService.getAccessToken()
      const user = authService.getCurrentUserSync()

      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view your services",
          variant: "destructive",
        })
        return
      }

      let url = `${API_BASE}/engineering-services?engineerId=${user._id}&page=1&limit=50`
      if (filter !== "all") {
        url += `&status=${filter}`
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch services")
      }

      const result = await response.json()

      if (result.success) {
        setServices(result.data.docs || [])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load services. Please try again.",
        variant: "destructive",
      })
      setServices([])
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-yellow-100 text-yellow-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getServiceTypeIcon = (serviceType: string) => {
    switch (serviceType) {
      case "installation":
        return "🔧"
      case "maintenance":
        return "⚙️"
      case "repair":
        return "🔨"
      case "service":
        return "🛠️"
      default:
        return "📋"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-32 rounded-xl bg-gray-100 shadow-inner animate-pulse"
            style={{ boxShadow: "inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff" }}
          />
        ))}
      </div>
    )
  }

  const filteredServices = services

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-700">Engineering Services</h2>
          <Badge className="bg-[#00aeef] text-white">
            {filteredServices.length} {filteredServices.length === 1 ? "Service" : "Services"}
          </Badge>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {["all", "assigned", "in-progress", "completed"].map((status) => (
            <Button
              key={status}
              onClick={() => setFilter(status)}
              variant={filter === status ? "default" : "outline"}
              size="sm"
              className={`rounded-xl px-4 py-2 whitespace-nowrap ${
                filter === status
                  ? "bg-[#00aeef] text-white shadow-md"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              {status === "all"
                ? "All"
                : status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <Card
          className="rounded-2xl bg-gray-50 p-4"
          style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
        >
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500 text-center">
              {filter === "all"
                ? "No services assigned to you yet"
                : `No ${filter.replace("-", " ")} services`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredServices.map((service) => (
            <Card
              key={service._id}
              className="rounded-2xl bg-white hover:bg-gray-50 transition cursor-pointer"
              style={{ boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff" }}
              onClick={() => onViewService(service)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getServiceTypeIcon(service.serviceType)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-800 capitalize">
                        {service.serviceType}
                      </h3>
                      <p className="text-sm text-gray-600">{service.facility.name}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(service.status)}>
                    {service.status.replace("-", " ")}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{service.facility.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Scheduled: {formatDate(service.scheduledDate)}</span>
                  </div>
                  {service.machineDetails && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Wrench className="h-4 w-4" />
                      <span className="truncate">{service.machineDetails}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    Updated: {formatDate(service.updatedAt)}
                  </span>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewService(service)
                    }}
                    size="sm"
                    className="rounded-lg px-3 py-1 bg-[#00aeef] text-white hover:bg-[#0096d6]"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
