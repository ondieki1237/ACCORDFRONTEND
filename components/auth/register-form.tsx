"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authService, type RegisterData } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { kenyanCounties } from "@/lib/constants"

interface RegisterFormProps {
  onSuccess: () => void
  onSwitchToLogin: () => void
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterData>({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "",
    region: "",
    territory: "",
    department: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await authService.register(formData)
      toast({
        title: "Registration successful",
        description: "Welcome to ACCORD!",
      })
      onSuccess()
    } catch (error) {
      toast({
        title: "Registration failed",
        description: "Please check your information and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateField = (field: keyof RegisterData, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-10">
      <Card className="w-full max-w-lg border border-gray-100 shadow-md rounded-2xl">
        <CardHeader className="text-center space-y-2">
          <img
            src="/accord-icon.png"
            alt="ACCORD Logo"
            className="w-16 h-16 mx-auto mb-2"
          />
          <CardTitle className="text-3xl font-semibold text-[#00aeef] tracking-wide">
            ACCORD
          </CardTitle>
          <CardDescription className="text-gray-500">
            Create your employee account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* --- Name Section --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-sm text-gray-700">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  className="mt-1 rounded-lg border border-gray-300 focus:border-[#00aeef] focus:ring-[#00aeef]"
                  required
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm text-gray-700">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  className="mt-1 rounded-lg border border-gray-300 focus:border-[#00aeef] focus:ring-[#00aeef]"
                  required
                />
              </div>
            </div>

            {/* --- Employee & Email --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="employeeId" className="text-sm text-gray-700">Employee ID</Label>
                <Input
                  id="employeeId"
                  placeholder="EMP001"
                  value={formData.employeeId}
                  onChange={(e) => updateField("employeeId", e.target.value)}
                  className="mt-1 rounded-lg border border-gray-300 focus:border-[#00aeef] focus:ring-[#00aeef]"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm text-gray-700">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className="mt-1 rounded-lg border border-gray-300 focus:border-[#00aeef] focus:ring-[#00aeef]"
                  required
                />
              </div>
            </div>

            {/* --- Password --- */}
            <div>
              <Label htmlFor="password" className="text-sm text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter strong password"
                value={formData.password}
                onChange={(e) => updateField("password", e.target.value)}
                className="mt-1 rounded-lg border border-gray-300 focus:border-[#00aeef] focus:ring-[#00aeef]"
                required
              />
            </div>

            {/* --- Role --- */}
            <div>
              <Label htmlFor="role" className="text-sm text-gray-700">Role</Label>
              <Select value={formData.role} onValueChange={(value) => updateField("role", value)}>
                <SelectTrigger className="mt-1 rounded-lg border border-gray-300 focus:border-[#00aeef] focus:ring-[#00aeef]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* --- Region & Territory --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="region" className="text-sm text-gray-700">Region</Label>
                <Select value={formData.region} onValueChange={(value) => updateField("region", value)}>
                  <SelectTrigger className="mt-1 rounded-lg border border-gray-300 focus:border-[#00aeef] focus:ring-[#00aeef]">
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {kenyanCounties.map((county) => (
                      <SelectItem key={county} value={county}>
                        {county}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="territory" className="text-sm text-gray-700">Territory</Label>
                <Input
                  id="territory"
                  placeholder="Work location"
                  value={formData.territory}
                  onChange={(e) => updateField("territory", e.target.value)}
                  className="mt-1 rounded-lg border border-gray-300 focus:border-[#00aeef] focus:ring-[#00aeef]"
                  required
                />
              </div>
            </div>

            {/* --- Department --- */}
            <div>
              <Label htmlFor="department" className="text-sm text-gray-700">Department</Label>
              <Select value={formData.department} onValueChange={(value) => updateField("department", value)}>
                <SelectTrigger className="mt-1 rounded-lg border border-gray-300 focus:border-[#00aeef] focus:ring-[#00aeef]">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* --- Submit Button --- */}
            <Button
              type="submit"
              className="w-full bg-[#00aeef] text-white font-medium rounded-lg py-2 hover:bg-[#0097d6] transition"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>

            {/* --- Switch to Login --- */}
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-[#00aeef] hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
