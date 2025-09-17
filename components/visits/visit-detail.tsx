"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Users, Clock, Calendar, ArrowLeft, FileText, Phone, Mail, Plus, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
}

interface FollowUp {
  action: string
  assignedTo: string
  dueDate: string
  priority: "low" | "medium" | "high"
}

export function VisitDetail({ visit, onBack }: VisitDetailProps) {
  const [showFollowUpForm, setShowFollowUpForm] = useState(false)
  const [followUp, setFollowUp] = useState<FollowUp>({
    action: "",
    assignedTo: "",
    dueDate: "",
    priority: "medium",
  })
  const { toast } = useToast()

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

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      toast({
        title: "Follow-up created",
        description: "Follow-up action has been scheduled successfully.",
      })

      setShowFollowUpForm(false)
      setFollowUp({
        action: "",
        assignedTo: "",
        dueDate: "",
        priority: "medium",
      })
    } catch (error) {
      toast({
        title: "Failed to create follow-up",
        description: "Please try again later.",
        variant: "destructive",
      })
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
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Start Time:</span>
              <span className="font-medium">{new Date(visit.startTime).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">End Time:</span>
              <span className="font-medium">{new Date(visit.endTime).toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <Badge variant="outline" className="rounded-lg px-2 py-1 bg-white shadow-inner">
                <Clock className="h-3 w-3 mr-1 text-[#00aeef]" />
                {calculateDuration(visit.startTime, visit.endTime)}
              </Badge>
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

      <Card className="rounded-2xl shadow-[5px_5px_15px_#d1d9e6,-5px_-5px_15px_#ffffff] border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-[#00aeef]" />
            Follow-up Actions
          </CardTitle>
          <CardDescription>Schedule follow-up tasks for this visit</CardDescription>
        </CardHeader>
        <CardContent>
          {!showFollowUpForm ? (
            <Button
              onClick={() => setShowFollowUpForm(true)}
              className="flex items-center gap-2 rounded-xl bg-[#00aeef] text-white shadow-[4px_4px_10px_#b0bec5,-4px_-4px_10px_#ffffff] hover:shadow-inner"
            >
              <Plus className="h-4 w-4" />
              Add Follow-up
            </Button>
          ) : (
            <form onSubmit={handleFollowUpSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="action">Follow-up Action</Label>
                <Input
                  id="action"
                  placeholder="Call client, send proposal, schedule demo..."
                  value={followUp.action}
                  onChange={(e) => setFollowUp({ ...followUp, action: e.target.value })}
                  required
                  className="rounded-xl shadow-inner"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Input
                    id="assignedTo"
                    placeholder="Employee ID or name"
                    value={followUp.assignedTo}
                    onChange={(e) => setFollowUp({ ...followUp, assignedTo: e.target.value })}
                    required
                    className="rounded-xl shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={followUp.dueDate}
                    onChange={(e) => setFollowUp({ ...followUp, dueDate: e.target.value })}
                    required
                    className="rounded-xl shadow-inner"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={followUp.priority}
                  onValueChange={(value: "low" | "medium" | "high") => setFollowUp({ ...followUp, priority: value })}
                >
                  <SelectTrigger className="rounded-xl shadow-inner">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="rounded-xl bg-[#00aeef] text-white shadow-[4px_4px_10px_#b0bec5,-4px_-4px_10px_#ffffff] hover:shadow-inner"
                >
                  Create Follow-up
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFollowUpForm(false)}
                  className="rounded-xl shadow-[4px_4px_10px_#d1d9e6,-4px_-4px_10px_#ffffff] hover:shadow-inner"
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
