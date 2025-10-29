"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Calendar, MapPin, Wrench, User, FileText, CheckCircle2, Clock } from "lucide-react"
import { authService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"

interface EngineeringService {
  _id: string
  date: string
  facility: {
    name: string
    location: string
  }
  serviceType: string
  engineerInCharge: {
    _id: string
    name: string
    phone: string
  }
  machineDetails: string
  conditionBefore: string
  conditionAfter: string
  status: "pending" | "assigned" | "in-progress" | "completed" | "cancelled"
  notes: string
  scheduledDate: string
  nextServiceDate?: string
  otherPersonnel?: string[]
  createdAt: string
  updatedAt: string
}

interface EngineeringServiceDetailProps {
  service: EngineeringService
  onBack: () => void
  onUpdate: () => void
}

const API_BASE = "https://app.codewithseth.co.ke/api"

export function EngineeringServiceDetail({ service, onBack, onUpdate }: EngineeringServiceDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [conditionBefore, setConditionBefore] = useState(service.conditionBefore || "")
  const [conditionAfter, setConditionAfter] = useState(service.conditionAfter || "")
  const [notes, setNotes] = useState(service.notes || "")
  const [nextServiceDate, setNextServiceDate] = useState(service.nextServiceDate || "")
  const [otherPersonnel, setOtherPersonnel] = useState(
    service.otherPersonnel ? service.otherPersonnel.join(", ") : ""
  )
  const { toast } = useToast()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-yellow-100 text-yellow-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleStartService = async () => {
    if (!conditionBefore.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe the machine condition before starting service",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const token = authService.getAccessToken()
      const response = await fetch(`${API_BASE}/engineering-services/${service._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "in-progress",
          conditionBefore: conditionBefore.trim(),
          notes: notes.trim() || `Started at ${new Date().toLocaleString()}`,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Service Started",
          description: "Service status updated to in-progress",
        })
        onUpdate()
      } else {
        throw new Error(result.message || "Failed to start service")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start service",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCompleteService = async () => {
    if (!conditionBefore.trim() || !conditionAfter.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both condition before and after service",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const token = authService.getAccessToken()
      const payload: any = {
        status: "completed",
        conditionBefore: conditionBefore.trim(),
        conditionAfter: conditionAfter.trim(),
        notes: notes.trim(),
      }

      if (otherPersonnel.trim()) {
        payload.otherPersonnel = [otherPersonnel.trim()]
      }

      if (nextServiceDate) {
        payload.nextServiceDate = new Date(nextServiceDate).toISOString()
      }

      const response = await fetch(`${API_BASE}/engineering-services/${service._id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Service Completed",
          description: "Service report submitted successfully",
        })
        setIsEditing(false)
        onUpdate()
      } else {
        throw new Error(result.message || "Failed to complete service")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete service",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canEdit = service.status === "assigned" || service.status === "in-progress"
  const isCompleted = service.status === "completed"

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="ghost"
          size="sm"
          className="rounded-xl hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Services
        </Button>
        <Badge className={getStatusColor(service.status)}>
          {service.status.replace("-", " ").toUpperCase()}
        </Badge>
      </div>

      {/* Service Information */}
      <Card
        className="rounded-2xl bg-white"
        style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#00aeef]">
            <Wrench className="h-5 w-5" />
            {service.serviceType.toUpperCase()} Service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Facility Info */}
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-800">{service.facility.name}</p>
                <p className="text-sm text-gray-600">{service.facility.location}</p>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="flex items-center gap-2 text-gray-700">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Scheduled Date</p>
              <p className="text-sm">{formatDate(service.scheduledDate)}</p>
            </div>
          </div>

          {/* Engineer */}
          <div className="flex items-center gap-2 text-gray-700">
            <User className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Engineer in Charge</p>
              <p className="text-sm">{service.engineerInCharge.name}</p>
              <p className="text-sm text-gray-500">{service.engineerInCharge.phone}</p>
            </div>
          </div>

          {/* Machine Details */}
          {service.machineDetails && (
            <div className="flex items-start gap-2 text-gray-700">
              <Wrench className="h-5 w-5 text-gray-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Machine Details</p>
                <p className="text-sm whitespace-pre-wrap">{service.machineDetails}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Report Form/Display */}
      <Card
        className="rounded-2xl bg-white"
        style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
      >
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[#00aeef]">
              <FileText className="h-5 w-5" />
              Service Report
            </span>
            {canEdit && !isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                className="rounded-lg bg-[#00aeef] text-white hover:bg-[#0096d6]"
              >
                {service.status === "assigned" ? "Start Service" : "Update Report"}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Condition Before */}
          <div className="space-y-2">
            <Label htmlFor="conditionBefore" className="text-sm font-semibold text-gray-700">
              Condition Before Service *
            </Label>
            {isEditing ? (
              <Textarea
                id="conditionBefore"
                value={conditionBefore}
                onChange={(e) => setConditionBefore(e.target.value)}
                placeholder="Describe the machine condition before service (errors, issues, etc.)..."
                rows={4}
                className="rounded-xl"
              />
            ) : (
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl whitespace-pre-wrap">
                {conditionBefore || "Not filled yet"}
              </p>
            )}
          </div>

          {/* Condition After */}
          {(isEditing || service.status === "in-progress" || isCompleted) && (
            <div className="space-y-2">
              <Label htmlFor="conditionAfter" className="text-sm font-semibold text-gray-700">
                Condition After Service *
              </Label>
              {isEditing ? (
                <Textarea
                  id="conditionAfter"
                  value={conditionAfter}
                  onChange={(e) => setConditionAfter(e.target.value)}
                  placeholder="Describe the machine condition after service (tests passed, operational status, etc.)..."
                  rows={4}
                  className="rounded-xl"
                />
              ) : (
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl whitespace-pre-wrap">
                  {conditionAfter || "Not filled yet"}
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
              Work Done / Notes
            </Label>
            {isEditing ? (
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe work performed, parts replaced, recommendations..."
                rows={6}
                className="rounded-xl"
              />
            ) : (
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl whitespace-pre-wrap">
                {notes || "No notes"}
              </p>
            )}
          </div>

          {/* Other Personnel */}
          {(isEditing || otherPersonnel) && (
            <div className="space-y-2">
              <Label htmlFor="otherPersonnel" className="text-sm font-semibold text-gray-700">
                Other Personnel (Optional)
              </Label>
              {isEditing ? (
                <Input
                  id="otherPersonnel"
                  value={otherPersonnel}
                  onChange={(e) => setOtherPersonnel(e.target.value)}
                  placeholder="e.g., Hospital technician: John Doe"
                  className="rounded-xl"
                />
              ) : (
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl">
                  {otherPersonnel || "None"}
                </p>
              )}
            </div>
          )}

          {/* Next Service Date */}
          {(isEditing || nextServiceDate) && (
            <div className="space-y-2">
              <Label htmlFor="nextServiceDate" className="text-sm font-semibold text-gray-700">
                Next Service Date (Optional)
              </Label>
              {isEditing ? (
                <Input
                  id="nextServiceDate"
                  type="date"
                  value={nextServiceDate ? nextServiceDate.split("T")[0] : ""}
                  onChange={(e) => setNextServiceDate(e.target.value)}
                  className="rounded-xl"
                />
              ) : (
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl">
                  {nextServiceDate ? formatDate(nextServiceDate) : "Not set"}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="flex-1 rounded-xl"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {service.status === "assigned" ? (
                <Button
                  onClick={handleStartService}
                  className="flex-1 rounded-xl bg-blue-500 text-white hover:bg-blue-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Start Service
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleCompleteService}
                  className="flex-1 rounded-xl bg-green-500 text-white hover:bg-green-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Complete Service
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timestamps */}
      <div className="text-xs text-gray-500 text-center space-y-1">
        <p>Created: {formatDate(service.createdAt)}</p>
        <p>Last Updated: {formatDate(service.updatedAt)}</p>
      </div>
    </div>
  )
}
