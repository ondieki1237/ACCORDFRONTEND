"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Logo + Title */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
          <img src="/accord-icon.png" alt="ACCORD Logo" className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-[#00aeef]">ACCORD</h1>
        <p className="text-sm text-gray-600 mt-1">Create your employee account</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
        {/* Name Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="firstName" className="text-xs font-medium text-gray-700">First Name</Label>
            <Input
              id="firstName"
              placeholder="John"
              value={formData.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              className="h-11 text-sm rounded-lg border border-gray-300 focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="lastName" className="text-xs font-medium text-gray-700">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Doe"
              value={formData.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              className="h-11 text-sm rounded-lg border border-gray-300 focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
              required
            />
          </div>
        </div>

        {/* Employee ID & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="employeeId" className="text-xs font-medium text-gray-700">Employee ID</Label>
            <Input
              id="employeeId"
              placeholder="EMP001"
              value={formData.employeeId}
              onChange={(e) => updateField("employeeId", e.target.value)}
              className="h-11 text-sm rounded-lg border border-gray-300 focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs font-medium text-gray-700">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="h-11 text-sm rounded-lg border border-gray-300 focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Label htmlFor="password" className="text-xs font-medium text-gray-700">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter strong password"
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
            className="h-11 text-sm rounded-lg border border-gray-300 focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
            required
          />
        </div>

        {/* Role */}
        <div className="space-y-1">
          <Label htmlFor="role" className="text-xs font-medium text-gray-700">Role</Label>
          <Select value={formData.role} onValueChange={(value) => updateField("role", value)}>
            <SelectTrigger className="h-11 text-sm rounded-lg border border-gray-300 focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Region & Territory */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="region" className="text-xs font-medium text-gray-700">Region</Label>
            <Select value={formData.region} onValueChange={(value) => updateField("region", value)}>
              <SelectTrigger className="h-11 text-sm rounded-lg border border-gray-300 focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20">
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
          <div className="space-y-1">
            <Label htmlFor="territory" className="text-xs font-medium text-gray-700">Territory</Label>
            <Input
              id="territory"
              placeholder="Work location"
              value={formData.territory}
              onChange={(e) => updateField("territory", e.target.value)}
              className="h-11 text-sm rounded-lg border border-gray-300 focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
              required
            />
          </div>
        </div>

        {/* Department */}
        <div className="space-y-1">
          <Label htmlFor="department" className="text-xs font-medium text-gray-700">Department</Label>
          <Select value={formData.department} onValueChange={(value) => updateField("department", value)}>
            <SelectTrigger className="h-11 text-sm rounded-lg border border-gray-300 focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-12 bg-[#00aeef] hover:bg-[#0097d6] text-white font-medium rounded-lg text-sm transition-all shadow-sm"
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>

        {/* Switch to Login */}
        <p className="text-center text-xs text-gray-600 mt-4">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-[#00aeef] hover:text-[#0097d6] hover:underline"
          >
            Sign in
          </button>
        </p>
      </form>
    </div>
  )
}