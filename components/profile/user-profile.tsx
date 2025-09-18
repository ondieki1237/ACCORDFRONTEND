"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { authService, type User } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { UserIcon, Mail, MapPin, Building, Shield, LogOut, Edit, TrendingUp } from "lucide-react"
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
      const res = await fetch("http://localhost:5000/api/sales/my", {
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
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Profile Header */}
      <Card className={neumorphicCard}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Avatar className={"w-16 h-16 " + neumorphicInset}>
                <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-muted-foreground">Employee ID: {user.employeeId}</p>
                <Badge className={`mt-2 ${getRoleColor(user.role)}`}>
                  <Shield className="w-3 h-3 mr-1" />
                  {user.role}
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" className={neumorphicButton + " bg-transparent"}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales Target Section */}
      <Card className={neumorphicCard}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <TrendingUp className="w-5 h-5" />
            Sales Target
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={neumorphicInset + " p-6 flex items-center justify-center"}>
            {salesLoading ? (
              <span className="text-gray-400 animate-pulse">Loading...</span>
            ) : salesTarget !== null ? (
              <span className="text-2xl font-bold text-green-700">
                ${salesTarget.toLocaleString()}
              </span>
            ) : (
              <span className="text-red-500">No target found</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className={neumorphicCard}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="w-5 h-5 mr-2 text-primary" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={neumorphicInset + " p-4"}>
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Information */}
      <Card className={neumorphicCard}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="w-5 h-5 mr-2 text-primary" />
            Work Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={neumorphicInset + " p-4"}>
              <div className="flex items-center space-x-3">
                <Building className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium">{user.department}</p>
                </div>
              </div>
            </div>
            <div className={neumorphicInset + " p-4"}>
              <div className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Region</p>
                  <p className="font-medium">{user.region}</p>
                </div>
              </div>
            </div>
          </div>
          <div className={neumorphicInset + " p-4"}>
            <div className="flex items-center space-x-3">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Territory</p>
                <p className="font-medium">{user.territory}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className={neumorphicCard}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              className={"flex-1 " + neumorphicButton + " bg-transparent"}
              onClick={() => toast({ title: "Feature coming soon!" })}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
