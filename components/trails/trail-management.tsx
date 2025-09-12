"use client"

import { useState } from "react"
import { TrailList } from "./trail-list"
import { CreateTrailForm } from "./create-trail-form"
import { TrailDetail } from "./trail-detail"

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

type ViewMode = "list" | "create" | "detail"

export function TrailManagement() {
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null)

  const handleCreateTrail = () => {
    setViewMode("create")
  }

  const handleViewTrail = (trail: Trail) => {
    setSelectedTrail(trail)
    setViewMode("detail")
  }

  const handleBackToList = () => {
    setViewMode("list")
    setSelectedTrail(null)
  }

  const handleTrailCreated = () => {
    setViewMode("list")
  }

  switch (viewMode) {
    case "create":
      return <CreateTrailForm onSuccess={handleTrailCreated} onCancel={handleBackToList} />
    case "detail":
      return selectedTrail ? (
        <TrailDetail trail={selectedTrail} onBack={handleBackToList} />
      ) : (
        <TrailList onCreateTrail={handleCreateTrail} onViewTrail={handleViewTrail} />
      )
    default:
      return <TrailList onCreateTrail={handleCreateTrail} onViewTrail={handleViewTrail} />
  }
}
