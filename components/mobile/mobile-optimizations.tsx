"use client"

import { useEffect } from "react"

export function MobileOptimizations() {
  useEffect(() => {
    // Prevent zoom on input focus (iOS Safari)
    const preventZoom = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT") {
        const viewport = document.querySelector('meta[name="viewport"]')
        if (viewport) {
          viewport.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no")

          // Restore zoom after blur
          const restoreZoom = () => {
            viewport.setAttribute("content", "width=device-width, initial-scale=1.0")
            target.removeEventListener("blur", restoreZoom)
          }
          target.addEventListener("blur", restoreZoom)
        }
      }
    }

    // Add touch-action CSS for better touch handling
    document.body.style.touchAction = "manipulation"

    // Prevent pull-to-refresh on mobile
    let startY = 0
    const preventPullToRefresh = (e: TouchEvent) => {
      if (e.touches.length !== 1) return

      const touch = e.touches[0]
      if (e.type === "touchstart") {
        startY = touch.clientY
      } else if (e.type === "touchmove") {
        const deltaY = touch.clientY - startY
        if (deltaY > 0 && window.scrollY === 0) {
          e.preventDefault()
        }
      }
    }

    document.addEventListener("focusin", preventZoom)
    document.addEventListener("touchstart", preventPullToRefresh, { passive: false })
    document.addEventListener("touchmove", preventPullToRefresh, { passive: false })

    // Add safe area CSS variables for devices with notches
    const updateSafeArea = () => {
      const safeAreaTop = getComputedStyle(document.documentElement).getPropertyValue("--sat") || "0px"
      const safeAreaBottom = getComputedStyle(document.documentElement).getPropertyValue("--sab") || "0px"

      document.documentElement.style.setProperty("--safe-area-top", safeAreaTop)
      document.documentElement.style.setProperty("--safe-area-bottom", safeAreaBottom)
    }

    updateSafeArea()
    window.addEventListener("resize", updateSafeArea)

    return () => {
      document.removeEventListener("focusin", preventZoom)
      document.removeEventListener("touchstart", preventPullToRefresh)
      document.removeEventListener("touchmove", preventPullToRefresh)
      window.removeEventListener("resize", updateSafeArea)
      document.body.style.touchAction = ""
    }
  }, [])

  return null
}
