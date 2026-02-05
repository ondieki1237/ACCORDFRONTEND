"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar, Clock, CheckCircle, ArrowLeft, Download, Eye, Trash } from "lucide-react";
import { authService } from "@/lib/auth";
import { apiService } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Report {
    _id: string;
    weekStart: string;
    weekEnd: string;
    status: string;
    createdAt: string;
    pdfUrl?: string;
    content?: {
        metadata?: {
            author?: string;
            weekRange?: string;
        };
        sections?: Array<{
            id: string;
            title: string;
            content: string;
        }>;
    };
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const { API_BASE_URL } = await import("@/lib/config");
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_BASE_URL}/reports/my`, {
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
                description: "Could not load reports. Please try again.",
                variant: "destructive",
            });
            setReports([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReport = async (reportId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (!confirm('Delete this report? This action cannot be undone.')) return;

        try {
            await apiService.deleteReport(reportId);
            setReports(prev => prev.filter(r => r._id !== reportId));
            toast({
                title: "Report deleted",
                description: "Report removed successfully.",
            });
        } catch (err) {
            console.error('Delete failed', err);
            toast({
                title: "Delete failed",
                description: "Could not delete report. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleDownloadReport = async (report: Report, e: React.MouseEvent) => {
        e.stopPropagation();
        
        if (report.pdfUrl) {
            window.open(report.pdfUrl, "_blank");
        } else {
            toast({
                title: "No PDF available",
                description: "This report doesn't have a downloadable PDF.",
                variant: "destructive",
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
            pending: { label: "Pending Review", variant: "secondary" },
            reviewed: { label: "Reviewed", variant: "default" },
            approved: { label: "Approved", variant: "default" },
            rejected: { label: "Rejected", variant: "destructive" },
        };

        const config = statusConfig[status] || { label: status, variant: "outline" };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#f1f4f9] via-[#e8ecf4] to-[#dfe5f0] p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    <Skeleton className="h-32 w-full rounded-3xl" />
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (selectedReport) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#f1f4f9] via-[#e8ecf4] to-[#dfe5f0] p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto space-y-6">
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
                                    <Button
                                        onClick={() => setSelectedReport(null)}
                                        variant="ghost"
                                        size="icon"
                                        className="text-white hover:bg-white/20 rounded-full"
                                    >
                                        <ArrowLeft className="h-6 w-6" />
                                    </Button>
                                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                                        <FileText className="h-8 w-8 text-white" />
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                                        Report Details
                                    </h1>
                                </div>
                                <p className="text-white/90 text-sm md:text-base ml-14">
                                    {selectedReport.content?.metadata?.weekRange ||
                                        `${new Date(selectedReport.weekStart).toLocaleDateString()} - ${new Date(selectedReport.weekEnd).toLocaleDateString()}`}
                                </p>
                            </div>
                            {getStatusBadge(selectedReport.status)}
                        </div>
                    </div>

                    {/* Report Content */}
                    <Card className="bg-white rounded-3xl border-0 shadow-xl">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-bold text-gray-800">Report Content</CardTitle>
                                {selectedReport.pdfUrl && (
                                    <Button
                                        onClick={() => window.open(selectedReport.pdfUrl, "_blank")}
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download PDF
                                    </Button>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    Submitted: {new Date(selectedReport.createdAt).toLocaleDateString()}
                                </div>
                                {selectedReport.content?.metadata?.author && (
                                    <div className="flex items-center gap-1">
                                        By: {selectedReport.content.metadata.author}
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {selectedReport.content?.sections?.map((section) => (
                                <div key={section.id} className="space-y-2">
                                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-[#00aeef]" />
                                        {section.title}
                                    </h3>
                                    <div className="pl-4 text-gray-700 whitespace-pre-wrap">
                                        {section.content || <span className="text-gray-400 italic">No content provided</span>}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f1f4f9] via-[#e8ecf4] to-[#dfe5f0] p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
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
                                <Button
                                    onClick={() => router.push("/")}
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20 rounded-full"
                                >
                                    <ArrowLeft className="h-6 w-6" />
                                </Button>
                                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                                    <FileText className="h-8 w-8 text-white" />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white">
                                    My Reports
                                </h1>
                            </div>
                            <p className="text-white/90 text-sm md:text-base ml-14">
                                View all your submitted weekly reports
                            </p>
                        </div>
                    </div>
                </div>

                {/* Reports List */}
                {reports.length === 0 ? (
                    <Card className="bg-white rounded-3xl border-0 shadow-xl">
                        <CardContent className="py-12 text-center">
                            <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Reports Yet</h3>
                            <p className="text-gray-500 mb-6">You haven't submitted any weekly reports yet.</p>
                            <Button
                                onClick={() => router.push("/")}
                                className="bg-gradient-to-r from-[#00aeef] to-[#0096d6] hover:from-[#0096d6] hover:to-[#00aeef] text-white"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Create Your First Report
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {reports.map((report) => (
                            <Card
                                key={report._id}
                                className="bg-white rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                                onClick={() => setSelectedReport(report)}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <FileText className="h-5 w-5 text-[#00aeef]" />
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    {report.content?.metadata?.weekRange ||
                                                        `Week of ${new Date(report.weekStart).toLocaleDateString()}`}
                                                </h3>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 ml-8">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(report.createdAt).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-4 w-4" />
                                                    {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                                {report.content?.metadata?.author && (
                                                    <div className="text-gray-500">
                                                        By: {report.content.metadata.author}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(report.status)}
                                            {report.pdfUrl && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-green-600 hover:bg-green-50"
                                                    onClick={(e) => handleDownloadReport(report, e)}
                                                    title="Download PDF"
                                                >
                                                    <Download className="h-5 w-5" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-[#00aeef] hover:bg-[#00aeef]/10"
                                                title="View Details"
                                            >
                                                <Eye className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-600 hover:bg-red-50"
                                                onClick={(e) => handleDeleteReport(report._id, e)}
                                                title="Delete Report"
                                            >
                                                <Trash className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
