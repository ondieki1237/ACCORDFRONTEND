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

    // Keep track of keyboard / visual viewport changes to allow UI to move above
    // the virtual keyboard on mobile. We expose the offset via CSS variable
    // --keyboard-offset which components (like the bottom nav) can consume.
    const updateKeyboardOffset = () => {
      try {
        const vv = (window as any).visualViewport
        if (vv) {
          const offset = Math.max(0, window.innerHeight - vv.height)
          document.documentElement.style.setProperty('--keyboard-offset', `${Math.round(offset)}px`)
        } else {
          document.documentElement.style.setProperty('--keyboard-offset', `0px`)
        }
      } catch (e) {
        document.documentElement.style.setProperty('--keyboard-offset', `0px`)
      }
    }

    updateKeyboardOffset()
    const vv = (window as any).visualViewport
    if (vv) {
      if (typeof vv.addEventListener === 'function') {
        vv.addEventListener('resize', updateKeyboardOffset)
        vv.addEventListener('scroll', updateKeyboardOffset)
      } else {
        // Some environments expose visualViewport but not as an EventTarget.
        // Fallback to onresize/onscroll handlers.
        vv.onresize = updateKeyboardOffset
        vv.onscroll = updateKeyboardOffset
      }
    }

    // Read nav behavior preference: 'stayAbove' or 'stayBelow'. Default to 'stayBelow'
    try {
      const pref = typeof window !== 'undefined' ? localStorage.getItem('navBehavior') : null
      const behavior = pref || 'stayBelow'
      if (behavior === 'stayAbove') {
        document.body.classList.add('nav-stay-above')
        document.body.classList.remove('nav-stay-below')
      } else {
        document.body.classList.add('nav-stay-below')
        document.body.classList.remove('nav-stay-above')
      }
    } catch (e) {
      document.body.classList.add('nav-stay-below')
    }

    return () => {
      document.removeEventListener("focusin", preventZoom)
      document.removeEventListener("touchstart", preventPullToRefresh)
      document.removeEventListener("touchmove", preventPullToRefresh)
      window.removeEventListener("resize", updateSafeArea)
      const vv = (window as any).visualViewport
      if (vv) {
        if (typeof vv.removeEventListener === 'function') {
          vv.removeEventListener('resize', updateKeyboardOffset)
          vv.removeEventListener('scroll', updateKeyboardOffset)
        } else {
          vv.onresize = null
          vv.onscroll = null
        }
      }
      document.body.style.touchAction = ""
    }
  }, [])

  return null
}
