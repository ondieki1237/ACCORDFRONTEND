"use client";

import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { StatsCard } from "./stats-card";
import { RecentActivity } from "./recent-activity";
import { apiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { hasAdminAccess, canViewHeatmap } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart3, Clock, MapPin, Shield, TrendingUp, Users } from "lucide-react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

interface DashboardData {
  overview: { totalVisits: number; totalTrails: number };
  recentActivity: any[];
  performance: { visitsThisMonth: number; trailsThisMonth: number; averageVisitDuration: number; completionRate: number };
  heatmap?: { [key: string]: number };
}

export function DashboardOverview() {
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string }>({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd"),
    endDate: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), "yyyy-MM-dd"),
  });
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUserSync());
  const [totalVisits, setTotalVisits] = useState(0);
  const [averageDuration, setAverageDuration] = useState(0);
  const { toast } = useToast();

  // Fetch user if not available
  useEffect(() => {
    if (!currentUser) {
      authService.getCurrentUser().then(setCurrentUser).catch((error) => {
        console.error("Failed to get current user:", error);
        toast({ title: "Error", description: "Unable to fetch user data.", variant: "destructive" });
      });
    }
  }, [toast]);

  // Fetch visits data
  useEffect(() => {
    const fetchVisits = async () => {
      try {
        const token = localStorage.getItem("accessToken")
        const res = await fetch("http://localhost:5000/api/visits", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        })
        const data = await res.json()
        const docs = data?.data?.docs || data?.docs || []
        setTotalVisits(docs.length)

        // Calculate average duration (in minutes)
        let totalMinutes = 0
        let count = 0
        docs.forEach((visit: any) => {

            const start = new Date(visit.startTime)
            const end = new Date(visit.endTime)
            const diff = (end.getTime() - start.getTime()) / (1000 * 60)
            if (!isNaN(diff) && diff > 0) {
              totalMinutes += diff
              count++
            }
          }
        )
        setAverageDuration(count > 0 ? Math.round(totalMinutes / count) : 0)
      } catch (err) {
        setTotalVisits(0)
        setAverageDuration(0)
      }
    }
    fetchVisits()
  }, []);

  // API calls with React Query
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", dateRange, currentUser?.region, currentUser?.id],
    queryFn: async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const [overview, recentActivity, performance, visitsRes] = await Promise.all([
          apiService.getDashboardOverview(dateRange.startDate, dateRange.endDate, currentUser?.region || "North"),
          apiService.getRecentActivity(20),
          apiService.getPerformanceMetrics(dateRange.startDate, dateRange.endDate, currentUser?.region || "North"),
          fetch("http://localhost:5000/api/visits", {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
          }).then(res => res.json())
        ]);
        const docs = visitsRes?.data?.docs || visitsRes?.docs || [];
        // Calculate average duration
        let totalMinutes = 0, count = 0;
        docs.forEach((visit: any) => {
          if (visit.startTime && visit.endTime) {
            const start = new Date(visit.startTime);
            const end = new Date(visit.endTime);
            const diff = (end.getTime() - start.getTime()) / (1000 * 60);
            if (!isNaN(diff) && diff > 0) {
              totalMinutes += diff;
              count++;
            }
          }
        });
        const averageVisitDuration = count > 0 ? Math.round(totalMinutes / count) : 0;
        // Merge into overview
        return {
          overview: {
            ...overview,
            totalVisits: docs.length,
            averageVisitDuration,
          },
          recentActivity,
          performance,
          heatmap: null,
        };
      } catch (err) {
        console.error("Dashboard query failed:", err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2,
  });

  // Fetch performance trend data for chart
  const { data: performanceData } = useQuery({
    queryKey: ["performance", dateRange, currentUser?.region],
    queryFn: async () => {
      const token = localStorage.getItem("accessToken");
      const region = currentUser?.region || "North";
      const url = `http://localhost:5000/api/dashboard/performance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&region=${region}`;
      const res = await fetch(url, {
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        }
      });
      const data = await res.json();
      return data.success && Array.isArray(data.data) ? data.data : [];
    },
    enabled: !!currentUser,
    staleTime: 1000 * 60 * 5,
  });

  // Sales Heatmap Query
  const { data: salesHeatmap, isLoading: heatmapLoading } = useQuery({
    queryKey: ["salesHeatmap"],
    queryFn: apiService.getSalesHeatmap,
    staleTime: 1000 * 60 * 10, // cache 10 mins
  });

  // Transform recent activity
  const recentActivityArr = Array.isArray(data?.recentActivity) ? data.recentActivity : [];
  const transformedActivity = recentActivityArr.map((item: any, index: number) => ({
    id: item.id || index.toString(),
    type: item.type || (index % 2 === 0 ? "visit" : "trail"),
    description: item.description || item.action || `Activity ${index + 1}`,
    timestamp: item.timestamp || item.createdAt || new Date().toISOString(),
    client: item.client?.name || item.clientName,
  }));

  // Fetch trails data FIRST
  const { data: trailsData, isLoading: trailsLoading } = useQuery({
    queryKey: ["allTrails"],
    queryFn: async () => {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("http://localhost:5000/api/dashboard/all-trails", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      return data?.data || [];
    },
    staleTime: 1000 * 60 * 5,
  });

  // Now you can safely use trailsData below
  // Build date-indexed maps for visits and trails
  const visitsResDocs = data?.overview?.visits || []; // If you have visits by date, else use your fetched docs
  const trailsDocs = Array.isArray(trailsData) ? trailsData : [];

  // Collect all unique dates from both datasets
  const allDatesSet = new Set<string>();
  visitsResDocs.forEach((v: any) => v.date && allDatesSet.add(v.date.slice(0, 10)));
  trailsDocs.forEach((t: any) => t.date && allDatesSet.add(t.date.slice(0, 10)));
  const allDates = Array.from(allDatesSet).sort();

  // Count visits and trails per date
  const visitsByDate: Record<string, number> = {};
  visitsResDocs.forEach((v: any) => {
    const d = v.date?.slice(0, 10);
    if (d) visitsByDate[d] = (visitsByDate[d] || 0) + 1;
  });
  const trailsByDate: Record<string, number> = {};
  trailsDocs.forEach((t: any) => {
    const d = t.date?.slice(0, 10);
    if (d) trailsByDate[d] = (trailsByDate[d] || 0) + 1;
  });

  // Chart.js data for performance trends: Visits vs Trails
  const performanceChartData = {
    labels: allDates.map((d) => format(new Date(d), "MMM dd")),
    datasets: [
      {
        label: "Visits",
        data: allDates.map((d) => visitsByDate[d] || 0),
        borderColor: "hsl(var(--primary))",
        backgroundColor: "hsl(var(--primary)/0.2)",
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "Trails",
        data: allDates.map((d) => trailsByDate[d] || 0),
        borderColor: "hsl(var(--secondary))",
        backgroundColor: "hsl(var(--secondary)/0.2)",
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // Sales Heatmap chart data
  const salesHeatmapChartData = {
    labels: salesHeatmap?.map((item: any) => `${item.userName} (${item.location})`) || [],
    datasets: [
      {
        label: "Sales Activity",
        data: salesHeatmap?.map((item: any) => item.count) || [],
        backgroundColor: "hsl(var(--primary)/0.5)",
      },
    ],
  };

  // Heatmap chart data
  const heatmapChartData = {
    labels: Object.keys(data?.heatmap || {}),
    datasets: [
      {
        label: "Activity Intensity",
        data: Object.values(data?.heatmap || {}),
        backgroundColor: "hsl(var(--primary)/0.5)",
      },
    ],
  };

  // Calculate total trails and distance
  const totalTrails = trailsDocs.length;
  const totalTrailDistance = trailsDocs.reduce((sum, trail) => sum + (trail.totalDistance || 0), 0);

  if (isLoading || trailsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 neumorphic-card animate-pulse bg-primary/10 rounded-lg" />
          ))}
        </div>
        <div className="h-64 neumorphic-card animate-pulse bg-primary/10 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load dashboard data. Please try again later.</p>
        <Button onClick={() => window.location.reload()} className="mt-4 neumorphic-button">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      {currentUser && (
        <Card className="neumorphic-card p-6 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle>Welcome back, {currentUser.firstName}!</CardTitle>
            <CardDescription>
              {currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} • {currentUser.region} •{" "}
              {currentUser.territory}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Date Range Picker */}
      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
          <CardDescription>Select a date range for the dashboard data</CardDescription>
        </CardHeader>
        <CardContent>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="neumorphic-button">
                {`${dateRange.startDate} - ${dateRange.endDate}`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="range"
                selected={{
                  from: new Date(dateRange.startDate),
                  to: new Date(dateRange.endDate),
                }}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({
                      startDate: format(range.from, "yyyy-MM-dd"),
                      endDate: format(range.to, "yyyy-MM-dd"),
                    });
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Visits"
          value={totalVisits}
          description="This period"
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Total Trails"
          value={totalTrails}
          description={`Distance: ${totalTrailDistance.toFixed(2)} km`}
          icon={MapPin}
          trend={{ value: 8, isPositive: true }}
        />
        <StatsCard
          title="Avg. Visit Duration"
          value={`${Math.round(data?.performance.averageVisitDuration || 45)}m`}
          description="Minutes per visit"
          icon={Clock}
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Completion Rate"
          value={`${Math.round(data?.performance.completionRate || 85)}%`}
          description="Tasks completed"
          icon={TrendingUp}
          trend={{ value: 3, isPositive: true }}
        />
      </div>

      {/* Performance Trends */}
      <Card className="neumorphic-card">
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Compare Visits and Trails productivity over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Line
            data={performanceChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: true, position: "top" },
                tooltip: { mode: "index", intersect: false },
              },
              interaction: { mode: "nearest", axis: "x", intersect: false },
              scales: {
                x: { title: { display: true, text: "Date" } },
                y: { title: { display: true, text: "Count" }, beginAtZero: true },
              },
            }}
            height={300}
          />
        </CardContent>
      </Card>

      {/* Sales Rep Heatmap Bar Chart */}
      {hasAdminAccess(currentUser) && canViewHeatmap(currentUser) && salesHeatmap?.length > 0 && (
        <Card className="neumorphic-card">
          <CardHeader>
            <CardTitle>Sales Rep Heatmap</CardTitle>
            <CardDescription>Activity count by sales reps and regions</CardDescription>
          </CardHeader>
          <CardContent>
            <Bar
              data={salesHeatmapChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  x: { title: { display: true, text: "Sales Reps (Location)" } },
                  y: { title: { display: true, text: "Count" }, beginAtZero: true },
                },
              }}
              height={300}
            />
          </CardContent>
        </Card>
      )}

      {/* Admin Features */}
      {hasAdminAccess(currentUser) && (
        <Card className="neumorphic-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Features
            </CardTitle>
            <CardDescription>Super user tools and analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {canViewHeatmap(currentUser) && (
                <Button
                  variant="outline"
                  className="neumorphic-button flex items-center gap-2 bg-transparent"
                  onClick={() => window.location.href = "/dashboard/sales-heatmap"}
                >
                  <BarChart3 className="h-4 w-4" />
                  View Heatmap
                </Button>
              )}
              <Button
                variant="outline"
                className="neumorphic-button flex items-center gap-2 bg-transparent"
                onClick={() => window.location.href = "/dashboard/user-manager"}
              >
                <Users className="h-4 w-4" />
                Manage Users
              </Button>
              <Button
                variant="outline"
                className="neumorphic-button flex items-center gap-2 bg-transparent"
                onClick={() => window.location.href = "/dashboard/advanced-analytics"}
              >
                <TrendingUp className="h-4 w-4" />
                Advanced Analytics
              </Button>
              <Button variant="outline" className="neumorphic-button flex items-center gap-2 bg-transparent">
                <TrendingUp className="h-4 w-4" />
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <RecentActivity activities={transformedActivity} />
    </div>
  );
}