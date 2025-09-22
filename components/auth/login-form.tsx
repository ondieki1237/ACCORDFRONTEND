"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { authService, type LoginCredentials } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Mail, Lock, UserPlus, ArrowRight, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface LoginFormProps {
  onSuccess: () => void
  onSwitchToRegister: () => void
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isValidEmail, setIsValidEmail] = useState(true)
  const [isValidPassword, setIsValidPassword] = useState(true)
  const { toast } = useToast()

  // Enhanced validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    setIsValidEmail(emailRegex.test(email) || email.length === 0)
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    const hasLength = password.length >= 8
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const hasNumber = /\d/.test(password)
    setIsValidPassword(hasLength && hasSpecialChar && hasNumber)
    return hasLength && hasSpecialChar && hasNumber
  }

  const handleInputChange = (field: 'email' | 'password', value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }))
    
    if (field === 'email') {
      validateEmail(value)
    } else {
      validatePassword(value)
    }
  }

  const isFormValid = credentials.email && credentials.password && 
    isValidEmail && isValidPassword && 
    validateEmail(credentials.email) && validatePassword(credentials.password)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form and try again.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await authService.login(credentials)
      toast({
        title: "Welcome back!",
        description: "Successfully signed in to ACCORD",
        duration: 3000,
      })
      onSuccess()
    } catch (error: any) {
      const errorMessage = error?.message || "Login failed. Please check your credentials."
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-md relative">
        {/* Enhanced Background Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-purple-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <Card className="neumorphic-card-main relative overflow-hidden group">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-100/30 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          {/* Decorative Border */}
          <div className="absolute inset-0 rounded-[28px] border-2 border-transparent bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-700 -m-px"></div>

          <CardHeader className="relative z-10 text-center space-y-6 pt-10 pb-8">
            {/* Logo/Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#00aeef] via-blue-600 to-indigo-700 rounded-[20px] shadow-2xl mx-auto border-2 border-white/20 backdrop-blur-sm">
              <Image
                src="/accord-icon.png"
                alt="ACCORD Logo"
                width={48}
                height={48}
                className="drop-shadow-lg"
                priority
              />
            </div>
            
            <div className="space-y-3">
              <CardTitle className="text-4xl font-black bg-gradient-to-r from-[#00aeef] via-blue-600 to-indigo-700 bg-clip-text text-transparent tracking-tight">
                ACCORD
              </CardTitle>
              <CardDescription className="text-gray-600 text-base font-medium leading-relaxed">
                Sign in to your account
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="relative z-10 space-y-6 pb-10">
            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Email Field */}
              <div className="space-y-3">
                <Label 
                  htmlFor="email" 
                  className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 group/data-[invalid=true]:text-red-600"
                  data-invalid={!isValidEmail && credentials.email}
                >
                  <div className="p-1.5 bg-gradient-to-br from-[#00aeef]/10 to-blue-600/10 rounded-full">
                    <Mail className="h-4 w-4 text-[#00aeef]" />
                  </div>
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="seth@example.com"
                    value={credentials.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={cn(
                      "neumorphic-input-field relative pl-12 pr-4 h-14 text-base font-medium",
                      !isValidEmail && credentials.email && "neumorphic-input-error"
                    )}
                    required
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Mail className={cn(
                      "h-4 w-4 transition-colors",
                      !isValidEmail && credentials.email ? "text-red-400" : "text-gray-400"
                    )} />
                  </div>
                  
                  {/* Validation Indicator */}
                  {credentials.email && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {isValidEmail ? (
                        <div className="neumorphic-validation-success p-1.5 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 border-2 border-red-400 rounded-full animate-pulse bg-red-50"></div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Validation Message */}
                {!isValidEmail && credentials.email && (
                  <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50/80 backdrop-blur-sm px-3 py-2 rounded-xl border border-red-200">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                    Please enter a valid email address
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-3">
                <Label 
                  htmlFor="password" 
                  className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 group/data-[invalid=true]:text-red-600"
                  data-invalid={!isValidPassword && credentials.password}
                >
                  <div className="p-1.5 bg-gradient-to-br from-[#00aeef]/10 to-blue-600/10 rounded-full">
                    <Lock className="h-4 w-4 text-[#00aeef]" />
                  </div>
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={credentials.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={cn(
                      "neumorphic-input-field relative pl-12 pr-14 h-14 text-base font-medium",
                      !isValidPassword && credentials.password && "neumorphic-input-error"
                    )}
                    required
                  />
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Lock className={cn(
                      "h-4 w-4 transition-colors",
                      !isValidPassword && credentials.password ? "text-red-400" : "text-gray-400"
                    )} />
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 p-0 neumorphic-button-icon"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-600" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-600" />
                    )}
                  </Button>

                  {/* Validation Indicator */}
                  {credentials.password && (
                    <div className="absolute right-14 top-1/2 -translate-y-1/2">
                      {isValidPassword ? (
                        <div className="neumorphic-validation-success p-1.5 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 border-2 border-red-400 rounded-full animate-pulse bg-red-50"></div>
                      )}
                    </div>
                  )}
                </div>

                {/* Password Requirements */}
                {credentials.password && (
                  <div className="space-y-2.5 bg-gray-50/50 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50">
                    <div className="flex items-center gap-3 text-xs text-gray-700 font-medium">
                      <div className={cn(
                        "w-2 h-2 rounded-full transition-all duration-200",
                        credentials.password.length >= 8 ? "bg-green-600 scale-110 shadow-sm" : "bg-gray-300"
                      )} />
                      At least 8 characters
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-700 font-medium">
                      <div className={cn(
                        "w-2 h-2 rounded-full transition-all duration-200",
                        /\d/.test(credentials.password) ? "bg-green-600 scale-110 shadow-sm" : "bg-gray-300"
                      )} />
                      Contains a number
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-700 font-medium">
                      <div className={cn(
                        "w-2 h-2 rounded-full transition-all duration-200",
                        /[!@#$%^&*(),.?":{}|<>]/.test(credentials.password) ? "bg-green-600 scale-110 shadow-sm" : "bg-gray-300"
                      )} />
                      Special character
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className={cn(
                  "w-full h-14 text-base font-bold relative overflow-hidden group shadow-2xl",
                  isFormValid 
                    ? "neumorphic-button-primary" 
                    : "neumorphic-button-disabled"
                )}
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                    <span className="opacity-0">Signing in...</span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center justify-center gap-2.5 transition-all duration-300 group-hover:translate-x-1">
                      <span>Sign In</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </span>
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wide">
                <span className="px-3 bg-white/80 backdrop-blur-sm text-gray-500 font-medium rounded-full shadow-sm">
                  or
                </span>
              </div>
            </div>

            {/* Register Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-base font-semibold neumorphic-button-secondary group shadow-lg"
              onClick={onSwitchToRegister}
              disabled={isLoading}
            >
              <span className="flex items-center justify-center gap-2.5 transition-all duration-300 group-hover:translate-x-1">
                <UserPlus className="h-4 w-4" />
                <span>Create New Account</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
            </Button>

            {/* Additional Links */}
            <div className="text-center space-y-3 pt-6">
              <p className="text-xs text-gray-500 leading-relaxed">
                By signing in, you agree to our{' '}
                <button className="text-[#00aeef] hover:text-blue-700 font-semibold transition-colors duration-200">
                  Terms of Service
                </button>{' '}
                and{' '}
                <button className="text-[#00aeef] hover:text-blue-700 font-semibold transition-colors duration-200">
                  Privacy Policy
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Floating Decorative Elements */}
        <div className="absolute top-24 left-6">
          <div className="w-2 h-2 bg-[#00aeef]/20 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
        </div>
        <div className="absolute bottom-24 right-6">
          <div className="w-2 h-2 bg-blue-500/20 rounded-full animate-ping" style={{animationDelay: '1.5s'}}></div>
        </div>
      </div>

      {/* Enhanced Custom Styles */}
      <style jsx>{`
        .neumorphic-card-main {
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 28px;
          box-shadow: 
            25px 25px 50px rgba(225, 229, 233, 0.8),
            -25px -25px 50px rgba(255, 255, 255, 0.9),
            inset 12px 12px 24px rgba(255, 255, 255, 0.8),
            inset -12px -12px 24px rgba(225, 229, 233, 0.6);
          border: 1px solid rgba(233, 236, 239, 0.8);
          backdrop-filter: blur(20px);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .neumorphic-card-main:hover {
          box-shadow: 
            30px 30px 60px rgba(225, 229, 233, 0.9),
            -30px -30px 60px rgba(255, 255, 255, 0.95),
            inset 15px 15px 30px rgba(255, 255, 255, 0.9),
            inset -15px -15px 30px rgba(225, 229, 233, 0.7);
          transform: translateY(-6px);
        }

        .neumorphic-input-field {
          background: linear-gradient(145deg, #ffffff 0%, #fafbfc 100%) !important;
          border: 2px solid rgba(233, 236, 239, 0.8) !important;
          border-radius: 20px !important;
          box-shadow: 
            inset 6px 6px 12px rgba(225, 229, 233, 0.7),
            inset -6px -6px 12px rgba(255, 255, 255, 0.9),
            4px 4px 8px rgba(225, 229, 233, 0.4),
            -4px -4px 8px rgba(255, 255, 255, 0.6);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
          padding: 16px 20px !important;
          font-size: 16px !important;
          position: relative;
        }

        .neumorphic-input-field:focus {
          box-shadow: 
            inset 3px 3px 6px rgba(225, 229, 233, 0.5),
            inset -3px -3px 6px rgba(255, 255, 255, 0.8),
            0 0 0 4px rgba(0, 174, 239, 0.15),
            6px 6px 12px rgba(0, 174, 239, 0.2) !important;
          border-color: #00aeef !important;
          transform: translateY(-2px) !important;
        }

        .neumorphic-input-field:hover:not(:focus) {
          box-shadow: 
            inset 4px 4px 8px rgba(225, 229, 233, 0.6),
            inset -4px -4px 8px rgba(255, 255, 255, 0.85),
            5px 5px 10px rgba(225, 229, 233, 0.5),
            -5px -5px 10px rgba(255, 255, 255, 0.7);
          transform: translateY(-1px);
          border-color: rgba(0, 174, 239, 0.3) !important;
        }

        .neumorphic-input-error {
          border-color: rgba(239, 68, 68, 0.6) !important;
          box-shadow: 
            inset 6px 6px 12px rgba(239, 68, 68, 0.1),
            inset -6px -6px 12px rgba(255, 255, 255, 0.9),
            0 0 0 2px rgba(239, 68, 68, 0.15) !important;
        }

        .neumorphic-button-primary {
          background: linear-gradient(145deg, #00aeef 0%, #0097d6 50%, #0077b6 100%) !important;
          border: none !important;
          box-shadow: 
            12px 12px 24px rgba(0, 174, 239, 0.4),
            -12px -12px 24px rgba(0, 151, 214, 0.3),
            inset 6px 6px 12px rgba(255, 255, 255, 0.2),
            inset -6px -6px 12px rgba(0, 151, 214, 0.2);
          border-radius: 20px !important;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .neumorphic-button-primary:hover:not(:disabled) {
          box-shadow: 
            8px 8px 16px rgba(0, 174, 239, 0.5),
            -8px -8px 16px rgba(0, 151, 214, 0.4),
            inset 4px 4px 8px rgba(255, 255, 255, 0.3),
            inset -4px -4px 8px rgba(0, 151, 214, 0.3);
          transform: translateY(-3px);
          background: linear-gradient(145deg, #0097d6 0%, #0077b6 50%, #005a8b 100%) !important;
        }

        .neumorphic-button-primary:active {
          box-shadow: 
            inset 6px 6px 12px rgba(0, 151, 214, 0.4),
            inset -6px -6px 12px rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .neumorphic-button-disabled {
          background: linear-gradient(145deg, #f8f9fa 0%, #e9ecef 100%) !important;
          border: 2px solid rgba(222, 226, 230, 0.8) !important;
          box-shadow: 
            inset 8px 8px 16px rgba(225, 229, 233, 0.8),
            inset -8px -8px 16px rgba(255, 255, 255, 0.4);
          color: #6c757d !important;
          cursor: not-allowed !important;
        }

        .neumorphic-button-secondary {
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%) !important;
          border: 2px solid rgba(233, 236, 239, 0.8) !important;
          box-shadow: 
            10px 10px 20px rgba(225, 229, 233, 0.6),
            -10px -10px 20px rgba(255, 255, 255, 0.8),
            inset 5px 5px 10px rgba(255, 255, 255, 0.4),
            inset -5px -5px 10px rgba(225, 229, 233, 0.3);
          border-radius: 20px !important;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
          color: #374151 !important;
          font-weight: 600 !important;
        }

        .neumorphic-button-secondary:hover:not(:disabled) {
          box-shadow: 
            6px 6px 12px rgba(225, 229, 233, 0.8),
            -6px -6px 12px rgba(255, 255, 255, 0.9),
            inset 3px 3px 6px rgba(255, 255, 255, 0.5),
            inset -3px -3px 6px rgba(225, 229, 233, 0.4);
          transform: translateY(-2px);
          border-color: rgba(0, 174, 239, 0.3) !important;
        }

        .neumorphic-button-icon {
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%) !important;
          border: none !important;
          box-shadow: 
            4px 4px 8px rgba(225, 229, 233, 0.6),
            -4px -4px 8px rgba(255, 255, 255, 0.8),
            inset 2px 2px 4px rgba(255, 255, 255, 0.4),
            inset -2px -2px 4px rgba(225, 229, 233, 0.3);
          border-radius: 16px !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .neumorphic-button-icon:hover {
          box-shadow: 
            2px 2px 4px rgba(225, 229, 233, 0.8),
            -2px -2px 4px rgba(255, 255, 255, 0.9),
            inset 1px 1px 2px rgba(255, 255, 255, 0.3),
            inset -1px -1px 2px rgba(225, 229, 233, 0.4);
          transform: translateY(-1px) scale(1.05);
        }

        .neumorphic-validation-success {
          background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 
            3px 3px 6px rgba(225, 229, 233, 0.6),
            -3px -3px 6px rgba(255, 255, 255, 0.8),
            inset 1px 1px 2px rgba(255, 255, 255, 0.4),
            inset -1px -1px 2px rgba(225, 229, 233, 0.3);
          border-radius: 12px;
          transition: all 0.3s ease;
        }

        .neumorphic-validation-success:hover {
          box-shadow: 
            2px 2px 4px rgba(34, 197, 94, 0.3),
            -2px -2px 4px rgba(255, 255, 255, 0.9),
            inset 1px 1px 2px rgba(255, 255, 255, 0.3),
            inset -1px -1px 2px rgba(225, 229, 233, 0.4);
          transform: scale(1.1);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        @media (max-width: 640px) {
          .neumorphic-card-main {
            margin: 1rem;
            box-shadow: 
              15px 15px 30px rgba(225, 229, 233, 0.8),
              -15px -15px 30px rgba(255, 255, 255, 0.9),
              inset 8px 8px 16px rgba(255, 255, 255, 0.8),
              inset -8px -8px 16px rgba(225, 229, 233, 0.6);
            border-radius: 24px;
          }

          .neumorphic-card-main:hover {
            transform: translateY(-3px);
          }
        }

        /* Custom scrollbar for password requirements */
        .space-y-2.5::-webkit-scrollbar {
          width: 4px;
        }

        .space-y-2.5::-webkit-scrollbar-track {
          background: rgba(225, 229, 233, 0.5);
          border-radius: 2px;
        }

        .space-y-2.5::-webkit-scrollbar-thumb {
          background: rgba(0, 174, 239, 0.3);
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}