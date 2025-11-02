// app/page.tsx
"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { ProductManagement } from "@/components/products/product-management"
import { QuotationManagement } from "@/components/quotations/quotation-management"
import { VisitManagement } from "@/components/visits/visit-management"
import { EngineerVisitManagement } from "@/components/visits/engineer-visit-management"
import { PWAInstall } from "@/components/mobile/pwa-install"
import { OfflineIndicator } from "@/components/mobile/offline-indicator"
import { MobileOptimizations } from "@/components/mobile/mobile-optimizations"
import { TouchGestures } from "@/components/mobile/touch-gestures"
import { authService } from "@/lib/auth"
import { Toaster } from "@/components/ui/toaster"
import { UserProfile } from "@/components/profile/user-profile"
import SalesDashboard from "@/components/saleshome/page"
import EngineerDashboard from "@/components/saleshome/engineer-dashboard"
import { Home, Calendar, ShoppingCart, User, Wrench, ClipboardList } from "lucide-react"
import { aggressiveTracker } from "@/lib/aggressive-tracker"
import { nativeBackgroundTracker } from "@/lib/native-background-tracker"
import { Capacitor } from "@capacitor/core"

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isEngineer, setIsEngineer] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      setIsAuthenticated(authService.isAuthenticated())
      
      // Get user data to check role
      if (authService.isAuthenticated()) {
        try {
          const user = await authService.getCurrentUser()
          setCurrentUser(user)
          
          // Check if user has engineer role
          const userRole = user?.role?.toLowerCase() || ''
          setIsEngineer(userRole.includes('engineer') || userRole === 'engineer')
        } catch (error) {
          console.error('Failed to get user:', error)
        }
      }
      
      setIsLoading(false)
    }
    
    checkAuth()
    
    // Start location tracking when authenticated
    if (authService.isAuthenticated()) {
      // Use native background tracker on Android, web tracker on web
      if (Capacitor.isNativePlatform() && nativeBackgroundTracker) {
        nativeBackgroundTracker.startBackgroundTracking().catch(() => {})
      } else {
        aggressiveTracker.startTracking().catch(() => {})
      }
    }
  }, [])

  const handleAuthSuccess = async () => {
    setIsAuthenticated(true)
    
    // Get user data after login
    try {
      const user = await authService.getCurrentUser()
      setCurrentUser(user)
      
      // Check if user has engineer role
      const userRole = user?.role?.toLowerCase() || ''
      setIsEngineer(userRole.includes('engineer') || userRole === 'engineer')
    } catch (error) {
      console.error('Failed to get user:', error)
    }
    
    // Start tracking immediately after login
    if (Capacitor.isNativePlatform() && nativeBackgroundTracker) {
      nativeBackgroundTracker.startBackgroundTracking().catch(() => {})
    } else {
      aggressiveTracker.startTracking().catch(() => {})
    }
  }

  const handleSwipeLeft = () => {
    const pages = ["dashboard", "visits", "products", "quotations", "profile"]
    const currentIndex = pages.indexOf(currentPage)
    if (currentIndex < pages.length - 1) {
      setCurrentPage(pages[currentIndex + 1])
    }
  }

  const handleSwipeRight = () => {
    const pages = ["dashboard", "visits", "products", "quotations", "profile"]
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
      <div className="min-h-screen bg-gradient-to-br from-[#e6ecf5] to-[#d1dbe9]">
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
        return isEngineer ? <EngineerDashboard /> : <SalesDashboard />
      case "visits":
        return isEngineer ? <EngineerVisitManagement /> : <VisitManagement />
      case "products":
        return <ProductManagement />
      case "quotations":
        return <QuotationManagement />
      case "profile":
        return <UserProfile />
      default:
        return isEngineer ? <EngineerDashboard /> : <SalesDashboard />
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
          { id: "visits", label: isEngineer ? "My Services" : "Visits", icon: isEngineer ? Wrench : Calendar },
          { id: "products", label: "Products", icon: ShoppingCart },
          { id: "quotations", label: "Quotes", icon: ClipboardList },
          { id: "profile", label: "Profile", icon: User },
        ].map(({ id, label, icon: Icon }) => {
          const isActive = currentPage === id
          return (
            <button
              key={id}
              onClick={() => setCurrentPage(id)}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-[#00aeef] text-white shadow-inner scale-105"
                  : "text-gray-600 hover:bg-gray-100/50 hover:scale-105"
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-semibold">{label}</span>
            </button>
          )
        })}
      </nav>
      <Toaster />
    </div>
  )
}