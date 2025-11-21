"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import { isNavigationBlocked } from "@/lib/nav-blocker"

interface TouchGesturesProps {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  children: React.ReactNode
  className?: string
  // How large a horizontal swipe must be as a fraction of element width (0-1).
  // Default 0.25 (25% of width). Lower = easier to trigger.
  thresholdRatio?: number
  // Minimum distance in pixels regardless of ratio. Default 50px.
  minDistance?: number
  // If true, only accept swipes that start within edgeWidth px from the left or right edge.
  edgeOnly?: boolean
  // Edge width in pixels when edgeOnly is true. Default 48px.
  edgeWidth?: number
}

export function TouchGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  children,
  className,
  thresholdRatio = 0.25,
  minDistance = 50,
  edgeOnly = false,
  edgeWidth = 48,
}: TouchGesturesProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0]
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return

      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y

      // Compute thresholds
      const elementWidth = element.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 0)
      const computedMinSwipe = Math.max(minDistance, elementWidth * thresholdRatio)
      const maxVerticalDistance = 100

      // If edgeOnly is enabled, ensure the swipe started near an edge
      if (edgeOnly && touchStartRef.current) {
        const startX = touchStartRef.current.x
        const nearLeft = startX <= edgeWidth
        const nearRight = startX >= elementWidth - edgeWidth
        if (!nearLeft && !nearRight) {
          touchStartRef.current = null
          return
        }
      }

      // Horizontal swipes
      if (Math.abs(deltaX) > computedMinSwipe && Math.abs(deltaY) < maxVerticalDistance) {
        // If navigation is blocked (e.g., a modal/form is open), ignore swipes
        if (isNavigationBlocked()) {
          touchStartRef.current = null
          return
        }
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight()
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft()
        }
      }

      // Vertical swipes
      if (Math.abs(deltaY) > minDistance && Math.abs(deltaX) < maxVerticalDistance) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown()
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp()
        }
      }

      touchStartRef.current = null
    }

    element.addEventListener("touchstart", handleTouchStart, { passive: true })
    element.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      element.removeEventListener("touchstart", handleTouchStart)
      element.removeEventListener("touchend", handleTouchEnd)
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown])

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  )
}
