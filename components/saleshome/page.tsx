"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Clock, TrendingUp, Upload, FileText, MessageSquare } from "lucide-react";
import { authService, type User } from "@/lib/auth";
import { VisitList } from "@/components/visits/visit-list";
import { TrailList } from "@/components/trails/trail-list";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import CreateReport from "@/components/saleshome/reportcreate";
const Planner = dynamic(() => import("@/components/saleshome/planner"), { ssr: false });

interface Quotation {
  _id: string;
  hospital: string;
  equipmentRequired: string;
  responded: boolean;
  status?: string;
  response?: any;
  createdAt: string;
}

interface Report {
  _id: string;
  weekStart: string;
  weekEnd: string;
  status: string;
  createdAt: string;
  fileUrl?: string;
}

export default function SalesDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"reports" | "visits" | "trails" | "communications">("reports");
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [quotationsLoading, setQuotationsLoading] = useState(true);
  const [quotationsError, setQuotationsError] = useState<string | null>(null);
  const [checked, setChecked] = useState<{ [id: string]: boolean }>({});
  const [salesSummary, setSalesSummary] = useState<{
    totalSales: number;
    totalTarget: number;
  } | null>(null);
  const [salesLoading, setSalesLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsVisibleCount, setReportsVisibleCount] = useState(3);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCreateReport, setShowCreateReport] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (err) {
        setError("Failed to load user data. Please try again.");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Fetch quotations
  useEffect(() => {
    const fetchQuotations = async () => {
      setQuotationsLoading(true);
      setQuotationsError(null);
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch("https://app.codewithseth.co.ke/api/quotation/my", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error("Failed to fetch quotations");
        const data = await res.json();
        setQuotations(Array.isArray(data.data) ? data.data : []);
      } catch (err) {
        setQuotationsError("Could not load quotations.");
        setQuotations([]);
      } finally {
        setQuotationsLoading(false);
      }
    };
    fetchQuotations();
  }, []);

  // Fetch sales summary
  useEffect(() => {
    const fetchSalesSummary = async () => {
      setSalesLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch("https://app.codewithseth.co.ke/api/sales/summary", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        if (!res.ok) throw new Error("Failed to fetch sales summary");
        const data = await res.json();
        setSalesSummary({
          totalSales: data.data?.totalSales ?? 0,
          totalTarget: data.data?.totalTarget ?? 0,
        });
      } catch {
        setSalesSummary(null);
      } finally {
        setSalesLoading(false);
      }
    };
    fetchSalesSummary();
  }, []);

  // Fetch reports when reports tab is active
  useEffect(() => {
    if (activeTab === "reports") {
      fetchReports();
    }
  }, [activeTab]);

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://app.codewithseth.co.ke/api/reports/my", {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch reports");
      const data = await res.json();
      setReports(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      toast({
        title: "Error",
        description: "Could not load reports.",
        variant: "destructive",
      });
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  };

  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !weekStart || !weekEnd) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields and select a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setUploadLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData();
      formData.append("report", selectedFile);
      formData.append("weekStart", weekStart);
      formData.append("weekEnd", weekEnd);

      const res = await fetch("https://app.codewithseth.co.ke/api/reports", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to upload report");

      toast({
        title: "Report uploaded",
        description: "Your weekly report has been submitted successfully.",
      });

      setSelectedFile(null);
      setWeekStart("");
      setWeekEnd("");
      fetchReports();
    } catch (err) {
      toast({
        title: "Upload failed",
        description: "Could not upload the report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-64 h-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
        <p className="text-red-500 text-lg">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold">
          Welcome, {user ? `${user.firstName}` : "User"}!
        </h1>
        <Button
          variant="default"
          className="bg-blue-600 text-white hover:bg-blue-700"
          onClick={() => router.push("/request")}
        >
          Request Quotation
        </Button>
      </div>

      {/* Sales Summary Card */}
      <Card className="rounded-2xl shadow-[8px_8px_16px_#cfd4db,-8px_-8px_16px_#ffffff] bg-gray-50">
        <CardHeader>
          <CardTitle className="text-blue-700">Sales Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {salesLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : salesSummary ? (
            <>
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <div>
                  Total Sales:{" "}
                  <span className="font-medium text-gray-800">
                    Ksh {salesSummary.totalSales.toFixed(2)}
                  </span>
                </div>
                <div>
                  Total Target:{" "}
                  <span className="font-medium text-gray-800">
                    Ksh {salesSummary.totalTarget.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{
                    width: `${Math.min((salesSummary.totalSales / salesSummary.totalTarget) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                {((salesSummary.totalSales / salesSummary.totalTarget) * 100).toFixed(1)}% of target achieved
              </div>
            </>
          ) : (
            <div className="text-muted-foreground text-sm">
              Sales data not available.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quotations Card */}
      <Card className="rounded-2xl shadow-[8px_8px_16px_#cfd4db,-8px_-8px_16px_#ffffff] bg-gray-50">
        <CardHeader>
          <CardTitle className="text-blue-700">Requested Quotations</CardTitle>
        </CardHeader>
        <CardContent>
          {quotationsLoading ? (
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          ) : quotationsError ? (
            <div className="text-red-500">{quotationsError}</div>
          ) : quotations.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No quotations requested yet.
            </div>
          ) : (
            <div className="space-y-2">
              {quotations.map((q) => {
                const isResponded =
                  q.status === "responded" || !!q.response || q.responded;
                return (
                  <div
                    key={q._id}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl bg-white shadow-inner transition ${
                      isResponded
                        ? "border-2 border-green-400 bg-green-50 shadow-green-100"
                        : ""
                    }`}
                  >
                    <div>
                      <div className="font-medium text-sm">{q.hospital}</div>
                      <div className="text-xs text-gray-500">
                        {q.equipmentRequired}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(q.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isResponded ? (
                        <>
                          <CheckCircle className="text-green-600 w-5 h-5" />
                          <span className="text-xs text-green-600 font-semibold">
                            Responded
                          </span>
                        </>
                      ) : (
                        <>
                          <Clock className="text-gray-400 w-5 h-5" />
                          <span className="text-xs text-gray-400">Pending</span>
                        </>
                      )}
                      <Checkbox
                        checked={checked[q._id] ?? isResponded}
                        onCheckedChange={() =>
                          setChecked((prev) => ({
                            ...prev,
                            [q._id]: !(prev[q._id] ?? isResponded),
                          }))
                        }
                        disabled={!isResponded}
                        className={`border-2 ${
                          isResponded ? "border-green-400" : "border-gray-300"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("reports")}
          className={`flex-1 py-2 text-center text-sm font-medium ${
            activeTab === "reports"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Reports
        </button>
        <button
          onClick={() => setActiveTab("visits")}
          className={`flex-1 py-2 text-center text-sm font-medium ${
            activeTab === "visits"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Visits
        </button>
        <button
          onClick={() => setActiveTab("trails")}
          className={`flex-1 py-2 text-center text-sm font-medium ${
            activeTab === "trails"
              ? "border-b-2 border-green-500 text-green-600"
              : "text-gray-500"
          }`}
        >
          Trails
        </button>
        <button
          onClick={() => setActiveTab("communications")}
          className={`flex-1 py-2 text-center text-sm font-medium ${
            activeTab === "communications"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500"
          }`}
        >
          Communications
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "reports" && (
          <div className="space-y-4">
            <Card className="rounded-2xl shadow-[8px_8px_16px_#cfd4db,-8px_-8px_16px_#ffffff] bg-gray-50">
              <CardHeader>
                <CardTitle className="text-blue-700 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Weekly Reports
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Dialog open={showCreateReport} onOpenChange={setShowCreateReport}>
                    <DialogTrigger asChild>
                      <Button className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
                        Create New Report
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create Weekly Report</DialogTitle>
                      </DialogHeader>
                      <CreateReport 
                        onClose={() => setShowCreateReport(false)} 
                        onSuccess={() => {
                          setShowCreateReport(false);
                          fetchReports();
                        }} 
                      />
                    </DialogContent>
                  </Dialog>
                    <div className="flex-1 flex gap-2">
                      {reports.length > 0 && (
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab("reports")}
                          className="flex-1"
                        >
                          View My Reports ({reports.length})
                        </Button>
                      )}
                      <Dialog open={plannerOpen} onOpenChange={setPlannerOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="px-3">
                            Open Planner
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto w-[95vw]">
                          <DialogHeader>
                            <DialogTitle>Weekly Travel Planner</DialogTitle>
                            <DialogDescription>
                              Plan your weekly travel schedule and submit it to your manager.
                            </DialogDescription>
                          </DialogHeader>
                          <Planner onSuccess={() => setPlannerOpen(false)} />
                        </DialogContent>
                      </Dialog>
                    </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {activeTab === "visits" && (
          <div className="space-y-4">
            <VisitList
              onCreateVisit={() => {
                setActiveTab("visits");
                router.push("/visits/new");
              }}
              onViewVisit={(visit) => {
                setActiveTab("visits");
                router.push(`/visits/${visit._id}`);
              }}
              showActions={false}
            />
          </div>
        )}
        {activeTab === "trails" && (
          <div className="space-y-4">
            <TrailList
              onCreateTrail={() => {
                setActiveTab("trails");
                router.push("/trails/new");
              }}
              onViewTrail={(trail) => {
                setActiveTab("trails");
                router.push(`/trails/${trail._id}`);
              }}
              showActions={false}
            />
          </div>
        )}
        {activeTab === "communications" && (
          <div className="space-y-4">
            <Card className="rounded-2xl shadow-[8px_8px_16px_#cfd4db,-8px_-8px_16px_#ffffff] bg-gray-50">
              <CardHeader>
                <CardTitle className="text-blue-700 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Communications
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => router.push("/communications/personalized")}
                  >
                    Personalized Communication
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => router.push("/communications/group")}
                  >
                    Group Communication
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}