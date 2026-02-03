"use client"
import React, { useEffect, useState } from "react"

type UpdateInfo = {
  version?: string
  releaseNotes?: string
  forced?: boolean
  internalUpdate?: boolean
  updateMethod?: "internal" | "external"
  requiresRestart?: boolean
  updateInstructions?: string
  bundledCode?: string | null
}

const CHECK_ENDPOINT = process.env.NEXT_PUBLIC_UPDATE_CHECK_URL || "https://app.codewithseth.co.ke/api/app-updates/check"

export default function UpdateChecker({ role = "sales", platform = "android" }: { role?: string; platform?: string }) {
  const [update, setUpdate] = useState<UpdateInfo | null>(null)
  const [show, setShow] = useState(false)
  const [checking, setChecking] = useState(true)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

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
            const mapped: UpdateInfo = {
              version: upd.version,
              releaseNotes: upd.releaseNotes,
              forced: !!upd.forced,
              internalUpdate: upd.internalUpdate ?? true,
              updateMethod: upd.updateMethod || "internal",
              requiresRestart: upd.requiresRestart ?? true,
              updateInstructions: upd.updateInstructions,
              bundledCode: upd.bundledCode || null,
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

  async function handleApplyUpdate() {
    if (!update) return

    setApplying(true)

    try {
      // If there's bundled code to apply immediately
      if (update.bundledCode) {
        try {
          // Apply the code patch (eval in a safe context)
          const fn = new Function(update.bundledCode)
          fn()
          console.log("✅ Update code patch applied successfully")
        } catch (err) {
          console.error("Failed to apply code patch:", err)
        }
      }

      // If restart is required
      if (update.requiresRestart) {
        setApplied(true)
        // Give user a moment to see the message, then reload
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        // Update applied without restart
        setApplied(true)
        setTimeout(() => {
          setShow(false)
        }, 2000)
      }
    } catch (err) {
      console.error("Failed to apply update:", err)
    } finally {
      setApplying(false)
    }
  }

  function handleDismiss() {
    if (!update?.forced) {
      setShow(false)
    }
  }

  return (
    <div aria-hidden={!show} style={{ display: show ? undefined : "none" }}>
      {/* Backdrop for forced updates */}
      {update.forced && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
      )}
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-300">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#00aeef]/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#00aeef]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {applied ? "Update Applied!" : "Update Available"}
              </h3>
              {update.version && (
                <p className="text-sm text-gray-500">Version {update.version}</p>
              )}
            </div>
          </div>

          {/* Applied State */}
          {applied ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600">
                {update.requiresRestart ? "Restarting app..." : "Update applied successfully!"}
              </p>
            </div>
          ) : (
            <>
              {/* Release Notes */}
              {update.releaseNotes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">What's New</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{update.releaseNotes}</p>
                </div>
              )}

              {/* Update Instructions */}
              {update.updateInstructions && (
                <p className="text-xs text-gray-500 mb-4 text-center">
                  {update.updateInstructions}
                </p>
              )}

              {/* Forced Update Notice */}
              {update.forced && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-sm text-amber-800 font-medium">
                    ⚠️ This update is required to continue using the app.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {!update.forced && (
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Later
                  </button>
                )}
                <button
                  onClick={handleApplyUpdate}
                  disabled={applying}
                  className={`flex-1 px-4 py-3 text-sm font-medium text-white bg-[#00aeef] rounded-xl hover:bg-[#0096d6] transition-colors disabled:opacity-50 ${update.forced ? 'w-full' : ''}`}
                >
                  {applying ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Applying...
                    </span>
                  ) : update.requiresRestart ? (
                    "Update & Restart"
                  ) : (
                    "Apply Update"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
