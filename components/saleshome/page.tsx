"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Clock, TrendingUp, Upload, FileText, MessageSquare, ShoppingCart, Calendar, Users, Folder } from "lucide-react";
import DocumentsViewer from "@/components/documents/DocumentsViewer";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { authService, type User } from "@/lib/auth";
import { VisitList } from "@/components/visits/visit-list";
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
  const [activeTab, setActiveTab] = useState<"reports" | "visits" | "communications">("reports");
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
    <div className="min-h-screen bg-gradient-to-br from-[#f1f4f9] via-[#e8ecf4] to-[#dfe5f0] p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div
          className="bg-gradient-to-r from-[#00aeef] to-[#0096d6] rounded-3xl p-6 md:p-8 shadow-xl"
          style={{
            boxShadow: "12px 12px 24px rgba(0, 174, 239, 0.2), -12px -12px 24px rgba(255, 255, 255, 0.9)"
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <TrendingUp className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">
                  Welcome, {user ? `${user.firstName}` : "User"}!
                </h1>
              </div>
              <p className="text-white/90 text-sm md:text-base ml-14">
                Track your performance, manage visits, and grow your sales
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-col sm:flex-row items-start gap-3">
            <Button
              onClick={() => router.push("/request")}
              className="w-full sm:w-auto bg-white hover:bg-white/90 text-[#00aeef] font-semibold shadow-lg rounded-xl px-6 py-6 transition-all duration-300 hover:scale-105"
            >
              <FileText className="w-5 h-5 mr-2" />
              Request Quotation
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button className="w-full sm:w-auto bg-white/90 hover:bg-white text-[#004b60] font-semibold shadow-lg rounded-xl px-6 py-6 transition-all duration-300 hover:scale-105">
                  <Folder className="w-5 h-5 mr-2" />
                  Documents
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[480px]">
                <DocumentsViewer />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Sales Summary Card */}
        <Card
          className="bg-white rounded-3xl border-0 shadow-xl overflow-hidden"
          style={{
            boxShadow: "8px 8px 16px rgba(0, 174, 239, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.9)"
          }}
        >
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-[#00aeef] text-xl font-bold">
              <TrendingUp className="w-6 h-6" />
              Sales Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-xl" />
                ))}
              </div>
            ) : salesSummary ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-center flex-1">
                    <div className="text-sm text-gray-600 mb-1">Total Sales</div>
                    <div className="text-2xl font-bold text-[#00aeef]">
                      Ksh {salesSummary.totalSales.toLocaleString()}
                    </div>
                  </div>
                  <div className="h-12 w-px bg-gray-300"></div>
                  <div className="text-center flex-1">
                    <div className="text-sm text-gray-600 mb-1">Target</div>
                    <div className="text-2xl font-bold text-gray-700">
                      Ksh {salesSummary.totalTarget.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                    <div
                      className="bg-gradient-to-r from-[#00aeef] to-[#0096d6] h-4 rounded-full transition-all duration-1000 ease-out shadow-lg"
                      style={{
                        width: `${Math.min((salesSummary.totalSales / salesSummary.totalTarget) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-lg font-bold text-[#00aeef]">
                      {((salesSummary.totalSales / salesSummary.totalTarget) * 100).toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-600 ml-2">of target achieved</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                Sales data not available.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quotations Card */}
        <Card
          className="bg-white rounded-3xl border-0 shadow-xl overflow-hidden"
          style={{
            boxShadow: "8px 8px 16px rgba(0, 174, 239, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.9)"
          }}
        >
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-[#00aeef] text-xl font-bold">
              <ShoppingCart className="w-6 h-6" />
              Requested Quotations
            </CardTitle>
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
              <div className="space-y-3">
                {quotations.map((q) => {
                  const isResponded =
                    q.status === "responded" || !!q.response || q.responded;
                  return (
                    <div
                      key={q._id}
                      className={`flex items-center justify-between px-4 py-4 rounded-2xl transition-all duration-300 ${isResponded
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 shadow-lg"
                          : "bg-white border-2 border-gray-200 hover:border-[#00aeef]/30 shadow-md hover:shadow-lg"
                        }`}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-base text-gray-800">{q.hospital}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {q.equipmentRequired}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(q.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isResponded ? (
                          <div className="flex items-center gap-2 bg-green-100 px-3 py-2 rounded-xl">
                            <CheckCircle className="text-green-600 w-5 h-5" />
                            <span className="text-sm text-green-700 font-semibold">
                              Responded
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-xl">
                            <Clock className="text-gray-500 w-5 h-5" />
                            <span className="text-sm text-gray-600">Pending</span>
                          </div>
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
                          className={`border-2 h-5 w-5 ${isResponded ? "border-green-500" : "border-gray-400"
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
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden"
          style={{
            boxShadow: "8px 8px 16px rgba(0, 174, 239, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.9)"
          }}
        >
          <div className="flex overflow-x-auto border-b border-gray-200 scrollbar-hide">
            <button
              onClick={() => setActiveTab("reports")}
              className={`flex-1 min-w-[90px] py-4 text-center text-sm font-semibold transition-all duration-300 ${activeTab === "reports"
                  ? "border-b-4 border-[#00aeef] text-[#00aeef] bg-[#00aeef]/5"
                  : "text-gray-500 hover:text-[#00aeef] hover:bg-gray-50"
                }`}
            >
              <FileText className="w-4 h-4 mx-auto mb-1" />
              <span className="text-xs">Reports</span>
            </button>
            <button
              onClick={() => setActiveTab("visits")}
              className={`flex-1 min-w-[90px] py-4 text-center text-sm font-semibold transition-all duration-300 ${activeTab === "visits"
                  ? "border-b-4 border-[#00aeef] text-[#00aeef] bg-[#00aeef]/5"
                  : "text-gray-500 hover:text-[#00aeef] hover:bg-gray-50"
                }`}
            >
              <Users className="w-4 h-4 mx-auto mb-1" />
              <span className="text-xs">Visits</span>
            </button>
            <button
              onClick={() => setActiveTab("communications")}
              className={`flex-1 min-w-[90px] py-4 text-center text-sm font-semibold transition-all duration-300 ${activeTab === "communications"
                  ? "border-b-4 border-[#00aeef] text-[#00aeef] bg-[#00aeef]/5"
                  : "text-gray-500 hover:text-[#00aeef] hover:bg-gray-50"
                }`}
            >
              <MessageSquare className="w-4 h-4 mx-auto mb-1" />
              <span className="text-xs">Comms</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "reports" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Dialog open={showCreateReport} onOpenChange={setShowCreateReport}>
                    <DialogTrigger asChild>
                      <Button className="flex-1 bg-gradient-to-r from-[#00aeef] to-[#0096d6] hover:from-[#0096d6] hover:to-[#00aeef] text-white font-semibold shadow-lg rounded-xl px-6 py-6 transition-all duration-300 hover:scale-105">
                        <FileText className="w-5 h-5 mr-2" />
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
                  <div className="flex-1 flex gap-3">
                    {reports.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => router.push("/reports")}
                        className="flex-1 border-2 border-[#00aeef]/30 hover:border-[#00aeef] text-[#00aeef] font-semibold rounded-xl px-4 py-6 transition-all duration-300 hover:bg-[#00aeef]/5"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Reports ({reports.length})
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => router.push("/planners")}
                      className="border-2 border-[#00aeef]/30 hover:border-[#00aeef] text-[#00aeef] font-semibold rounded-xl px-4 py-6 transition-all duration-300 hover:bg-[#00aeef]/5"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      View Planners
                    </Button>
                    <Dialog open={plannerOpen} onOpenChange={setPlannerOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-2 border-[#00aeef]/30 hover:border-[#00aeef] text-[#00aeef] font-semibold rounded-xl px-4 py-6 transition-all duration-300 hover:bg-[#00aeef]/5"
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          Create Planner
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
                  onCreateEngineerVisit={() => {
                    router.push("/visits/engineer/new");
                  }}
                  showActions={false}
                />
              </div>
            )}
            {activeTab === "communications" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    className="flex-1 bg-gradient-to-r from-[#00aeef] to-[#0096d6] hover:from-[#0096d6] hover:to-[#00aeef] text-white font-semibold shadow-lg rounded-xl px-6 py-6 transition-all duration-300 hover:scale-105"
                    onClick={() => router.push("/communications/personalized")}
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Personalized Communication
                  </Button>
                  <Button
                    className="flex-1 bg-gradient-to-r from-[#00aeef] to-[#0096d6] hover:from-[#0096d6] hover:to-[#00aeef] text-white font-semibold shadow-lg rounded-xl px-6 py-6 transition-all duration-300 hover:scale-105"
                    onClick={() => router.push("/communications/group")}
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Group Communication
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}