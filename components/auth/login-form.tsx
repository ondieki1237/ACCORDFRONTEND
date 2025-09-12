"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    <Card className="w-full max-w-md mx-auto neumorphic-card">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary">ACCORD</CardTitle>
        <CardDescription>Sign in to your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={credentials.email}
              onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
              className="neumorphic-input"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="neumorphic-input"
              required
            />
          </div>
          <Button type="submit" className="w-full neumorphic-button" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
          <Button type="button" variant="ghost" className="w-full neumorphic-button" onClick={onSwitchToRegister}>
            Don't have an account? Register
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
