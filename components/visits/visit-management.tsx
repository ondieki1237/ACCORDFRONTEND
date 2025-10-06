"use client"

import { useState } from "react"
import { VisitList } from "./visit-list"
import { CreateVisitForm } from "./create-visit-form"
import { VisitDetail } from "./visit-detail"
import { EngineerVisitForm } from "@/components/engineer/engineervisitform"

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

type ViewMode = "list" | "create" | "detail" | "engineer"

export function VisitManagement() {
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null)

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

  const handleBackToList = () => {
    setViewMode("list")
    setSelectedVisit(null)
  }

  const handleVisitCreated = () => {
    setViewMode("list")
  }

  const handleEngineerVisitCreated = () => {
    setViewMode("list")
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
        <VisitList onCreateVisit={handleCreateVisit} onCreateEngineerVisit={handleCreateEngineerVisit} onViewVisit={handleViewVisit} />
      )
    default:
      return <VisitList onCreateVisit={handleCreateVisit} onCreateEngineerVisit={handleCreateEngineerVisit} onViewVisit={handleViewVisit} />
  }
}
