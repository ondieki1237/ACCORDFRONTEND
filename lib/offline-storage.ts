/**
 * Offline Storage Service
 * Handles local caching of user data, visits, trails, and sync functionality
 */

import { Preferences } from '@capacitor/preferences'

export interface CachedData {
  user: any
  visits: any[]
  trails: any[]
  leads: any[]
  followUpVisits: any[]
  lastSyncTime: number
  pendingSync: {
    visits: any[]
    trails: any[]
    engineerVisits: any[]
    leads: any[]
    followUpVisits: any[]
  }
}

export interface OfflineStatus {
  isOffline: boolean
  lastOnlineTime: number
  pendingItems: number
}

class OfflineStorageService {
  private static readonly KEYS = {
    USER_DATA: 'accord_user_data',
    VISITS_CACHE: 'accord_visits_cache',
    TRAILS_CACHE: 'accord_trails_cache',
    LEADS_CACHE: 'accord_leads_cache',
    PENDING_SYNC: 'accord_pending_sync',
    LAST_SYNC: 'accord_last_sync',
    OFFLINE_STATUS: 'accord_offline_status'
  }

  private listeners: Set<(data: CachedData) => void> = new Set()
  private statusListeners: Set<(status: OfflineStatus) => void> = new Set()

  /**
   * Initialize offline storage and check connection
   */
  async initialize(): Promise<void> {
    // Set up online/offline listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this))
      window.addEventListener('offline', this.handleOffline.bind(this))
    }

