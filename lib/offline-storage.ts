/**
 * Offline Storage Service
 * Handles local caching of user data, visits, trails, and sync functionality
 */

import { Preferences } from '@capacitor/preferences'

export interface CachedData {
  user: any
  visits: any[]
  trails: any[]
  lastSyncTime: number
  pendingSync: {
    visits: any[]
    trails: any[]
    engineerVisits: any[]
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
   * Add item to pending sync queue
   */
  async addToPendingSync(type: 'visits' | 'trails' | 'engineerVisits', data: any): Promise<void> {
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
  async getPendingSync(): Promise<{ visits: any[], trails: any[], engineerVisits: any[] }> {
    try {
      const { value } = await Preferences.get({ key: OfflineStorageService.KEYS.PENDING_SYNC })
      if (value) {
        return JSON.parse(value)
      }
      return { visits: [], trails: [], engineerVisits: [] }
    } catch (error) {
      console.error('Error getting pending sync:', error)
      return { visits: [], trails: [], engineerVisits: [] }
    }
  }

  /**
   * Clear pending sync items
   */
  async clearPendingSync(type?: 'visits' | 'trails' | 'engineerVisits'): Promise<void> {
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
   * Get all cached data
   */
  async getAllCachedData(): Promise<CachedData> {
    const [user, visits, trails, pending, lastSync] = await Promise.all([
      this.getCachedUserData(),
      this.getCachedVisits(),
      this.getCachedTrails(),
      this.getPendingSync(),
      this.getLastSyncTime()
    ])

    return {
      user,
      visits,
      trails,
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
    const pendingCount = pending.visits.length + pending.trails.length + pending.engineerVisits.length
    
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
  subscribe(listener: (data: CachedData) => void): () => void {
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
    pendingCount: number
    lastSync: Date | null
  }> {
    const [user, visits, trails, pending, lastSync] = await Promise.all([
      this.getCachedUserData(),
      this.getCachedVisits(),
      this.getCachedTrails(),
      this.getPendingSync(),
      this.getLastSyncTime()
    ])

    return {
      userDataSize: user ? JSON.stringify(user).length : 0,
      visitsCount: visits.length,
      trailsCount: trails.length,
      pendingCount: pending.visits.length + pending.trails.length + pending.engineerVisits.length,
      lastSync: lastSync ? new Date(lastSync) : null
    }
  }

  // Sync all pending data when online
  async syncPendingData(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.onLine) {
      throw new Error('Cannot sync while offline')
    }

    const apiService = await import('./api').then(m => m.apiService)
    const pending = await this.getPendingSync()
    
    // Sync visits
    for (const visit of pending.visits) {
      try {
        await apiService.createVisit(visit)
        // Remove from pending list after successful sync
      } catch (error) {
        console.error('Failed to sync visit:', error)
        throw error
      }
    }

    // Sync trails  
    for (const trail of pending.trails) {
      try {
        await apiService.createTrail(trail)
        // Remove from pending list after successful sync
      } catch (error) {
        console.error('Failed to sync trail:', error)
        throw error
      }
    }

    // Sync engineer visits
    for (const visit of pending.engineerVisits) {
      try {
        await apiService.createEngineerVisit(visit)
        // Remove from pending list after successful sync
      } catch (error) {
        console.error('Failed to sync engineer visit:', error)
        throw error
      }
    }

    // Clear all pending data after successful sync
    await Preferences.set({
      key: OfflineStorageService.KEYS.PENDING_SYNC,
      value: JSON.stringify({ visits: [], trails: [], engineerVisits: [] })
    })

    // Update last sync time
    await Preferences.set({
      key: OfflineStorageService.KEYS.LAST_SYNC,
      value: Date.now().toString()
    })
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorageService()