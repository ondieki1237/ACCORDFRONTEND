"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building, Wrench, ClipboardList, Users, Calendar, Phone } from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Preferences } from "@capacitor/preferences"

interface CreateEngineeringServiceFormProps {
  onSuccess: () => void
  onCancel: () => void
}

interface EngineeringServiceFormData {
  date: string
  startTime: string
  facilityName: string
  facilityLocation: string
  serviceType: string
  machineDetails: string
  conditionBefore: string
  conditionAfter: string
  otherPersonnel: string
  nextServiceDate: string
  engineerName: string
  engineerPhone: string
}

const LOCAL_KEY = "pendingEngineeringServices"

// Helper functions for Capacitor Preferences storage
async function getPendingServices(): Promise<any[]> {
  const { value } = await Preferences.get({ key: LOCAL_KEY })
  return value ? JSON.parse(value) : []
}

async function setPendingServices(services: any[]) {
  await Preferences.set({ key: LOCAL_KEY, value: JSON.stringify(services) })
}

export default function CreateEngineeringServiceForm({ onSuccess, onCancel }: CreateEngineeringServiceFormProps) {
  const [formData, setFormData] = useState<EngineeringServiceFormData>({
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    facilityName: "",
    facilityLocation: "",
    serviceType: "installation",
    machineDetails: "",
    conditionBefore: "",
    conditionAfter: "",
    otherPersonnel: "",
    nextServiceDate: "",
    engineerName: "",
    engineerPhone: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const [pendingServices, setPendingServicesState] = useState<any[]>([])

  // Load pending services from Preferences on mount
  useEffect(() => {
    getPendingServices().then(setPendingServicesState)
  }, [])

  // Try to sync pending services on mount and when online
  useEffect(() => {
    const syncPending = async () => {
      const servicesToSync = await getPendingServices()
      if (navigator.onLine && servicesToSync.length > 0) {
        const failed: any[] = []
        for (const service of servicesToSync) {
          try {
            await apiService.createEngineeringService(service)
          } catch (err) {
            failed.push(service)
          }
        }
        setPendingServicesState(failed)
        await setPendingServices(failed)
        if (servicesToSync.length > 0) {
          toast({
            title: failed.length === 0 ? "Offline services synced" : "Some services failed to sync",
            description: failed.length === 0 ? "All offline services have been uploaded." : "Some offline services could not be uploaded.",
            variant: failed.length === 0 ? "default" : "destructive",
          })
        }
      }
    }
    window.addEventListener("online", syncPending)
    syncPending()
    return () => window.removeEventListener("online", syncPending)
  }, [toast])

  const updateField = (field: keyof EngineeringServiceFormData, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validation for required fields
    if (!formData.nextServiceDate) {
      toast({
        title: "Validation Error",
        description: "Next service date is required.",
        variant: "destructive",
      })
      setIsSubmitting(false)
      return
    }

    try {
      const dateTime = new Date(`${formData.date}T${formData.startTime}:00Z`).toISOString()
      const serviceData = {
        date: dateTime,
        facility: {
          name: formData.facilityName,
          location: formData.facilityLocation,
        },
        serviceType: formData.serviceType,
        machineDetails: formData.machineDetails,
        conditionBefore: formData.conditionBefore,
        conditionAfter: formData.conditionAfter,
        otherPersonnel: formData.otherPersonnel,
        nextServiceDate: formData.nextServiceDate,
        engineerInCharge: {
          name: formData.engineerName,
          phone: formData.engineerPhone,
        },
      }

      if (navigator.onLine) {
        await apiService.createEngineeringService(serviceData)
        toast({
          title: "Service recorded",
          description: "Your engineering service has been successfully recorded.",
        })
        onSuccess()
      } else {
        const updatedPending = [...pendingServices, serviceData]
        setPendingServicesState(updatedPending)
        await setPendingServices(updatedPending)
        toast({
          title: "Offline mode",
          description: "Service saved locally and will upload when online.",
        })
        onSuccess()
      }
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not record the service. Please try again.",
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
          <h2 className="text-2xl font-bold text-[#00aeef]">Record Engineering Service</h2>
          <p className="text-gray-500">Create a new engineering service record:</p>
        </div>
        <Button variant="outline" onClick={onCancel} className="h-10 px-6 rounded-xl shadow">
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Facility Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Facility Details
            </CardTitle>
            <CardDescription>Details about the facility where the service was performed</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="facilityName">Facility Name</Label>
              <Input
                id="facilityName"
                placeholder="e.g. Acme Hospital"
                value={formData.facilityName}
                onChange={(e) => updateField("facilityName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facilityLocation">Facility Location</Label>
              <Input
                id="facilityLocation"
                placeholder="e.g. Nairobi"
                value={formData.facilityLocation}
                onChange={(e) => updateField("facilityLocation", e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Service Details
            </CardTitle>
            <CardDescription>Type of service and machine information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label htmlFor="serviceType">Service Type</Label>
              <Select value={formData.serviceType} onValueChange={(v) => updateField("serviceType", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="machineDetails">Machine Details</Label>
              <Input
                id="machineDetails"
                placeholder="e.g. Model XYZ-123, Serial No. ABC456"
                value={formData.machineDetails}
                onChange={(e) => updateField("machineDetails", e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Machine Condition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Machine Condition
            </CardTitle>
            <CardDescription>Condition of the machine before and after the service</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="conditionBefore">Condition Before Service</Label>
              <Textarea
                id="conditionBefore"
                placeholder="Describe the machine's condition prior to service..."
                value={formData.conditionBefore}
                onChange={(e) => updateField("conditionBefore", e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="conditionAfter">Condition After Service</Label>
              <Textarea
                id="conditionAfter"
                placeholder="Describe the machine's condition after service..."
                value={formData.conditionAfter}
                onChange={(e) => updateField("conditionAfter", e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Personnel Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Personnel Details
            </CardTitle>
            <CardDescription>Engineer in charge and other available personnel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="engineerName">Engineer in Charge - Name</Label>
                <Input
                  id="engineerName"
                  placeholder="e.g. John Doe"
                  value={formData.engineerName}
                  onChange={(e) => updateField("engineerName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="engineerPhone">Engineer in Charge - Phone</Label>
                <Input
                  id="engineerPhone"
                  placeholder="e.g. +254712345678"
                  value={formData.engineerPhone}
                  onChange={(e) => updateField("engineerPhone", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otherPersonnel">Other Personnel Available</Label>
              <Textarea
                id="otherPersonnel"
                placeholder="List names of other personnel present (optional)..."
                value={formData.otherPersonnel}
                onChange={(e) => updateField("otherPersonnel", e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Next Service */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Next Service
            </CardTitle>
            <CardDescription>Scheduled date for the next service (Required)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nextServiceDate">Next Service Date</Label>
              <Input
                id="nextServiceDate"
                type="date"
                value={formData.nextServiceDate}
                onChange={(e) => updateField("nextServiceDate", e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" className="flex-1 h-10 px-6 bg-[#00aeef] text-white rounded-xl shadow hover:shadow-md transition" disabled={isSubmitting}>
            {isSubmitting ? "Recording..." : "Record Service"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="h-10 px-6 rounded-xl shadow">
            Cancel
          </Button>
        </div>
      </form>
      {/* Show pending services badge/message */}
      {pendingServices.length > 0 && (
        <div className="text-xs text-yellow-600 mt-2">
          {pendingServices.length} service(s) pending upload. They will sync automatically when you are online.
        </div>
      )}
    </div>
  )
}