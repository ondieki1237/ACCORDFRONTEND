"use client"

import React, { useState } from "react"
import { PricingForm } from "./pricing-form"
import { PricingList } from "./pricing-list"
import { PricingDetail } from "./pricing-detail"
import { Button } from "@/components/ui/button"
import { Plus, List, ArrowLeft } from "lucide-react"

interface PricingManagementProps {
  engineerId: string
  isAdmin?: boolean
}

type View = 'list' | 'create' | 'detail'

interface PricingRecord {
  _id: string
  activityType: string
  fare: number
  location?: string
  facility?: string
  machine?: string
  otherCharges?: { description: string; amount: number }[]
  createdAt: string
}

export function PricingManagement({ engineerId, isAdmin = false }: PricingManagementProps) {
  const [currentView, setCurrentView] = useState<View>('list')
  const [selectedRecord, setSelectedRecord] = useState<PricingRecord | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCreateSuccess = () => {
    setCurrentView('list')
    setRefreshKey(prev => prev + 1) // Trigger list refresh
  }

  const handleViewDetail = (record: PricingRecord) => {
    setSelectedRecord(record)
    setCurrentView('detail')
  }

  const handleBackToList = () => {
    setSelectedRecord(null)
    setCurrentView('list')
    setRefreshKey(prev => prev + 1)
  }

  if (currentView === 'create') {
    return (
      <PricingForm
        engineerId={engineerId}
        onSuccess={handleCreateSuccess}
        onCancel={() => setCurrentView('list')}
      />
    )
  }

  if (currentView === 'detail' && selectedRecord) {
    return (
      <PricingDetail
        record={selectedRecord}
        onBack={handleBackToList}
        isAdmin={isAdmin}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f4f9] via-[#e8ecf4] to-[#dfe5f0] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div
          className="bg-gradient-to-r from-[#00aeef] to-[#0096d6] rounded-3xl p-6 md:p-8 shadow-xl"
          style={{
            boxShadow: "12px 12px 24px rgba(0, 174, 239, 0.2), -12px -12px 24px rgba(255, 255, 255, 0.9)"
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <List className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">My Expenses</h2>
              </div>
              <p className="text-white/90 text-sm md:text-base ml-14">
                Track and manage your activity expenses
              </p>
            </div>
            <Button
              onClick={() => setCurrentView('create')}
              className="h-14 px-8 text-lg font-semibold bg-white text-[#00aeef] hover:bg-white/90 rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02]"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Expense
            </Button>
          </div>
        </div>

        {/* List */}
        <PricingList
          key={refreshKey}
          engineerId={!isAdmin ? engineerId : undefined}
          onViewDetail={handleViewDetail}
        />
      </div>
    </div>
  )
}
