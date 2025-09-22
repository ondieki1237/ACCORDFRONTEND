"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, Clock, TrendingUp, Upload, FileText } from "lucide-react";
import { authService, type User } from "@/lib/auth";
import { VisitList } from "@/components/visits/visit-list";
import { TrailList } from "@/components/trails/trail-list";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; // Assuming Radix UI Dialog is available
import CreateReport from "@/components/saleshome/reportcreate";

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
  fileUrl?: string; // Assuming backend returns a URL to the PDF
}

export default function SalesDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"reports" | "visits" | "trails">("reports"); // Changed default to "reports"
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
  const [reportsVisibleCount, setReportsVisibleCount] = useState(3); // show max 3 initially
  const [uploadLoading, setUploadLoading] = useState(false);
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showCreateReport, setShowCreateReport] = useState(false);
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
        const res = await fetch("https://accordbackend.onrender.com/api/quotation/my", {
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
        const res = await fetch("https://accordbackend.onrender.com/api/sales/summary", {
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
      const res = await fetch("https://accordbackend.onrender.com/api/reports/my", {
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

      const res = await fetch("https://accordbackend.onrender.com/api/reports", {
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
      fetchReports(); // Refresh the list
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
              {/* Add progress bar */}
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

      {/* Tabs - Reports first */}
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
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "reports" && (
          <div className="space-y-4">
            {/* Create Report Button */}
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
                          fetchReports(); // Refresh the reports list
                        }} 
                      />
                    </DialogContent>
                  </Dialog>
                  {reports.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("reports")}
                      className="flex-1"
                    >
                      View My Reports ({reports.length})
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* My Reports List */}
            <Card className="rounded-2xl shadow-[8px_8px_16px_#cfd4db,-8px_-8px_16px_#ffffff] bg-gray-50">
              <CardHeader>
                <CardTitle className="text-blue-700 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  My Submitted Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reportsLoading ? (
                  <div className="space-y-2">
                    {[...Array(2)].map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full rounded-xl" />
                    ))}
                  </div>
                ) : reports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No reports submitted yet. Create your first report above!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reports.slice(0, reportsVisibleCount).map((report) => (
                      <div
                        key={report._id}
                        className="flex items-center justify-between px-3 py-2 rounded-xl bg-white shadow-inner"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {new Date(report.weekStart).toLocaleDateString()} -{" "}
                            {new Date(report.weekEnd).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            Submitted: {new Date(report.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">Status: {report.status}</div>
                        </div>
                      </div>
                    ))}
                    {reports.length > reportsVisibleCount && (
                      <div className="flex justify-center mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReportsVisibleCount((c) => c + 1)}
                        >
                          View More
                        </Button>
                      </div>
                    )}
                  </div>
                )}
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
      </div>
    </div>
  );
}