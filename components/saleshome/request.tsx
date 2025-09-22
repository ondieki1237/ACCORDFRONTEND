"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { TrendingUp } from "lucide-react"

export default function RequestQuotation() {
  const { toast } = useToast()
  const router = useRouter()
  const [formData, setFormData] = useState({
    hospital: "",
    location: "",
    equipmentRequired: "",
    urgency: "",
    contactName: "",
    contactEmail: "",
    contactPhone: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [salesSummary, setSalesSummary] = useState(null)
  const [salesLoading, setSalesLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("https://accordbackend.onrender.com/api/quotation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error("Failed to submit quotation request")

      toast({ description: "Quotation request submitted successfully!", variant: "success" })
      setFormData({
        hospital: "",
        location: "",
        equipmentRequired: "",
        urgency: "",
        contactName: "",
        contactEmail: "",
        contactPhone: ""
      })
      // Go back after a short delay to let user see the notification
      setTimeout(() => router.back(), 1200)
    } catch (error) {
      toast({ description: "Error submitting request. Please try again.", variant: "destructive" })
      setTimeout(() => router.back(), 1200)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f4f9]">
      <Card className="rounded-2xl shadow-[8px_8px_16px_#cfd4db,-8px_-8px_16px_#ffffff] bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <TrendingUp className="w-5 h-5" />
            Sales Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-6 items-center justify-center py-2">
            {salesLoading ? (
              <span className="text-gray-400 animate-pulse">Loading...</span>
            ) : salesSummary ? (
              <>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">Total Sales</span>
                  <span className="text-2xl font-bold text-green-700">
                    Ksh{salesSummary.totalSales.toLocaleString()}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground">Target</span>
                  <span className="text-2xl font-bold text-blue-700">
                    Ksh{salesSummary.totalTarget.toLocaleString()}
                  </span>
                </div>
              </>
            ) : (
              <span className="text-red-500">No sales data found</span>
            )}
          </div>
        </CardContent>
      </Card>
      <Card className="w-full max-w-lg p-6 rounded-2xl shadow-[8px_8px_16px_#cfd4db,-8px_-8px_16px_#ffffff]">
        <CardContent>
          <div className="flex items-center mb-4">
            <Button
              type="button"
              variant="outline"
              className="mr-2"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              ← Back
            </Button>
            <h2 className="text-xl font-bold text-center flex-1 text-[#00aeef]">
              Request Quotation
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="hospital"
              placeholder="Hospital Requiring Quotation"
              value={formData.hospital}
              onChange={handleChange}
              className="rounded-xl shadow-inner px-4 py-3"
              required
            />
            <Input
              name="location"
              placeholder="Location"
              value={formData.location}
              onChange={handleChange}
              className="rounded-xl shadow-inner px-4 py-3"
              required
            />
            <Input
              name="equipmentRequired"
              placeholder="Equipment Required"
              value={formData.equipmentRequired}
              onChange={handleChange}
              className="rounded-xl shadow-inner px-4 py-3"
              required
            />
            <Input
              name="urgency"
              placeholder="Urgency (e.g. high, medium, low)"
              value={formData.urgency}
              onChange={handleChange}
              className="rounded-xl shadow-inner px-4 py-3"
              required
            />
            <Input
              name="contactName"
              placeholder="Contact Name"
              value={formData.contactName}
              onChange={handleChange}
              className="rounded-xl shadow-inner px-4 py-3"
              required
            />
            <Input
              type="email"
              name="contactEmail"
              placeholder="Contact Email"
              value={formData.contactEmail}
              onChange={handleChange}
              className="rounded-xl shadow-inner px-4 py-3"
              required
            />
            <Input
              type="tel"
              name="contactPhone"
              placeholder="Contact Phone"
              value={formData.contactPhone}
              onChange={handleChange}
              className="rounded-xl shadow-inner px-4 py-3"
              required
            />
            <Button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#00aeef] text-white shadow-[6px_6px_12px_#cfd4db,-6px_-6px_12px_#ffffff] hover:scale-[1.02] transition"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
