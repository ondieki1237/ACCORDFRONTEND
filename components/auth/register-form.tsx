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
    <Card className="w-full max-w-md mx-auto neumorphic-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">ACCORD</CardTitle>
        <CardDescription>Create your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                className="neumorphic-input"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                className="neumorphic-input"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee ID</Label>
            <Input
              id="employeeId"
              placeholder="EMP001"
              value={formData.employeeId}
              onChange={(e) => updateField("employeeId", e.target.value)}
              className="neumorphic-input"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => updateField("email", e.target.value)}
              className="neumorphic-input"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
              className="neumorphic-input"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(value) => updateField("role", value)}>
              <SelectTrigger className="neumorphic-input">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select value={formData.region} onValueChange={(value) => updateField("region", value)}>
                <SelectTrigger className="neumorphic-input">
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
            <div className="space-y-2">
              <Label htmlFor="territory">Territory</Label>
              <Input
                id="territory"
                placeholder="Your work location"
                value={formData.territory}
                onChange={(e) => updateField("territory", e.target.value)}
                className="neumorphic-input"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select value={formData.department} onValueChange={(value) => updateField("department", value)}>
              <SelectTrigger className="neumorphic-input">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full neumorphic-button" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create Account"}
          </Button>
          <Button type="button" variant="ghost" className="w-full neumorphic-button" onClick={onSwitchToLogin}>
            Already have an account? Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
