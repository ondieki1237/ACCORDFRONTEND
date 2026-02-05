"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { VisitHistorySelector } from "./visit-history-selector"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building, Users, Clock, MapPin, CheckCircle2, Calendar, FileText } from "lucide-react"
import { apiService } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Preferences } from "@capacitor/preferences"
import facilitiesData from "../facilities.json"

interface CreateVisitFormProps {
  onSuccess: () => void
  onCancel: () => void
  initialData?: any
}

interface Contact {
  name: string
  role: string
  phone: string
  email: string
}

interface ProductInterest {
  name: string
  notes: string
}

interface VisitFormData {
  date: string
  clientName: string
  clientType: string
  hospitalLevel: string
  location: string
  visitPurpose: string
  visitOutcome: string
  contacts: Contact[]
  productsOfInterest: ProductInterest[]
  isFollowUpRequired: boolean
  notes: string
  followUpOf?: string
}

const LOCAL_KEY = "pendingVisits"
const DRAFT_KEY = "visitFormDraft"

// Helper functions for Capacitor Preferences storage
async function getPendingVisits(): Promise<any[]> {
  const { value } = await Preferences.get({ key: LOCAL_KEY })
  return value ? JSON.parse(value) : []
}

async function setPendingVisits(visits: any[]) {
  await Preferences.set({ key: LOCAL_KEY, value: JSON.stringify(visits) })
}

