"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { authService, type User } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { UserIcon, Mail, MapPin, Building, Shield, LogOut, TrendingUp, User as UserIconLucide } from "lucide-react"
import { Preferences } from "@capacitor/preferences"

export function UserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [salesTarget, setSalesTarget] = useState<number | null>(null)
  const [salesLoading, setSalesLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchUserProfile()
    fetchSalesTarget()
  }, [])

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      const userData = await authService.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error("Failed to fetch user profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      })
      // Fallback to cached user data
      const cachedUser = authService.getCurrentUserSync()
      if (cachedUser) {
        setUser(cachedUser)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch sales target from API
  const fetchSalesTarget = async () => {
    try {
      setSalesLoading(true)
      const token = localStorage.getItem("accessToken")
      const res = await fetch("https://app.codewithseth.co.ke/api/sales/my", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) throw new Error("Failed to fetch sales")
      const data = await res.json()
      let target = 0
      if (Array.isArray(data.data)) {
        target = data.data.reduce((sum: number, sale: any) => sum + (sale.target || 0), 0)
      } else if (data.data?.target) {
        target = data.data.target
      }
      setSalesTarget(target)
    } catch (error) {
      setSalesTarget(null)
    } finally {
      setSalesLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
      window.location.reload()
    } catch (error) {
      console.error("Logout failed:", error)
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      })
    }
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "manager":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  // Neumorphism utility classes
  const neumorphicCard =
    "rounded-2xl bg-gray-50 shadow-[8px_8px_16px_#cfd4db,-8px_-8px_16px_#ffffff]"
  const neumorphicInset =
    "bg-gray-50 rounded-lg shadow-inner"
  const neumorphicButton =
    "rounded-xl shadow-[4px_4px_8px_#cfd4db,-4px_-4px_8px_#ffffff]"

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className={neumorphicCard + " p-6"}>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-muted rounded-full"></div>
            <div className="space-y-2">
              <div className="h-6 bg-muted rounded w-32"></div>
              <div className="h-4 bg-muted rounded w-24"></div>
            </div>
          </div>
        </div>
        <div className={neumorphicCard + " p-6"}>
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <UserIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
        <p className="text-muted-foreground mb-4">Unable to load your profile information.</p>
        <Button onClick={fetchUserProfile} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f4f9] via-[#e8ecf4] to-[#dfe5f0] p-4 sm:p-6 lg:p-8">
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Profile Header */}
        <div 
          className="bg-gradient-to-r from-[#00aeef] to-[#0096d6] rounded-3xl p-6 md:p-8 shadow-xl"
          style={{ 
            boxShadow: "12px 12px 24px rgba(0, 174, 239, 0.2), -12px -12px 24px rgba(255, 255, 255, 0.9)"
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-1">
                <Avatar className="w-16 h-16 md:w-20 md:h-20 border-4 border-white/30">
                  <AvatarFallback className="text-2xl font-bold bg-white text-[#00aeef]">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-white/80 text-sm md:text-base mt-1">Employee ID: {user.employeeId}</p>
                <Badge className="mt-2 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                  <Shield className="w-3 h-3 mr-1" />
                  {user.role}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Sales Target Section */}
        <Card 
          className="bg-white rounded-3xl border-0 shadow-xl overflow-hidden"
          style={{ 
            boxShadow: "8px 8px 16px rgba(0, 174, 239, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.9)"
          }}
        >
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-[#00aeef] text-xl font-bold">
              <TrendingUp className="w-6 h-6" />
              Sales Target
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="bg-gradient-to-r from-[#00aeef]/5 to-[#0096d6]/5 rounded-2xl p-8 flex items-center justify-center">
              {salesLoading ? (
                <span className="text-gray-400 animate-pulse">Loading...</span>
              ) : salesTarget !== null ? (
                <span className="text-3xl md:text-4xl font-bold text-[#00aeef]">
                  Ksh {salesTarget.toLocaleString()}
                </span>
              ) : (
                <span className="text-red-500">No target found</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card 
          className="bg-white rounded-3xl border-0 shadow-xl overflow-hidden"
          style={{ 
            boxShadow: "8px 8px 16px rgba(0, 174, 239, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.9)"
          }}
        >
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-[#00aeef] text-xl font-bold">
              <Mail className="w-6 h-6" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="bg-gradient-to-r from-[#00aeef]/5 to-[#0096d6]/5 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white rounded-full p-3 shadow-md">
                  <Mail className="w-5 h-5 text-[#00aeef]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Email</p>
                  <p className="font-semibold text-gray-800">{user.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Work Information */}
        <Card 
          className="bg-white rounded-3xl border-0 shadow-xl overflow-hidden"
          style={{ 
            boxShadow: "8px 8px 16px rgba(0, 174, 239, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.9)"
          }}
        >
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-[#00aeef] text-xl font-bold">
              <Building className="w-6 h-6" />
              Work Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-[#00aeef]/5 to-[#0096d6]/5 rounded-2xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-white rounded-full p-3 shadow-md">
                    <Building className="w-5 h-5 text-[#00aeef]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Department</p>
                    <p className="font-semibold text-gray-800">{user.department}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-[#00aeef]/5 to-[#0096d6]/5 rounded-2xl p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-white rounded-full p-3 shadow-md">
                    <MapPin className="w-5 h-5 text-[#00aeef]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Region</p>
                    <p className="font-semibold text-gray-800">{user.region}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-[#00aeef]/5 to-[#0096d6]/5 rounded-2xl p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white rounded-full p-3 shadow-md">
                  <MapPin className="w-5 h-5 text-[#00aeef]" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Territory</p>
                  <p className="font-semibold text-gray-800">{user.territory}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card 
          className="bg-white rounded-3xl border-0 shadow-xl overflow-hidden"
          style={{ 
            boxShadow: "8px 8px 16px rgba(0, 174, 239, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.9)"
          }}
        >
          <CardContent className="p-6">
            <Button 
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg rounded-xl px-6 py-6 transition-all duration-300 hover:scale-105"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
