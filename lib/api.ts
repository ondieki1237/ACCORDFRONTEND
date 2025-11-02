import { authService } from "./auth"
import { offlineStorage } from "./offline-storage"

// Allow overriding the API base URL via environment variable for different environments
// Use NEXT_PUBLIC_ so it's available on both server and client where needed
/**
 * API Service - Centralized API calls
 */

// Always use deployed API
const API_BASE_URL = "https://app.codewithseth.co.ke/api"

export interface DashboardOverview {
  totalVisits: number
  totalTrails: number
  recentActivity: Activity[]
  performance: PerformanceMetrics
}

export interface Activity {
  id: string
  type: "visit" | "trail"
  description: string
  timestamp: string
}

export interface PerformanceMetrics {
  visitsThisMonth: number
  trailsThisMonth: number
  averageVisitDuration: number
  completionRate: number
}

export interface Trail {
  id: string
  date: string
  startTime: string
  endTime: string
  path: {
    coordinates: number[][]
  }
  stops: any[]
  deviceInfo: any
}

export interface Visit {
  id?: string
  date: string
  startTime: string
  endTime?: string
  duration?: number
  client: {
    name: string
    type: string
    location: string
  }
  visitPurpose: string
  visitOutcome?: string
  contacts?: { 
    name: string
    role: string
    phone?: string
    email?: string
    department?: string
    notes?: string
    followUpRequired?: boolean
    followUpDate?: string
    priority?: string
  }[]
  existingEquipment?: any[]
  requestedEquipment?: any[]
  totalPotentialValue?: number
  competitorActivity?: string
  marketInsights?: string
  notes?: string
  nextVisitDate?: string
  isFollowUpRequired?: boolean
  followUpActions?: any[]
  tags?: string[]
  photos?: any[]
  attachments?: any[]
  _createdOffline?: boolean
}

export interface EngineeringService {
  id?: string
  date: string
  facility: {
    name: string
    location: string
  }
  serviceType: string
  machineDetails: string
  conditionBefore?: string
  conditionAfter?: string
  otherPersonnel?: string
  nextServiceDate: string
  engineerInCharge: {
    name: string
    phone: string
  }
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

class ApiService {

