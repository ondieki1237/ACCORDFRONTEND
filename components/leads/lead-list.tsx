"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Package, 
  DollarSign,
  Calendar,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  Edit
} from "lucide-react"
import { LeadForm } from "./lead-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Lead {
  id: string
  facilityName: string
  facilityType: string
  location: string
  contactPerson: {
    name: string
    role: string
    phone: string
    email: string
  }
  equipmentOfInterest: {
    name: string
    category: string
    quantity: number
  }
  budget: {
    amount: string
    currency: string
  }
  timeline: {
    expectedPurchaseDate: string
    urgency: string
  }
  leadStatus: string
  createdAt: string
}

export function LeadList() {
  const [view, setView] = useState<"list" | "form">("list")
  const [leads, setLeads] = useState<Lead[]>([])
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const { toast } = useToast()

  // Status change dialog state
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [statusCandidate, setStatusCandidate] = useState<string>("")
  const [statusChangeNote, setStatusChangeNote] = useState<string>("")
  const [selectedLeadForStatus, setSelectedLeadForStatus] = useState<Lead | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    loadLeads()
  }, [])

  useEffect(() => {
    filterLeads()
  }, [searchQuery, leads])

  const loadLeads = async () => {
    try {
      setIsLoading(true)
      const { apiService } = await import("@/lib/api")
      const response = await apiService.getLeads()
      
      console.log('Leads API Response:', response)
      console.log('Response type:', typeof response)
      console.log('Response.data:', response.data)
      console.log('Is response.data array?', Array.isArray(response.data))
      
      // Handle different response structures
      let leadsData: Lead[] = []
      
      if (response.success && response.data) {
        if (Array.isArray(response.data.docs)) {
          // Paginated response: { success: true, data: { docs: [...], totalDocs, page, ... } }
          leadsData = response.data.docs
          console.log('📄 Paginated response - Total:', response.data.totalDocs, 'Page:', response.data.page)
        } else if (Array.isArray(response.data)) {
          // Array response: { success: true, data: [...] }
          leadsData = response.data
        }
      } else if (Array.isArray(response.data)) {
        // Just data array: { data: [...] }
        leadsData = response.data
      } else if (Array.isArray(response)) {
        // Direct array response: [...]
        leadsData = response
      } else {
        console.warn('Unexpected response structure:', response)
        leadsData = []
      }
      
  console.log('✅ Final leadsData:', leadsData)
  console.log('📊 LeadsData length:', leadsData.length)

  // Normalize id field (API may return _id)
  const normalizedLeads = leadsData.map((l: any) => ({ ...l, id: l.id || l._id }))
  setLeads(normalizedLeads)
    } catch (error) {
      console.error("Failed to load leads:", error)
      setLeads([]) // Set empty array on error
      toast({
        title: "Failed to load leads",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterLeads = () => {
    if (!searchQuery.trim()) {
      setFilteredLeads(leads)
      return
    }

    // Ensure leads is an array before filtering
    if (!Array.isArray(leads)) {
      setFilteredLeads([])
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = leads.filter(
      (lead) =>
        lead.facilityName?.toLowerCase().includes(query) ||
        lead.location?.toLowerCase().includes(query) ||
        lead.contactPerson?.name?.toLowerCase().includes(query) ||
        lead.equipmentOfInterest?.name?.toLowerCase().includes(query) ||
        lead.leadStatus?.toLowerCase().includes(query)
    )
    setFilteredLeads(filtered)
  }

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    // Legacy helper retained but newer flow uses dialog + performStatusUpdate
    try {
      const { apiService } = await import("@/lib/api")
      await apiService.updateLead(leadId, { leadStatus: newStatus })
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, leadStatus: newStatus } : lead
      ))
      toast({
        title: "Status Updated",
        description: `Lead status changed to ${newStatus.replace("-", " ")}`,
      })
    } catch (error) {
      console.error("Failed to update lead status:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update lead status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const performStatusUpdate = async () => {
    if (!selectedLeadForStatus || !statusCandidate) return

    setIsUpdating(true)
    const prevLeads = [...leads]
    const prevFiltered = [...filteredLeads]

    // optimistic update
  const leadIdOrKey = selectedLeadForStatus.id || (selectedLeadForStatus as any)._id
  setLeads((curr) => curr.map(l => (l.id === leadIdOrKey || (l as any)._id === leadIdOrKey) ? { ...l, leadStatus: statusCandidate } : l))
  setFilteredLeads((curr) => curr.map(l => (l.id === leadIdOrKey || (l as any)._id === leadIdOrKey) ? { ...l, leadStatus: statusCandidate } : l))

    try {
      const { apiService } = await import("@/lib/api")
      const { authService } = await import("@/lib/auth")
      const currentUser = authService.getCurrentUserSync && authService.getCurrentUserSync()
      const role = currentUser?.role?.toLowerCase() || ""

      const payload = {
        leadStatus: statusCandidate,
        statusChangeNote: statusChangeNote || "",
      }

      let response: any
      const leadId = selectedLeadForStatus.id || (selectedLeadForStatus as any)._id
      console.log('performStatusUpdate: leadId=', leadId, 'status=', statusCandidate)
      if (role.includes("admin") || role === "manager") {
        response = await apiService.updateLeadAsAdmin(leadId, payload)
      } else {
        response = await apiService.updateLead(leadId, payload)
      }

      const updatedLead = response?.data || response

      // reconcile UI with server response
  const serverId = updatedLead.id || updatedLead._id || (selectedLeadForStatus as any).id
  setLeads((curr) => curr.map(l => (l.id === serverId || (l as any)._id === serverId) ? { ...l, ...updatedLead, id: serverId } : l))
  setFilteredLeads((curr) => curr.map(l => (l.id === serverId || (l as any)._id === serverId) ? { ...l, ...updatedLead, id: serverId } : l))

      toast({ title: "Status Updated", description: `Lead status changed to ${statusCandidate.replace("-"," ")}` })
    } catch (error: any) {
      console.error("Failed to perform status update:", error)
      // rollback
      setLeads(prevLeads)
      setFilteredLeads(prevFiltered)
      if (error?.status === 401) {
        toast({ title: "Unauthorized", description: "Please login again.", variant: "destructive" })
      } else if (error?.status === 403) {
        toast({ title: "Forbidden", description: "You don't have permission to change this lead.", variant: "destructive" })
      } else {
        toast({ title: "Update Failed", description: error?.message || "Could not update lead status.", variant: "destructive" })
      }
    } finally {
      setIsUpdating(false)
      setShowStatusDialog(false)
      setSelectedLeadForStatus(null)
      setStatusCandidate("")
      setStatusChangeNote("")
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: "bg-blue-100 text-blue-700",
      contacted: "bg-purple-100 text-purple-700",
      qualified: "bg-cyan-100 text-cyan-700",
      "proposal-sent": "bg-orange-100 text-orange-700",
      negotiation: "bg-yellow-100 text-yellow-700",
      won: "bg-green-100 text-green-700",
      lost: "bg-red-100 text-red-700",
    }
    return colors[status] || "bg-gray-100 text-gray-700"
  }

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      low: "bg-green-100 text-green-700",
      medium: "bg-yellow-100 text-yellow-700",
      high: "bg-red-100 text-red-700",
    }
    return colors[urgency] || "bg-gray-100 text-gray-700"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set"
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (view === "form") {
    return (
      <LeadForm
        onBack={() => {
          setView("list")
          setSelectedLead(null)
          loadLeads()
        }}
        onSuccess={() => {
          setView("list")
          setSelectedLead(null)
          loadLeads()
        }}
        initialData={selectedLead}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card
        className="rounded-3xl bg-white border-0 overflow-hidden"
        style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
      >
        <CardHeader className="bg-gradient-to-r from-[#00aeef] to-[#0096d6] pb-4">
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl p-2">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <span className="text-2xl">Leads</span>
                <p className="text-white/80 text-sm font-normal mt-1">
                  Manage your sales leads
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={loadLeads}
                size="sm"
                variant="ghost"
                className="bg-white/10 text-white hover:bg-white/20 rounded-xl"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={() => setView("form")}
                size="sm"
                className="bg-white text-[#00aeef] hover:bg-white/90 rounded-xl"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Lead
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search leads by facility, location, contact, or equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="rounded-xl bg-blue-50 border-0">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {Array.isArray(leads) ? leads.length : 0}
                </p>
                <p className="text-xs text-blue-600 mt-1">Total Leads</p>
              </CardContent>
            </Card>
            {/* Status change dialog */}
            <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Change Lead Status</DialogTitle>
                </DialogHeader>
                <DialogDescription>
                  {selectedLeadForStatus ? (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Changing status for <strong>{selectedLeadForStatus.facilityName}</strong>
                      </p>
                      <p className="text-sm">Current: <strong>{selectedLeadForStatus.leadStatus.replace("-"," ")}</strong></p>
                    </div>
                  ) : (
                    <p className="text-sm">Select a status and provide an optional note.</p>
                  )}
                </DialogDescription>

                <div className="mt-4">
                  <label className="text-sm font-medium">Note (optional)</label>
                  <Textarea
                    value={statusChangeNote}
                    onChange={(e) => setStatusChangeNote(e.target.value)}
                    placeholder="Short note about why status is changing"
                    className="mt-2"
                    rows={4}
                  />
                </div>

                <DialogFooter>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => setShowStatusDialog(false)} disabled={isUpdating}>
                      Cancel
                    </Button>
                    <Button
                      onClick={performStatusUpdate}
                      disabled={isUpdating}
                      className="bg-gradient-to-r from-[#00aeef] to-[#0096d6] text-white"
                    >
                      {isUpdating ? 'Updating...' : `Set status: ${statusCandidate.replace("-"," ")}`}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Card className="rounded-xl bg-green-50 border-0">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-700">
                  {Array.isArray(leads) ? leads.filter((l) => l.leadStatus === "qualified").length : 0}
                </p>
                <p className="text-xs text-green-600 mt-1">Qualified</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl bg-orange-50 border-0">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-orange-700">
                  {Array.isArray(leads) ? leads.filter((l) => l.timeline?.urgency === "high").length : 0}
                </p>
                <p className="text-xs text-orange-600 mt-1">High Priority</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl bg-purple-50 border-0">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-purple-700">
                  {Array.isArray(leads) ? leads.filter((l) => l.leadStatus === "new").length : 0}
                </p>
                <p className="text-xs text-purple-600 mt-1">New</p>
              </CardContent>
            </Card>
          </div>

          {/* Leads List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#00aeef] border-r-transparent"></div>
              <p className="text-gray-500 mt-4">Loading leads...</p>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {searchQuery ? "No leads found" : "No leads yet"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Start by creating your first lead"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setView("form")}
                  className="bg-gradient-to-r from-[#00aeef] to-[#0096d6] text-white rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Lead
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLeads.map((lead) => (
                <Card
                  key={lead.id}
                  className="rounded-2xl border-2 border-gray-200 hover:border-[#00aeef] transition-all"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          setSelectedLead(lead)
                          setView("form")
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-5 w-5 text-[#00aeef]" />
                          <h3 className="font-bold text-lg text-gray-800">
                            {lead.facilityName}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                          <MapPin className="h-4 w-4" />
                          {lead.location}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Status
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedLeadForStatus(lead)
                                setStatusCandidate("new")
                                setStatusChangeNote("")
                                setShowStatusDialog(true)
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-blue-500" />
                                New
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedLeadForStatus(lead)
                                setStatusCandidate("contacted")
                                setStatusChangeNote("")
                                setShowStatusDialog(true)
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-purple-500" />
                                Contacted
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedLeadForStatus(lead)
                                setStatusCandidate("qualified")
                                setStatusChangeNote("")
                                setShowStatusDialog(true)
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-cyan-500" />
                                Qualified
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedLeadForStatus(lead)
                                setStatusCandidate("proposal-sent")
                                setStatusChangeNote("")
                                setShowStatusDialog(true)
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-orange-500" />
                                Proposal Sent
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedLeadForStatus(lead)
                                setStatusCandidate("negotiation")
                                setStatusChangeNote("")
                                setShowStatusDialog(true)
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-yellow-500" />
                                Negotiation
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedLeadForStatus(lead)
                                setStatusCandidate("won")
                                setStatusChangeNote("")
                                setShowStatusDialog(true)
                              }}
                              className="text-green-600 font-medium"
                            >
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-green-500" />
                                Won
                              </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedLeadForStatus(lead)
                                setStatusCandidate("lost")
                                setStatusChangeNote("")
                                setShowStatusDialog(true)
                              }}
                              className="text-red-600"
                            >
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-red-500" />
                                Lost
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedLead(lead)
                            setView("form")
                          }}
                        >
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">{lead.equipmentOfInterest.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">
                          {lead.budget.currency} {lead.budget.amount || "TBD"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">{lead.contactPerson.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">
                          {formatDate(lead.timeline.expectedPurchaseDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`rounded-lg ${getStatusColor(lead.leadStatus)}`}>
                        {lead.leadStatus.replace("-", " ").toUpperCase()}
                      </Badge>
                      <Badge className={`rounded-lg ${getUrgencyColor(lead.timeline.urgency)}`}>
                        {lead.timeline.urgency.toUpperCase()} PRIORITY
                      </Badge>
                      {lead.facilityType && (
                        <Badge variant="outline" className="rounded-lg">
                          {lead.facilityType}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
