"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, WifiOff, Download, Edit2, Folder, ChevronDown, ChevronRight } from "lucide-react"
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
  onCreateFollowUp?: () => void
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
  const [openFolders, setOpenFolders] = useState<{ [date: string]: boolean }>({})
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

  // Group visits by date (YYYY-MM-DD)
  const groupedByDate: { [date: string]: Visit[] } = {}
  visits.forEach((visit) => {
    const dateKey = new Date(visit.date).toISOString().slice(0, 10)
    if (!groupedByDate[dateKey]) groupedByDate[dateKey] = []
    groupedByDate[dateKey].push(visit)
  })
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a))


  // Helper: convert visits array to XML string
  function visitsToXML(visits: Visit[]) {
    const escape = (str: string) => typeof str === 'string' ? str.replace(/[<>&'\"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','\'':'&apos;','"':'&quot;'}[c]||c)) : str
    function toXML(key: string, value: any, indent = '    '): string {
      if (value == null) return ''
      if (Array.isArray(value)) {
        return value.map(v => toXML(key.slice(0, -1), v, indent)).join('')
      } else if (typeof value === 'object') {
        let inner = ''
        for (const k in value) {
          if (Object.prototype.hasOwnProperty.call(value, k)) {
            inner += toXML(k, value[k], indent + '  ')
          }
        }
        return `\n${indent}<${key}>${inner ? '\n' + inner + indent : ''}</${key}>\n`
      } else {
        return `\n${indent}<${key}>${escape(value)}</${key}>`
      }
    }
    return `<?xml version="1.0" encoding="UTF-8"?>\n<visits>` +
      visits.map(v => {
        let xml = `\n  <visit>`
        const vAny = v as any;
        for (const k in vAny) {
          if (Object.prototype.hasOwnProperty.call(vAny, k)) {
            xml += toXML(k, vAny[k], '    ')
          }
        }
        xml += `\n  </visit>`
        return xml
      }).join('') +
      `\n</visits>`
  }

  function handleDownloadFolder(dateKey: string) {
    const visitsForDate = groupedByDate[dateKey]
    const xml = visitsToXML(visitsForDate)
    const blob = new Blob([xml], { type: "application/xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `visits-${dateKey}.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleDownloadAll() {
    const xml = visitsToXML(visits)
    const blob = new Blob([xml], { type: "application/xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `all-visits.xml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  function handleEditFolder(dateKey: string) {
    toast({
      title: "Edit Visits",
      description: `Edit all visits for ${new Date(dateKey).toLocaleDateString()}`,
    })
    // TODO: Implement bulk edit modal or redirect to edit page
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
      {/* Header - Only show if showActions is true */}
      {showActions && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-700">My Visits</h2>
            <div className="flex gap-2">
              <Button
                onClick={onCreateVisit}
                size="sm"
                className="rounded-xl px-4 py-2 bg-[#00aeef] text-white shadow-md hover:shadow-lg transition"
                style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
              >
                + Sales Visit
              </Button>
              <Button
                onClick={handleDownloadAll}
                size="sm"
                variant="outline"
                className="rounded-xl flex items-center gap-1"
              >
                <Download className="h-4 w-4" /> Download All (XML)
              </Button>
            </div>
          </div>
        </div>
      )}

      {visits.length === 0 ? (
        <Card
          className="rounded-2xl bg-gray-50 p-4"
          style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
        >
          <CardContent className="flex flex-col items-center justify-center py-6">
            <p className="text-gray-500 mb-2">No visits Recorded</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((dateKey) => {
            const isOpen = !!openFolders[dateKey]
            return (
              <Card key={dateKey} className="rounded-2xl bg-white shadow-md border-0">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2 cursor-pointer select-none" onClick={() => setOpenFolders(f => ({ ...f, [dateKey]: !f[dateKey] }))}>
                    <div className="flex items-center gap-2">
                      <Folder className="h-5 w-5 text-[#00aeef]" />
                      <span className="font-bold text-lg text-gray-800">{new Date(dateKey).toLocaleDateString()}</span>
                      {isOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-xl flex items-center gap-1" onClick={e => { e.stopPropagation(); handleDownloadFolder(dateKey) }}>
                        <Download className="h-4 w-4" /> Download
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl flex items-center gap-1" onClick={e => { e.stopPropagation(); handleEditFolder(dateKey) }}>
                        <Edit2 className="h-4 w-4" /> Edit
                      </Button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="grid gap-3 mt-2">
                      {groupedByDate[dateKey].map((visit) => {
                        const status = getVisitStatus(visit)
                        return (
                          <Card
                            key={visit._id}
                            className="px-4 py-3 rounded-2xl bg-gray-50 flex items-center justify-between"
                            style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
                          >
                            <div className="flex items-center justify-between w-full">
                              {/* Left: Client Name, Status */}
                              <div className="flex flex-col gap-1">
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
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
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
