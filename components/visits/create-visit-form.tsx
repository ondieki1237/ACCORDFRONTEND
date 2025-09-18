"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building, Users, Clock } from "lucide-react"
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
  location: string
  visitPurpose: string
  visitOutcome: string
  contactName: string
  contactRole: string
  contactPhone: string
  contactEmail: string
  isFollowUpRequired: boolean
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
    location: "",
    visitPurpose: "demo",
    visitOutcome: "successful",
    contactName: "",
    contactRole: "other",
    contactPhone: "",
    contactEmail: "",
    isFollowUpRequired: false,
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
      const visitData = {
        date: dateTime,
        startTime: dateTime,
        client: {
          name: formData.clientName,
          type: formData.clientType,
          location: formData.location,
        },
        visitPurpose: formData.visitPurpose,
        visitOutcome: formData.visitOutcome,
        contacts: formData.contactName
          ? [{
              name: formData.contactName,
              role: formData.contactRole,
              phone: formData.contactPhone,
              email: formData.contactEmail,
            }]
          : [],
        isFollowUpRequired: formData.isFollowUpRequired,
      }

      if (navigator.onLine) {
        await apiService.createVisit(visitData)
        toast({
          title: "Visit scheduled",
          description: "Your client visit has been successfully recorded.",
        })
        onSuccess()
      } else {
        const updatedPending = [...pendingVisits, visitData]
        setPendingVisitsState(updatedPending)
        await setPendingVisits(updatedPending)
        toast({
          title: "Offline mode",
          description: "Visit saved locally and will upload when online.",
        })
        onSuccess()
      }
    } catch (error) {
      toast({
        title: "Scheduling failed",
        description: "Could not schedule your visit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto bg-[#f1f4f9] p-6 rounded-2xl shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#00aeef]">Record Client Visit</h2>
          <p className="text-gray-500">Create a new client visit:</p>
        </div>
        <Button variant="outline" onClick={onCancel} className="h-10 px-6 rounded-xl shadow">
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Visit Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Visit Details
            </CardTitle>
            <CardDescription>Specify the date and time of the visit</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => updateField("date", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => updateField("startTime", e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Client Information
            </CardTitle>
            <CardDescription>Details about the client</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Facility Name</Label>
              <Input
                id="clientName"
                placeholder="e.g. Acme Hospital"
                value={formData.clientName}
                onChange={(e) => updateField("clientName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientType">Client Type</Label>
              <Select value={formData.clientType} onValueChange={(v) => updateField("clientType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="clinic">Clinic</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. Nairobi"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Visit Purpose and Outcome */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Visit Purpose & Outcome
            </CardTitle>
            <CardDescription>Purpose and expected outcome of the visit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="visitPurpose">Visit Purpose</Label>
              <Select value={formData.visitPurpose} onValueChange={(v) => updateField("visitPurpose", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine_visit">Routine Visit</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="demo">Demo</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitOutcome">Visit Outcome</Label>
              <Select value={formData.visitOutcome} onValueChange={(v) => updateField("visitOutcome", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="successful">Successful</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="no_access">No Access</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="isFollowUpRequired">Follow-Up Required</Label>
              <Select
                value={formData.isFollowUpRequired.toString()}
                onValueChange={(v) => updateField("isFollowUpRequired", v === "true")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select follow-up requirement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">No</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Contact Person */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contact Person
            </CardTitle>
            <CardDescription>Primary contact for this visit (Compulsory)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                placeholder="e.g. Dr. Jane Doe"
                value={formData.contactName}
                onChange={(e) => updateField("contactName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactRole">Contact Role</Label>
              <Select value={formData.contactRole} onValueChange={(v) => updateField("contactRole", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="nurse">Nurse</SelectItem>
                  <SelectItem value="lab_technician">Lab Technician</SelectItem>
                  <SelectItem value="pharmacist">Pharmacist</SelectItem>
                  <SelectItem value="administrator">Administrator</SelectItem>
                  <SelectItem value="procurement">Procurement</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                placeholder="e.g. +254712345678"
                value={formData.contactPhone}
                onChange={(e) => updateField("contactPhone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="e.g. jane.doe@example.com"
                value={formData.contactEmail}
                onChange={(e) => updateField("contactEmail", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      

        <div className="flex gap-4">
          <Button type="submit" className="flex-1 h-10 px-6 bg-[#00aeef] text-white rounded-xl shadow hover:shadow-md transition" disabled={isSubmitting}>
            {isSubmitting ? "Recording..." : "Record Visit"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="h-10 px-6 rounded-xl shadow">
            Cancel
          </Button>
        </div>
      </form>
      {/* Show pending visits badge/message */}
      {pendingVisits.length > 0 && (
        <div className="text-xs text-yellow-600 mt-2">
          {pendingVisits.length} visit(s) pending upload. They will sync automatically when you are online.
        </div>
      )}
    </div>
  )
}