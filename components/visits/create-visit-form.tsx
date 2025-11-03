"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building, Users, Clock, MapPin, CheckCircle2, Calendar, FileText } from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Preferences } from "@capacitor/preferences"

interface CreateVisitFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface VisitFormData {
  date: string
  startTime: string
  clientName: string
  clientType: string
  hospitalLevel: string
  location: string
  visitPurpose: string
  visitOutcome: string
  contactName: string
  contactRole: string
  contactPhone: string
  contactEmail: string
  isFollowUpRequired: boolean
  notes: string
}

const LOCAL_KEY = "pendingVisits"

// Helper functions for Capacitor Preferences storage
async function getPendingVisits(): Promise<any[]> {
  const { value } = await Preferences.get({ key: LOCAL_KEY })
  return value ? JSON.parse(value) : []
}

async function setPendingVisits(visits: any[]) {
  await Preferences.set({ key: LOCAL_KEY, value: JSON.stringify(visits) })
}

export function CreateVisitForm({ onSuccess, onCancel }: CreateVisitFormProps) {
  const [formData, setFormData] = useState<VisitFormData>({
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    clientName: "",
    clientType: "hospital",
    hospitalLevel: "5",
    location: "",
    visitPurpose: "demo",
    visitOutcome: "successful",
    contactName: "",
    contactRole: "doctor",
    contactPhone: "",
    contactEmail: "",
    isFollowUpRequired: false,
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const [pendingVisits, setPendingVisitsState] = useState<any[]>([])

  // Load pending visits from Preferences on mount
  useEffect(() => {
    getPendingVisits().then(setPendingVisitsState)
  }, [])

  // Try to sync pending visits on mount and when online
  useEffect(() => {
    const syncPending = async () => {
      const visitsToSync = await getPendingVisits()
      if (navigator.onLine && visitsToSync.length > 0) {
        const failed: any[] = []
        for (const visit of visitsToSync) {
          try {
            await apiService.createVisit(visit)
          } catch (err) {
            failed.push(visit)
          }
        }
        setPendingVisitsState(failed)
        await setPendingVisits(failed)
        if (visitsToSync.length > 0) {
          toast({
            title: failed.length === 0 ? "Offline visits synced" : "Some visits failed to sync",
            description: failed.length === 0 ? "All offline visits have been uploaded." : "Some offline visits could not be uploaded.",
            variant: failed.length === 0 ? "default" : "destructive",
          })
        }
      }
    }
    window.addEventListener("online", syncPending)
    syncPending()
    return () => window.removeEventListener("online", syncPending)
  }, [toast])

  const updateField = (field: keyof VisitFormData, value: string | boolean) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const dateTime = new Date(`${formData.date}T${formData.startTime}:00Z`).toISOString()
      
      const visitData: any = {
        date: dateTime,
        startTime: dateTime,
        client: {
          name: formData.clientName,
          type: formData.clientType,
          level: formData.hospitalLevel,
          location: formData.location,
        },
        visitPurpose: formData.visitPurpose,
        visitOutcome: formData.visitOutcome,
        notes: formData.notes,
      }

      // Only add contacts if contact name is provided
      if (formData.contactName && formData.contactName.trim() !== '') {
        visitData.contacts = [{
          name: formData.contactName,
          role: formData.contactRole,
          phone: formData.contactPhone,
          email: formData.contactEmail,
        }];
      }

      // Use production API
      const token = localStorage.getItem('accessToken');
      console.log('Sending visit data:', JSON.stringify(visitData, null, 2));
      console.log('Using token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      
      const response = await fetch('https://app.codewithseth.co.ke/api/visits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(visitData),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Backend error response:', errorData);
        throw new Error(errorData.message || `Failed to create visit (${response.status})`);
      }

      const result = await response.json();
      
      // Successfully saved online
      toast({
        title: "Visit Created",
        description: "Your client visit has been successfully saved to the database.",
      })
      onSuccess()
    } catch (error: any) {
      console.error('Visit creation error:', error)
      toast({
        title: "Failed to Create Visit",
        description: error.message || "Could not save your visit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f4f9] via-[#e8ecf4] to-[#dfe5f0] p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
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
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">New Client Visit</h2>
              </div>
              <p className="text-white/90 text-sm md:text-base ml-14">
                Schedule and record visit details for your client
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
          {/* Visit Details */}
          <Card 
            className="rounded-3xl bg-white border-0 overflow-hidden"
            style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
          >
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 pb-4">
              <CardTitle className="flex items-center gap-3 text-[#00aeef]">
                <div className="bg-[#00aeef] rounded-xl p-2">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl">Visit Schedule</span>
              </CardTitle>
              <CardDescription className="ml-14 text-base">When will this visit take place?</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 pt-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#00aeef]" />
                  Visit Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef] transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#00aeef]" />
                  Start Time *
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => updateField("startTime", e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef] transition-all"
                />
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card 
            className="rounded-3xl bg-white border-0 overflow-hidden"
            style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
          >
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 pb-4">
              <CardTitle className="flex items-center gap-3 text-[#00aeef]">
                <div className="bg-emerald-500 rounded-xl p-2">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl">Client Details</span>
              </CardTitle>
              <CardDescription className="ml-14 text-base">Information about the facility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <Building className="h-4 w-4 text-emerald-500" />
                  Facility Name *
                </Label>
                <Input
                  id="clientName"
                  placeholder="e.g. Nairobi General Hospital"
                  value={formData.clientName}
                  onChange={(e) => updateField("clientName", e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-emerald-500 transition-all text-base"
                />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientType" className="text-base font-semibold text-gray-700">Client Type *</Label>
                  <Select value={formData.clientType} onValueChange={(v) => updateField("clientType", v)}>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200">
                      <SelectValue placeholder="Select client type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hospital">🏥 Hospital</SelectItem>
                      <SelectItem value="clinic">🏥 Clinic</SelectItem>
                      <SelectItem value="other">📋 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospitalLevel" className="text-base font-semibold text-gray-700">Hospital Level *</Label>
                  <Select value={formData.hospitalLevel} onValueChange={(v) => updateField("hospitalLevel", v)}>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200">
                      <SelectValue placeholder="Select hospital level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">Level 6 - National Referral Hospitals</SelectItem>
                      <SelectItem value="5">Level 5 - County Referral Hospitals</SelectItem>
                      <SelectItem value="4">Level 4 - Primary Hospitals</SelectItem>
                      <SelectItem value="3">Level 3 - Health Centres</SelectItem>
                      <SelectItem value="2">Level 2 - Dispensaries</SelectItem>
                      <SelectItem value="1">Level 1 - Community Health Facilities</SelectItem>
                      <SelectItem value="not_applicable">Not Applicable (Clinic/Pharmacy/Lab)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  Location *
                </Label>
                <Input
                  id="location"
                  placeholder="e.g. Nairobi, Kenya"
                  value={formData.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-emerald-500 transition-all text-base"
                />
              </div>
            </CardContent>
          </Card>

            {/* Visit Purpose and Outcome */}
          <Card 
            className="rounded-3xl bg-white border-0 overflow-hidden"
            style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
          >
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-4">
              <CardTitle className="flex items-center gap-3 text-[#00aeef]">
                <div className="bg-purple-500 rounded-xl p-2">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl">Visit Purpose & Outcome</span>
              </CardTitle>
              <CardDescription className="ml-14 text-base">What is the goal of this visit?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="visitPurpose" className="text-base font-semibold text-gray-700">Visit Purpose *</Label>
                  <Select value={formData.visitPurpose} onValueChange={(v) => updateField("visitPurpose", v)}>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200">
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo">🎯 Demo</SelectItem>
                      <SelectItem value="followup">📞 Follow Up</SelectItem>
                      <SelectItem value="installation">🔧 Installation</SelectItem>
                      <SelectItem value="maintenance">�️ Maintenance</SelectItem>
                      <SelectItem value="consultation">💬 Consultation</SelectItem>
                      <SelectItem value="sales">� Sales</SelectItem>
                      <SelectItem value="other">📋 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visitOutcome" className="text-base font-semibold text-gray-700">Visit Outcome *</Label>
                  <Select value={formData.visitOutcome} onValueChange={(v) => updateField("visitOutcome", v)}>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200">
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="successful">✅ Successful</SelectItem>
                      <SelectItem value="pending">⏳ Pending</SelectItem>
                      <SelectItem value="followup_required">� Follow-up Required</SelectItem>
                      <SelectItem value="no_interest">🚫 No Interest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="isFollowUpRequired" className="text-base font-semibold text-gray-700">Follow-Up Required? *</Label>
                <Select
                  value={formData.isFollowUpRequired.toString()}
                  onValueChange={(v) => updateField("isFollowUpRequired", v === "true")}
                >
                  <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="Select follow-up requirement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">❌ No</SelectItem>
                    <SelectItem value="true">✅ Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Contact Person */}
          <Card 
            className="rounded-3xl bg-white border-0 overflow-hidden"
            style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
          >
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 pb-4">
              <CardTitle className="flex items-center gap-3 text-[#00aeef]">
                <div className="bg-orange-500 rounded-xl p-2">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl">Contact Person</span>
              </CardTitle>
              <CardDescription className="ml-14 text-base">Primary contact at the facility (Compulsory)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="contactName" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <Users className="h-4 w-4 text-orange-500" />
                  Contact Name *
                </Label>
                <Input
                  id="contactName"
                  placeholder="e.g. Dr. Jane Doe"
                  value={formData.contactName}
                  onChange={(e) => updateField("contactName", e.target.value)}
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-500 transition-all text-base"
                />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contactRole" className="text-base font-semibold text-gray-700">Contact Role *</Label>
                  <Select value={formData.contactRole} onValueChange={(v) => updateField("contactRole", v)}>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">👨‍⚕️ Doctor</SelectItem>
                      <SelectItem value="nurse">👩‍⚕️ Nurse</SelectItem>
                      <SelectItem value="admin">� Administrator</SelectItem>
                      <SelectItem value="procurement">� Procurement</SelectItem>
                      <SelectItem value="it_manager">� IT Manager</SelectItem>
                      <SelectItem value="ceo">� CEO</SelectItem>
                      <SelectItem value="other">📋 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-base font-semibold text-gray-700">Phone Number</Label>
                  <Input
                    id="contactPhone"
                    placeholder="+254712345678"
                    value={formData.contactPhone}
                    onChange={(e) => updateField("contactPhone", e.target.value)}
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-500 transition-all text-base"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="text-base font-semibold text-gray-700">Email Address</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="jane.doe@example.com"
                  value={formData.contactEmail}
                  onChange={(e) => updateField("contactEmail", e.target.value)}
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-500 transition-all text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card 
            className="rounded-3xl bg-white border-0 overflow-hidden"
            style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
          >
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
              <CardTitle className="flex items-center gap-3 text-[#00aeef]">
                <div className="bg-blue-500 rounded-xl p-2">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl">Additional Information</span>
              </CardTitle>
              <CardDescription className="ml-14 text-base">Any other relevant details about this visit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Notes & Observations
                </Label>
                <textarea
                  id="notes"
                  placeholder="Enter any additional information, observations, or important details from the visit..."
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-base resize-none"
                />
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
                  Recording Visit...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Record Visit
                </div>
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel} 
              className="h-14 px-8 text-lg font-semibold rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Cancel
            </Button>
          </div>
        </form>
        
        {/* Show pending visits badge/message */}
        {pendingVisits.length > 0 && (
          <div 
            className="bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400 rounded-2xl p-4 flex items-center gap-3 shadow-lg"
          >
            <div className="bg-yellow-400 rounded-full p-2">
              <Clock className="h-5 w-5 text-yellow-900" />
            </div>
            <div>
              <p className="font-semibold text-yellow-900">
                {pendingVisits.length} visit{pendingVisits.length > 1 ? 's' : ''} pending upload
              </p>
              <p className="text-sm text-yellow-800">
                Will sync automatically when you're back online
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}