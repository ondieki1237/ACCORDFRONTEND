"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Send, Save, Package, User, Phone, Mail, MapPin, Hash, FileText, Clock, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { quotationStorage } from "@/lib/quotation-storage"

interface Product {
  id: string
  name: string
  price: string
  category: string
  brand: string
}

interface QuotationFormProps {
  product: Product
  onBack: () => void
  onSuccess?: () => void
}

export function QuotationForm({ product, onBack, onSuccess }: QuotationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    clientLocation: "",
    quantity: 1,
    urgency: "medium",
    notes: "",
  })
  const { toast } = useToast()

  const updateField = (field: keyof typeof formData, value: string | number) => {
    setFormData({ ...formData, [field]: value })
  }

  const validateForm = (): boolean => {
    if (!formData.clientName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter client name",
        variant: "destructive",
      })
      return false
    }

    if (!formData.clientPhone.trim() && !formData.clientEmail.trim()) {
      toast({
        title: "Missing Contact",
        description: "Please provide either phone or email",
        variant: "destructive",
      })
      return false
    }

    if (formData.quantity < 1) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be at least 1",
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

      // Save quotation (offline-first)
      const quotation = await quotationStorage.saveQuotation({
        productId: product.id,
        productName: product.name,
        productPrice: product.price,
        clientName: formData.clientName.trim(),
        clientPhone: formData.clientPhone.trim(),
        clientEmail: formData.clientEmail.trim(),
        clientLocation: formData.clientLocation.trim(),
        quantity: formData.quantity,
        urgency: formData.urgency as "low" | "medium" | "high",
        notes: formData.notes.trim(),
      })

      const isOnline = navigator.onLine

      toast({
        title: isOnline ? "Quotation Submitted!" : "Quotation Saved Offline",
        description: isOnline
          ? "Quotation request sent successfully. You'll be notified when processed."
          : "Quotation saved locally. It will be sent automatically when you're back online.",
      })

      // Reset form
      setFormData({
        clientName: "",
        clientPhone: "",
        clientEmail: "",
        clientLocation: "",
        quantity: 1,
        urgency: "medium",
        notes: "",
      })

      if (onSuccess) {
        onSuccess()
      } else {
        onBack()
      }
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Could not save quotation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalPrice = parseFloat(product.price) * formData.quantity

  return (
    <div className="space-y-6">
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
              <Send className="h-6 w-6" />
            </div>
            <div>
              <span className="text-2xl">Request Quotation</span>
              <p className="text-white/80 text-sm font-normal mt-1">
                Fill in client details to request a quote
              </p>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          {/* Product Summary */}
          <Card
            className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-0 mb-6"
            style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
          >
            <CardContent className="p-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Package className="h-5 w-5 text-[#00aeef]" />
                Product Information
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Product:</span>
                  <span className="text-sm font-semibold text-gray-800">{product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Category:</span>
                  <span className="text-sm font-semibold text-gray-800">{product.category}</span>
                </div>
                {product.brand && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Brand:</span>
                    <span className="text-sm font-semibold text-gray-800">{product.brand}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Unit Price:</span>
                  <span className="text-sm font-semibold text-[#00aeef]">
                    KES {parseFloat(product.price).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quotation Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Client Information */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <User className="h-5 w-5 text-[#00aeef]" />
                Client Information
              </h3>

              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-base font-semibold text-gray-700">
                  Client Name / Facility Name *
                </Label>
                <Input
                  id="clientName"
                  placeholder="e.g. Nairobi General Hospital"
                  value={formData.clientName}
                  onChange={(e) => updateField("clientName", e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientPhone" className="text-base font-semibold text-gray-700 flex items-center gap-1">
                    <Phone className="h-4 w-4 text-[#00aeef]" />
                    Phone Number *
                  </Label>
                  <Input
                    id="clientPhone"
                    type="tel"
                    placeholder="+254712345678"
                    value={formData.clientPhone}
                    onChange={(e) => updateField("clientPhone", e.target.value)}
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientEmail" className="text-base font-semibold text-gray-700 flex items-center gap-1">
                    <Mail className="h-4 w-4 text-[#00aeef]" />
                    Email Address
                  </Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    placeholder="client@example.com"
                    value={formData.clientEmail}
                    onChange={(e) => updateField("clientEmail", e.target.value)}
                    className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientLocation" className="text-base font-semibold text-gray-700 flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-[#00aeef]" />
                  Location / Address
                </Label>
                <Input
                  id="clientLocation"
                  placeholder="e.g. Nairobi, Kenya"
                  value={formData.clientLocation}
                  onChange={(e) => updateField("clientLocation", e.target.value)}
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
                />
              </div>
            </div>

            {/* Order Details */}
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Hash className="h-5 w-5 text-[#00aeef]" />
                Order Details
              </h3>

              <div className="space-y-2">
                <Label htmlFor="quantity" className="text-base font-semibold text-gray-700">
                  Quantity *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => updateField("quantity", parseInt(e.target.value) || 1)}
                  required
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency" className="text-base font-semibold text-gray-700 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-[#00aeef]" />
                  Urgency Level *
                </Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) => updateField("urgency", value)}
                >
                  <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef]">
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        Low - No rush
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        Medium - Standard delivery
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        High - Urgent need
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Total Price Estimate */}
              <Card
                className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border-0"
                style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">
                    Estimated Total:
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    KES {totalPrice.toLocaleString()}
                  </span>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-base font-semibold text-gray-700 flex items-center gap-1">
                  <FileText className="h-4 w-4 text-[#00aeef]" />
                  Additional Notes / Requirements
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any special requirements, delivery timeline, warranty details, etc."
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={4}
                  className="rounded-xl border-2 border-gray-200 focus:border-[#00aeef]"
                />
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
                      Your quotation will be saved locally and automatically sent when you reconnect to the internet.
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
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {navigator.onLine ? <Send className="h-5 w-5" /> : <Save className="h-5 w-5" />}
                    {navigator.onLine ? "Submit Quotation" : "Save Offline"}
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
