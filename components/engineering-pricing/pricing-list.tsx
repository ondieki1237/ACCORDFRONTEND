"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, Calendar, MapPin, Building, ChevronRight, Filter, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PricingRecord {
  _id: string
  activityType: string
  fare: number
  location?: string
  facility?: string
  machine?: string
  otherCharges?: { description: string; amount: number }[]
  createdAt: string
  engineerId?: any
}

interface PricingListProps {
  engineerId?: string
  onViewDetail?: (record: PricingRecord) => void
}

const activityTypeLabels: Record<string, string> = {
  installation: "🔧 Installation",
  maintenance: "🛠️ Maintenance",
  service: "⚙️ Service",
  previsit: "👁️ Pre-visit"
}

export function PricingList({ engineerId, onViewDetail }: PricingListProps) {
  const [records, setRecords] = useState<PricingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    activityType: "",
    searchTerm: ""
  })
  const { toast } = useToast()

  const fetchRecords = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken')
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      })
      
      if (engineerId) params.append('engineerId', engineerId)
      if (filters.activityType) params.append('activityType', filters.activityType)

      const response = await fetch(
        `https://app.codewithseth.co.ke/api/engineering-pricing?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch pricing records (${response.status})`)
      }

      const data = await response.json()
      console.log('Pricing records response:', data)

      let recordsList = []
      if (data.status === 'success' && Array.isArray(data.data)) {
        recordsList = data.data
      } else if (Array.isArray(data)) {
        recordsList = data
      }

      // Apply local search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        recordsList = recordsList.filter((r: PricingRecord) => 
          r.facility?.toLowerCase().includes(searchLower) ||
          r.location?.toLowerCase().includes(searchLower) ||
          r.machine?.toLowerCase().includes(searchLower)
        )
      }

      setRecords(recordsList)
      
      // Handle pagination
      if (data.meta) {
        setTotalPages(Math.ceil(data.meta.totalDocs / 20))
      }
    } catch (error: any) {
      console.error('Failed to fetch pricing records:', error)
      toast({
        title: "Failed to Load Records",
        description: error.message || "Could not fetch pricing records.",
        variant: "destructive"
      })
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [page, filters.activityType, engineerId])

  const handleSearch = () => {
    setPage(1)
    fetchRecords()
  }

  const calculateTotal = (record: PricingRecord) => {
    const fare = record.fare || 0
    const otherChargesTotal = record.otherCharges?.reduce((sum, charge) => sum + (charge.amount || 0), 0) || 0
    return fare + otherChargesTotal
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="rounded-3xl bg-white border-0 overflow-hidden"
        style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 pb-4">
          <CardTitle className="flex items-center gap-3 text-[#00aeef]">
            <div className="bg-[#00aeef] rounded-xl p-2">
              <Filter className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg">Filter Records</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Activity Type</label>
              <Select
                value={filters.activityType || "all"}
                onValueChange={(value) => {
                  setFilters(prev => ({ ...prev, activityType: value === "all" ? "" : value }))
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200">
                  <SelectValue placeholder="All Activities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="installation">🔧 Installation</SelectItem>
                  <SelectItem value="maintenance">🛠️ Maintenance</SelectItem>
                  <SelectItem value="service">⚙️ Service</SelectItem>
                  <SelectItem value="previsit">👁️ Pre-visit</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-gray-700">Search</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by facility, location, or machine..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-12 rounded-xl border-2 border-gray-200"
                />
                <Button
                  onClick={handleSearch}
                  className="h-12 px-6 rounded-xl bg-[#00aeef] hover:bg-[#0096d6]"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Records List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#00aeef] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading expense records...</p>
        </div>
      ) : records.length === 0 ? (
        <Card className="rounded-3xl bg-white border-0 overflow-hidden"
          style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}>
          <CardContent className="py-12 text-center">
            <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Expense Records Found</h3>
            <p className="text-gray-500">You haven't submitted any expense claims yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <Card
              key={record._id}
              className="rounded-3xl bg-white border-0 overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300"
              style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
              onClick={() => onViewDetail && onViewDetail(record)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-[#00aeef]/10 to-[#0096d6]/10 rounded-xl p-3">
                        <DollarSign className="h-6 w-6 text-[#00aeef]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {activityTypeLabels[record.activityType] || record.activityType}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(record.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grid gap-2 md:grid-cols-2">
                      {record.facility && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building className="h-4 w-4 text-emerald-500" />
                          <span>{record.facility}</span>
                        </div>
                      )}
                      {record.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-orange-500" />
                          <span>{record.location}</span>
                        </div>
                      )}
                    </div>

                    {record.machine && (
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold">Equipment:</span> {record.machine}
                      </p>
                    )}

                    {/* Breakdown */}
                    <div className="pt-2 border-t border-gray-100 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Transport Fare:</span>
                        <span className="font-semibold text-gray-800">
                          KES {record.fare.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {record.otherCharges && record.otherCharges.length > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Other Charges ({record.otherCharges.length}):</span>
                          <span className="font-semibold text-gray-800">
                            KES {record.otherCharges.reduce((sum, c) => sum + c.amount, 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-base pt-2 border-t border-gray-200">
                        <span className="font-bold text-gray-800">Total:</span>
                        <span className="font-bold text-[#00aeef] text-lg">
                          KES {calculateTotal(record).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Arrow */}
                  {onViewDetail && (
                    <ChevronRight className="h-6 w-6 text-gray-400 flex-shrink-0 ml-4" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-6">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-12 px-6 rounded-xl"
          >
            Previous
          </Button>
          <span className="text-sm font-semibold text-gray-700">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-12 px-6 rounded-xl"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