  async getSalesHeatmap() {
    const res = await this.makeRequest("/dashboard/heatmap/sales");
    return res.data; // assuming response has { success, data }
  }
  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    let token = authService.getAccessToken();
    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    // If unauthorized, try to refresh the token and retry once
    if (response.status === 401) {
      const refreshToken = authService.getRefreshToken && authService.getRefreshToken();
      if (refreshToken) {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshData.tokens || {};
          if (newAccessToken && newRefreshToken) {
            authService.setTokens && authService.setTokens(newAccessToken, newRefreshToken);
            token = newAccessToken;
            // Retry the original request with the new token
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
              ...options,
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...options.headers,
              },
            });
          }
        } else {
          // Refresh failed, log out
          authService.logout && authService.logout();
        }
      } else {
        // No refresh token, log out
        authService.logout && authService.logout();
      }
    }

    if (!response.ok) {
      // Try to parse error response for better debugging
      let errorMsg = response.statusText;
      let fullErrorData = null;
      try {
        const errorData = await response.json();
        fullErrorData = errorData;
        console.error('Backend error response:', errorData);
        if (errorData && errorData.message) {
          errorMsg = errorData.message;
        }
        if (errorData && errorData.error) {
          errorMsg += ": " + errorData.error;
        }
        if (errorData && errorData.errors) {
          errorMsg += ": " + JSON.stringify(errorData.errors);
        }
        if (errorData && errorData.details) {
          errorMsg += " - " + JSON.stringify(errorData.details);
        }
      } catch {
        // ignore JSON parse errors
      }
      throw new Error(`API request failed: ${errorMsg}`);
    }

    return response.json();
  }

  async getDashboardOverview(startDate?: string, endDate?: string, region?: string): Promise<any> {
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)
    if (region) params.append("region", region)

    return this.makeRequest(`/dashboard/overview?${params.toString()}`)
  }

  async getRecentActivity(limit = 20): Promise<any> {
    return this.makeRequest(`/dashboard/recent-activity?limit=${limit}`)
  }

  async getPerformanceMetrics(startDate?: string, endDate?: string, region?: string): Promise<any> {
    const params = new URLSearchParams()
    if (startDate) params.append("startDate", startDate)
    if (endDate) params.append("endDate", endDate)
    if (region) params.append("region", region)

    return this.makeRequest(`/dashboard/performance?${params.toString()}`)
  }

  async getTrails(page = 1, limit = 20, startDate?: string, endDate?: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await this.makeRequest(`/trails?${params.toString()}`)
      
      // Cache successful response
      if (response && Array.isArray(response.data)) {
        await offlineStorage.cacheTrails(response.data)
      }
      
      return response
    } catch (error) {
      console.warn('Failed to fetch trails from server, using cached data:', error)
      
      // Return cached data if offline
      const cachedTrails = await offlineStorage.getCachedTrails()
      return {
        data: cachedTrails,
        _fromCache: true,
        _cacheTimestamp: Date.now()
      }
    }
  }

  async getVisits(page = 1, limit = 20, startDate?: string, endDate?: string): Promise<any> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await this.makeRequest(`/visits?${params.toString()}`)
      
      // Cache successful response
      if (response && Array.isArray(response.data)) {
        await offlineStorage.cacheVisits(response.data)
      }
      
      return response
    } catch (error) {
      console.warn('Failed to fetch visits from server, using cached data:', error)
      
      // Return cached data if offline
      const cachedVisits = await offlineStorage.getCachedVisits()
      return {
        data: cachedVisits,
        _fromCache: true,
        _cacheTimestamp: Date.now()
      }
    }
  }

  async createTrail(trailData: Omit<Trail, "id">): Promise<Trail> {
    try {
      const response = await this.makeRequest("/trails", {
        method: "POST",
        body: JSON.stringify(trailData),
      })
      return response
    } catch (error) {
      console.warn('Failed to create trail online, saving offline:', error)
      
      // If offline, store in pending sync
      await offlineStorage.addToPendingSync('trails', trailData)
      
      // Return a mock response with offline indicator
      return {
        ...trailData,
        id: `offline_trail_${Date.now()}`,
        _createdOffline: true
      } as Trail
    }
  }

  async createVisit(visitData: Omit<Visit, "id">): Promise<Visit> {
    // Check if we're actually online before attempting API call
    if (!navigator.onLine) {
      console.log('Device is offline, saving visit locally')
      await offlineStorage.addToPendingSync('visits', visitData)
      return {
        ...visitData,
        id: `offline_visit_${Date.now()}`,
        _createdOffline: true
      } as Visit
    }

    try {
      // Build payload matching backend minimal structure
      const payload: any = {
        date: visitData.date,
        startTime: visitData.startTime,
        client: {
          name: visitData.client.name,
          type: visitData.client.type,
          location: visitData.client.location,
        },
        visitPurpose: visitData.visitPurpose,
        visitOutcome: visitData.visitOutcome || 'pending',
      };

      // Add level to client if it exists
      if ((visitData.client as any).level) {
        payload.client.level = (visitData.client as any).level;
      }

      // Add notes if provided
      if (visitData.notes && visitData.notes.trim() !== '') {
        payload.notes = visitData.notes;
      }

      // Add customData if provided
      if ((visitData as any).customData && (visitData as any).customData.trim() !== '') {
        payload.customData = (visitData as any).customData;
      }

      // Add contacts only if they exist and are valid
      if (visitData.contacts && visitData.contacts.length > 0) {
        const validContacts = visitData.contacts.filter(c => c.name && c.name.trim() !== '');
        if (validContacts.length > 0) {
          payload.contacts = validContacts.map(c => {
            const contact: any = {
              name: c.name,
              role: c.role || 'other',
            };
            if (c.phone && c.phone.trim() !== '') contact.phone = c.phone;
            if (c.email && c.email.trim() !== '') contact.email = c.email;
            return contact;
          });
        }
      }

      // Add other optional fields only if they have meaningful values
      if (visitData.endTime) payload.endTime = visitData.endTime;
      if (visitData.duration) payload.duration = visitData.duration;
      if (visitData.isFollowUpRequired !== undefined) payload.isFollowUpRequired = visitData.isFollowUpRequired;
      if (visitData.nextVisitDate) payload.nextVisitDate = visitData.nextVisitDate;
      if (visitData.totalPotentialValue) payload.totalPotentialValue = visitData.totalPotentialValue;
      if (visitData.competitorActivity && visitData.competitorActivity.trim() !== '') {
        payload.competitorActivity = visitData.competitorActivity;
      }
      if (visitData.marketInsights && visitData.marketInsights.trim() !== '') {
        payload.marketInsights = visitData.marketInsights;
      }
      
      // Add array fields if they exist
      if (visitData.existingEquipment && visitData.existingEquipment.length > 0) {
        payload.existingEquipment = visitData.existingEquipment;
      }
      if (visitData.requestedEquipment && visitData.requestedEquipment.length > 0) {
        payload.requestedEquipment = visitData.requestedEquipment;
      }
      if (visitData.followUpActions && visitData.followUpActions.length > 0) {
        payload.followUpActions = visitData.followUpActions;
      }
      if (visitData.tags && visitData.tags.length > 0) {
        payload.tags = visitData.tags;
      }
      if (visitData.photos && visitData.photos.length > 0) {
        payload.photos = visitData.photos;
      }
      if (visitData.attachments && visitData.attachments.length > 0) {
        payload.attachments = visitData.attachments;
      }
      
      console.log('Creating visit online with payload:', payload)
      const response = await this.makeRequest("/visits", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log('Visit created successfully:', response)
      return response
    } catch (error: any) {
      console.error('Failed to create visit online:', error)
      // If we're here and online, it means the API call failed
      // Don't save to offline storage - throw the error to show to user
      throw new Error(error.message || 'Failed to create visit. Please check your connection and try again.')
    }
  }

  async createEngineerVisit(visitData: any): Promise<any> {
    try {
      // Engineer visit data structure as used in the form
      return await this.makeRequest("/engineering-services", {
        method: "POST",
        body: JSON.stringify(visitData),
      });
    } catch (error) {
      console.warn('Failed to create engineer visit online, saving offline:', error)
      
      // If offline, store in pending sync
      await offlineStorage.addToPendingSync('engineerVisits', visitData)
      
      // Return a mock response with offline indicator
      const engineerVisit = {
        id: `offline_engineer_visit_${Date.now()}`,
        date: visitData.date,
        startTime: visitData.startTime,
        client: {
          name: visitData.clientName,
          type: "Engineer Visit",
          location: visitData.clientLocation,
        },
        visitPurpose: visitData.visitPurpose,
        contacts: visitData.contacts || [],
        _createdOffline: true
      }
      
      return engineerVisit
    }
  }

  // Create a new engineering service record (frontend form calls this)
  async createEngineeringService(serviceData: Partial<EngineeringService>): Promise<EngineeringService> {
    return this.makeRequest("/engineering-services", {
      method: "POST",
      body: JSON.stringify(serviceData),
    });
  }

  // Fetch paginated engineering services
  async getEngineeringServices(page = 1, limit = 20, filters: Record<string, string> = {}): Promise<any> {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
    Object.entries(filters).forEach(([k, v]) => params.append(k, v))
    return this.makeRequest(`/engineering-services?${params.toString()}`)
  }

  // Get a single engineering service by id
  async getEngineeringServiceById(id: string): Promise<EngineeringService> {
    return this.makeRequest(`/engineering-services/${id}`)
  }

  async deleteVisit(visitId: string): Promise<void> {
    return this.makeRequest(`/visits/${visitId}`, {
      method: "DELETE",
    })
  }

  async deleteTrail(trailId: string): Promise<void> {
    return this.makeRequest(`/trails/${trailId}`, {
      method: "DELETE",
    })
  }

  async updateVisit(visitId: string, visitData: Partial<Visit>): Promise<Visit> {
    return this.makeRequest(`/visits/${visitId}`, {
      method: "PUT",
      body: JSON.stringify(visitData),
    })
  }

  async updateTrail(trailId: string, trailData: Partial<Trail>): Promise<Trail> {
    return this.makeRequest(`/trails/${trailId}`, {
      method: "PUT",
      body: JSON.stringify(trailData),
    })
  }
}

export const apiService = new ApiService()
