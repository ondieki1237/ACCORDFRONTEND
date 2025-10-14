/**
 * Service Worker for Background Trail Tracking
 * Handles location tracking when the app is in the background
 */

const CACHE_NAME = 'accord-trail-cache-v1'
const BACKGROUND_SYNC_TAG = 'trail-background-sync'

// Install service worker
self.addEventListener('install', (event) => {
  console.log('🔧 Trail Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/app/page.tsx',
        '/components/trails/create-trail-form.tsx'
      ])
    })
  )
  
  // Force activation immediately
  self.skipWaiting()
})

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('✅ Trail Service Worker activated')
  
  event.waitUntil(
    // Clean up old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  // Take control of all pages immediately
  return self.clients.claim()
})

// Handle background sync for trail data
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag)
  
  if (event.tag === BACKGROUND_SYNC_TAG) {
    event.waitUntil(syncTrailData())
  }
})

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'START_BACKGROUND_TRACKING':
      handleStartBackgroundTracking(data)
      break
    case 'STOP_BACKGROUND_TRACKING':
      handleStopBackgroundTracking()
      break
    case 'UPDATE_LOCATION':
      handleLocationUpdate(data)
      break
    case 'PING':
      event.source.postMessage({ type: 'PONG', timestamp: Date.now() })
      break
    default:
      console.log('Unknown message type:', type)
  }
})

// Handle network requests
self.addEventListener('fetch', (event) => {
  // Only handle trail-related API requests
  if (event.request.url.includes('/api/trails')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If network fails, store request for background sync
        return storeFailedRequest(event.request)
      })
    )
  }
})

// Background tracking functions
async function handleStartBackgroundTracking(sessionData) {
  console.log('🚀 Starting background tracking for session:', sessionData.id)
  
  try {
    // Store session data
    await storeTrackingSession(sessionData)
    
    // Register for background sync
    await self.registration.sync.register(BACKGROUND_SYNC_TAG)
    
    // Notify all clients
    notifyClients('BACKGROUND_TRACKING_STARTED', sessionData)
    
  } catch (error) {
    console.error('Failed to start background tracking:', error)
    notifyClients('BACKGROUND_TRACKING_ERROR', { error: error.message })
  }
}

async function handleStopBackgroundTracking() {
  console.log('🛑 Stopping background tracking')
  
  try {
    // Get stored session
    const session = await getStoredTrackingSession()
    
    if (session) {
      // Save final trail data
      await saveFinalTrailData(session)
      
      // Clear stored session
      await clearStoredTrackingSession()
      
      // Notify clients
      notifyClients('BACKGROUND_TRACKING_STOPPED', session)
    }
    
  } catch (error) {
    console.error('Failed to stop background tracking:', error)
    notifyClients('BACKGROUND_TRACKING_ERROR', { error: error.message })
  }
}

async function handleLocationUpdate(locationData) {
  try {
    // Get current session
    const session = await getStoredTrackingSession()
    
    if (session && session.isActive) {
      // Add new location point
      session.coordinates.push([locationData.latitude, locationData.longitude])
      session.lastUpdate = Date.now()
      
      // Store updated session
      await storeTrackingSession(session)
      
      // Notify clients of update
      notifyClients('LOCATION_UPDATED', {
        sessionId: session.id,
        pointsRecorded: session.coordinates.length,
        lastLocation: [locationData.latitude, locationData.longitude]
      })
      
      console.log(`📍 Background location update: ${session.coordinates.length} points recorded`)
    }
    
  } catch (error) {
    console.error('Failed to handle location update:', error)
  }
}

