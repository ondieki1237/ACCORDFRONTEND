"use client"

import { useEffect } from "react"
import { isNavigationBlocked } from "@/lib/nav-blocker"

export default function BackButtonHandler() {
  useEffect(() => {
    // Handle Android hardware back button and web unload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If navigation is blocked by a form, force the browser to show the confirmation
      if (isNavigationBlocked()) {
        const message = "You have unsaved changes. Please save or cancel before exiting."
        e.returnValue = message
        return message
      }
      return undefined
    }

    // Dynamic import of Capacitor App at runtime only when running on a native platform.
    // We avoid importing '@capacitor/app' at build time by checking for the presence of
    // window.Capacitor and using a concatenated string in the dynamic import so bundlers
    // won't statically resolve the module and fail the web build when the package
    // isn't installed for web-only environments.
    let appListener: any = null
    const setupCapacitorBack = async () => {
      try {
        const maybeCapacitor = (typeof window !== 'undefined' && (window as any).Capacitor) || null
        if (maybeCapacitor && typeof maybeCapacitor.isNativePlatform === 'function' && maybeCapacitor.isNativePlatform()) {
          // Use concatenation to avoid static analysis by bundlers
          const mod = await import('@capacitor' + '/app')
          const App = mod.App
          appListener = App.addListener('backButton', async () => {
            try {
              // If navigation is blocked, show a message and prevent exit
              if (isNavigationBlocked()) {
                try {
                  // small user feedback
                  window.alert('Please save or cancel the form before leaving this page.')
                } catch (e) {}
                return
              }

              // If there is history to go back to, go back
              if (window.history.length > 1) {
                window.history.back()
                return
              }
            } catch (e) {
              // ignore
            }
            const shouldExit = window.confirm('Do you really want to exit the app?')
            if (shouldExit) {
              // On native Android, exit the app
              try {
                if (App && typeof App.exitApp === 'function') {
                  App.exitApp()
                } else {
                  window.close()
                }
              } catch (e) {
                // fallback
                window.close()
              }
            }
          })
        } else {
          // Not native; attach beforeunload for web PWAs
          window.addEventListener('beforeunload', handleBeforeUnload)
        }
      } catch (error) {
        // On error, just attach beforeunload for web
        window.addEventListener('beforeunload', handleBeforeUnload)
      }
    }

    setupCapacitorBack()

    return () => {
      try {
        if (appListener && typeof appListener.remove === 'function') {
          appListener.remove()
        }
      } catch (_) {}
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return null
}
