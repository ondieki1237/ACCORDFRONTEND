// app/page.tsx
"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { RegisterForm } from "@/components/auth/register-form"
import { ProductManagement } from "@/components/products/product-management"
import { LeadManagement } from "@/components/leads/lead-management"
import { MachineManagement } from "@/components/machines/machine-management"
import { VisitManagement } from "@/components/visits/visit-management"
import { EngineerVisitManagement } from "@/components/visits/engineer-visit-management"
import { PricingManagement } from "@/components/engineering-pricing/pricing-management"
import { PWAInstall } from "@/components/mobile/pwa-install"
import { OfflineIndicator } from "@/components/mobile/offline-indicator"
import { MobileOptimizations } from "@/components/mobile/mobile-optimizations"
import { TouchGestures } from "@/components/mobile/touch-gestures"
import { SplashScreen } from "@/components/layout/splash-screen"
import { authService } from "@/lib/auth"
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { UserProfile } from "@/components/profile/user-profile"
import SalesDashboard from "@/components/saleshome/page"
import EngineerDashboard from "@/components/saleshome/engineer-dashboard"
import { Home, Calendar, ShoppingCart, User, Wrench, TrendingUp } from "lucide-react"

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showSplash, setShowSplash] = useState(true)
  const [currentPage, setCurrentPage] = useState("dashboard")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isEngineer, setIsEngineer] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = authService.getAccessToken()
        const user = await authService.getCurrentUser()
        
        if (token && user) {
          setIsAuthenticated(true)
          setCurrentUser(user)
          
          // Check user role
          const userRole = user?.role?.toLowerCase() || ''
          setIsEngineer(userRole.includes('engineer') || userRole === 'engineer')
          setIsAdmin(userRole.includes('admin') || userRole === 'admin' || userRole === 'manager')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Hide splash screen after animation completes
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 2700) // 2.7s total (animation + fade out)

    return () => clearTimeout(timer)
  }, [])

  const handleAuthSuccess = async () => {
    setIsAuthenticated(true)
    
    // Get user data after login
    try {
      const user = await authService.getCurrentUser()
      setCurrentUser(user)
      
      // Check user role
      const userRole = user?.role?.toLowerCase() || ''
      setIsEngineer(userRole.includes('engineer') || userRole === 'engineer')
      setIsAdmin(userRole.includes('admin') || userRole === 'admin' || userRole === 'manager')
    } catch (error) {
      console.error('Failed to get user:', error)
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      setIsAuthenticated(false)
      setCurrentUser(null)
      setIsEngineer(false)
      setIsAdmin(false)
      setCurrentPage("dashboard")
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleSwipeLeft = () => {
    // Different pages for engineer vs sales
    const pages = isEngineer 
      ? ["dashboard", "visits", "expenses", "leads", "profile"]
      : ["dashboard", "visits", "products", "leads", "profile"]
    const currentIndex = pages.indexOf(currentPage)
    if (currentIndex < pages.length - 1) {
      setCurrentPage(pages[currentIndex + 1])
    }
  }

  const handleSwipeRight = () => {
    // Different pages for engineer vs sales
    const pages = isEngineer 
      ? ["dashboard", "visits", "expenses", "leads", "profile"]
      : ["dashboard", "visits", "products", "leads", "profile"]
    const currentIndex = pages.indexOf(currentPage)
    if (currentIndex > 0) {
      setCurrentPage(pages[currentIndex - 1])
    }
  }

  // Show splash screen
  if (showSplash) {
    return <SplashScreen />
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
    // Admin users get redirected to admin panel
    if (isAdmin) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-3xl font-bold text-[#00aeef]">Admin Dashboard</h1>
            <p className="text-gray-600">
              Admin access detected. Please use the dedicated admin panel.
            </p>
            <Button
              onClick={() => window.location.href = 'https://app.codewithseth.co.ke/admin'}
              className="bg-[#00aeef] hover:bg-[#0097d6] w-full"
            >
              Go to Admin Panel
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full"
            >
              Logout
            </Button>
          </div>
        </div>
      )
    }

    // Regular role-based routing for sales and engineers
    switch (currentPage) {
      case "dashboard":
        return isEngineer ? <EngineerDashboard /> : <SalesDashboard />
      case "visits":
        return isEngineer ? <EngineerVisitManagement /> : <VisitManagement />
      case "products":
        return <ProductManagement />
      case "expenses":
        // Engineer expenses/pricing section
        return <PricingManagement engineerId={currentUser?.id || currentUser?._id} isAdmin={isAdmin} />
      case "leads":
        return isEngineer ? <MachineManagement /> : <LeadManagement />
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
      <nav
        className="fixed left-0 right-0 bg-white/90 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.05)] rounded-t-3xl flex justify-around py-3 px-4 z-50 lg:hidden"
        // Position controlled by nav behavior preference. When body has class 'nav-stay-above'
        // we move the nav above the keyboard using --keyboard-offset. Default behavior is
        // to stay down (nav-stay-below) so the nav remains at the bottom and does not shift.
        style={
          document?.body?.classList?.contains('nav-stay-above')
            ? { bottom: 'var(--keyboard-offset, 0px)' }
            : { bottom: 0 }
        }
      >
        {(isEngineer 
          ? [
              { id: "dashboard", label: "Home", icon: Home },
              { id: "visits", label: "My Services", icon: Wrench },
              { id: "expenses", label: "Expenses", icon: ShoppingCart },
              { id: "leads", label: "Machines", icon: Wrench },
              { id: "profile", label: "Profile", icon: User },
            ]
          : [
              { id: "dashboard", label: "Home", icon: Home },
              { id: "visits", label: "Visits", icon: Calendar },
              { id: "products", label: "Products", icon: ShoppingCart },
              { id: "leads", label: "Leads", icon: TrendingUp },
              { id: "profile", label: "Profile", icon: User },
            ]
        ).map(({ id, label, icon: Icon }) => {
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