    // Update initial status
    await this.updateOfflineStatus()
  }

  /**
   * Cache user data
   */
  async cacheUserData(user: any): Promise<void> {
    await Preferences.set({
      key: OfflineStorageService.KEYS.USER_DATA,
      value: JSON.stringify(user)
    })
  }

  /**
   * Get cached user data
   */
  async getCachedUserData(): Promise<any | null> {
    try {
      const { value } = await Preferences.get({ key: OfflineStorageService.KEYS.USER_DATA })
      return value ? JSON.parse(value) : null
    } catch (error) {
      console.error('Error getting cached user data:', error)
      return null
    }
  }

  /**
   * Cache visits data
   */
  async cacheVisits(visits: any[]): Promise<void> {
    await Preferences.set({
      key: OfflineStorageService.KEYS.VISITS_CACHE,
      value: JSON.stringify({
        data: visits,
        timestamp: Date.now()
      })
    })
    this.notifyDataUpdate()
  }

  /**
   * Get cached visits
   */
  async getCachedVisits(): Promise<any[]> {
    try {
      const { value } = await Preferences.get({ key: OfflineStorageService.KEYS.VISITS_CACHE })
      if (value) {
        const cached = JSON.parse(value)
        return cached.data || []
      }
      return []
    } catch (error) {
      console.error('Error getting cached visits:', error)
      return []
    }
  }

  /**
   * Cache trails data
   */
  async cacheTrails(trails: any[]): Promise<void> {
    await Preferences.set({
      key: OfflineStorageService.KEYS.TRAILS_CACHE,
      value: JSON.stringify({
        data: trails,
        timestamp: Date.now()
      })
    })
    this.notifyDataUpdate()
  }

  /**
   * Get cached trails
   */
  async getCachedTrails(): Promise<any[]> {
    try {
      const { value } = await Preferences.get({ key: OfflineStorageService.KEYS.TRAILS_CACHE })
      if (value) {
        const cached = JSON.parse(value)
        return cached.data || []
      }
      return []
    } catch (error) {
      console.error('Error getting cached trails:', error)
      return []
    }
  }

  /**
   * Cache leads data
   */
  async cacheLeads(leads: any[]): Promise<void> {
    await Preferences.set({
      key: OfflineStorageService.KEYS.LEADS_CACHE,
      value: JSON.stringify({
        data: leads,
        timestamp: Date.now()
      })
    })
    this.notifyDataUpdate()
  }

  /**
   * Get cached leads
   */
  async getCachedLeads(): Promise<any[]> {
    try {
      const { value } = await Preferences.get({ key: OfflineStorageService.KEYS.LEADS_CACHE })
      if (value) {
        const cached = JSON.parse(value)
        return cached.data || []
      }
      return []
    } catch (error) {
      console.error('Error getting cached leads:', error)
      return []
    }
  }

  /**
   * Cache follow-up visits data
   */
  async cacheFollowUpVisits(followUpVisits: any[]): Promise<void> {
    await Preferences.set({
      key: 'accord_followup_visits_cache',
      value: JSON.stringify({
        data: followUpVisits,
        timestamp: Date.now()
      })
    })
    this.notifyDataUpdate()
  }

  /**
   * Get cached follow-up visits
   */
  async getCachedFollowUpVisits(): Promise<any[]> {
    try {
      const { value } = await Preferences.get({ key: 'accord_followup_visits_cache' })
      if (value) {
        const cached = JSON.parse(value)
        return cached.data || []
      }
      return []
    } catch (error) {
      console.error('Error getting cached follow-up visits:', error)
      return []
    }
  }

  /**
   * Add item to pending sync queue
   */
  async addToPendingSync(type: 'visits' | 'trails' | 'engineerVisits' | 'leads' | 'followUpVisits' | 'machines', data: any): Promise<void> {
    try {
      const pending = await this.getPendingSync()
      pending[type].push({
        ...data,
        _offlineId: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        _createdOffline: true,
        _timestamp: Date.now()
      })

      await Preferences.set({
        key: OfflineStorageService.KEYS.PENDING_SYNC,
        value: JSON.stringify(pending)
      })

      await this.updateOfflineStatus()
      this.notifyDataUpdate()
    } catch (error) {
      console.error('Error adding to pending sync:', error)
    }
  }

  /**
   * Get pending sync items
   */
  async getPendingSync(): Promise<{ visits: any[], trails: any[], engineerVisits: any[], leads: any[], followUpVisits: any[], machines: any[] }> {
    try {
      const { value } = await Preferences.get({ key: OfflineStorageService.KEYS.PENDING_SYNC })
      const data = value ? JSON.parse(value) : { visits: [], trails: [], engineerVisits: [], leads: [], followUpVisits: [], machines: [] }
      return {
        visits: data.visits || [],
        trails: data.trails || [],
        engineerVisits: data.engineerVisits || [],
        leads: data.leads || [],
        followUpVisits: data.followUpVisits || [],
        machines: data.machines || []
      }
    } catch (error) {
      console.error('Error getting pending sync:', error)
      return { visits: [], trails: [], engineerVisits: [], leads: [], followUpVisits: [], machines: [] }
    }
  }

  /**
   * Clear pending sync items
   */
  async clearPendingSync(type?: 'visits' | 'trails' | 'engineerVisits' | 'leads' | 'followUpVisits' | 'machines'): Promise<void> {
    try {
      if (type) {
        const pending = await this.getPendingSync()
        pending[type] = []
        await Preferences.set({
          key: OfflineStorageService.KEYS.PENDING_SYNC,
          value: JSON.stringify(pending)
        })
      } else {
        await Preferences.remove({ key: OfflineStorageService.KEYS.PENDING_SYNC })
      }

      await this.updateOfflineStatus()
    } catch (error) {
      console.error('Error clearing pending sync:', error)
    }
  }

  /**
   * Get all cached data at once
   */
  async getAllCachedData(): Promise<CachedData> {
    const [user, visits, trails, leads, followUpVisits, pending, lastSync] = await Promise.all([
      this.getCachedUserData(),
      this.getCachedVisits(),
      this.getCachedTrails(),
      this.getCachedLeads(),
      this.getCachedFollowUpVisits(),
      this.getPendingSync(),
      this.getLastSyncTime()
    ])

    return {
      user,
      visits,
      trails,
      leads,
      followUpVisits,
      lastSyncTime: lastSync,
      pendingSync: pending
    }
  }

  /**
   * Get offline status
   */
  async getOfflineStatus(): Promise<OfflineStatus> {
    try {
      const { value } = await Preferences.get({ key: OfflineStorageService.KEYS.OFFLINE_STATUS })
      if (value) {
        return JSON.parse(value)
      }
    } catch (error) {
      console.error('Error getting offline status:', error)
    }

    return {
      isOffline: typeof window !== 'undefined' ? !navigator.onLine : true,
      lastOnlineTime: Date.now(),
      pendingItems: 0
    }
  }

  /**
   * Update offline status
   */
  private async updateOfflineStatus(): Promise<void> {
    const pending = await this.getPendingSync()
    const pendingCount = (pending?.visits?.length || 0) +
      (pending?.trails?.length || 0) +
      (pending?.engineerVisits?.length || 0) +
      (pending?.leads?.length || 0) +
      (pending?.followUpVisits?.length || 0) +
      (pending?.machines?.length || 0)

    const isOnline = typeof window !== 'undefined' && navigator.onLine
    const status: OfflineStatus = {
      isOffline: !isOnline,
      lastOnlineTime: isOnline ? Date.now() : (await this.getOfflineStatus()).lastOnlineTime,
      pendingItems: pendingCount
    }

    await Preferences.set({
      key: OfflineStorageService.KEYS.OFFLINE_STATUS,
      value: JSON.stringify(status)
    })

    this.notifyStatusUpdate(status)
  }

  /**
   * Handle going online
   */
  private async handleOnline(): Promise<void> {
    console.log('📶 Connection restored - syncing offline data...')
    await this.updateOfflineStatus()

    // Trigger sync (will be implemented by API service)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('accord:online', {
        detail: await this.getPendingSync()
      }))
    }
  }

  /**
   * Handle going offline
   */
  private async handleOffline(): Promise<void> {
    console.log('📵 Connection lost - switching to offline mode...')
    await this.updateOfflineStatus()
  }

  /**
   * Get last sync time
   */
  async getLastSyncTime(): Promise<number> {
    try {
      const { value } = await Preferences.get({ key: OfflineStorageService.KEYS.LAST_SYNC })
      return value ? parseInt(value) : 0
    } catch (error) {
      return 0
    }
  }

  /**
   * Update last sync time
   */
  async updateLastSyncTime(): Promise<void> {
    await Preferences.set({
      key: OfflineStorageService.KEYS.LAST_SYNC,
      value: Date.now().toString()
    })
  }

  /**
   * Subscribe to data updates
   */
  onDataUpdate(listener: (data: CachedData) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  /**
   * Subscribe to status updates
   */
  subscribeToStatus(listener: (status: OfflineStatus) => void): () => void {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  /**
   * Notify listeners of data updates
   */
  private async notifyDataUpdate(): Promise<void> {
    const data = await this.getAllCachedData()
    this.listeners.forEach(listener => listener(data))
  }

  /**
   * Notify listeners of status updates
   */
  private notifyStatusUpdate(status: OfflineStatus): void {
    this.statusListeners.forEach(listener => listener(status))
  }

  /**
   * Clear all cached data (for logout)
   */
  async clearAllCache(): Promise<void> {
    const keys = Object.values(OfflineStorageService.KEYS)
    await Promise.all(keys.map(key => Preferences.remove({ key })))
  }

  /**
   * Get cache size and statistics
   */
  async getCacheStats(): Promise<{
    userDataSize: number
    visitsCount: number
    trailsCount: number
    leadsCount: number
    pendingCount: number
    lastSync: Date | null
  }> {
    const [user, visits, trails, leads, pending, lastSync] = await Promise.all([
      this.getCachedUserData(),
      this.getCachedVisits(),
      this.getCachedTrails(),
      this.getCachedLeads(),
      this.getPendingSync(),
      this.getLastSyncTime()
    ])

    return {
      userDataSize: user ? JSON.stringify(user).length : 0,
      visitsCount: visits.length,
      trailsCount: trails.length,
      leadsCount: leads.length,
      pendingCount: (pending?.visits?.length || 0) +
        (pending?.trails?.length || 0) +
        (pending?.engineerVisits?.length || 0) +
        (pending?.leads?.length || 0) +
        (pending?.followUpVisits?.length || 0) +
        (pending?.machines?.length || 0),
      lastSync: lastSync ? new Date(lastSync) : null
    }
  }

  /**
   * Remove a specific item from pending sync
   */
  async removeFromPending(type: 'visits' | 'trails' | 'engineerVisits' | 'leads' | 'followUpVisits' | 'machines', offlineId: string): Promise<void> {
    try {
      const pending = await this.getPendingSync()
      pending[type] = pending[type].filter(item => item._offlineId !== offlineId)

      await Preferences.set({
        key: OfflineStorageService.KEYS.PENDING_SYNC,
        value: JSON.stringify(pending)
      })

      await this.updateOfflineStatus()
      this.notifyDataUpdate()
    } catch (error) {
      console.error('Error removing from pending sync:', error)
    }
  }

  // Sync all pending data when online
  async syncPendingData(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.onLine) {
      throw new Error('Cannot sync while offline')
    }

    const { apiService } = await import('./api')
    const pending = await this.getPendingSync()
    const types: ('visits' | 'trails' | 'engineerVisits' | 'leads' | 'followUpVisits' | 'machines')[] =
      ['visits', 'trails', 'engineerVisits', 'leads', 'followUpVisits', 'machines']

    let anySuccess = false

    for (const type of types) {
      const items = [...pending[type]]
      if (items.length === 0) continue

      console.log(`🔄 Syncing ${items.length} ${type}...`)

      for (const item of items) {
        try {
          // Attempt to create the item online
          // We set skipOfflineSave to true to avoid circular loops
          let response: any

          if (type === 'visits') response = await apiService.createVisit(item, true)
          else if (type === 'trails') response = await apiService.createTrail(item, true)
          else if (type === 'engineerVisits') response = await apiService.createEngineerVisit(item, true)
          else if (type === 'leads') response = await apiService.createLead(item, true)
          else if (type === 'followUpVisits') response = await apiService.createFollowUpVisit(item, true)
          else if (type === 'machines') response = await apiService.createMachine(item, true)

          // If successful, remove from pending
          await this.removeFromPending(type, item._offlineId)
          anySuccess = true

          console.log(`✅ Successfully synced ${type} item:`, item._offlineId)
        } catch (error) {
          console.error(`❌ Failed to sync ${type} item ${item._offlineId}:`, error)
          // Continue with next item instead of stopping the whole process
        }
      }
    }

    if (anySuccess) {
      // Update last sync time
      await this.updateLastSyncTime()
      // Note: addToPendingSync/removeFromPending already call updateOfflineStatus and notifyDataUpdate
    }
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorageService()