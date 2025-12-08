"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, MapPin, Building, Wrench, DollarSign } from "lucide-react"

interface PricingRecord {
  _id: string
  activityType: string
  fare: number
  location?: string
  facility?: string
  machine?: string
  otherCharges?: { description: string; amount: number }[]
  createdAt: string
  updatedAt?: string
  engineerId?: any
}

interface PricingDetailProps {
  record: PricingRecord
  onBack: () => void
  isAdmin?: boolean
}

const activityTypeLabels: Record<string, string> = {
  installation: "🔧 Installation",
  maintenance: "🛠️ Maintenance",
  service: "⚙️ Service",
  previsit: "👁️ Pre-visit"
}

export function PricingDetail({ record, onBack, isAdmin = false }: PricingDetailProps) {
  const calculateTotal = () => {
    const fare = record.fare || 0
    const otherChargesTotal = record.otherCharges?.reduce((sum, charge) => sum + (charge.amount || 0), 0) || 0
    return fare + otherChargesTotal
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f4f9] via-[#e8ecf4] to-[#dfe5f0] p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div
          className="bg-gradient-to-r from-[#00aeef] to-[#0096d6] rounded-3xl p-6 md:p-8 shadow-xl"
          style={{
            boxShadow: "12px 12px 24px rgba(0, 174, 239, 0.2), -12px -12px 24px rgba(255, 255, 255, 0.9)"
          }}
        >
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="h-12 w-12 p-0 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-bold text-white">Expense Detail</h2>
              <p className="text-white/90 text-sm md:text-base mt-1">
                View complete expense claim information
              </p>
            </div>
          </div>
        </div>

        {/* Activity Information */}
        <Card
          className="rounded-3xl bg-white border-0 overflow-hidden"
          style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
        >
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 pb-4">
            <CardTitle className="flex items-center gap-3 text-[#00aeef]">
              <div className="bg-[#00aeef] rounded-xl p-2">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl">Activity Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500 mb-1">Activity Type</p>
                <p className="text-lg font-semibold text-gray-800">
                  {activityTypeLabels[record.activityType] || record.activityType}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Submitted Date
                </p>
                <p className="text-lg font-semibold text-gray-800">
                  {formatDate(record.createdAt)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Facility */}
        {(record.location || record.facility || record.machine) && (
          <Card
            className="rounded-3xl bg-white border-0 overflow-hidden"
            style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
          >
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 pb-4">
              <CardTitle className="flex items-center gap-3 text-[#00aeef]">
                <div className="bg-emerald-500 rounded-xl p-2">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl">Location & Facility</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {record.location && (
                <div>
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Location
                  </p>
                  <p className="text-base font-medium text-gray-800">{record.location}</p>
                </div>
              )}
              {record.facility && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Facility Name</p>
                  <p className="text-base font-medium text-gray-800">{record.facility}</p>
                </div>
              )}
              {record.machine && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Machine/Equipment</p>
                  <p className="text-base font-medium text-gray-800">{record.machine}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Expense Breakdown */}
        <Card
          className="rounded-3xl bg-white border-0 overflow-hidden"
          style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
        >
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 pb-4">
            <CardTitle className="flex items-center gap-3 text-[#00aeef]">
              <div className="bg-orange-500 rounded-xl p-2">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl">Expense Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Transport Fare */}
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <div>
                  <p className="font-semibold text-gray-800">Transport Fare</p>
                  <p className="text-sm text-gray-500">Travel costs</p>
                </div>
                <p className="text-xl font-bold text-gray-800">
                  KES {record.fare.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Other Charges */}
              {record.otherCharges && record.otherCharges.length > 0 && (
                <>
                  <div className="pt-2">
                    <p className="font-semibold text-gray-800 mb-3">Other Charges</p>
                    <div className="space-y-3">
                      {record.otherCharges.map((charge, index) => (
                        <div key={index} className="flex justify-between items-center py-2 px-4 bg-gray-50 rounded-xl">
                          <p className="text-gray-700">{charge.description}</p>
                          <p className="font-semibold text-gray-800">
                            KES {charge.amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <p className="text-gray-600">Other Charges Subtotal</p>
                    <p className="font-semibold text-gray-800">
                      KES {record.otherCharges.reduce((sum, c) => sum + c.amount, 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </>
              )}

              {/* Total */}
              <div className="flex justify-between items-center pt-4 border-t-2 border-[#00aeef]/20">
                <div>
                  <p className="text-xl font-bold text-gray-800">Total Expenses</p>
                  <p className="text-sm text-gray-500">All charges included</p>
                </div>
                <p className="text-3xl font-bold text-[#00aeef]">
                  KES {calculateTotal().toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        {record.updatedAt && record.updatedAt !== record.createdAt && (
          <Card
            className="rounded-3xl bg-white border-0 overflow-hidden"
            style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
          >
            <CardContent className="py-4">
              <p className="text-sm text-gray-500">
                Last updated: {formatDate(record.updatedAt)}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Back Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="h-14 px-8 text-lg font-semibold rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to List
          </Button>
        </div>
      </div>
    </div>
  )
}
