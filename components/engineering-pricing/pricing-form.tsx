"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, MapPin, Building, Wrench, Plus, X, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PricingFormProps {
  onSuccess: () => void
  onCancel: () => void
  engineerId: string
}

interface OtherCharge {
  description: string
  amount: string
}

interface PricingFormData {
  activityType: string
  fare: string
  location: string
  facility: string
  machine: string
  otherCharges: OtherCharge[]
}

export function PricingForm({ onSuccess, onCancel, engineerId }: PricingFormProps) {
  const [formData, setFormData] = useState<PricingFormData>({
    activityType: "service",
    fare: "",
    location: "",
    facility: "",
    machine: "",
    otherCharges: [{ description: "", amount: "" }]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const updateField = (field: keyof PricingFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addCharge = () => {
    setFormData(prev => ({
      ...prev,
      otherCharges: [...prev.otherCharges, { description: "", amount: "" }]
    }))
  }

  const removeCharge = (index: number) => {
    if (formData.otherCharges.length <= 1) return
    setFormData(prev => ({
      ...prev,
      otherCharges: prev.otherCharges.filter((_, i) => i !== index)
    }))
  }

  const updateCharge = (index: number, field: keyof OtherCharge, value: string) => {
    setFormData(prev => ({
      ...prev,
      otherCharges: prev.otherCharges.map((charge, i) =>
        i === index ? { ...charge, [field]: value } : charge
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate fare
      const fareAmount = parseFloat(formData.fare)
      if (isNaN(fareAmount) || fareAmount < 0) {
        throw new Error("Please enter a valid fare amount")
      }

      // Validate installation requires location
      if (formData.activityType === 'installation' && !formData.location.trim()) {
        throw new Error("Location is required for installation activities")
      }

      // Build payload
      const payload: any = {
        engineerId,
        activityType: formData.activityType,
        fare: fareAmount
      }

      // Add optional fields
      if (formData.location.trim()) payload.location = formData.location.trim()
      if (formData.facility.trim()) payload.facility = formData.facility.trim()
      if (formData.machine.trim()) payload.machine = formData.machine.trim()

      // Add valid other charges
      const validCharges = formData.otherCharges.filter(c => 
        c.description.trim() && c.amount.trim() && !isNaN(parseFloat(c.amount))
      ).map(c => ({
        description: c.description.trim(),
        amount: parseFloat(c.amount)
      }))

      if (validCharges.length > 0) {
        payload.otherCharges = validCharges
      }

      // Submit to API
      const token = localStorage.getItem('accessToken')
      console.log('Submitting pricing claim:', payload)

      const response = await fetch('https://app.codewithseth.co.ke/api/engineering-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        throw new Error(errorData.message || `Failed to submit pricing claim (${response.status})`)
      }

      const result = await response.json()
      console.log('Pricing claim submitted successfully:', result)

      toast({
        title: "Expense Claim Submitted",
        description: "Your pricing claim has been successfully recorded.",
      })

      onSuccess()
    } catch (error: any) {
      console.error('Pricing submission error:', error)
      toast({
        title: "Failed to Submit Claim",
        description: error.message || "Could not submit your expense claim. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateTotal = () => {
    const fareAmount = parseFloat(formData.fare) || 0
    const chargesTotal = formData.otherCharges.reduce((sum, charge) => {
      const amount = parseFloat(charge.amount) || 0
      return sum + amount
    }, 0)
    return fareAmount + chargesTotal
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
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">New Expense Claim</h2>
              </div>
              <p className="text-white/90 text-sm md:text-base ml-14">
                Record your activity expenses and pricing
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={onCancel}
              className="h-12 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm shadow-lg"
            >
              Cancel
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Activity Details */}
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
              <CardDescription className="ml-14 text-base">What type of activity did you perform?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="activityType" className="text-base font-semibold text-gray-700">Activity Type *</Label>
                <Select value={formData.activityType} onValueChange={(v) => updateField("activityType", v)}>
                  <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="Select activity type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="installation">🔧 Installation</SelectItem>
                    <SelectItem value="maintenance">🛠️ Maintenance</SelectItem>
                    <SelectItem value="service">⚙️ Service</SelectItem>
                    <SelectItem value="previsit">👁️ Pre-visit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fare" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[#00aeef]" />
                  Transport Fare (KES) *
                </Label>
                <Input
                  id="fare"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 1500"
                  value={formData.fare}
                  onChange={(e) => updateField("fare", e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef] transition-all text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Location & Facility */}
          <Card
            className="rounded-3xl bg-white border-0 overflow-hidden"
            style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
          >
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 pb-4">
              <CardTitle className="flex items-center gap-3 text-[#00aeef]">
                <div className="bg-emerald-500 rounded-xl p-2">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl">Location & Facility Details</span>
              </CardTitle>
              <CardDescription className="ml-14 text-base">Where did you perform this activity?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="location" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  Location {formData.activityType === 'installation' && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="location"
                  placeholder="e.g. Nairobi CBD, Mombasa"
                  value={formData.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  required={formData.activityType === 'installation'}
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-emerald-500 transition-all text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facility" className="text-base font-semibold text-gray-700">Facility Name</Label>
                <Input
                  id="facility"
                  placeholder="e.g. Kenyatta National Hospital"
                  value={formData.facility}
                  onChange={(e) => updateField("facility", e.target.value)}
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-emerald-500 transition-all text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="machine" className="text-base font-semibold text-gray-700">Machine/Equipment</Label>
                <Input
                  id="machine"
                  placeholder="e.g. X-Ray Model 500"
                  value={formData.machine}
                  onChange={(e) => updateField("machine", e.target.value)}
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-emerald-500 transition-all text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Other Charges */}
          <Card
            className="rounded-3xl bg-white border-0 overflow-hidden"
            style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
          >
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-[#00aeef]">
                    <div className="bg-orange-500 rounded-xl p-2">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xl">Other Charges</span>
                  </CardTitle>
                  <CardDescription className="ml-14 text-base">Additional expenses incurred</CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={addCharge}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Charge
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {formData.otherCharges.map((charge, index) => (
                <div key={index} className={`relative ${index > 0 ? 'pt-6 border-t border-gray-100' : ''}`}>
                  {formData.otherCharges.length > 1 && (
                    <div className="absolute right-0 top-0 md:top-6">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCharge(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg h-8 px-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`charge-description-${index}`} className="text-base font-semibold text-gray-700">
                        Description
                      </Label>
                      <Input
                        id={`charge-description-${index}`}
                        placeholder="e.g. Lunch, Accommodation"
                        value={charge.description}
                        onChange={(e) => updateCharge(index, "description", e.target.value)}
                        className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-500 transition-all text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`charge-amount-${index}`} className="text-base font-semibold text-gray-700">
                        Amount (KES)
                      </Label>
                      <Input
                        id={`charge-amount-${index}`}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 500"
                        value={charge.amount}
                        onChange={(e) => updateCharge(index, "amount", e.target.value)}
                        className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-500 transition-all text-base"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Total Summary */}
          <Card
            className="rounded-3xl bg-white border-0 overflow-hidden"
            style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
          >
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-base">Total Expenses</p>
                  <p className="text-3xl font-bold text-[#00aeef] mt-1">
                    KES {calculateTotal().toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-[#00aeef]/10 to-[#0096d6]/10 rounded-full p-4">
                  <DollarSign className="h-10 w-10 text-[#00aeef]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <Button
              type="submit"
              className="flex-1 h-14 px-8 text-lg font-semibold bg-gradient-to-r from-[#00aeef] to-[#0096d6] text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
              disabled={isSubmitting}
              style={{
                boxShadow: "8px 8px 16px rgba(0, 174, 239, 0.3), -8px -8px 16px rgba(255, 255, 255, 0.8)"
              }}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting Claim...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Submit Expense Claim
                </div>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-14 px-8 text-lg font-semibold rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-300"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
