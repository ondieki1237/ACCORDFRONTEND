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
    <>
      <Card className="w-full bg-white border-none shadow-md rounded-2xl">
        <CardHeader className="text-center space-y-1">
          <img
            src="/accord-icon.png"
            alt="ACCORD Logo"
            className="w-14 h-14 mx-auto mb-2"
          />
          <CardTitle className="text-2xl font-semibold text-[#00aeef]">
            ACCORD
          </CardTitle>
          <CardDescription className="text-gray-500">
            Sign in to your account
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email" className="text-sm text-gray-700">
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
                className="mt-1 rounded-lg border border-gray-200 focus:border-[#00aeef] focus:ring-[#00aeef]"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                className="mt-1 rounded-lg border border-gray-200 focus:border-[#00aeef] focus:ring-[#00aeef]"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#00aeef] text-white font-medium rounded-lg py-2 hover:bg-[#0097d6] transition"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <p className="text-center text-sm text-gray-600">
              Don’t have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-[#00aeef] hover:underline"
              >
                Register
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
