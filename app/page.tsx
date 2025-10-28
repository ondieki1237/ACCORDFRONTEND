// app/page.tsx
"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { TrailManagement } from "@/components/trails/trail-management"
import { VisitManagement } from "@/components/visits/visit-management"
import { PWAInstall } from "@/components/mobile/pwa-install"
import { OfflineIndicator } from "@/components/mobile/offline-indicator"
import { MobileOptimizations } from "@/components/mobile/mobile-optimizations"
import { TouchGestures } from "@/components/mobile/touch-gestures"
import { authService } from "@/lib/auth"
import { Toaster } from "@/components/ui/toaster"
import { UserProfile } from "@/components/profile/user-profile"
import SalesDashboard from "@/components/saleshome/page"
import { Home, Calendar, Map, User } from "lucide-react"

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState("dashboard")

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated())
    setIsLoading(false)
  }, [])

  const handleAuthSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleSwipeLeft = () => {
    const pages = ["dashboard", "visits", "trails", "profile"]
    const currentIndex = pages.indexOf(currentPage)
    if (currentIndex < pages.length - 1) {
      setCurrentPage(pages[currentIndex + 1])
    }
  }

  const handleSwipeRight = () => {
    const pages = ["dashboard", "visits", "trails", "profile"]
    const currentIndex = pages.indexOf(currentPage)
    if (currentIndex > 0) {
      setCurrentPage(pages[currentIndex - 1])
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e6ecf5] to-[#d1dbe9]">
        <div className="text-center space-y-4">
          <div className="text-4xl font-extrabold text-[#00aeef] tracking-tight">ACCORD</div>
          <div className="text-gray-500 animate-pulse">Loading your experience...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#e6ecf5] to-[#d1dbe9]">
        <MobileOptimizations />
        <OfflineIndicator />
        <div className="w-full max-w-md p-6 bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
          {showRegister ? (
            <RegisterForm onSuccess={handleAuthSuccess} onSwitchToLogin={() => setShowRegister(false)} />
          ) : (
            <LoginForm onSuccess={handleAuthSuccess} onSwitchToRegister={() => setShowRegister(true)} />
          )}
        </div>
        <Toaster />
      </div>
    )
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <SalesDashboard />
      case "visits":
        return <VisitManagement />
      case "trails":
        return <TrailManagement />
      case "profile":
        return <UserProfile />
      default:
        return <SalesDashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6ecf5] to-[#d1dbe9] pb-20 lg:pb-0">
      <MobileOptimizations />
      <OfflineIndicator />
      <PWAInstall />
      <TouchGestures onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight}>
  <main className="w-full px-4 py-4 lg:container lg:mx-auto lg:p-8">
          <div className="hidden lg:block mb-8">
            <h1 className="text-4xl font-extrabold text-[#00aeef] tracking-tight">ACCORD Dashboard</h1>
            <p className="text-gray-600 mt-2">Streamline your business operations</p>
          </div>
          <div className="bg-transparent p-0 lg:bg-white/80 lg:backdrop-blur-md lg:rounded-2xl lg:shadow-[0_8px_32px_rgba(0,0,0,0.1)] lg:p-6">
            {renderCurrentPage()}
          </div>
        </main>
      </TouchGestures>
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.05)] rounded-t-3xl flex justify-around py-3 px-4 z-50 lg:hidden">
        {[
          { id: "dashboard", label: "Home", icon: Home },
          { id: "visits", label: "Visits", icon: Calendar },
          { id: "trails", label: "Trails", icon: Map },
          { id: "profile", label: "Profile", icon: User },
        ].map(({ id, label, icon: Icon }) => {
          const isActive = currentPage === id
          return (
            <button
              key={id}
              onClick={() => setCurrentPage(id)}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-[#00aeef] text-white shadow-inner scale-105"
                  : "text-gray-600 hover:bg-gray-100/50 hover:scale-105"
              }`}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-semibold">{label}</span>
            </button>
          )
        })}
      </nav>
      <Toaster />
    </div>
  )
}