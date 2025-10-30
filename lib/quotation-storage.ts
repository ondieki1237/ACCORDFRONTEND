/**
 * Quotation Storage Service
 * Manages quotation requests with offline support
 * Auto-syncs to backend when online
 */

import { Preferences } from "@capacitor/preferences"
import { authService } from "./auth"

export interface QuotationRequest {
  id: string
  productId: string
  productName: string
  productPrice: string
  clientName: string
  clientPhone: string
  clientEmail: string
  clientLocation: string
  quantity: number
  urgency: "low" | "medium" | "high"
  notes: string
  requestedBy: string // User ID
  requestedByName: string // User name
  status: "pending" | "sent" | "failed"
  createdAt: number
  syncedAt?: number
  errorMessage?: string
}

interface QuotationMetadata {
  totalQuotations: number
  pendingSync: number
  lastSync: number
}

const KEYS = {
  QUOTATIONS: "quotation_requests",
  METADATA: "quotation_metadata",
}

const API_BASE = "https://app.codewithseth.co.ke/api"

class QuotationStorageService {
  /**
   * Generate unique quotation ID
   */
  private generateId(): string {
    return `quot_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }

  /**
   * Save quotation request (offline-first)
   */
  async saveQuotation(quotation: Omit<QuotationRequest, "id" | "createdAt" | "requestedBy" | "requestedByName" | "status">): Promise<QuotationRequest> {
    try {
      const user = authService.getCurrentUserSync()
      if (!user) {
        throw new Error("User not authenticated")
      }

      const newQuotation: QuotationRequest = {
        ...quotation,
        id: this.generateId(),
        requestedBy: (user as any)._id || (user as any).id || "unknown",
        requestedByName: (user as any).firstName || (user as any).name || (user as any).username || "Unknown User",
        status: "pending",
        createdAt: Date.now(),
      }

      // Add to local storage
      const quotations = await this.getAllQuotations()
      quotations.push(newQuotation)
      await this.saveAllQuotations(quotations)

      // Update metadata
      await this.updateMetadata()

      // Try to sync immediately if online
      if (navigator.onLine) {
        this.syncQuotation(newQuotation).catch(() => {
          // Silent fail - will retry later
        })
      }

      return newQuotation
    } catch (error) {
      console.error("Failed to save quotation:", error)
      throw error
    }
  }

  /**
   * Get all quotations
   */
  async getAllQuotations(): Promise<QuotationRequest[]> {
    try {
      const { value } = await Preferences.get({ key: KEYS.QUOTATIONS })
      if (!value) return []
      return JSON.parse(value)
    } catch (error) {
      console.error("Failed to get quotations:", error)
      return []
    }
  }

  /**
   * Get quotation by ID
   */
  async getQuotationById(id: string): Promise<QuotationRequest | null> {
    const quotations = await this.getAllQuotations()
    return quotations.find((q) => q.id === id) || null
  }

  /**
   * Get pending quotations (not synced)
   */
  async getPendingQuotations(): Promise<QuotationRequest[]> {
    const quotations = await this.getAllQuotations()
    return quotations.filter((q) => q.status === "pending")
  }

  /**
   * Get sent quotations (successfully synced)
   */
  async getSentQuotations(): Promise<QuotationRequest[]> {
    const quotations = await this.getAllQuotations()
    return quotations.filter((q) => q.status === "sent")
  }

  /**
   * Get failed quotations
   */
  async getFailedQuotations(): Promise<QuotationRequest[]> {
    const quotations = await this.getAllQuotations()
    return quotations.filter((q) => q.status === "failed")
  }

  /**
   * Save all quotations
   */
  private async saveAllQuotations(quotations: QuotationRequest[]): Promise<void> {
    await Preferences.set({
      key: KEYS.QUOTATIONS,
      value: JSON.stringify(quotations),
    })
  }

  /**
   * Update single quotation
   */
  async updateQuotation(id: string, updates: Partial<QuotationRequest>): Promise<void> {
    const quotations = await this.getAllQuotations()
    const index = quotations.findIndex((q) => q.id === id)

    if (index !== -1) {
      quotations[index] = { ...quotations[index], ...updates }
      await this.saveAllQuotations(quotations)
      await this.updateMetadata()
    }
  }

  /**
   * Delete quotation
   */
  async deleteQuotation(id: string): Promise<void> {
    const quotations = await this.getAllQuotations()
    const filtered = quotations.filter((q) => q.id !== id)
    await this.saveAllQuotations(filtered)
    await this.updateMetadata()
  }

  /**
   * Sync quotation to backend API
   */
  private async syncQuotation(quotation: QuotationRequest): Promise<boolean> {
    try {
      const token = authService.getAccessToken()
      if (!token) {
        throw new Error("Authentication required")
      }

      // Transform to match backend schema
      const payload = {
        hospital: quotation.clientName, // Map clientName to hospital
        location: quotation.clientLocation,
        equipmentRequired: quotation.productName,
        urgency: quotation.urgency,
        contactName: quotation.clientName,
        contactEmail: quotation.clientEmail,
        contactPhone: quotation.clientPhone,
      }

      const response = await fetch(`${API_BASE}/quotation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Server returned ${response.status}`)
      }

      // Mark as sent
      await this.updateQuotation(quotation.id, {
        status: "sent",
        syncedAt: Date.now(),
        errorMessage: undefined,
      })

      return true
    } catch (error: any) {
      // Mark as failed with error message
      await this.updateQuotation(quotation.id, {
        status: "failed",
        errorMessage: error.message || "Unknown error",
      })
      return false
    }
  }

  /**
   * Sync all pending quotations
   */
  async syncAllPending(): Promise<{ success: number; failed: number }> {
    const pending = await this.getPendingQuotations()
    let success = 0
    let failed = 0

    for (const quotation of pending) {
      const result = await this.syncQuotation(quotation)
      if (result) {
        success++
      } else {
        failed++
      }
    }

    return { success, failed }
  }

  /**
   * Retry failed quotations
   */
  async retryFailed(): Promise<{ success: number; failed: number }> {
    const failed = await this.getFailedQuotations()
    let success = 0
    let failedCount = 0

    // Reset failed quotations to pending
    for (const quotation of failed) {
      await this.updateQuotation(quotation.id, {
        status: "pending",
        errorMessage: undefined,
      })
    }

    // Try to sync them
    for (const quotation of failed) {
      const result = await this.syncQuotation(quotation)
      if (result) {
        success++
      } else {
        failedCount++
      }
    }

    return { success, failed: failedCount }
  }

  /**
   * Get metadata
   */
  async getMetadata(): Promise<QuotationMetadata | null> {
    try {
      const { value } = await Preferences.get({ key: KEYS.METADATA })
      if (!value) return null
      return JSON.parse(value)
    } catch (error) {
      console.error("Failed to get metadata:", error)
      return null
    }
  }

  /**
   * Update metadata
   */
  private async updateMetadata(): Promise<void> {
    const quotations = await this.getAllQuotations()
    const pending = quotations.filter((q) => q.status === "pending").length

    const metadata: QuotationMetadata = {
      totalQuotations: quotations.length,
      pendingSync: pending,
      lastSync: Date.now(),
    }

    await Preferences.set({
      key: KEYS.METADATA,
      value: JSON.stringify(metadata),
    })
  }

  /**
   * Clear all quotations
   */
  async clearAll(): Promise<void> {
    await Preferences.remove({ key: KEYS.QUOTATIONS })
    await Preferences.remove({ key: KEYS.METADATA })
  }

  /**
   * Get quotations statistics
   */
  async getStatistics(): Promise<{
    total: number
    pending: number
    sent: number
    failed: number
  }> {
    const quotations = await this.getAllQuotations()

    return {
      total: quotations.length,
      pending: quotations.filter((q) => q.status === "pending").length,
      sent: quotations.filter((q) => q.status === "sent").length,
      failed: quotations.filter((q) => q.status === "failed").length,
    }
  }
}

export const quotationStorage = new QuotationStorageService()