// Data persistence functions
async function storeTrackingSession(session) {
  const db = await openDatabase()
  const transaction = db.transaction(['sessions'], 'readwrite')
  const store = transaction.objectStore('sessions')
  
  return new Promise((resolve, reject) => {
    const request = store.put(session, 'current')
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function getStoredTrackingSession() {
  const db = await openDatabase()
  const transaction = db.transaction(['sessions'], 'readonly')
  const store = transaction.objectStore('sessions')
  
  return new Promise((resolve, reject) => {
    const request = store.get('current')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function clearStoredTrackingSession() {
  const db = await openDatabase()
  const transaction = db.transaction(['sessions'], 'readwrite')
  const store = transaction.objectStore('sessions')
  
  return new Promise((resolve, reject) => {
    const request = store.delete('current')
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AccordTrailDB', 1)
    
    request.onupgradeneeded = () => {
      const db = request.result
      
      // Create sessions store
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions')
      }
      
      // Create failed requests store
      if (!db.objectStoreNames.contains('failedRequests')) {
        const store = db.createObjectStore('failedRequests', { autoIncrement: true })
        store.createIndex('timestamp', 'timestamp')
      }
    }
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Background sync functions
async function syncTrailData() {
  console.log('🔄 Syncing trail data in background...')
  
  try {
    // Get current tracking session
    const session = await getStoredTrackingSession()
    
    if (session && session.coordinates.length > 0) {
      // Prepare trail data for API
      const trailData = {
        date: new Date(session.startTime).toISOString().split('T')[0],
        startTime: new Date(session.startTime).toISOString(),
        endTime: new Date().toISOString(),
        path: { coordinates: session.coordinates },
        stops: session.stops || [],
        deviceInfo: {
          deviceId: `ServiceWorker-${session.id}`,
          type: 'Background-Tracker',
          userAgent: navigator.userAgent,
          pointsRecorded: session.coordinates.length,
          backgroundSync: true
        }
      }
      
      // Attempt to save to API
      const response = await fetch('https://accordbackend.onrender.com/api/trails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getStoredAuthToken()}`
        },
        body: JSON.stringify(trailData)
      })
      
      if (response.ok) {
        console.log('✅ Trail data synced successfully')
        await clearStoredTrackingSession()
        notifyClients('TRAIL_SYNCED', trailData)
      } else {
        throw new Error(`Sync failed: ${response.status}`)
      }
    }
    
    // Also sync any failed requests
    await syncFailedRequests()
    
  } catch (error) {
    console.error('Background sync failed:', error)
    // Will retry automatically
  }
}

async function syncFailedRequests() {
  const db = await openDatabase()
  const transaction = db.transaction(['failedRequests'], 'readwrite')
  const store = transaction.objectStore('failedRequests')
  
  return new Promise((resolve) => {
    const request = store.getAll()
    request.onsuccess = async () => {
      const failedRequests = request.result
      
      for (const failedRequest of failedRequests) {
        try {
          const response = await fetch(failedRequest.url, failedRequest.options)
          if (response.ok) {
            // Remove successfully synced request
            store.delete(failedRequest.id)
          }
        } catch (error) {
          console.log('Failed request still failing:', error)
        }
      }
      
      resolve()
    }
  })
}

// Utility functions
async function getStoredAuthToken() {
  // Try to get auth token from various storage methods
  try {
    const clients = await self.clients.matchAll()
    if (clients.length > 0) {
      // Request token from active client
      return new Promise((resolve) => {
        clients[0].postMessage({ type: 'GET_AUTH_TOKEN' })
        
        // Listen for response
        const messageHandler = (event) => {
          if (event.data.type === 'AUTH_TOKEN_RESPONSE') {
            self.removeEventListener('message', messageHandler)
            resolve(event.data.token)
          }
        }
        
        self.addEventListener('message', messageHandler)
        
        // Timeout after 5 seconds
        setTimeout(() => {
          self.removeEventListener('message', messageHandler)
          resolve(null)
        }, 5000)
      })
    }
  } catch (error) {
    console.error('Failed to get auth token:', error)
  }
  
  return null
}

async function storeFailedRequest(request) {
  const db = await openDatabase()
  const transaction = db.transaction(['failedRequests'], 'readwrite')
  const store = transaction.objectStore('failedRequests')
  
  const failedRequest = {
    url: request.url,
    options: {
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: await request.text()
    },
    timestamp: Date.now()
  }
  
  return new Promise((resolve, reject) => {
    const req = store.add(failedRequest)
    req.onsuccess = () => resolve(new Response('Request stored for later sync'))
    req.onerror = () => reject(req.error)
  })
}

async function saveFinalTrailData(session) {
  if (session.coordinates.length < 2) {
    console.log('Insufficient data for trail save')
    return
  }
  
  const trailData = {
    date: new Date(session.startTime).toISOString().split('T')[0],
    startTime: new Date(session.startTime).toISOString(),
    endTime: new Date().toISOString(),
    path: { coordinates: session.coordinates },
    stops: session.stops || [],
    deviceInfo: {
      deviceId: `Background-${session.id}`,
      type: 'Background-Completed',
      pointsRecorded: session.coordinates.length,
      duration: Date.now() - session.startTime
    }
  }
  
  try {
    const response = await fetch('https://accordbackend.onrender.com/api/trails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getStoredAuthToken()}`
      },
      body: JSON.stringify(trailData)
    })
    
    if (response.ok) {
      console.log('✅ Final trail data saved successfully')
    } else {
      // Store for background sync
      await self.registration.sync.register(BACKGROUND_SYNC_TAG)
    }
  } catch (error) {
    console.error('Failed to save final trail data:', error)
    // Will be retried in background sync
  }
}

function notifyClients(type, data) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type, data, timestamp: Date.now() })
    })
  })
}

console.log('🔧 Trail Service Worker loaded and ready')