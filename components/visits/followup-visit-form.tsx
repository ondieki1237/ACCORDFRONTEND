"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FollowUpVisitFormProps {
  onBack: () => void
  onSuccess?: () => void
  initialData?: any
  visitId?: string
  clientName?: string
}

export function FollowUpVisitForm({ onBack, onSuccess, initialData, visitId, clientName }: FollowUpVisitFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    followUpDate: initialData?.followUpDate || "",
    reason: initialData?.reason || "",
    outcome: initialData?.outcome || "",
    needAnotherFollowUp: initialData?.needAnotherFollowUp || "",
    whyAnotherFollowUp: initialData?.whyAnotherFollowUp || "",
    whyNoMoreFollowUp: initialData?.whyNoMoreFollowUp || "",
  })
  
  const { toast } = useToast()

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const validateForm = (): boolean => {
    if (!formData.followUpDate) {
      toast({
        title: "Missing Information",
        description: "Please select follow-up date",
        variant: "destructive",
      })
      return false
    }

    if (!formData.reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter reason for follow-up",
        variant: "destructive",
      })
      return false
    }

    if (!formData.outcome.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter outcome of the visit",
        variant: "destructive",
      })
      return false
    }

    if (!formData.needAnotherFollowUp) {
      toast({
        title: "Missing Information",
        description: "Please indicate if another follow-up is needed",
        variant: "destructive",
      })
      return false
    }

    if (formData.needAnotherFollowUp === "yes" && !formData.whyAnotherFollowUp.trim()) {
      toast({
        title: "Missing Information",
        description: "Please explain why another follow-up is needed",
        variant: "destructive",
      })
      return false
    }

    if (formData.needAnotherFollowUp === "no" && !formData.whyNoMoreFollowUp.trim()) {
      toast({
        title: "Missing Information",
        description: "Please explain why no more follow-up is needed",
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
      
      const followUpData = {
        visitId: visitId || null, // Link to the original visit if provided
        clientName: clientName || null,
        followUpDate: formData.followUpDate,
        reason: formData.reason.trim(),
        outcome: formData.outcome.trim(),
        needAnotherFollowUp: formData.needAnotherFollowUp === "yes",
        ...(formData.needAnotherFollowUp === "yes" 
          ? { whyAnotherFollowUp: formData.whyAnotherFollowUp.trim() }
          : { whyNoMoreFollowUp: formData.whyNoMoreFollowUp.trim() }
        ),
        createdAt: new Date().toISOString(),
      }

      await apiService.createFollowUpVisit(followUpData)

      const isOnline = navigator.onLine

      toast({
        title: isOnline ? "Follow-up Visit Recorded!" : "Saved Offline",
        description: isOnline
          ? "Follow-up visit has been successfully recorded."
          : "Follow-up visit saved locally. It will be synced when you're back online.",
      })

      if (onSuccess) {
        onSuccess()
      } else {
        onBack()
      }
    } catch (error: any) {
      console.error("Failed to create follow-up visit:", error)
      toast({
        title: "Submission Failed",
        description: error.message || "Could not save follow-up visit. Please try again.",
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
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl">Follow-up Visit</span>
              <p className="text-white/80 text-sm font-normal mt-1">
                {clientName ? `Follow-up for ${clientName}` : "Record details of your follow-up visit"}
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Follow-up Date */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#00aeef]" />
                Visit Date
              </h3>

              <div className="space-y-2">
                <Label htmlFor="followUpDate" className="text-base font-semibold text-gray-700">
                  Follow-up Date *
                </Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={formData.followUpDate}
                  onChange={(e) => updateField("followUpDate", e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#00aeef]" />
                Visit Details
              </h3>

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-base font-semibold text-gray-700">
                  Reason for Follow-up *
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Why was this follow-up visit scheduled? What needed to be addressed?"
                  value={formData.reason}
                  onChange={(e) => updateField("reason", e.target.value)}
                  required
                  rows={4}
                  className="rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Examples: Follow up on quotation, check equipment delivery, discuss payment terms, etc.
                </p>
              </div>
            </div>

            {/* Outcome */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#00aeef]" />
                Visit Outcome
              </h3>

              <div className="space-y-2">
                <Label htmlFor="outcome" className="text-base font-semibold text-gray-700">
                  What was the outcome? *
                </Label>
                <Textarea
                  id="outcome"
                  placeholder="Describe what happened during this visit and what was accomplished..."
                  value={formData.outcome}
                  onChange={(e) => updateField("outcome", e.target.value)}
                  required
                  rows={5}
                  className="rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include: decisions made, agreements reached, documents signed, next steps discussed, etc.
                </p>
              </div>
            </div>

            {/* Need Another Follow-up */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[#00aeef]" />
                Next Steps
              </h3>

              <div className="space-y-4">
                <Label className="text-base font-semibold text-gray-700">
                  Is another follow-up needed? *
                </Label>
                
                <div className="space-y-3">
                  <div 
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      formData.needAnotherFollowUp === "yes" 
                        ? "border-[#00aeef] bg-blue-50" 
                        : "border-gray-200 hover:border-[#00aeef]"
                    }`}
                    onClick={() => {
                      console.log('FollowUpVisitForm: selected YES for needAnotherFollowUp')
                      updateField("needAnotherFollowUp", "yes")
                      updateField("whyNoMoreFollowUp", "")
                    }}
                  >
                    <div className={`size-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                      formData.needAnotherFollowUp === "yes"
                        ? "border-[#00aeef] bg-[#00aeef]"
                        : "border-gray-300"
                    }`}>
                      {formData.needAnotherFollowUp === "yes" && (
                        <div className="size-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-gray-700">Yes - Another follow-up is required</span>
                    </div>
                  </div>
                  
                  <div 
                    className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      formData.needAnotherFollowUp === "no" 
                        ? "border-[#00aeef] bg-blue-50" 
                        : "border-gray-200 hover:border-[#00aeef]"
                    }`}
                    onClick={() => {
                      console.log('FollowUpVisitForm: selected NO for needAnotherFollowUp')
                      updateField("needAnotherFollowUp", "no")
                      updateField("whyAnotherFollowUp", "")
                    }}
                  >
                    <div className={`size-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                      formData.needAnotherFollowUp === "no"
                        ? "border-[#00aeef] bg-[#00aeef]"
                        : "border-gray-300"
                    }`}>
                      {formData.needAnotherFollowUp === "no" && (
                        <div className="size-2 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <XCircle className="h-5 w-5 text-red-500" />
                      <span className="font-medium text-gray-700">No - Follow-up complete</span>
                    </div>
                  </div>
                </div>

                {/* Conditional: Why another follow-up */}
                {formData.needAnotherFollowUp === "yes" && (
                  <Card className="rounded-xl bg-blue-50 border-2 border-blue-200">
                    <CardContent className="p-4 space-y-2">
                      <Label htmlFor="whyAnotherFollowUp" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#00aeef]" />
                        Why is another follow-up needed? *
                      </Label>
                      <Textarea
                        id="whyAnotherFollowUp"
                        placeholder="Explain what still needs to be addressed or followed up on..."
                        value={formData.whyAnotherFollowUp}
                        onChange={(e) => updateField("whyAnotherFollowUp", e.target.value)}
                        rows={4}
                        className="rounded-xl border-2 border-gray-200 focus:border-[#00aeef] bg-white"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Examples: Waiting for approval, need to discuss pricing, equipment demo scheduled, etc.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Conditional: Why no more follow-up */}
                {formData.needAnotherFollowUp === "no" && (
                  <Card className="rounded-xl bg-green-50 border-2 border-green-200">
                    <CardContent className="p-4 space-y-2">
                      <Label htmlFor="whyNoMoreFollowUp" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Why is no more follow-up needed? *
                      </Label>
                      <Textarea
                        id="whyNoMoreFollowUp"
                        placeholder="Explain why this follow-up is complete..."
                        value={formData.whyNoMoreFollowUp}
                        onChange={(e) => updateField("whyNoMoreFollowUp", e.target.value)}
                        rows={4}
                        className="rounded-xl border-2 border-gray-200 focus:border-[#00aeef] bg-white"
                      />
                      <p className="text-xs text-gray-600 mt-1">
                        Examples: Deal closed, client declined, purchased from competitor, budget unavailable, etc.
                      </p>
                    </CardContent>
                  </Card>
                )}
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
                      Your follow-up visit will be saved locally and automatically synced when you reconnect.
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
                    {navigator.onLine ? "Save Follow-up" : "Save Offline"}
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
