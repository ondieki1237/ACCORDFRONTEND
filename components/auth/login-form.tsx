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
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await authService.login(credentials)
      toast({
        title: "Login successful",
        description: "Welcome back to ACCORD!",
      })
      onSuccess()
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f0f4f8] m-0 p-0">
      <Card className="w-full max-w-md mx-auto rounded-2xl shadow-[8px_8px_16px_#cdd4db,-8px_-8px_16px_#ffffff] border-0">
        <CardHeader className="text-center space-y-2">
          <img
            src="/accord-icon.png"
            alt="ACCORD Logo"
            className="w-16 h-16 mx-auto mb-2 drop-shadow-md"
          />
          <CardTitle className="text-3xl font-extrabold text-[#00aeef] tracking-wide">
            ACCORD
          </CardTitle>
          <CardDescription className="text-gray-600">
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={credentials.email}
                onChange={(e) =>
                  setCredentials({ ...credentials, email: e.target.value })
                }
                className="rounded-xl shadow-inner px-3 py-2"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                className="rounded-xl shadow-inner px-3 py-2"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#00aeef] text-white font-semibold rounded-xl shadow-[4px_4px_8px_#cdd4db,-4px_-4px_8px_#ffffff] hover:bg-[#0097d6] transition-all"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-gray-700 hover:text-[#00aeef] rounded-xl transition-all"
              onClick={onSwitchToRegister}
            >
              Don&apos;t have an account? Register
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
