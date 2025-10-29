"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Wrench, AlertCircle } from "lucide-react";
import { authService, type User } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

const API_BASE = "https://app.codewithseth.co.ke/api";

interface ServiceSummary {
  assigned: number;
  inProgress: number;
  completed: number;
  total: number;
}

export default function EngineerDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceSummary, setServiceSummary] = useState<ServiceSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Fetch service summary
  useEffect(() => {
    const fetchServiceSummary = async () => {
      if (!user) return;

      setSummaryLoading(true);
      try {
        const token = authService.getAccessToken();
        const response = await fetch(
          `${API_BASE}/engineering-services?engineerId=${user.id}&page=1&limit=1000`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch services");

        const result = await response.json();
        const services = result.data?.docs || [];

        // Calculate summary
        const summary: ServiceSummary = {
          assigned: services.filter((s: any) => s.status === "assigned").length,
          inProgress: services.filter((s: any) => s.status === "in-progress").length,
          completed: services.filter((s: any) => s.status === "completed").length,
          total: services.length,
        };

        setServiceSummary(summary);
      } catch (err) {
        console.error("Failed to load service summary:", err);
      } finally {
        setSummaryLoading(false);
      }
    };

    if (user) {
      fetchServiceSummary();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <Wrench className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">
              Welcome, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-blue-100">Engineering Services Dashboard</p>
          </div>
        </div>
      </div>

      {/* Service Summary Cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : serviceSummary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Services */}
          <Card
            className="rounded-2xl bg-white hover:shadow-lg transition"
            style={{ boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff" }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-gray-800">{serviceSummary.total}</p>
                  <p className="text-xs text-gray-500 mt-1">All assigned</p>
                </div>
                <div className="rounded-full bg-gray-100 p-3">
                  <Wrench className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Services */}
          <Card
            className="rounded-2xl bg-white hover:shadow-lg transition"
            style={{ boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff" }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Assigned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-yellow-600">{serviceSummary.assigned}</p>
                  <p className="text-xs text-gray-500 mt-1">Ready to start</p>
                </div>
                <div className="rounded-full bg-yellow-100 p-3">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* In Progress Services */}
          <Card
            className="rounded-2xl bg-white hover:shadow-lg transition"
            style={{ boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff" }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-blue-600">{serviceSummary.inProgress}</p>
                  <p className="text-xs text-gray-500 mt-1">Currently working</p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Services */}
          <Card
            className="rounded-2xl bg-white hover:shadow-lg transition"
            style={{ boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff" }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-600">{serviceSummary.completed}</p>
                  <p className="text-xs text-gray-500 mt-1">Successfully done</p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card
          className="rounded-2xl bg-white"
          style={{ boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff" }}
        >
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500">Failed to load service summary</p>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card
        className="rounded-2xl bg-white"
        style={{ boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff" }}
      >
        <CardHeader>
          <CardTitle className="text-lg font-bold text-gray-700">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            Navigate to <strong>My Engineering Services</strong> tab to view and manage your assigned services.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-yellow-100 text-yellow-800">
              {serviceSummary?.assigned || 0} pending to start
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              {serviceSummary?.inProgress || 0} in progress
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card
        className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100"
        style={{ boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff" }}
      >
        <CardHeader>
          <CardTitle className="text-lg font-bold text-blue-800 flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            How to Use
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-blue-900">
          <div className="flex gap-2">
            <span className="font-bold">1.</span>
            <p>Go to <strong>"My Engineering Services"</strong> tab to see all services assigned to you</p>
          </div>
          <div className="flex gap-2">
            <span className="font-bold">2.</span>
            <p>Click on any service to view full details and machine information</p>
          </div>
          <div className="flex gap-2">
            <span className="font-bold">3.</span>
            <p>Click <strong>"Start Service"</strong> button to begin work (fill condition before service)</p>
          </div>
          <div className="flex gap-2">
            <span className="font-bold">4.</span>
            <p>After completing work, click <strong>"Complete Service"</strong> and submit your full report</p>
          </div>
          <div className="flex gap-2">
            <span className="font-bold">5.</span>
            <p>Include condition after service, work done, and any recommendations</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
