"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Send, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Package, 
  User, 
  Phone, 
  MapPin,
  Calendar,
  TrendingUp
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { quotationStorage, QuotationRequest } from "@/lib/quotation-storage"

export function QuotationList() {
  const [quotations, setQuotations] = useState<QuotationRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    sent: 0,
    failed: 0,
  })
  const { toast } = useToast()

  const loadQuotations = async () => {
    try {
      const allQuotations = await quotationStorage.getAllQuotations()
      setQuotations(allQuotations)

      const stats = await quotationStorage.getStatistics()
      setStatistics(stats)
    } catch (error: any) {
      toast({
        title: "Load Failed",
        description: error.message || "Could not load quotations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuotations()

    // Auto-sync on mount if online
    if (navigator.onLine) {
      syncPendingQuotations()
    }

    // Listen for online events
    const handleOnline = () => {
      toast({
        title: "📡 Back Online",
        description: "Syncing pending quotations...",
      })
      syncPendingQuotations()
    }

    window.addEventListener("online", handleOnline)
    return () => window.removeEventListener("online", handleOnline)
  }, [])

  const syncPendingQuotations = async () => {
    if (!navigator.onLine) {
      toast({
        title: "No Connection",
        description: "Cannot sync while offline",
        variant: "destructive",
      })
      return
    }

    try {
      setSyncing(true)
      const result = await quotationStorage.syncAllPending()

      if (result.success > 0 || result.failed > 0) {
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${result.success} quotation(s). ${result.failed} failed.`,
        })
        await loadQuotations()
      }
      // Silently succeed when there's nothing to sync
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message || "Could not sync quotations",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const retryFailedQuotations = async () => {
    if (!navigator.onLine) {
      toast({
        title: "No Connection",
        description: "Cannot retry while offline",
        variant: "destructive",
      })
      return
    }

    try {
      setSyncing(true)
      const result = await quotationStorage.retryFailed()

      toast({
        title: "Retry Complete",
        description: `Successfully sent ${result.success} quotation(s). ${result.failed} failed.`,
      })
      await loadQuotations()
    } catch (error: any) {
      toast({
        title: "Retry Failed",
        description: error.message || "Could not retry quotations",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const deleteQuotation = async (id: string) => {
    try {
      await quotationStorage.deleteQuotation(id)
      toast({
        title: "Quotation Deleted",
        description: "Quotation removed successfully",
      })
      await loadQuotations()
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Could not delete quotation",
        variant: "destructive",
      })
    }
  }

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp)
    return date.toLocaleString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge className="rounded-lg bg-green-100 text-green-800 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Sent
          </Badge>
        )
      case "failed":
        return (
          <Badge className="rounded-lg bg-red-100 text-red-800 border-red-300">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default: // pending
        return (
          <Badge className="rounded-lg bg-yellow-100 text-yellow-800 border-yellow-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
    }
  }

  const filterQuotations = (status?: string) => {
    if (!status) return quotations
    return quotations.filter((q) => q.status === status)
  }

  const QuotationCard = ({ quotation }: { quotation: QuotationRequest }) => (
    <Card
      className="rounded-2xl bg-white border-0 hover:scale-[1.02] transition-transform duration-200"
      style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 text-lg mb-1 flex items-center gap-2">
              <Package className="h-5 w-5 text-[#00aeef]" />
              {quotation.productName}
            </h3>
            <p className="text-sm text-gray-500">
              Quotation #{quotation.id.slice(0, 8).toUpperCase()}
            </p>
          </div>
          {getStatusBadge(quotation.status)}
        </div>

        {/* Client Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gray-400" />
            <span className="font-semibold text-gray-700">{quotation.clientName}</span>
          </div>
          {quotation.clientPhone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{quotation.clientPhone}</span>
            </div>
          )}
          {quotation.clientLocation && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{quotation.clientLocation}</span>
            </div>
          )}
        </div>

        {/* Order Details */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Quantity</p>
              <p className="font-bold text-gray-800">{quotation.quantity} units</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Total Value</p>
              <p className="font-bold text-[#00aeef] text-lg">
                KES {(parseFloat(quotation.productPrice) * quotation.quantity).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quotation.notes && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Notes:</p>
            <p className="text-sm text-gray-700 line-clamp-2">{quotation.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            {formatDate(quotation.createdAt)}
          </div>
          {quotation.status === "failed" && quotation.errorMessage && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => syncPendingQuotations()}
              className="rounded-lg text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>

        {/* Error Message */}
        {quotation.errorMessage && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">Error: {quotation.errorMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-[#00aeef]/30 border-t-[#00aeef] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading quotations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card
        className="rounded-3xl bg-white border-0"
        style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
      >
        <CardHeader className="bg-gradient-to-r from-[#00aeef] to-[#0096d6] rounded-t-3xl pb-4">
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl p-2">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="text-2xl">Quotations</span>
                <p className="text-white/80 text-sm font-normal mt-1">
                  Manage and track all quotation requests
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-white/20 border-white/40 text-white rounded-lg">
              {navigator.onLine ? "📡 Online" : "📴 Offline"}
            </Badge>
          </CardTitle>
        </CardHeader>

        {/* Statistics */}
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border-0">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 text-[#00aeef] mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-800">{statistics.total}</p>
                <p className="text-xs text-gray-600">Total</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 border-0">
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-800">{statistics.pending}</p>
                <p className="text-xs text-gray-600">Pending</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border-0">
              <CardContent className="p-4 text-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-800">{statistics.sent}</p>
                <p className="text-xs text-gray-600">Sent</p>
              </CardContent>
            </Card>
            <Card className="rounded-xl bg-gradient-to-br from-red-50 to-rose-50 border-0">
              <CardContent className="p-4 text-center">
                <AlertCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-800">{statistics.failed}</p>
                <p className="text-xs text-gray-600">Failed</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6">
            <Button
              onClick={syncPendingQuotations}
              disabled={syncing || !navigator.onLine || statistics.pending === 0}
              className="rounded-xl bg-gradient-to-r from-[#00aeef] to-[#0096d6] text-white"
            >
              {syncing ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Syncing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Sync Pending ({statistics.pending})
                </>
              )}
            </Button>
            {statistics.failed > 0 && (
              <Button
                onClick={retryFailedQuotations}
                disabled={syncing || !navigator.onLine}
                variant="outline"
                className="rounded-xl border-2"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Failed ({statistics.failed})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quotations List with Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-gray-100 p-1">
          <TabsTrigger value="all" className="rounded-xl">
            All ({statistics.total})
          </TabsTrigger>
          <TabsTrigger value="pending" className="rounded-xl">
            Pending ({statistics.pending})
          </TabsTrigger>
          <TabsTrigger value="sent" className="rounded-xl">
            Sent ({statistics.sent})
          </TabsTrigger>
          <TabsTrigger value="failed" className="rounded-xl">
            Failed ({statistics.failed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-6">
          {quotations.length === 0 ? (
            <Card className="rounded-2xl bg-gray-50 border-0">
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Quotations Yet</h3>
                <p className="text-gray-500">
                  Start requesting quotes for products to see them here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quotations.map((quotation) => (
                <QuotationCard key={quotation.id} quotation={quotation} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {filterQuotations("pending").length === 0 ? (
            <Card className="rounded-2xl bg-gray-50 border-0">
              <CardContent className="p-12 text-center">
                <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Pending Quotations</h3>
                <p className="text-gray-500">All quotations have been synced.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterQuotations("pending").map((quotation) => (
                <QuotationCard key={quotation.id} quotation={quotation} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4 mt-6">
          {filterQuotations("sent").length === 0 ? (
            <Card className="rounded-2xl bg-gray-50 border-0">
              <CardContent className="p-12 text-center">
                <Send className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Sent Quotations</h3>
                <p className="text-gray-500">Quotations you submit will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterQuotations("sent").map((quotation) => (
                <QuotationCard key={quotation.id} quotation={quotation} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="failed" className="space-y-4 mt-6">
          {filterQuotations("failed").length === 0 ? (
            <Card className="rounded-2xl bg-gray-50 border-0">
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Failed Quotations</h3>
                <p className="text-gray-500">Great! All submissions were successful.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterQuotations("failed").map((quotation) => (
                <QuotationCard key={quotation.id} quotation={quotation} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
