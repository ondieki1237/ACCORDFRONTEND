"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building, Users, Clock, FileText, MapPin } from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CreateVisitFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface VisitFormData {
  date: string
  startTime: string
  endTime: string
  clientName: string
  clientType: string
  latitude: string
  longitude: string
  visitPurpose: string
  contactName: string
  contactEmail: string
  contactPhone: string
  notes: string
  equipment: string
}

export function CreateVisitForm({ onSuccess, onCancel }: CreateVisitFormProps) {
  const [formData, setFormData] = useState<VisitFormData>({
    date: new Date().toISOString().split("T")[0],
    startTime: "",
    endTime: "",
    clientName: "",
    clientType: "hospital",
    latitude: "",
    longitude: "",
    visitPurpose: "routine_visit",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    notes: "",
    equipment: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const updateField = (field: keyof VisitFormData, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const startDateTime = new Date(`${formData.date}T${formData.startTime}:00Z`).toISOString()
      const endDateTime = new Date(`${formData.date}T${formData.endTime}:00Z`).toISOString()

      const visitData = {
        visitId: `VISIT-${Date.now()}`, // Simple unique ID
        date: formData.date,
        startTime: startDateTime,
        endTime: endDateTime,
        client: {
          name: formData.clientName,
          type: formData.clientType,
          location: {
            coordinates: [
              parseFloat(formData.longitude) || 0,
              parseFloat(formData.latitude) || 0
            ]
          }
        },
        visitPurpose: formData.visitPurpose,
        contacts: formData.contactName
          ? [{
              name: formData.contactName,
              email: formData.contactEmail,
              phone: formData.contactPhone
            }]
          : [],
        requestedEquipment: formData.equipment ? [formData.equipment] : [],
        notes: formData.notes || ""
      }

      await apiService.createVisit(visitData)

      toast({
        title: "Visit scheduled",
        description: "Your client visit has been successfully scheduled.",
      })

      onSuccess()
    } catch (error) {
      console.error("Failed to create visit:", error)
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Schedule New Visit</h2>
          <p className="text-muted-foreground">Create a new client visit appointment</p>
        </div>
        <Button variant="outline" onClick={onCancel}>
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
            <CardDescription>When will the visit take place?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
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
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => updateField("endTime", e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Client Information
            </CardTitle>
            <CardDescription>Who are you visiting?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client/Company Name</Label>
              <Input
                id="clientName"
                placeholder="Client A"
                value={formData.clientName}
                onChange={(e) => updateField("clientName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Client Type</Label>
              <Select value={formData.clientType} onValueChange={(v) => updateField("clientType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="clinic">Clinic</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="text"
                  placeholder="-1.2921"
                  value={formData.latitude}
                  onChange={(e) => updateField("latitude", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="text"
                  placeholder="36.8219"
                  value={formData.longitude}
                  onChange={(e) => updateField("longitude", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visit Purpose */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Visit Purpose
            </CardTitle>
            <CardDescription>Why is this visit happening?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Select value={formData.visitPurpose} onValueChange={(v) => updateField("visitPurpose", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="routine_visit">Routine Visit</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Contact Person */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contact Person
            </CardTitle>
            <CardDescription>Primary contact for this visit (optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                placeholder="John Smith"
                value={formData.contactName}
                onChange={(e) => updateField("contactName", e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="john@client.com"
                  value={formData.contactEmail}
                  onChange={(e) => updateField("contactEmail", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Phone</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.contactPhone}
                  onChange={(e) => updateField("contactPhone", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes & Equipment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Additional Information
            </CardTitle>
            <CardDescription>Notes and equipment requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="equipment">Requested Equipment</Label>
              <Input
                id="equipment"
                placeholder="Laptop, projector, samples..."
                value={formData.equipment}
                onChange={(e) => updateField("equipment", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Visit Notes</Label>
              <Textarea
                id="notes"
                placeholder="Initial visit"
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "Scheduling Visit..." : "Schedule Visit"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}