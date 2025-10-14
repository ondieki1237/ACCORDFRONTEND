import { authService } from "../auth"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://accordbackend.onrender.com/api"

async function makeRequest(path: string, options: RequestInit = {}) {
  const token = authService.getAccessToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (!res.ok) {
    let msg = res.statusText
    try {
      const data = await res.json()
      if (data && data.message) msg = data.message
    } catch {}
    throw new Error(`Request failed: ${msg}`)
  }

  return res.json()
}

// Assign a service to a user (admin action). Example usage:
// import { assignService } from '@/lib/api/engineeringService'
// await assignService('650a1b2c3d4e5f67890abcde', { assignedTo: 'userId' })
export async function assignService(serviceId: string, payload: { assignedTo: string; notes?: string }) {
  return makeRequest(`/engineering-services/${serviceId}/assign`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

// Get services assigned to the current authenticated user
export async function getAssignedServices(page = 1, limit = 20) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return makeRequest(`/engineering-services/assigned?${params.toString()}`)
}

// Get single engineering service by id
export async function getServiceById(id: string) {
  return makeRequest(`/engineering-services/${id}`)
}

// Get services assigned to a specific engineer (paginated)
export async function getServicesByEngineer(engineerId: string, page = 1, limit = 50) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  return makeRequest(`/engineering-services/engineer/${engineerId}?${params.toString()}`)
}

// Fetch services for the authenticated user using the /mine endpoint
// Example: fetchMyServices({ page: 1, limit: 20, startDate: '2025-01-01', endDate: '2025-12-31' })
export async function fetchMyServices(query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams()
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") params.append(k, String(v))
  })
  return makeRequest(`/engineering-services/mine?${params.toString()}`)
}

export default {
  assignService,
  getAssignedServices,
  getServiceById,
  getServicesByEngineer,
  fetchMyServices,
}
