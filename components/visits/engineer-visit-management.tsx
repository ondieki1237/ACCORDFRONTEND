"use client"

import { useState } from "react"
import { EngineeringServicesList } from "./engineering-services-list"
import { EngineeringServiceDetail } from "./engineering-service-detail"

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

type ViewMode = "list" | "detail"

export function EngineerVisitManagement() {
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedService, setSelectedService] = useState<EngineeringService | null>(null)

  const handleViewService = (service: EngineeringService) => {
    setSelectedService(service)
    setViewMode("detail")
  }

  const handleBackToList = () => {
    setViewMode("list")
    setSelectedService(null)
  }

  const handleServiceUpdated = () => {
    // Refresh the service list
    setViewMode("list")
    setSelectedService(null)
  }

  switch (viewMode) {
    case "detail":
      return selectedService ? (
        <EngineeringServiceDetail 
          service={selectedService} 
          onBack={handleBackToList}
          onUpdate={handleServiceUpdated}
        />
      ) : (
        <EngineeringServicesList onViewService={handleViewService} />
      )
    default:
      return <EngineeringServicesList onViewService={handleViewService} />
  }
}
