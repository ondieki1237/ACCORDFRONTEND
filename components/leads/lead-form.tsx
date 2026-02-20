"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Save,
  Building2,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  Clock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface LeadFormProps {
  onBack: () => void
  onSuccess?: () => void
  initialData?: any
}

export function LeadForm({ onBack, onSuccess, initialData }: LeadFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    // Facility Information
    facilityName: initialData?.facilityName || "",
    facilityType: initialData?.facilityType || "",
    location: initialData?.location || "",

    // Contact Person
    contactPersonName: initialData?.contactPersonName || "",
    contactPersonRole: initialData?.contactPersonRole || "",
    contactPhone: initialData?.contactPhone || "",

    // Facility Details
    hospitalLevel: initialData?.hospitalLevel || "",

    // Equipment of Interest
    equipmentOfInterest: initialData?.equipmentOfInterest || "",

    // Budget & Timeline
    budget: initialData?.budget || "",
    expectedPurchaseDate: initialData?.expectedPurchaseDate || "",

    // Competitor Analysis
    competitorAnalysis: initialData?.competitorAnalysis || "",

    // Additional Information
    leadSource: initialData?.leadSource || "field-visit",
    leadStatus: initialData?.leadStatus || "new",
  })

  const { toast } = useToast()

  const updateField = (field: keyof typeof formData, value: string | number) => {
    setFormData({ ...formData, [field]: value })
  }

  const validateForm = (): boolean => {
    if (!formData.facilityName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter facility name",
        variant: "destructive",
      })
      return false
    }

    if (!formData.contactPersonName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter contact person name",
        variant: "destructive",
      })
      return false
    }

    if (!formData.contactPhone.trim()) {
      toast({
        title: "Missing Contact",
        description: "Please provide a phone number",
        variant: "destructive",
      })
      return false
    }

    if (!formData.equipmentOfInterest.trim()) {
      toast({
        title: "Missing Information",
        description: "Please specify equipment of interest",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setIsSubmitting(true)

      // Import API service dynamically
      const { apiService } = await import("@/lib/api")

      const leadData = {
        facilityName: formData.facilityName.trim(),
        facilityType: formData.facilityType.trim(),
        location: formData.location.trim(),
        contactPerson: {
          name: formData.contactPersonName.trim(),
          role: formData.contactPersonRole.trim(),
          phone: formData.contactPhone.trim(),
        },
        facilityDetails: {
          hospitalLevel: formData.hospitalLevel.trim(),
        },
        equipmentOfInterest: {
          name: formData.equipmentOfInterest.trim(),
        },
        budget: `KSH ${formData.budget.trim()}`,
        timeline: {
          expectedPurchaseDate: formData.expectedPurchaseDate,
        },
        competitorAnalysis: formData.competitorAnalysis.trim(),
        leadSource: formData.leadSource,
        leadStatus: formData.leadStatus,
        createdAt: new Date().toISOString(),
      }

      await apiService.createLead(leadData)

      const isOnline = navigator.onLine

      toast({
        title: isOnline ? "Lead Created!" : "Lead Saved Offline",
        description: isOnline
          ? "Lead has been successfully created and saved."
          : "Lead saved locally. It will be synced automatically when you're back online.",
      })

      if (onSuccess) {
        onSuccess()
      } else {
        onBack()
      }
    } catch (error: any) {
      console.error("Failed to create lead:", error)
      toast({
        title: "Submission Failed",
        description: error.message || "Could not save lead. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="rounded-xl hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Badge variant="outline" className="rounded-lg">
          {navigator.onLine ? "📡 Online" : "📴 Offline"}
        </Badge>
      </div>

      {/* Main Card */}
      <Card
        className="rounded-3xl bg-white border-0 overflow-hidden"
        style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
      >
        <CardHeader className="bg-gradient-to-r from-[#00aeef] to-[#0096d6] pb-4">
          <CardTitle className="flex items-center gap-3 text-white">
            <div className="bg-white/20 rounded-xl p-2">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl">New Lead</span>
              <p className="text-white/80 text-sm font-normal mt-1">
                Capture lead information for potential sales
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Facility Information */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#00aeef]" />
                Facility Information
              </h3>

              <div className="space-y-2">
                <Label htmlFor="facilityName" className="text-base font-semibold text-gray-700">
                  Facility Name *
                </Label>
                <Input
                  id="facilityName"
                  placeholder="e.g. Nairobi General Hospital"
                  value={formData.facilityName}
                  onChange={(e) => updateField("facilityName", e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facilityType" className="text-base font-semibold text-gray-700">
                    Facility Type
                  </Label>
                  <Select
                    value={formData.facilityType}
                    onValueChange={(value) => updateField("facilityType", value)}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="clinic">Clinic</SelectItem>
                      <SelectItem value="diagnostic-center">Diagnostic Center</SelectItem>
                      <SelectItem value="laboratory">Laboratory</SelectItem>
                      <SelectItem value="pharmacy">Pharmacy</SelectItem>
                      <SelectItem value="medical-center">Medical Center</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hospitalLevel" className="text-base font-semibold text-gray-700">
                    Hospital Level
                  </Label>
                  <Select
                    value={formData.hospitalLevel}
                    onValueChange={(value) => updateField("hospitalLevel", value)}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="level-1">Level 1</SelectItem>
                      <SelectItem value="level-2">Level 2</SelectItem>
                      <SelectItem value="level-3">Level 3</SelectItem>
                      <SelectItem value="level-4">Level 4</SelectItem>
                      <SelectItem value="level-5">Level 5</SelectItem>
                      <SelectItem value="level-6">Level 6</SelectItem>
                      <SelectItem value="private">Private Hospital</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-base font-semibold text-gray-700 flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-[#00aeef]" />
                  Location *
                </Label>
                <Input
                  id="location"
                  placeholder="e.g. Nairobi, Kenya"
                  value={formData.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
                />
              </div>
            </div>

            {/* Contact Person */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <User className="h-5 w-5 text-[#00aeef]" />
                Contact Person
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPersonName" className="text-base font-semibold text-gray-700">
                    Full Name *
                  </Label>
                  <Input
                    id="contactPersonName"
                    placeholder="e.g. Dr. Jane Smith"
                    value={formData.contactPersonName}
                    onChange={(e) => updateField("contactPersonName", e.target.value)}
                    required
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPersonRole" className="text-base font-semibold text-gray-700">
                    Role / Position
                  </Label>
                  <Input
                    id="contactPersonRole"
                    placeholder="e.g. Chief Medical Officer"
                    value={formData.contactPersonRole}
                    onChange={(e) => updateField("contactPersonRole", e.target.value)}
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="text-base font-semibold text-gray-700 flex items-center gap-1">
                  <Phone className="h-4 w-4 text-[#00aeef]" />
                  Phone Number *
                </Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="+254712345678"
                  value={formData.contactPhone}
                  onChange={(e) => updateField("contactPhone", e.target.value)}
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
                />
              </div>
            </div>

            {/* Equipment of Interest */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Package className="h-5 w-5 text-[#00aeef]" />
                Equipment of Interest
              </h3>

              <div className="space-y-2">
                <Label htmlFor="equipmentOfInterest" className="text-base font-semibold text-gray-700">
                  Equipment Name / Description *
                </Label>
                <Input
                  id="equipmentOfInterest"
                  placeholder="e.g. GE Vivid E95 Ultrasound System"
                  value={formData.equipmentOfInterest}
                  onChange={(e) => updateField("equipmentOfInterest", e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
                />
              </div>
            </div>

            {/* Budget & Timeline */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-[#00aeef]" />
                Budget & Timeline
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget" className="text-base font-semibold text-gray-700">
                      Estimated Budget (KSH)
                    </Label>
                    <Input
                      id="budget"
                      type="text"
                      placeholder="e.g. 5,000,000"
                      value={formData.budget}
                      onChange={(e) => updateField("budget", e.target.value)}
                      className="flex-1 h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
                    />
                  </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedPurchaseDate" className="text-base font-semibold text-gray-700 flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-[#00aeef]" />
                    Expected Purchase Date
                  </Label>
                  <Input
                    id="expectedPurchaseDate"
                    type="date"
                    value={formData.expectedPurchaseDate}
                    onChange={(e) => updateField("expectedPurchaseDate", e.target.value)}
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
                  />
                </div>
              </div>
            </div>

            {/* Competitor Analysis */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#00aeef]" />
                Competitor Analysis
              </h3>

              <div className="space-y-2">
                <Label htmlFor="competitorAnalysis" className="text-base font-semibold text-gray-700">
                  Competitor Information & Analysis (Optional)
                </Label>
                <Textarea
                  id="competitorAnalysis"
                  placeholder="Detail all competitor information here:
• Which competitors are they considering?
• What are competitor strengths and weaknesses?
• Why should they choose us instead?
• Any competitor pricing or offers they mentioned?
• Our competitive advantages..."
                  value={formData.competitorAnalysis}
                  onChange={(e) => updateField("competitorAnalysis", e.target.value)}
                  rows={8}
                  className="rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include all competitor details, their offerings, pricing, and how we compare
                </p>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800">Additional Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="leadSource" className="text-base font-semibold text-gray-700">
                    Lead Source
                  </Label>
                  <Select
                    value={formData.leadSource}
                    onValueChange={(value) => updateField("leadSource", value)}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="field-visit">Field Visit</SelectItem>
                      <SelectItem value="phone-call">Phone Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="event">Event/Conference</SelectItem>
                      <SelectItem value="website">Website Inquiry</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leadStatus" className="text-base font-semibold text-gray-700">
                    Lead Status
                  </Label>
                  <Select
                    value={formData.leadStatus}
                    onValueChange={(value) => updateField("leadStatus", value)}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal-sent">Proposal Sent</SelectItem>
                      <SelectItem value="negotiation">In Negotiation</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Offline Notice */}
            {!navigator.onLine && (
              <Card className="rounded-xl bg-yellow-50 border-2 border-yellow-200">
                <CardContent className="p-4 flex items-start gap-3">
                  <Clock className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900 text-sm">Offline Mode</p>
                    <p className="text-yellow-800 text-xs">
                      Your lead will be saved locally and automatically synced when you reconnect to the internet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-14 text-lg font-semibold rounded-2xl bg-gradient-to-r from-[#00aeef] to-[#0096d6] text-white shadow-xl hover:shadow-2xl transition-all duration-300"
                style={{
                  boxShadow: "8px 8px 16px rgba(0, 174, 239, 0.3), -8px -8px 16px rgba(255, 255, 255, 0.8)",
                }}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-5 w-5" />
                    {navigator.onLine ? "Save Lead" : "Save Offline"}
                  </div>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="h-14 px-8 text-lg font-semibold rounded-2xl border-2"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
