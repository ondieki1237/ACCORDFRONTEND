"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Users, Clock, Calendar, ArrowLeft, FileText, Phone, Mail, Plus, AlertCircle, Edit, Trash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { FollowUpVisitForm } from "./followup-visit-form"

interface Visit {
  id: string
  date: string
  startTime: string
  endTime: string
  client: {
    name: string
  }
  contacts: any[]
  requestedEquipment: any[]
  notes: string
  status?: "scheduled" | "in-progress" | "completed" | "cancelled"
}

interface VisitDetailProps {
  visit: Visit
  onBack: () => void
  onEdit?: () => void
  onDelete?: () => void
}

interface FollowUp {
  action: string
  assignedTo: string
  dueDate: string
  priority: "low" | "medium" | "high"
}

export function VisitDetail({ visit, onBack, onEdit, onDelete }: VisitDetailProps) {
  const [showFollowUpForm, setShowFollowUpForm] = useState(false)
  const { toast } = useToast()

  // If showing follow-up form, render it fullscreen
  if (showFollowUpForm) {
    return (
      <FollowUpVisitForm
        onBack={() => setShowFollowUpForm(false)}
        onSuccess={() => {
          setShowFollowUpForm(false)
          toast({
            title: "Success",
            description: "Follow-up visit recorded successfully"
          })
        }}
        visitId={visit.id}
        clientName={visit.client?.name}
      />
    )
  }

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffHours}h ${diffMinutes}m`
  }

  const getVisitStatus = (visit: Visit) => {
    const now = new Date()
    const visitStart = new Date(visit.startTime)
    const visitEnd = new Date(visit.endTime)

    if (visit.status) return visit.status

    if (now < visitStart) return "scheduled"
    if (now >= visitStart && now <= visitEnd) return "in-progress"
    return "completed"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const status = getVisitStatus(visit)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="rounded-xl shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_#ffffff] hover:shadow-inner"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{visit.client?.name || "Unknown Client"}</h2>
            <Badge className={`${getStatusColor(status)} rounded-full px-3 py-1 shadow-sm`}>{status}</Badge>
          </div>
          <p className="text-muted-foreground">Visit details and information</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="rounded-xl shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_#ffffff] hover:shadow-inner flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("Are you sure you want to delete this visit? This action cannot be undone.")) {
                onDelete?.()
              }
            }}
            className="rounded-xl shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_#ffffff] hover:shadow-inner flex items-center gap-2 text-red-600 hover:text-red-700"
          >
            <Trash className="h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl shadow-[5px_5px_15px_#d1d9e6,-5px_-5px_15px_#ffffff] border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#00aeef]" />
              Visit Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Date:</span>
              <span className="font-medium">{new Date(visit.date).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-[5px_5px_15px_#d1d9e6,-5px_-5px_15px_#ffffff] border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-[#00aeef]" />
              Client Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Company:</span>
              <span className="font-medium">{visit.client?.name || "N/A"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Contacts:</span>
              <span className="font-medium">{visit.contacts?.length || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Equipment:</span>
              <span className="font-medium">{visit.requestedEquipment?.length || 0} items</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {visit.contacts && visit.contacts.length > 0 && (
        <Card className="rounded-2xl shadow-[5px_5px_15px_#d1d9e6,-5px_-5px_15px_#ffffff] border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#00aeef]" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {visit.contacts.map((contact, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#f1f4f9] shadow-inner"
                >
                  <div>
                    <div className="font-medium">{contact.name || "Unknown Contact"}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4">
                      {contact.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-[#00aeef]" />
                          {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-[#00aeef]" />
                          {contact.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {visit.requestedEquipment && visit.requestedEquipment.length > 0 && (
        <Card className="rounded-2xl shadow-[5px_5px_15px_#d1d9e6,-5px_-5px_15px_#ffffff] border-0">
          <CardHeader>
            <CardTitle>Requested Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {visit.requestedEquipment.map((item, index) => (
                <Badge key={index} variant="outline" className="rounded-xl px-3 py-1 bg-white shadow-inner">
                  {typeof item === "string" ? item : item.name || "Equipment"}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {visit.notes && (
        <Card className="rounded-2xl shadow-[5px_5px_15px_#d1d9e6,-5px_-5px_15px_#ffffff] border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#00aeef]" />
              Visit Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{visit.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4 pt-4 pb-10">
        <Button
          onClick={onEdit}
          className="w-full rounded-2xl h-14 bg-[#00aeef] hover:bg-[#009bd1] text-white shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] flex items-center justify-center gap-2 text-lg font-semibold transition-all active:scale-[0.98]"
        >
          <Edit className="h-5 w-5" />
          Edit Visit
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowFollowUpForm(true)}
          className="w-full rounded-2xl h-14 border-2 border-[#00aeef] text-[#00aeef] hover:bg-[#00aeef]/5 bg-white shadow-[8px_8px_16px_#d1d9e6,-8px_-8px_16px_#ffffff] flex items-center justify-center gap-2 text-lg font-semibold transition-all"
        >
          <Plus className="h-5 w-5" />
          Record Follow-up
        </Button>
      </div>
    </div>
  )
}