export function CreateVisitForm({ onSuccess, onCancel, initialData }: CreateVisitFormProps) {
  // Register a navigation block while this form is active so users cannot exit
  // using hardware back or swipe navigation. Only allow exit via Record Visit or Cancel.
  useEffect(() => {
    try {
      const { blockNavigation } = require('@/lib/nav-blocker')
      blockNavigation('create-visit-form')
      return () => {
        try { const { unblockNavigation } = require('@/lib/nav-blocker'); unblockNavigation('create-visit-form') } catch (e) { }
      }
    } catch (e) {
      return
    }
  }, [])
  const [formData, setFormData] = useState<VisitFormData>({
    date: new Date().toISOString().split("T")[0],
    clientName: "",
    clientType: "hospital",
    hospitalLevel: "5",
    location: "",
    visitPurpose: "demo",
    visitOutcome: "successful",
    contacts: [{ name: "", role: "doctor", phone: "", email: "" }],
    productsOfInterest: [{ name: "", notes: "" }],
    isFollowUpRequired: false,
    notes: "",
    followUpOf: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const [pendingVisits, setPendingVisitsState] = useState<any[]>([])

  // Facilities typeahead
  const [facilityQuery, setFacilityQuery] = useState('')
  const [facilitySuggestions, setFacilitySuggestions] = useState<any[]>([])
  const [isFacilitiesLoading, setIsFacilitiesLoading] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const facilitiesTimerRef = useRef<number | null>(null)
  const facilitiesAbortRef = useRef<AbortController | null>(null)
  const clientNameRef = useRef<HTMLInputElement | null>(null)
  const closeTimeoutRef = useRef<number | null>(null)

  // Load pending visits and draft from Preferences on mount
  useEffect(() => {
    getPendingVisits().then(setPendingVisitsState)

    // Load draft
    const loadDraft = async () => {
      const { value } = await Preferences.get({ key: DRAFT_KEY })
      if (value) {
        try {
          const draft = JSON.parse(value)
          // Ensure draft has valid structure
          setFormData(prev => ({ ...prev, ...draft }))
          toast({
            title: "Draft Restored",
            description: "We restored your previous unsaved visit details.",
          })
        } catch (e) {
          console.error("Failed to parse draft", e)
        }
      }
    }
    loadDraft()
  }, [toast])

  // Save draft whenever formData changes
  useEffect(() => {
    const saveDraft = async () => {
      await Preferences.set({ key: DRAFT_KEY, value: JSON.stringify(formData) })
    }
    // Debounce saving to avoid excessive writes
    const timeoutId = setTimeout(saveDraft, 1000)
    return () => clearTimeout(timeoutId)
  }, [formData])

  // Update facilityQuery when clientName input changes
  useEffect(() => {
    setFacilityQuery(formData.clientName)
  }, [formData.clientName])

  // Populate form if initialData is provided (editing mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date ? new Date(initialData.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
        clientName: initialData.client?.name || "",
        clientType: initialData.client?.type || "hospital",
        hospitalLevel: initialData.client?.level || "5",
        location: initialData.client?.location || "",
        visitPurpose: initialData.visitPurpose || "demo",
        visitOutcome: initialData.visitOutcome || "successful",
        contacts: initialData.contacts?.length > 0 ? initialData.contacts : [{ name: "", role: "doctor", phone: "", email: "" }],
        productsOfInterest: initialData.productsOfInterest?.length > 0
          ? initialData.productsOfInterest
          : (initialData.requestedEquipment?.length > 0 ? initialData.requestedEquipment : [{ name: "", notes: "" }]),
        isFollowUpRequired: initialData.isFollowUpRequired || false,
        notes: initialData.notes || "",
        followUpOf: initialData.followUpOf || "",
      })
    }
  }, [initialData])

  const fetchFacilities = useCallback(async (query: string) => {
    if (!query || query.trim().length === 0) {
      setFacilitySuggestions([])
      setIsFacilitiesLoading(false)
      return
    }

    // debounce
    if (facilitiesTimerRef.current) {
      window.clearTimeout(facilitiesTimerRef.current)
    }

    facilitiesTimerRef.current = window.setTimeout(async () => {
      try {
        setIsFacilitiesLoading(true)

        const lowerQuery = query.toLowerCase()
        const results = (facilitiesData as any[]).filter((f: any) => {
          const name = f.properties?.name || ''
          return name.toLowerCase().includes(lowerQuery)
        }).slice(0, 10) // Limit to 10 suggestions

        setFacilitySuggestions(results)
      } catch (err) {
        console.error('Facility lookup failed:', err)
        setFacilitySuggestions([])
      } finally {
        setIsFacilitiesLoading(false)
      }
    }, 300)
  }, [])

  // Trigger fetch when facilityQuery changes
  useEffect(() => {
    fetchFacilities(facilityQuery)
    return () => {
      if (facilitiesTimerRef.current) {
        window.clearTimeout(facilitiesTimerRef.current)
      }
      facilitiesAbortRef.current?.abort()
    }
  }, [facilityQuery, fetchFacilities])

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
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [...prev.contacts, { name: "", role: "doctor", phone: "", email: "" }]
    }))
  }

  const removeContact = (index: number) => {
    if (formData.contacts.length <= 1) return // Prevent removing the last contact
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }))
  }

  const updateContact = (index: number, field: keyof Contact, value: string) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) =>
        i === index ? { ...contact, [field]: value } : contact
      )
    }))
  }

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      productsOfInterest: [...prev.productsOfInterest, { name: "", notes: "" }]
    }))
  }

  const removeProduct = (index: number) => {
    if (formData.productsOfInterest.length <= 1) return
    setFormData(prev => ({
      ...prev,
      productsOfInterest: prev.productsOfInterest.filter((_, i) => i !== index)
    }))
  }

  const updateProduct = (index: number, field: keyof ProductInterest, value: string) => {
    setFormData(prev => ({
      ...prev,
      productsOfInterest: prev.productsOfInterest.map((product, i) =>
        i === index ? { ...product, [field]: value } : product
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    return handleSubmitInternal(false)
  }

  // Internal submit handler. If keepOpen is true, the form will remain open
  // and reset client-specific fields so the user can add another visit for
  // the same date.
  const handleSubmitInternal = async (keepOpen: boolean) => {
    setIsSubmitting(true)

    let visitData: any = null

    try {
      // Create date object treating the input as local time (no Z suffix)
      // Defaulting time to 09:00 as per user request to remove time input
      const dateTime = new Date(`${formData.date}T09:00:00`).toISOString()

      visitData = {
        date: dateTime,
        startTime: dateTime,
        client: {
          name: formData.clientName,
          type: formData.clientType,
          level: formData.hospitalLevel,
          location: formData.location,
        },
        visitPurpose: formData.visitPurpose,
        visitOutcome: formData.visitOutcome,
        notes: formData.notes,
        isFollowUpRequired: formData.isFollowUpRequired,
      }

      if (formData.followUpOf) visitData.followUpOf = formData.followUpOf;

      // Filter and format contacts
      const validContacts = formData.contacts
        .filter(c => c.name.trim() !== '')
        .map(c => ({
          name: c.name.trim(),
          role: c.role || 'other',
          phone: c.phone?.trim() || undefined,
          email: c.email?.trim() || undefined,
        }));

      if (validContacts.length > 0) {
        visitData.contacts = validContacts;
      }

      // Filter and format products
      const validProducts = formData.productsOfInterest.filter(p => p.name.trim() !== '')
      if (validProducts.length > 0) {
        visitData.productsOfInterest = validProducts;
        // Also send as requestedEquipment for compatibility
        visitData.requestedEquipment = validProducts;
      }

      // Special field for visibility in list if needed
      visitData.revisitRequired = formData.isFollowUpRequired;

      // Use production API
      const token = localStorage.getItem('accessToken');
      const isEditing = !!(initialData?._id || initialData?.id);
      const targetId = initialData?._id || initialData?.id;

      console.log(`${isEditing ? 'Updating' : 'Creating'} visit:`, JSON.stringify(visitData, null, 2));
      console.log('Target URL ID:', targetId);

      const url = isEditing
        ? `https://app.codewithseth.co.ke/api/visits/${targetId}`
        : 'https://app.codewithseth.co.ke/api/visits';

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(visitData),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Backend error response:', errorData);
        throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} visit (${response.status})`);
      }

      const result = await response.json();

      // Successfully saved online
      toast({
        title: isEditing ? "Visit Updated" : "Visit Created",
        description: isEditing
          ? "Your visit details have been successfully updated."
          : "Your client visit has been successfully saved to the database.",
      })
      // Clear draft
      await Preferences.remove({ key: DRAFT_KEY })
      try { const { unblockNavigation } = require('@/lib/nav-blocker'); unblockNavigation('create-visit-form') } catch (e) { }

      if (keepOpen) {
        // Reset client-specific fields but keep the date so user can add another visit
        setFormData(prev => ({
          ...prev,
          clientName: "",
          clientType: "hospital",
          hospitalLevel: "5",
          location: "",
          visitPurpose: prev.visitPurpose || 'demo',
          visitOutcome: prev.visitOutcome || 'successful',
          contacts: [{ name: "", role: "doctor", phone: "", email: "" }],
          productsOfInterest: [{ name: "", notes: "" }],
          isFollowUpRequired: false,
          notes: "",
          followUpOf: "",
        }))

        // Keep pendingVisits and remain on form
        setTimeout(() => { if (clientNameRef.current) clientNameRef.current.focus() }, 100)
        return
      }

      onSuccess()
    } catch (error: any) {
      console.error('Visit creation error:', error)

      // If network error, save to pending visits
      if (!navigator.onLine || error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
        const pending = await getPendingVisits()
        const newPending = [...pending, visitData]
        await setPendingVisits(newPending)
        setPendingVisitsState(newPending)

        toast({
          title: "Saved Offline",
          description: "You are offline. Visit saved locally and will sync when online.",
          variant: "default", // Use default or a specific offline variant if available
        })
        // Clear draft since it's now "saved" as pending
        await Preferences.remove({ key: DRAFT_KEY })
        try { const { unblockNavigation } = require('@/lib/nav-blocker'); unblockNavigation('create-visit-form') } catch (e) { }

        if (keepOpen) {
          // If offline and user wanted to add another, keep the form open and reset fields
          setFormData(prev => ({
            ...prev,
            clientName: "",
            clientType: "hospital",
            hospitalLevel: "5",
            location: "",
            contacts: [{ name: "", role: "doctor", phone: "", email: "" }],
            productsOfInterest: [{ name: "", notes: "" }],
            isFollowUpRequired: false,
            notes: "",
            followUpOf: "",
          }))
          setTimeout(() => { if (clientNameRef.current) clientNameRef.current.focus() }, 100)
          return
        }

        onSuccess()
        return
      }

      toast({
        title: "Failed to Create Visit",
        description: error.message || "Could not save your visit. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    // Clear draft on cancel
    await Preferences.remove({ key: DRAFT_KEY })
    try { const { unblockNavigation } = require('@/lib/nav-blocker'); unblockNavigation('create-visit-form') } catch (e) { }
    onCancel()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f4f9] via-[#e8ecf4] to-[#dfe5f0] p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <div
          className="bg-gradient-to-r from-[#00aeef] to-[#0096d6] rounded-3xl p-6 md:p-8 shadow-xl"
          style={{
            boxShadow: "12px 12px 24px rgba(0, 174, 239, 0.2), -12px -12px 24px rgba(255, 255, 255, 0.9)"
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">New Client Visit</h2>
              </div>
              <p className="text-white/90 text-sm md:text-base ml-14">
                Schedule and record visit details for your client
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="h-12 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm shadow-lg"
            >
              Cancel
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Visit Details */}
          <Card
            className="rounded-3xl bg-white border-0 overflow-hidden"
            style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
          >
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 pb-4">
              <CardTitle className="flex items-center gap-3 text-[#00aeef]">
                <div className="bg-[#00aeef] rounded-xl p-2">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl">Visit Record</span>
              </CardTitle>
              <CardDescription className="ml-14 text-base">When did this interaction take place?</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2 pt-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#00aeef]" />
                  Visit Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-[#00aeef] transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="visitPurpose" className="text-base font-semibold text-gray-700">Visit Purpose *</Label>
                <Select value={formData.visitPurpose} onValueChange={(v) => updateField("visitPurpose", v)}>
                  <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200">
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo">🎯 Demo</SelectItem>
                    <SelectItem value="telesales">📱 Telesales</SelectItem>
                    <SelectItem value="quotation_followup">📋 Quotation Followup</SelectItem>
                    <SelectItem value="company_introduction">🏢 Company Introduction</SelectItem>
                    <SelectItem value="debt_collection">💳 Debt Collection</SelectItem>
                    <SelectItem value="followup">📞 Follow Up</SelectItem>
                    <SelectItem value="installation">🔧 Installation</SelectItem>
                    <SelectItem value="maintenance">🛠️ Maintenance</SelectItem>
                    <SelectItem value="consultation">💬 Consultation</SelectItem>
                    <SelectItem value="sales">💰 Sales</SelectItem>
                    <SelectItem value="other">📋 Other</SelectItem>
                  </SelectContent>
                </Select>
                {/* If purpose is followup, show visit history selector */}
                {formData.visitPurpose === 'followup' && (
                  <VisitHistorySelector
                    onSelect={(facility) => {
                      updateField('followUpOf', facility.name + facility.location + facility.level)
                      updateField('clientName', facility.name)
                      updateField('clientType', facility.type)
                      updateField('hospitalLevel', facility.level)
                      updateField('location', facility.location)
                      setTimeout(() => {
                        if (clientNameRef.current) {
                          clientNameRef.current.focus()
                        }
                      }, 100)
                    }}
                    selectedVisitId={formData.followUpOf || ''}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Client Information */}
          <Card
            className="rounded-3xl bg-white border-0 overflow-hidden"
            style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
          >
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 pb-4">
              <CardTitle className="flex items-center gap-3 text-[#00aeef]">
                <div className="bg-emerald-500 rounded-xl p-2">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl">Client Details</span>
              </CardTitle>
              <CardDescription className="ml-14 text-base">Information about the facility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <Building className="h-4 w-4 text-emerald-500" />
                  Facility Name *
                </Label>
                <Input
                  id="clientName"
                  placeholder="e.g. Nairobi General Hospital"
                  ref={clientNameRef}
                  value={formData.clientName}
                  onChange={(e) => updateField("clientName", e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-emerald-500 transition-all text-base"
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      setHighlightIndex((prev) => Math.min(prev + 1, facilitySuggestions.length - 1))
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      setHighlightIndex((prev) => Math.max(prev - 1, 0))
                    } else if (e.key === 'Enter') {
                      if (highlightIndex >= 0 && facilitySuggestions[highlightIndex]) {
                        const f = facilitySuggestions[highlightIndex]
                        const name = f?.properties?.name || f?.properties?.label || f?.name || ''
                        updateField('clientName', name)

                        // Auto-fill location
                        const loc = (f?.geometry && f.geometry.type === 'Point') ? `${f.geometry.coordinates[1]}, ${f.geometry.coordinates[0]}` : (f?.properties?.address || '')
                        updateField('location', loc)

                        // Auto-fill client type based on amenity
                        const amenity = (f?.properties?.amenity || '').toLowerCase()
                        const healthcare = (f?.properties?.healthcare || '').toLowerCase()

                        if (amenity.includes('hospital') || healthcare.includes('hospital')) {
                          updateField('clientType', 'hospital')
                          updateField('hospitalLevel', '4')
                        } else if (amenity.includes('clinic') || healthcare.includes('clinic') || amenity.includes('dispensary')) {
                          updateField('clientType', 'clinic')
                          updateField('hospitalLevel', '2')
                        } else if (amenity.includes('pharmacy')) {
                          updateField('clientType', 'other')
                          updateField('hospitalLevel', 'not_applicable')
                        }

                        setFacilitySuggestions([])
                        setHighlightIndex(-1)
                        e.preventDefault()
                      }
                    } else if (e.key === 'Escape') {
                      setFacilitySuggestions([])
                      setHighlightIndex(-1)
                    }
                  }}
                  onBlur={() => {
                    // Delay closing to allow click handlers on list items
                    closeTimeoutRef.current = window.setTimeout(() => {
                      setFacilitySuggestions([])
                      setHighlightIndex(-1)
                    }, 150)
                  }}
                  onFocus={() => {
                    // If there's a query, refetch suggestions
                    if (formData.clientName && formData.clientName.trim().length > 0) {
                      setFacilityQuery(formData.clientName)
                    }
                    if (closeTimeoutRef.current) {
                      window.clearTimeout(closeTimeoutRef.current)
                      closeTimeoutRef.current = null
                    }
                  }}
                />
                {/* Suggestions dropdown */}
                {facilitySuggestions.length > 0 && (
                  <div className="relative">
                    <ul className="absolute z-50 left-0 right-0 bg-white border mt-1 rounded-xl shadow-lg max-h-56 overflow-auto">
                      {facilitySuggestions.map((f, idx) => {
                        const name = f?.properties?.name || f?.properties?.label || f?.name || ''
                        const subtitle = f?.properties?.amenity || f?.properties?.type || ''
                        return (
                          <li
                            key={f._id || f.id || idx}
                            onMouseDown={(ev) => {
                              // prevent blur
                              ev.preventDefault()
                            }}
                            onClick={() => {
                              // populate fields
                              updateField('clientName', name)

                              // Auto-fill location
                              const loc = (f?.geometry && f.geometry.type === 'Point') ? `${f.geometry.coordinates[1]}, ${f.geometry.coordinates[0]}` : (f?.properties?.address || '')
                              updateField('location', loc)

                              // Auto-fill client type based on amenity
                              const amenity = (f?.properties?.amenity || '').toLowerCase()
                              const healthcare = (f?.properties?.healthcare || '').toLowerCase()

                              if (amenity.includes('hospital') || healthcare.includes('hospital')) {
                                updateField('clientType', 'hospital')
                                // Default to Level 4 for generic hospitals if not specified, user can change
                                updateField('hospitalLevel', '4')
                              } else if (amenity.includes('clinic') || healthcare.includes('clinic') || amenity.includes('dispensary')) {
                                updateField('clientType', 'clinic')
                                updateField('hospitalLevel', '2') // Dispensary/Clinic level
                              } else if (amenity.includes('pharmacy')) {
                                updateField('clientType', 'other')
                                updateField('hospitalLevel', 'not_applicable')
                              }

                              setFacilitySuggestions([])
                              setHighlightIndex(-1)
                            }}
                            className={`px-4 py-3 cursor-pointer hover:bg-gray-100 ${highlightIndex === idx ? 'bg-gray-100' : ''}`}
                          >
                            <div className="font-medium text-sm">{name}</div>
                            {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientType" className="text-base font-semibold text-gray-700">Client Type *</Label>
                  <Select value={formData.clientType} onValueChange={(v) => updateField("clientType", v)}>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200">
                      <SelectValue placeholder="Select client type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hospital">🏥 Hospital</SelectItem>
                      <SelectItem value="clinic">🏥 Clinic</SelectItem>
                      <SelectItem value="other">📋 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hospitalLevel" className="text-base font-semibold text-gray-700">Hospital Level *</Label>
                  <Select value={formData.hospitalLevel} onValueChange={(v) => updateField("hospitalLevel", v)}>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200">
                      <SelectValue placeholder="Select hospital level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">Level 6 - National Referral Hospitals</SelectItem>
                      <SelectItem value="5">Level 5 - County Referral Hospitals</SelectItem>
                      <SelectItem value="4">Level 4 - Primary Hospitals</SelectItem>
                      <SelectItem value="3">Level 3 - Health Centres</SelectItem>
                      <SelectItem value="2">Level 2 - Dispensaries</SelectItem>
                      <SelectItem value="1">Level 1 - Community Health Facilities</SelectItem>
                      <SelectItem value="not_applicable">Not Applicable (Clinic/Pharmacy/Lab)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                  Location *
                </Label>
                <Input
                  id="location"
                  placeholder="e.g. Nairobi, Kenya"
                  value={formData.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  required
                  className="h-12 rounded-xl border-2 border-gray-200 focus:border-emerald-500 transition-all text-base"
                />
              </div>
            </CardContent>
          </Card>

          {/* Visit Outcome and Follow-Up Required */}
          <Card
            className="rounded-3xl bg-white border-0 overflow-hidden"
            style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
          >
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 pb-4">
              <CardTitle className="flex items-center gap-3 text-[#00aeef]">
                <div className="bg-purple-500 rounded-xl p-2">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl">The Outcome</span>
              </CardTitle>
              <CardDescription className="ml-14 text-base">What was the outcome of this interaction?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="visitOutcome" className="text-base font-semibold text-gray-700">Visit Outcome *</Label>
                  <Select value={formData.visitOutcome} onValueChange={(v) => updateField("visitOutcome", v)}>
                    <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200">
                      <SelectValue placeholder="Select outcome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="successful">✅ Successful</SelectItem>
                      <SelectItem value="pending">⏳ Pending</SelectItem>
                      <SelectItem value="followup_required">🔁 Follow-up Required</SelectItem>
                      <SelectItem value="no_interest">🚫 No Interest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isFollowUpRequired" className="text-base font-semibold text-gray-700">Follow-Up Required? *</Label>
                  <Select
                    value={formData.isFollowUpRequired.toString()}
                    onValueChange={(v) => updateField("isFollowUpRequired", v === "true")}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200">
                      <SelectValue placeholder="Select follow-up requirement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">❌ No</SelectItem>
                      <SelectItem value="true">✅ Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Persons */}
          <Card
            className="rounded-3xl bg-white border-0 overflow-hidden"
            style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
          >
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-[#00aeef]">
                    <div className="bg-orange-500 rounded-xl p-2">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xl">Persons in Contact</span>
                  </CardTitle>
                  <CardDescription className="ml-14 text-base">Who did you interact with? (At least one required)</CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={addContact}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Add Person
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {formData.contacts.map((contact, index) => (
                <div key={index} className={`relative ${index > 0 ? 'pt-6 border-t border-gray-100' : ''}`}>
                  {formData.contacts.length > 1 && (
                    <div className="absolute right-0 top-0 md:top-6">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContact(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg h-8 px-2"
                      >
                        Remove
                      </Button>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`contactName-${index}`} className="text-base font-semibold text-gray-700 flex items-center gap-2">
                        <Users className="h-4 w-4 text-orange-500" />
                        Name *
                      </Label>
                      <Input
                        id={`contactName-${index}`}
                        placeholder="e.g. Dr. Jane Doe"
                        value={contact.name}
                        onChange={(e) => updateContact(index, "name", e.target.value)}
                        className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-500 transition-all text-base"
                      />
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`contactRole-${index}`} className="text-base font-semibold text-gray-700">Role *</Label>
                        <Select value={contact.role} onValueChange={(v) => updateContact(index, "role", v)}>
                          <SelectTrigger className="h-12 rounded-xl border-2 border-gray-200">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="doctor">👨‍⚕️ Doctor</SelectItem>
                            <SelectItem value="nurse">👩‍⚕️ Nurse</SelectItem>
                            <SelectItem value="admin"> Administrator</SelectItem>
                            <SelectItem value="procurement"> Procurement</SelectItem>
                            <SelectItem value="it_manager"> IT Manager</SelectItem>
                            <SelectItem value="lab_hod">🔬 Lab HOD</SelectItem>
                            <SelectItem value="ceo"> CEO</SelectItem>
                            <SelectItem value="other">📋 Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`contactPhone-${index}`} className="text-base font-semibold text-gray-700">Phone Number</Label>
                        <Input
                          id={`contactPhone-${index}`}
                          placeholder="+254712345678"
                          value={contact.phone}
                          onChange={(e) => updateContact(index, "phone", e.target.value)}
                          className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-500 transition-all text-base"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`contactEmail-${index}`} className="text-base font-semibold text-gray-700">Email Address</Label>
                      <Input
                        id={`contactEmail-${index}`}
                        type="email"
                        placeholder="jane.doe@example.com"
                        value={contact.email}
                        onChange={(e) => updateContact(index, "email", e.target.value)}
                        className="h-12 rounded-xl border-2 border-gray-200 focus:border-orange-500 transition-all text-base"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Items of Interest */}
          <Card
            className="rounded-3xl bg-white border-0 overflow-hidden"
            style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
          >
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3 text-[#00aeef]">
                    <div className="bg-indigo-500 rounded-xl p-2">
                      <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xl">Items of Interest</span>
                  </CardTitle>
                  <CardDescription className="ml-14 text-base">Products the client is interested in</CardDescription>
                </div>
                <Button
                  type="button"
                  onClick={addProduct}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {formData.productsOfInterest.map((product, index) => (
                <div key={index} className={`relative ${index > 0 ? 'pt-6 border-t border-gray-100' : ''}`}>
                  {formData.productsOfInterest.length > 1 && (
                    <div className="absolute right-0 top-0 md:top-6">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProduct(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg h-8 px-2"
                      >
                        Remove
                      </Button>
                    </div>
                  )}

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`productName-${index}`} className="text-base font-semibold text-gray-700 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                        Product Name
                      </Label>
                      <Input
                        id={`productName-${index}`}
                        placeholder="e.g. Ultrasound Machine"
                        value={product.name}
                        onChange={(e) => updateProduct(index, "name", e.target.value)}
                        className="h-12 rounded-xl border-2 border-gray-200 focus:border-indigo-500 transition-all text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`productNotes-${index}`} className="text-base font-semibold text-gray-700">Notes / Specifications</Label>
                      <Input
                        id={`productNotes-${index}`}
                        placeholder="e.g. Portable model preferred"
                        value={product.notes}
                        onChange={(e) => updateProduct(index, "notes", e.target.value)}
                        className="h-12 rounded-xl border-2 border-gray-200 focus:border-indigo-500 transition-all text-base"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card
            className="rounded-3xl bg-white border-0 overflow-hidden"
            style={{ boxShadow: "12px 12px 24px #d1d9e6, -12px -12px 24px #ffffff" }}
          >
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
              <CardTitle className="flex items-center gap-3 text-[#00aeef]">
                <div className="bg-blue-500 rounded-xl p-2">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl">Additional Information</span>
              </CardTitle>
              <CardDescription className="ml-14 text-base">Any other relevant details about this visit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-base font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Notes & Observations
                </Label>
                <textarea
                  id="notes"
                  placeholder="Enter any additional information, observations, or important details from the visit..."
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-base resize-none"
                />
              </div>
            </CardContent>
          </Card>


          {/* Submit Buttons */}
          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <Button
              type="submit"
              className="flex-1 h-14 px-8 text-lg font-semibold bg-gradient-to-r from-[#00aeef] to-[#0096d6] text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]"
              disabled={isSubmitting}
              style={{
                boxShadow: "8px 8px 16px rgba(0, 174, 239, 0.3), -8px -8px 16px rgba(255, 255, 255, 0.8)"
              }}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Recording Visit...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Record Visit
                </div>
              )}
            </Button>
            <Button
              type="button"
              onClick={async (e) => { e.preventDefault(); await handleSubmitInternal(true) }}
              className="flex-none h-14 px-6 text-md font-semibold bg-white text-[#00aeef] rounded-2xl shadow-inner border-2 border-[#00aeef]/20 hover:shadow-md transition-all duration-200"
              disabled={isSubmitting}
            >
              Add Another (Same Day)
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="h-14 px-8 text-lg font-semibold rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Cancel
            </Button>
          </div>
        </form>

        {/* Show pending visits badge/message */}
        {pendingVisits.length > 0 && (
          <div
            className="bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400 rounded-2xl p-4 flex items-center gap-3 shadow-lg"
          >
            <div className="bg-yellow-400 rounded-full p-2">
              <Clock className="h-5 w-5 text-yellow-900" />
            </div>
            <div>
              <p className="font-semibold text-yellow-900">
                {pendingVisits.length} visit{pendingVisits.length > 1 ? 's' : ''} pending upload
              </p>
              <p className="text-sm text-yellow-800">
                Will sync automatically when you're back online
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}