"use client"
import React, { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"

type UpdateInfo = {
  hasUpdate?: boolean
  latestVersion?: string
  versionName?: string
  changelog?: string
  mandatory?: boolean
  forceUpdate?: boolean
  downloadUrl?: string
}

import { UPDATE_CHECK_URL, APK_DOWNLOAD_URL, APP_VERSION } from "@/lib/config"

const CHECK_ENDPOINT = UPDATE_CHECK_URL
const APPLIED_VERSION_KEY = "accord_applied_update_version"
const DISMISSED_VERSION_KEY = "accord_dismissed_update_version"
const PENDING_UPDATE_KEY = "accord_pending_update"

// Helper functions
function getAppliedVersion(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(APPLIED_VERSION_KEY)
}

function setAppliedVersion(version: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(APPLIED_VERSION_KEY, version)
  }
}

function getDismissedVersion(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(DISMISSED_VERSION_KEY)
}

function setDismissedVersion(version: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(DISMISSED_VERSION_KEY, version)
  }
}

function getPendingUpdate(): UpdateInfo | null {
  if (typeof window === "undefined") return null
  try {
    const stored = sessionStorage.getItem(PENDING_UPDATE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function setPendingUpdate(update: UpdateInfo | null): void {
  if (typeof window !== "undefined") {
    if (update) {
      sessionStorage.setItem(PENDING_UPDATE_KEY, JSON.stringify(update))
    } else {
      sessionStorage.removeItem(PENDING_UPDATE_KEY)
    }
  }
}

// Global flag to prevent multiple API checks
let hasCheckedThisSession = false

export default function UpdateChecker({ role = "sales", platform = "android" }: { role?: string; platform?: string }) {
  const [update, setUpdate] = useState<UpdateInfo | null>(() => {
    if (typeof window === "undefined") return null
    return getPendingUpdate()
  })
  const [show, setShow] = useState(() => {
    if (typeof window === "undefined") return false
    return getPendingUpdate() !== null
  })
  const [isUpdating, setIsUpdating] = useState(false)

  const isCheckingRef = useRef(false)
  const hasInitializedRef = useRef(false)

  useEffect(() => {
    // If we already have update state from session, show it
    if (update && show) {
      console.log("📦 Update already loaded from session:", update.latestVersion || update.versionName)
      hasInitializedRef.current = true
      return
    }

    // Skip if already checked this session
    if (hasCheckedThisSession || isCheckingRef.current || hasInitializedRef.current) {
      return
    }

    let mounted = true
    isCheckingRef.current = true
    hasCheckedThisSession = true
    hasInitializedRef.current = true

    async function getCurrentVersion() {
      if (typeof window === "undefined") return APP_VERSION
      try {
        const mod = await import("@capacitor/app")
        const infoObj = await mod.App.getInfo()
        return (infoObj as any)?.version || (infoObj as any)?.versionName || APP_VERSION
      } catch {
        return APP_VERSION
      }
    }

    async function checkForUpdate() {
      try {
        const currentVersion = await getCurrentVersion()
        console.log("🔍 Checking for updates... Current version:", currentVersion)

        const res = await fetch(CHECK_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentVersion,
            platform,
            role
          }),
          cache: "no-store",
        })

        if (!res.ok) {
          console.log("❌ Update check failed:", res.status)
          return
        }

        const data = await res.json()
        console.log("📦 Update response:", data)

        // Handle both response formats
        const hasUpdate = data.hasUpdate || data.updateAvailable
        const updateInfo = data.update || data
        const latestVersion = updateInfo.latestVersion || updateInfo.versionName

        // Skip if current version matches latest version (no update needed)
        if (currentVersion === latestVersion) {
          console.log(`✅ Already on latest version ${currentVersion}, no update needed`)
          return
        }

        if (hasUpdate) {
          const version = latestVersion

          // Check if this version was already applied
          const appliedVersion = getAppliedVersion()
          if (appliedVersion === version) {
            console.log(`✅ Version ${version} already applied, skipping`)
            return
          }

          // Check if dismissed this session (non-mandatory only)
          const isMandatory = updateInfo.mandatory || updateInfo.forceUpdate
          const dismissedVersion = getDismissedVersion()
          if (!isMandatory && dismissedVersion === version) {
            console.log(`⏭️ Version ${version} dismissed this session`)
            return
          }

          const mapped: UpdateInfo = {
            hasUpdate: true,
            latestVersion: version,
            versionName: version,
            changelog: updateInfo.changelog || updateInfo.releaseNotes,
            mandatory: isMandatory,
            forceUpdate: isMandatory,
            downloadUrl: updateInfo.downloadUrl || updateInfo.apkUrl || APK_DOWNLOAD_URL,
          }

          if (mounted) {
            setPendingUpdate(mapped)
            setUpdate(mapped)
            setShow(true)
            console.log("✅ Update available:", version)
          }
        } else {
          console.log("✅ App is up to date")
        }
      } catch (e) {
        console.error("❌ Failed to check for updates:", e)
      } finally {
        isCheckingRef.current = false
      }
    }

    checkForUpdate()

    return () => {
      mounted = false
    }
  }, [role, platform])

  // Don't render if no update
  if (!update || !show) {
    return null
  }

  /**
   * CRITICAL: Use Browser.open() to trigger APK download
   * This hands control to Android's Download Manager which can install APKs
   * DO NOT use fetch() or Filesystem.downloadFile() - Android will refuse to install
   */
  async function handleDownloadAndInstall() {
    if (!update) return

    setIsUpdating(true)

    try {
      const downloadUrl = update.downloadUrl || APK_DOWNLOAD_URL
      console.log("📥 Opening download URL:", downloadUrl)

      // Use Capacitor Browser to open the download URL
      // This triggers Android Download Manager → APK Installer
      const { Browser } = await import("@capacitor/browser")

      await Browser.open({
        url: downloadUrl,
      })

      // Mark version as applied (user initiated download)
      if (update.latestVersion || update.versionName) {
        setAppliedVersion(update.latestVersion || update.versionName || "")
      }

      // Clear pending update
      setPendingUpdate(null)

      // Close the modal after a short delay
      setTimeout(() => {
        setShow(false)
        setIsUpdating(false)
      }, 1000)

    } catch (err) {
      console.error("❌ Failed to open download:", err)

      // Fallback: try opening in a new window
      try {
        window.open(update.downloadUrl || APK_DOWNLOAD_URL, "_blank")
        setPendingUpdate(null)
        setTimeout(() => {
          setShow(false)
          setIsUpdating(false)
        }, 1000)
      } catch (e) {
        console.error("❌ Fallback also failed:", e)
        setIsUpdating(false)
      }
    }
  }

  function handleDismiss() {
    if (update?.mandatory || update?.forceUpdate) {
      return // Cannot dismiss mandatory updates
    }

    // Remember dismissed version for this session
    if (update?.latestVersion || update?.versionName) {
      setDismissedVersion(update.latestVersion || update.versionName || "")
    }

    setPendingUpdate(null)
    setShow(false)
  }

  const isMandatory = update.mandatory || update.forceUpdate
  const version = update.latestVersion || update.versionName

  const modalContent = (
    <div
      id="update-checker-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: show ? 'block' : 'none',
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isMandatory && !isUpdating && handleDismiss()}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm pointer-events-auto">

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-[#00aeef]/10 flex items-center justify-center">
              {isUpdating ? (
                <svg className="w-8 h-8 text-[#00aeef] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-8 h-8 text-[#00aeef]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
            {isUpdating ? "Opening Download..." : "Update Available"}
          </h3>

          {/* Version */}
          {version && (
            <p className="text-sm text-gray-500 text-center mb-4">
              Version {version}
            </p>
          )}

          {isUpdating ? (
            <p className="text-sm text-gray-600 text-center mb-6">
              The download will open in your browser. Please install the APK when the download completes.
            </p>
          ) : (
            <>
              {/* Changelog */}
              {update.changelog && (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl max-h-32 overflow-y-auto">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">What's New</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{update.changelog}</p>
                </div>
              )}

              {/* Info */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800 text-center">
                  📱 A new version of ACCORD is ready to install.
                </p>
              </div>

              {/* Mandatory Notice */}
              {isMandatory && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800 font-medium text-center">
                    ⚠️ This update is required to continue.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Buttons */}
          {!isUpdating && (
            <div className="flex gap-3">
              {!isMandatory && (
                <button
                  onClick={handleDismiss}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors"
                >
                  Later
                </button>
              )}
              <button
                onClick={handleDownloadAndInstall}
                disabled={isUpdating}
                className={`flex-1 px-4 py-3 text-sm font-medium text-white bg-[#00aeef] rounded-xl hover:bg-[#0096d6] active:bg-[#0086c6] transition-colors disabled:opacity-50 ${isMandatory ? 'w-full' : ''}`}
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Update Now
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // Use portal to render at document body level
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return modalContent
}
