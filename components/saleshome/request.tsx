"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("http://localhost:5000/api/quotation", {
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
