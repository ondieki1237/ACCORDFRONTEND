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
import { Eye, EyeOff, User, Mail, Lock, UserPlus, ArrowRight, CheckCircle, Briefcase, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

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
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  const validateField = (field: keyof RegisterData, value: string) => {
    const newErrors = { ...errors }
    
    switch (field) {
      case 'email':
        newErrors.email = value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        break
      case 'password':
        newErrors.password = value && !(value.length >= 8 && /\d/.test(value))
        break
      case 'employeeId':
        newErrors[field] = value && !/^EMP\d{3,6}$/.test(value.toUpperCase())
        break
    }
    
    setErrors(newErrors)
    return !newErrors[field]
  }

  const updateField = (field: keyof RegisterData, value: string) => {
    setFormData({ ...formData, [field]: field === 'employeeId' ? value.toUpperCase() : value })
    if (field === 'email' || field === 'password' || field === 'employeeId') {
      validateField(field, value)
    }
  }

  const isFormValid = formData.firstName && formData.lastName && formData.email && 
    formData.password && formData.employeeId && formData.territory &&
    formData.role && formData.region && formData.department &&
    !errors.email && !errors.password && !errors.employeeId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields correctly.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await authService.register(formData)
      toast({
        title: "Welcome to ACCORD!",
        description: "Your account has been created.",
      })
      onSuccess()
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-lg relative">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <Card className="neumorphic-card-main relative overflow-hidden group">
          {/* Decorative Border */}
          <div className="absolute inset-0 rounded-[28px] border-2 border-transparent bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-700 -m-px"></div>

          <CardHeader className="relative z-10 text-center space-y-4 pt-8 pb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#00aeef] via-blue-600 to-indigo-700 rounded-[16px] shadow-xl mx-auto">
              <Image
                src="/accord-icon.png"
                alt="ACCORD Logo"
                width={32}
                height={32}
                className="drop-shadow-lg"
                priority
              />
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-3xl font-black bg-gradient-to-r from-[#00aeef] via-blue-600 to-indigo-700 bg-clip-text text-transparent">
                Join ACCORD
              </CardTitle>
              <CardDescription className="text-gray-600">
                Create your sales account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="relative z-10 space-y-6 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Personal Info - Compact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-3 w-3 text-[#00aeef]" />
                    First Name
                  </Label>
                  <Input
                    placeholder="Seth"
                    value={formData.firstName}
                    onChange={(e) => updateField("firstName", e.target.value)}
                    className="h-11 neumorphic-input-field pl-8"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-3 w-3 text-[#00aeef]" />
                    Last Name
                  </Label>
                  <Input
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => updateField("lastName", e.target.value)}
                    className="h-11 neumorphic-input-field pl-8"
                    required
                  />
                </div>
              </div>

              {/* Employee ID & Email */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-3 w-3 text-[#00aeef]" />
                    Employee ID
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="EMP001"
                      value={formData.employeeId}
                      onChange={(e) => updateField("employeeId", e.target.value)}
                      className={cn(
                        "h-11 neumorphic-input-field pl-8 pr-8",
                        errors.employeeId && "neumorphic-input-error"
                      )}
                      required
                    />
                    {formData.employeeId && !errors.employeeId && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {errors.employeeId && (
                    <p className="text-xs text-red-600">Format: EMP001</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="h-3 w-3 text-[#00aeef]" />
                    Email
                  </Label>
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className={cn(
                        "h-11 neumorphic-input-field pl-8 pr-8",
                        errors.email && "neumorphic-input-error"
                      )}
                      required
                    />
                    {formData.email && !errors.email && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-600">Invalid email</p>
                  )}
                </div>
              </div>

              {/* Password & Territory */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Lock className="h-3 w-3 text-[#00aeef]" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => updateField("password", e.target.value)}
                      className={cn(
                        "h-11 neumorphic-input-field pl-8 pr-10",
                        errors.password && "neumorphic-input-error"
                      )}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    {formData.password && !errors.password && (
                      <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600">8+ chars with number</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-[#00aeef]" />
                    Territory
                  </Label>
                  <Input
                    placeholder="Nairobi Central"
                    value={formData.territory}
                    onChange={(e) => updateField("territory", e.target.value)}
                    className="h-11 neumorphic-input-field pl-8"
                    required
                  />
                </div>
              </div>

              {/* Work Info - Compact */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Briefcase className="h-3 w-3 text-[#00aeef]" />
                    Role
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => updateField("role", value)}>
                    <SelectTrigger className="h-11 neumorphic-select pl-8">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-[#00aeef]" />
                    Region
                  </Label>
                  <Select value={formData.region} onValueChange={(value) => updateField("region", value)}>
                    <SelectTrigger className="h-11 neumorphic-select pl-8">
                      <SelectValue placeholder="County" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {kenyanCounties.slice(0, 10).map((county) => (
                        <SelectItem key={county} value={county}>{county}</SelectItem>
                      ))}
                      {kenyanCounties.length > 10 && (
                        <SelectItem value="other" className="text-gray-500">Other...</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Department - Single field */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Briefcase className="h-3 w-3 text-[#00aeef]" />
                  Department
                </Label>
                <Select value={formData.department} onValueChange={(value) => updateField("department", value)}>
                  <SelectTrigger className="h-11 neumorphic-select pl-8">
                    <SelectValue placeholder="Department" />
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
                className={cn(
                  "w-full h-12 text-base font-bold relative overflow-hidden group",
                  isFormValid ? "neumorphic-button-primary" : "neumorphic-button-disabled"
                )}
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2 transition-all group-hover:translate-x-1">
                    <UserPlus className="h-4 w-4" />
                    Create Account
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1" />
                  </span>
                )}
              </Button>
            </form>

            {/* Login Link */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-sm font-semibold neumorphic-button-secondary"
              onClick={onSwitchToLogin}
              disabled={isLoading}
            >
              Already have an account? Sign in
            </Button>

            <p className="text-xs text-gray-500 text-center pt-4">
              By signing up, you agree to our{' '}
              <button className="text-[#00aeef] hover:text-blue-700 font-medium">Terms</button>
            </p>
          </CardContent>
        </Card>
      </div>

        {/* Compact Custom Styles */}
        <style jsx>{`
        .neumorphic-card-main {
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 24px;
          box-shadow: 
            15px 15px 30px rgba(225, 229, 233, 0.7),
            -15px -15px 30px rgba(255, 255, 255, 0.8),
            inset 8px 8px 16px rgba(255, 255, 255, 0.6),
            inset -8px -8px 16px rgba(225, 229, 233, 0.5);
          border: 1px solid rgba(233, 236, 239, 0.6);
          backdrop-filter: blur(15px);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .neumorphic-card-main:hover {
          box-shadow: 
            20px 20px 40px rgba(225, 229, 233, 0.8),
            -20px -20px 40px rgba(255, 255, 255, 0.9),
            inset 10px 10px 20px rgba(255, 255, 255, 0.7),
            inset -10px -10px 20px rgba(225, 229, 233, 0.6);
          transform: translateY(-3px);
        }

        .neumorphic-input-field,
        .neumorphic-select {
          background: linear-gradient(145deg, #ffffff 0%, #fafbfc 100%) !important;
          border: 2px solid rgba(233, 236, 239, 0.7) !important;
          border-radius: 12px !important;
          box-shadow: 
            inset 4px 4px 8px rgba(225, 229, 233, 0.6),
            inset -4px -4px 8px rgba(255, 255, 255, 0.8),
            2px 2px 4px rgba(225, 229, 233, 0.3),
            -2px -2px 4px rgba(255, 255, 255, 0.5);
          transition: all 0.3s ease !important;
          padding: 12px 16px !important;
          font-size: 14px !important;
        }

        .neumorphic-input-field:focus,
        .neumorphic-select:focus-within {
          box-shadow: 
            inset 2px 2px 4px rgba(225, 229, 233, 0.4),
            inset -2px -2px 4px rgba(255, 255, 255, 0.6),
            0 0 0 3px rgba(0, 174, 239, 0.1),
            4px 4px 8px rgba(0, 174, 239, 0.15) !important;
          border-color: #00aeef !important;
          transform: translateY(-1px) !important;
        }

        .neumorphic-input-error {
          border-color: #ef4444 !important;
          box-shadow: 
            inset 4px 4px 8px rgba(239, 68, 68, 0.1),
            inset -4px -4px 8px rgba(255, 255, 255, 0.8),
            0 0 0 2px rgba(239, 68, 68, 0.15) !important;
        }

        .neumorphic-button-primary {
          background: linear-gradient(145deg, #00aeef 0%, #0097d6 100%) !important;
          border: none !important;
          box-shadow: 
            8px 8px 16px rgba(0, 174, 239, 0.3),
            -8px -8px 16px rgba(0, 151, 214, 0.2),
            inset 4px 4px 8px rgba(255, 255, 255, 0.2),
            inset -4px -4px 8px rgba(0, 151, 214, 0.1);
          border-radius: 12px !important;
          transition: all 0.3s ease !important;
        }

        .neumorphic-button-primary:hover:not(:disabled) {
          box-shadow: 
            6px 6px 12px rgba(0, 174, 239, 0.4),
            -6px -6px 12px rgba(0, 151, 214, 0.3),
            inset 3px 3px 6px rgba(255, 255, 255, 0.3),
            inset -3px -3px 6px rgba(0, 151, 214, 0.2);
          transform: translateY(-2px);
        }

        .neumorphic-button-secondary {
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%) !important;
          border: 2px solid rgba(233, 236, 239, 0.7) !important;
          box-shadow: 
            6px 6px 12px rgba(225, 229, 233, 0.5),
            -6px -6px 12px rgba(255, 255, 255, 0.7),
            inset 3px 3px 6px rgba(255, 255, 255, 0.3),
            inset -3px -3px 6px rgba(225, 229, 233, 0.2);
          border-radius: 12px !important;
          transition: all 0.3s ease !important;
          color: #374151 !important;
          font-weight: 600 !important;
        }

        .neumorphic-button-secondary:hover:not(:disabled) {
          box-shadow: 
            4px 4px 8px rgba(225, 229, 233, 0.6),
            -4px -4px 8px rgba(255, 255, 255, 0.8),
            inset 2px 2px 4px rgba(255, 255, 255, 0.4),
            inset -2px -2px 4px rgba(225, 229, 233, 0.3);
          transform: translateY(-1px);
          border-color: rgba(0, 174, 239, 0.2) !important;
        }

        .neumorphic-select-content {
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%) !important;
          border-radius: 12px !important;
          box-shadow: 
            8px 8px 16px rgba(225, 229, 233, 0.7),
            -8px -8px 16px rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(233, 236, 239, 0.6) !important;
        }

        @media (max-width: 640px) {
          .grid-cols-2 {
            grid-template-columns: 1fr !important;
          }
          
          .neumorphic-card-main {
            margin: 1rem;
            border-radius: 20px;
          }
        }
      `}</style>
    </div>
  )
}