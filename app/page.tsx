"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { TrailManagement } from "@/components/trails/trail-management"
import { VisitManagement } from "@/components/visits/visit-management"
import { MobileNav } from "@/components/layout/mobile-nav"
import { PWAInstall } from "@/components/mobile/pwa-install"
import { OfflineIndicator } from "@/components/mobile/offline-indicator"
import { MobileOptimizations } from "@/components/mobile/mobile-optimizations"
import { TouchGestures } from "@/components/mobile/touch-gestures"
import { authService } from "@/lib/auth"
import { Toaster } from "@/components/ui/toaster"
import { UserProfile } from "@/components/profile/user-profile"

// Import your sales home page
import SalesDashboard from "@/components/saleshome/page"

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
        return <SalesDashboard /> // Show your sales home page here
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
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <MobileOptimizations />
      <OfflineIndicator />
      <PWAInstall />

      <MobileNav currentPage={currentPage} onPageChange={setCurrentPage} />

      <TouchGestures onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight}>
        <main className="container mx-auto p-4 lg:p-6">
          <div className="hidden lg:block mb-6">
            <h1 className="text-3xl font-bold text-primary">ACCORD Dashboard</h1>
            <p className="text-muted-foreground">Manage your business operations</p>
          </div>

          {renderCurrentPage()}
        </main>
      </TouchGestures>

      <Toaster />
    </div>
  )
}