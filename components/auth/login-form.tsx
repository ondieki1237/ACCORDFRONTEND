"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService, type LoginCredentials } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  onSwitchToReset: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister, onSwitchToReset }: LoginFormProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.login(credentials);
      toast({ title: "Login successful", description: "Welcome back to ACCORD!" });
      onSuccess();
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* -------------------------------------------------
       FULL-PAGE FORM – NO CARD, NO PADDING, NO SHADOW
       ------------------------------------------------- */
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
      {/* Logo + Title */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
          <img src="/accord-icon.png" alt="ACCORD Logo" className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-[#00aeef]">ACCORD</h1>
        <p className="text-sm text-gray-600 mt-1">Sign in to your account</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full max-w-xs space-y-4">
        {/* Email */}
        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs font-medium text-gray-700">
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
            className="h-10 text-sm rounded-md border border-gray-300 focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
            required
          />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <Label htmlFor="password" className="text-xs font-medium text-gray-700">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={credentials.password}
            onChange={(e) =>
              setCredentials({ ...credentials, password: e.target.value })
            }
            className="h-10 text-sm rounded-md border border-gray-300 focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
            required
          />
        </div>

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSwitchToReset}
            className="text-xs text-[#00aeef] hover:text-[#0097d6] hover:underline"
          >
            Forgot Password?
          </button>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-10 bg-[#00aeef] hover:bg-[#0097d6] text-white font-medium rounded-md text-sm transition-all"
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>

        {/* Register Link */}
        <p className="text-center text-xs text-gray-600 mt-4">
          Don’t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-medium text-[#00aeef] hover:text-[#0097d6] hover:underline"
          >
            Register
          </button>
        </p>
      </form>
    </div>
  );
}