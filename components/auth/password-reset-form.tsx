"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { ArrowLeft, Mail, Lock, CheckCircle } from "lucide-react";

interface PasswordResetFormProps {
    onSwitchToLogin: () => void;
}

type ResetStep = "email" | "code" | "password";

export function PasswordResetForm({ onSwitchToLogin }: PasswordResetFormProps) {
    const [currentStep, setCurrentStep] = useState<ResetStep>("email");
    const [email, setEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Step 1: Request password reset (send verification code)
    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await apiService.requestPasswordReset(email);

            toast({
                title: "Verification code sent",
                description: `A 6-digit code has been sent to ${email}`,
            });

            setCurrentStep("code");
        } catch (error: any) {
            toast({
                title: "Failed to send code",
                description: error.message || "Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify code
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();

        if (verificationCode.length !== 6) {
            toast({
                title: "Invalid code",
                description: "Please enter a 6-digit verification code.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            await apiService.verifyResetCode(email, verificationCode);

            toast({
                title: "Code verified",
                description: "Please create your new password.",
            });

            setCurrentStep("password");
        } catch (error: any) {
            toast({
                title: "Invalid verification code",
                description: error.message || "Please check the code and try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3: Reset password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate password length (4-8 characters)
        if (newPassword.length < 4 || newPassword.length > 8) {
            toast({
                title: "Invalid password",
                description: "Password must be between 4 and 8 characters.",
                variant: "destructive",
            });
            return;
        }

        // Validate password confirmation
        if (newPassword !== confirmPassword) {
            toast({
                title: "Passwords don't match",
                description: "Please make sure both passwords are the same.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            await apiService.resetPassword(email, verificationCode, newPassword);

            toast({
                title: "Password reset successful",
                description: "You can now login with your new password.",
            });

            // Redirect to login after 2 seconds
            setTimeout(() => {
                onSwitchToLogin();
            }, 2000);
        } catch (error: any) {
            toast({
                title: "Failed to reset password",
                description: error.message || "Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Resend verification code
    const handleResendCode = async () => {
        setIsLoading(true);

        try {
            await apiService.requestPasswordReset(email);

            toast({
                title: "Code resent",
                description: `A new verification code has been sent to ${email}`,
            });
        } catch (error: any) {
            toast({
                title: "Failed to resend code",
                description: error.message || "Please try again later.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-blue-50 to-white flex flex-col items-center justify-center p-4">
            {/* Logo + Title */}
            <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <img src="/accord-icon.png" alt="ACCORD Logo" className="w-10 h-10" />
                </div>
                <h1 className="text-2xl font-bold text-[#00aeef]">Reset Password</h1>
                <p className="text-sm text-gray-600 mt-1">
                    {currentStep === "email" && "Enter your email to receive a verification code"}
                    {currentStep === "code" && "Enter the 6-digit code sent to your email"}
                    {currentStep === "password" && "Create your new password"}
                </p>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-6 w-full max-w-xs">
                <div className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === "email" ? "bg-[#00aeef] text-white" : "bg-gray-200 text-gray-600"
                        }`}>
                        1
                    </div>
                    <div className="w-12 h-0.5 bg-gray-300"></div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === "code" ? "bg-[#00aeef] text-white" : "bg-gray-200 text-gray-600"
                        }`}>
                        2
                    </div>
                    <div className="w-12 h-0.5 bg-gray-300"></div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${currentStep === "password" ? "bg-[#00aeef] text-white" : "bg-gray-200 text-gray-600"
                        }`}>
                        3
                    </div>
                </div>
            </div>

            {/* Step 1: Email Input */}
            {currentStep === "email" && (
                <form onSubmit={handleRequestReset} className="w-full max-w-xs space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="reset-email" className="text-xs font-medium text-gray-700">
                            Email Address
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="reset-email"
                                type="email"
                                placeholder="john@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-10 pl-10 text-sm rounded-md border border-gray-300 focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-10 bg-[#00aeef] hover:bg-[#0097d6] text-white font-medium rounded-md text-sm transition-all"
                        disabled={isLoading}
                    >
                        {isLoading ? "Sending code..." : "Send Verification Code"}
                    </Button>

                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="flex items-center justify-center w-full text-xs text-gray-600 hover:text-[#00aeef] transition-colors"
                    >
                        <ArrowLeft className="h-3 w-3 mr-1" />
                        Back to Login
                    </button>
                </form>
            )}

            {/* Step 2: Verification Code */}
            {currentStep === "code" && (
                <form onSubmit={handleVerifyCode} className="w-full max-w-xs space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="verification-code" className="text-xs font-medium text-gray-700">
                            Verification Code
                        </Label>
                        <Input
                            id="verification-code"
                            type="text"
                            placeholder="000000"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            className="h-10 text-center text-lg tracking-widest font-mono rounded-md border border-gray-300 focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                            maxLength={6}
                            required
                        />
                        <p className="text-xs text-gray-500 text-center mt-1">
                            Code sent to {email}
                        </p>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-10 bg-[#00aeef] hover:bg-[#0097d6] text-white font-medium rounded-md text-sm transition-all"
                        disabled={isLoading || verificationCode.length !== 6}
                    >
                        {isLoading ? "Verifying..." : "Verify Code"}
                    </Button>

                    <div className="flex items-center justify-between text-xs">
                        <button
                            type="button"
                            onClick={() => setCurrentStep("email")}
                            className="flex items-center text-gray-600 hover:text-[#00aeef] transition-colors"
                        >
                            <ArrowLeft className="h-3 w-3 mr-1" />
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={isLoading}
                            className="text-[#00aeef] hover:text-[#0097d6] hover:underline disabled:opacity-50"
                        >
                            Resend Code
                        </button>
                    </div>
                </form>
            )}

            {/* Step 3: New Password */}
            {currentStep === "password" && (
                <form onSubmit={handleResetPassword} className="w-full max-w-xs space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="new-password" className="text-xs font-medium text-gray-700">
                            New Password
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="new-password"
                                type="password"
                                placeholder="4-8 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="h-10 pl-10 text-sm rounded-md border border-gray-300 focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                                minLength={4}
                                maxLength={8}
                                required
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            Password must be 4-8 characters long
                        </p>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="confirm-password" className="text-xs font-medium text-gray-700">
                            Confirm Password
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="Re-enter password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="h-10 pl-10 text-sm rounded-md border border-gray-300 focus:border-[#00aeef] focus:ring-2 focus:ring-[#00aeef]/20"
                                minLength={4}
                                maxLength={8}
                                required
                            />
                        </div>
                    </div>

                    {/* Password strength indicator */}
                    {newPassword.length > 0 && (
                        <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-xs">
                                <CheckCircle className={`h-3 w-3 ${newPassword.length >= 4 && newPassword.length <= 8 ? "text-green-500" : "text-gray-300"
                                    }`} />
                                <span className={
                                    newPassword.length >= 4 && newPassword.length <= 8 ? "text-green-600" : "text-gray-500"
                                }>
                                    4-8 characters
                                </span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs">
                                <CheckCircle className={`h-3 w-3 ${newPassword === confirmPassword && newPassword.length > 0 ? "text-green-500" : "text-gray-300"
                                    }`} />
                                <span className={
                                    newPassword === confirmPassword && newPassword.length > 0 ? "text-green-600" : "text-gray-500"
                                }>
                                    Passwords match
                                </span>
                            </div>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-10 bg-[#00aeef] hover:bg-[#0097d6] text-white font-medium rounded-md text-sm transition-all"
                        disabled={isLoading}
                    >
                        {isLoading ? "Resetting password..." : "Reset Password"}
                    </Button>

                    <button
                        type="button"
                        onClick={() => setCurrentStep("code")}
                        className="flex items-center justify-center w-full text-xs text-gray-600 hover:text-[#00aeef] transition-colors"
                    >
                        <ArrowLeft className="h-3 w-3 mr-1" />
                        Back
                    </button>
                </form>
            )}
        </div>
    );
}
