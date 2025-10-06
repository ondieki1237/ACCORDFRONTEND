/**
 * Service Worker Registration Component
 * Registers the trail tracking service worker
 */

"use client"

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/trail-sw.js')
        .then((registration) => {
          console.log('🔧 Trail Service Worker registered:', registration)
          
          // Listen for service worker messages
          navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, data } = event.data
            
            switch (type) {
              case 'TRAIL_SYNCED':
                console.log('✅ Trail synced in background:', data)
                break
              case 'BACKGROUND_TRACKING_ERROR':
                console.error('❌ Background tracking error:', data)
                break
              case 'GET_AUTH_TOKEN':
                // Send auth token to service worker
                const token = localStorage.getItem('accessToken')
                event.source?.postMessage({
                  type: 'AUTH_TOKEN_RESPONSE',
                  token
                })
                break
              default:
                console.log('SW Message:', type, data)
            }
          })
        })
        .catch((error) => {
          console.warn('Service Worker registration failed:', error)
        })
    }
  }, [])

  return null // This component doesn't render anything
}