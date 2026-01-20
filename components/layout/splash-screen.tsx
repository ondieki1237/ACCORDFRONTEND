"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export function SplashScreen() {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Start fade out after 2 seconds
    const timer = setTimeout(() => {
      setFadeOut(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#00aeef] via-[#0096d6] to-[#007db3] transition-opacity duration-700 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-300" />
      </div>

      {/* Logo container with animation */}
      <div className="relative z-10 flex flex-col items-center space-y-6">
        {/* Logo with scale and fade-in animation */}
        <div className="relative animate-scaleIn">
          <div className="absolute inset-0 bg-white rounded-3xl blur-2xl opacity-50 animate-pulse" />
          <div className="relative bg-white rounded-3xl p-8 shadow-2xl">
            <Image
              src="/accord-icon.png"
              alt="ACCORD Logo"
              width={120}
              height={120}
              className="w-32 h-32 object-contain"
              priority
            />
          </div>
        </div>

        {/* App name with slide-up animation */}
        <div className="text-center space-y-2 animate-slideUp">
          <h1 className="text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
            ACCORD
          </h1>
          <p className="text-white/90 text-lg font-medium">
            Sales & Engineering Platform
          </p>
        </div>

        {/* Loading indicator */}
        <div className="flex space-x-2 animate-fadeIn delay-500">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>

      {/* Bottom branding */}
      <div className="absolute bottom-8 text-center animate-fadeIn delay-700">
        <p className="text-white/70 text-sm">
          Powering Healthcare Solutions
        </p>
      </div>
    </div>
  )
}
