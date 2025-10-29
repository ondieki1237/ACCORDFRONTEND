"use client"

import { useState } from "react"
import { VisitList } from "./visit-list"
import { CreateVisitForm } from "./create-visit-form"
import { VisitDetail } from "./visit-detail"
import EngineerVisitForm from "@/components/visits/engineer/engineervisitform"
import { EngineeringServicesList } from "./engineering-services-list"
import { EngineeringServiceDetail } from "./engineering-service-detail"

interface Visit {
  id: string
  date: string
  startTime: string
  endTime: string
  client: {
    name: string
  }
  contacts: any[]
  requestedEquipment: any[]
  notes: string
  status?: "scheduled" | "in-progress" | "completed" | "cancelled"
}

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

type ViewMode = "list" | "create" | "detail" | "engineer" | "engineering-services" | "engineering-service-detail"

export function VisitManagement() {
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)
  const [selectedService, setSelectedService] = useState<EngineeringService | null>(null)

  const handleCreateVisit = () => {
    setViewMode("create")
  }

  const handleCreateEngineerVisit = () => {
    setViewMode("engineer")
  }

  const handleViewVisit = (visit: any) => {
    setSelectedVisit(visit)
    setViewMode("detail")
  }

  const handleViewEngineeringServices = () => {
    setViewMode("engineering-services")
  }

  const handleViewService = (service: EngineeringService) => {
    setSelectedService(service)
    setViewMode("engineering-service-detail")
  }

  const handleBackToList = () => {
    setViewMode("list")
    setSelectedVisit(null)
    setSelectedService(null)
  }

  const handleBackToServices = () => {
    setViewMode("engineering-services")
    setSelectedService(null)
  }

  const handleVisitCreated = () => {
    setViewMode("list")
  }

  const handleEngineerVisitCreated = () => {
    setViewMode("list")
  }

  const handleServiceUpdated = () => {
    // Refresh the service detail
    setViewMode("engineering-services")
  }

  switch (viewMode) {
    case "create":
      return <CreateVisitForm onSuccess={handleVisitCreated} onCancel={handleBackToList} />
    case "engineer":
      return <EngineerVisitForm onSuccess={handleEngineerVisitCreated} onCancel={handleBackToList} />
    case "detail":
      return selectedVisit ? (
        <VisitDetail visit={selectedVisit} onBack={handleBackToList} />
      ) : (
        <VisitList 
          onCreateVisit={handleCreateVisit} 
          onCreateEngineerVisit={handleCreateEngineerVisit}
          onViewVisit={handleViewVisit}
          onViewEngineeringServices={handleViewEngineeringServices}
        />
      )
    case "engineering-services":
      return <EngineeringServicesList onViewService={handleViewService} />
    case "engineering-service-detail":
      return selectedService ? (
        <EngineeringServiceDetail 
          service={selectedService} 
          onBack={handleBackToServices}
          onUpdate={handleServiceUpdated}
        />
      ) : (
        <EngineeringServicesList onViewService={handleViewService} />
      )
    default:
      return (
        <VisitList 
          onCreateVisit={handleCreateVisit} 
          onCreateEngineerVisit={handleCreateEngineerVisit}
          onViewVisit={handleViewVisit}
          onViewEngineeringServices={handleViewEngineeringServices}
        />
      )
  }
}
