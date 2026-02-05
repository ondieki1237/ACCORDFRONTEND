"use client"
import React, { useEffect, useState } from "react"

type UpdateInfo = {
  versionName?: string
  changelog?: string
  forceUpdate?: boolean
  apkUrl?: string
  versionCode?: number
}

const CHECK_ENDPOINT = process.env.NEXT_PUBLIC_UPDATE_CHECK_URL || "https://app.codewithseth.co.ke/api/app-updates/check"
const APK_DOWNLOAD_URL = "https://app.codewithseth.co.ke/downloads/app-debug.apk"
const APPLIED_VERSION_KEY = "accord_applied_update_version"
const DISMISSED_VERSION_KEY = "accord_dismissed_update_version"

// Helper to get/set applied versions
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

export default function UpdateChecker({ role = "sales", platform = "android" }: { role?: string; platform?: string }) {
  const [update, setUpdate] = useState<UpdateInfo | null>(null)
  const [show, setShow] = useState(false)
  const [checking, setChecking] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")

  useEffect(() => {
    let mounted = true

    async function getCurrentVersion() {
      if (typeof window === "undefined") return null
      try {
        const mod = await import("@capacitor/app")
        const infoObj = await mod.App.getInfo()
        const v = (infoObj as any)?.version || (infoObj as any)?.versionName || (infoObj as any)?.build
        return v || null
      } catch {
        return null
      }
    }

    async function check() {
      try {
        const currentVersion = await getCurrentVersion()

        const res = await fetch(CHECK_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, platform, currentVersion }),
          cache: "no-store",
        })

        if (res.ok) {
          const body = await res.json()
          if (body && body.updateAvailable && body.update) {
            const upd = body.update
            const updateVersion = upd.versionName

            // Check if this version was already applied
            const appliedVersion = getAppliedVersion()
            if (appliedVersion && appliedVersion === updateVersion) {
              console.log(`✅ Update ${updateVersion} already applied, skipping prompt`)
              if (mounted) setChecking(false)
              return
            }

            // Check if this version was dismissed this session (non-forced only)
            const dismissedVersion = getDismissedVersion()
            if (!upd.forceUpdate && dismissedVersion === updateVersion) {
              console.log(`⏭️ Update ${updateVersion} dismissed this session, skipping prompt`)
              if (mounted) setChecking(false)
              return
            }

            const mapped: UpdateInfo = {
              versionName: upd.versionName,
              changelog: upd.changelog,
              forceUpdate: !!upd.forceUpdate,
              apkUrl: upd.apkUrl || APK_DOWNLOAD_URL,
              versionCode: upd.versionCode,
            }
            if (mounted) {
              setUpdate(mapped)
              setShow(true)
            }
          }
        }
      } catch (e) {
        console.error("Failed to check for updates:", e)
      } finally {
        if (mounted) setChecking(false)
      }
    }

    check()
    return () => {
      mounted = false
    }
  }, [role, platform])

  if (checking) return null
  if (!update) return null

  async function handleDownloadAndInstall() {
    if (!update) return

    setDownloading(true)
    setDownloadProgress(0)
    setStatusMessage("Preparing download...")

    try {
      const downloadUrl = update.apkUrl || APK_DOWNLOAD_URL
      
      // Check if we're on a Capacitor Android environment
      const isCapacitor = typeof (window as any).Capacitor !== 'undefined'
      const isAndroid = isCapacitor && (window as any).Capacitor.getPlatform() === 'android'

      if (!isAndroid) {
        // Fallback for web/non-Android: just open the download URL
        setStatusMessage("Opening download link...")
        window.open(downloadUrl, '_blank')
        
        if (update.versionName) {
          setAppliedVersion(update.versionName)
        }
        
        setTimeout(() => {
          setShow(false)
          setDownloading(false)
        }, 2000)
        return
      }

      // Check if we have install permission
      const Capacitor = (window as any).Capacitor
      if (Capacitor?.Plugins?.AppUpdater) {
        const permCheck = await Capacitor.Plugins.AppUpdater.canInstallApk()
        if (!permCheck.canInstall) {
          setStatusMessage("Please enable install permission...")
          await Capacitor.Plugins.AppUpdater.openInstallPermissionSettings()
          setDownloading(false)
          return
        }
      }

      // Android: Download APK and trigger install
      setStatusMessage("Downloading update...")
      
      // Use fetch to download with progress tracking
      const response = await fetch(downloadUrl)
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`)
      }

      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : 0
      
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const chunks: Uint8Array[] = []
      let received = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        chunks.push(value)
        received += value.length
        
        if (total > 0) {
          const progress = Math.round((received / total) * 100)
          setDownloadProgress(progress)
          setStatusMessage(`Downloading... ${progress}%`)
        } else {
          // No content-length, show bytes downloaded
          const mb = (received / (1024 * 1024)).toFixed(1)
          setStatusMessage(`Downloading... ${mb} MB`)
        }
      }

      // Combine chunks into single array
      const apkData = new Uint8Array(received)
      let position = 0
      for (const chunk of chunks) {
        apkData.set(chunk, position)
        position += chunk.length
      }

      setStatusMessage("Saving APK file...")
      setDownloadProgress(100)

      // Convert to base64 for Capacitor Filesystem
      const base64Data = btoa(
        apkData.reduce((data, byte) => data + String.fromCharCode(byte), '')
      )

      // Import Capacitor Filesystem
      const { Filesystem, Directory } = await import('@capacitor/filesystem')
      
      const fileName = `accord-update-${update.versionName || 'latest'}.apk`
      
      // Write the APK to cache directory
      const writeResult = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      })

      console.log('APK saved to:', writeResult.uri)
      setStatusMessage("Starting installation...")

      // Trigger APK installation using our native plugin
      if (Capacitor?.Plugins?.AppUpdater) {
        const result = await Capacitor.Plugins.AppUpdater.installApk({ path: fileName })
        
        if (result.permissionRequired) {
          setStatusMessage(result.message || "Please grant install permission")
          setDownloading(false)
          return
        }

        if (result.success) {
          // Mark version as applied
          if (update.versionName) {
            setAppliedVersion(update.versionName)
          }
          setStatusMessage("Installation started! Please follow the prompts.")
        }
      } else {
        // Fallback: Open the download URL directly in browser
        setStatusMessage("Opening download in browser...")
        window.open(downloadUrl, '_blank')
        
        if (update.versionName) {
          setAppliedVersion(update.versionName)
        }
      }

      // Close the modal after a delay
      setTimeout(() => {
        setDownloading(false)
        setShow(false)
      }, 3000)

    } catch (err) {
      console.error("Failed to download/install update:", err)
      setStatusMessage("Download failed. Tap to retry.")
      setDownloading(false)
    }
  }

  function handleDismiss() {
    if (!update?.forceUpdate) {
      // Remember dismissed version for this session only
      if (update?.versionName) {
        setDismissedVersion(update.versionName)
      }
      setShow(false)
    }
  }

  return (
    <div aria-hidden={!show} style={{ display: show ? undefined : "none" }}>
      {/* Backdrop for forced updates */}
      {update.forceUpdate && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
      )}
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#00aeef]/10 flex items-center justify-center">
              {downloading ? (
                <svg className="w-6 h-6 text-[#00aeef] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-[#00aeef]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {downloading ? "Downloading Update" : "Update Available"}
              </h3>
              {update.versionName && (
                <p className="text-sm text-gray-500">Version {update.versionName}</p>
              )}
            </div>
          </div>

          {/* Downloading State */}
          {downloading ? (
            <div className="py-4">
              {/* Progress Bar */}
              <div className="mb-3">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00aeef] to-[#0096d6] transition-all duration-300 ease-out"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600 text-center">{statusMessage}</p>
            </div>
          ) : (
            <>
              {/* Release Notes */}
              {update.changelog && (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">What's New</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{update.changelog}</p>
                </div>
              )}

              {/* APK Install Info */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800">
                  📱 This update will download and install a new version of the app.
                </p>
              </div>

              {/* Forced Update Notice */}
              {update.forceUpdate && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800 font-medium">
                    ⚠️ This update is required to continue using the app.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {!update.forceUpdate && (
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Later
                  </button>
                )}
                <button
                  onClick={handleDownloadAndInstall}
                  disabled={downloading}
                  className={`flex-1 px-4 py-3 text-sm font-medium text-white bg-[#00aeef] rounded-xl hover:bg-[#0096d6] transition-colors disabled:opacity-50 ${update.forceUpdate ? 'w-full' : ''}`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download & Install
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
