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

// Import your sales home page
import SalesDashboard from "@/components/saleshome/page"

// Icons for tabs
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary mb-2">ACCORD</div>
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <MobileOptimizations />
        <OfflineIndicator />
        {showRegister ? (
          <RegisterForm onSuccess={handleAuthSuccess} onSwitchToLogin={() => setShowRegister(false)} />
        ) : (
          <LoginForm onSuccess={handleAuthSuccess} onSwitchToRegister={() => setShowRegister(true)} />
        )}
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
        return <VisitManagement />
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <MobileOptimizations />
      <OfflineIndicator />
      <PWAInstall />

      <TouchGestures onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight}>
        <main className="container mx-auto p-4 lg:p-6">
          <div className="hidden lg:block mb-6">
            <h1 className="text-3xl font-bold text-primary">ACCORD Dashboard</h1>
            <p className="text-muted-foreground">Manage your business operations</p>
          </div>

          {renderCurrentPage()}
        </main>
      </TouchGestures>

      {/* Updated Neumorphic Mobile Tabs */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#f1f4f9] shadow-[8px_8px_16px_#cfd4db,-8px_-8px_16px_#ffffff] rounded-t-2xl flex justify-around py-2 px-3 z-50 lg:hidden">
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
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-[#00aeef] text-white shadow-inner scale-105"
                  : "bg-[#f1f4f9] text-gray-600 shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] hover:scale-105"
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </button>
          )
        })}
      </nav>

      <Toaster />
    </div>
  )
}
