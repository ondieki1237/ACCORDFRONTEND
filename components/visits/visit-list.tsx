"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, WifiOff, Download, Edit2, Folder, ChevronDown, ChevronRight, Clock } from "lucide-react"
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

  // Helper: Get start of week (Monday)
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  // Helper: Format week range
  const formatWeekRange = (startDateStr: string) => {
    const start = new Date(startDateStr)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    const startFmt = start.toLocaleDateString('en-US', options)
    const endFmt = end.toLocaleDateString('en-US', { ...options, year: 'numeric' })
    return `${startFmt} - ${endFmt}`
  }

  // Group visits by Week (Monday start) and then by Day
  const groupedData: {
    [weekStart: string]: {
      visits: Visit[], // All visits in the week
      days: { [date: string]: Visit[] } // Visits grouped by day
    }
  } = {}

  visits.forEach((visit) => {
    const date = new Date(visit.date)
    const weekStart = getStartOfWeek(date).toISOString().slice(0, 10)
    const dayKey = date.toISOString().slice(0, 10)

    if (!groupedData[weekStart]) {
      groupedData[weekStart] = { visits: [], days: {} }
    }

    // Add to week collection
    groupedData[weekStart].visits.push(visit)

    // Add to day collection
    if (!groupedData[weekStart].days[dayKey]) {
      groupedData[weekStart].days[dayKey] = []
    }
    groupedData[weekStart].days[dayKey].push(visit)
  })

  // Sort weeks descending
  const sortedWeeks = Object.keys(groupedData).sort((a, b) => b.localeCompare(a))


  // Helper: convert visits array to XML string
  function visitsToXML(visits: Visit[]) {
    const escape = (str: string) => typeof str === 'string' ? str.replace(/[<>&'\"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '\'': '&apos;', '"': '&quot;' }[c] || c)) : str
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

  function handleDownloadFolder(visits: Visit[], filename: string) {
    const xml = visitsToXML(visits)
    const blob = new Blob([xml], { type: "application/xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
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

  function handleEditFolder(label: string) {
    toast({
      title: "Edit Visits",
      description: `Edit all visits for ${label}`,
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
          {sortedWeeks.map((weekKey) => {
            const weekData = groupedData[weekKey]
            const isWeekOpen = !!openFolders[`week-${weekKey}`]
            const sortedDays = Object.keys(weekData.days).sort((a, b) => b.localeCompare(a))

            return (
              <Card key={weekKey} className="rounded-2xl bg-white shadow-md border-0 overflow-hidden">
                <CardContent className="p-0">
                  {/* Week Header */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer select-none hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenFolders(f => ({ ...f, [`week-${weekKey}`]: !f[`week-${weekKey}`] }))}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-5 w-5 text-[#00aeef]" />
                      <span className="font-bold text-lg text-gray-800">{formatWeekRange(weekKey)}</span>
                      {isWeekOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                      <Badge variant="secondary" className="ml-2 text-xs">{weekData.visits.length} visits</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-xl flex items-center gap-1" onClick={e => { e.stopPropagation(); handleDownloadFolder(weekData.visits, `visits-week-${weekKey}.xml`) }}>
                        <Download className="h-4 w-4" /> Week
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl flex items-center gap-1" onClick={e => { e.stopPropagation(); handleEditFolder(`week of ${formatWeekRange(weekKey)}`) }}>
                        <Edit2 className="h-4 w-4" /> Edit
                      </Button>
                    </div>
                  </div>

                  {/* Days List (Nested) */}
                  {isWeekOpen && (
                    <div className="bg-gray-50/50 border-t">
                      {sortedDays.map(dayKey => {
                        const dayVisits = weekData.days[dayKey]
                        const isDayOpen = !!openFolders[`day-${dayKey}`]

                        return (
                          <div key={dayKey} className="border-b last:border-0">
                            <div
                              className="flex items-center justify-between px-6 py-3 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                              onClick={() => setOpenFolders(f => ({ ...f, [`day-${dayKey}`]: !f[`day-${dayKey}`] }))}
                            >
                              <div className="flex items-center gap-2 pl-4 border-l-2 border-[#00aeef]">
                                <Folder className="h-4 w-4 text-gray-500" />
                                <span className="font-medium text-gray-700">{new Date(dayKey).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                {isDayOpen ? <ChevronDown className="h-3 w-3 text-gray-400" /> : <ChevronRight className="h-3 w-3 text-gray-400" />}
                                <Badge variant="outline" className="ml-2 text-[10px] h-5">{dayVisits.length}</Badge>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs rounded-lg flex items-center gap-1" onClick={e => { e.stopPropagation(); handleDownloadFolder(dayVisits, `visits-${dayKey}.xml`) }}>
                                  <Download className="h-3 w-3" /> Day
                                </Button>
                              </div>
                            </div>

                            {/* Visits List */}
                            {isDayOpen && (
                              <div className="px-6 pb-3 pt-1 grid gap-2">
                                {dayVisits.map((visit) => {
                                  const status = getVisitStatus(visit)
                                  return (
                                    <Card
                                      key={visit._id}
                                      className="px-4 py-3 rounded-xl bg-white border shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"
                                    >
                                      <div className="flex items-center justify-between w-full">
                                        {/* Left: Client Name, Status */}
                                        <div className="flex flex-col gap-1">
                                          <span className="font-medium text-gray-700 text-sm">
                                            {visit.client?.name || "Unknown Client"}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              {new Date(visit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <Badge
                                              className={`rounded-full px-2 py-0.5 text-[10px] w-fit ${getStatusColor(status)}`}
                                            >
                                              {status}
                                            </Badge>
                                            {visit._createdOffline && (
                                              <Badge
                                                variant="outline"
                                                className="rounded-full px-2 py-0.5 text-[10px] w-fit border-orange-300 text-orange-600 bg-orange-50 flex items-center gap-1"
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
                                          className="rounded-lg h-8 px-3 flex items-center gap-1 text-[#00aeef] hover:bg-[#00aeef]/10 transition"
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
