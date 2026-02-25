"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft, MapPin, DollarSign, Users as UsersIcon, Eye } from "lucide-react";
import { EditPlannerModal } from "@/components/planners/edit-planner-modal";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface DayPlan {
    day: string;
    date: string;
    place: string;
    means: string;
    allowance: string;
    prospects: string;
}

interface Planner {
    _id: string;
    weekCreatedAt: string;
    days: DayPlan[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
        approval?: {
            status: "pending" | "approved" | "disapproved";
            reviewer?: string;
            reviewedAt?: string;
            note?: string;
        };
}

export default function PlannersPage() {
    const [planners, setPlanners] = useState<Planner[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlanner, setSelectedPlanner] = useState<Planner | null>(null);
    const [apiError, setApiError] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        fetchPlanners();
    }, []);

    const fetchPlanners = async () => {
        setLoading(true);
        setApiError(false);
        try {
            const { API_BASE_URL } = await import("@/lib/config");
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_BASE_URL}/planner/my`, {
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (res.status === 404) {
                // API endpoint doesn't exist yet
                setApiError(true);
                toast({
                    title: "API Not Available",
                    description: "The planner viewing API is not yet implemented on the backend.",
                    variant: "destructive",
                });
                setPlanners([]);
            } else if (!res.ok) {
                throw new Error("Failed to fetch planners");
            } else {
                const data = await res.json();
                setPlanners(Array.isArray(data.data) ? data.data : []);
            }
        } catch (err: any) {
            if (err.message.includes("fetch")) {
                setApiError(true);
                toast({
                    title: "Connection Error",
                    description: "Could not connect to the server. Please check your internet connection.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Could not load planners. Please try again.",
                    variant: "destructive",
                });
            }
            setPlanners([]);
        } finally {
            setLoading(false);
        }
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

    if (selectedPlanner) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#f1f4f9] via-[#e8ecf4] to-[#dfe5f0] p-4 sm:p-6 lg:p-8">
                <div className="max-w-5xl mx-auto space-y-6">
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
                                        onClick={() => setSelectedPlanner(null)}
                                        variant="ghost"
                                        size="icon"
                                        className="text-white hover:bg-white/20 rounded-full"
                                    >
                                        <ArrowLeft className="h-6 w-6" />
                                    </Button>
                                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                                        <Calendar className="h-8 w-8 text-white" />
                                    </div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                                        Planner Details
                                    </h1>
                                        {selectedPlanner.approval && (
                                            <Badge className={`ml-3 ${
                                                selectedPlanner.approval.status === "approved" ? "bg-green-100 text-green-700" :
                                                selectedPlanner.approval.status === "disapproved" ? "bg-red-100 text-red-700" :
                                                "bg-yellow-100 text-yellow-700"
                                            }`}>
                                                {selectedPlanner.approval.status.charAt(0).toUpperCase() + selectedPlanner.approval.status.slice(1)}
                                            </Badge>
                                        )}
                                </div>
                                    {/* Edit/Delete Buttons if not reviewed */}
                                    {selectedPlanner.approval?.status === "pending" && (
                                        <div className="flex gap-2 mb-2 ml-14">
                                            <Button
                                                variant="outline"
                                                className="border-blue-400 text-blue-700 hover:bg-blue-50"
                                                onClick={() => setEditOpen(true)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                onClick={async () => {
                                                    if (confirm("Are you sure you want to delete this planner? This cannot be undone.")) {
                                                        try {
                                                            const { apiService } = await import("@/lib/api");
                                                            await apiService.makeRequest(`/planner/${selectedPlanner._id}`, { method: "DELETE" });
                                                            setSelectedPlanner(null);
                                                            fetchPlanners();
                                                        } catch (err) {
                                                            alert("Failed to delete planner. Please try again.");
                                                        }
                                                    }
                                                }}
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    )}

                                    {/* Edit Planner Modal */}
                                    {selectedPlanner && (
                                        <EditPlannerModal
                                            open={editOpen}
                                            onClose={() => setEditOpen(false)}
                                            planner={selectedPlanner}
                                            onSave={async (updated) => {
                                                try {
                                                    const { apiService } = await import("@/lib/api");
                                                    await apiService.makeRequest(`/planner/${selectedPlanner._id}`, {
                                                        method: "PUT",
                                                        body: JSON.stringify(updated),
                                                        headers: { "Content-Type": "application/json" },
                                                    });
                                                    toast({ title: "Planner updated" });
                                                    setEditOpen(false);
                                                    setSelectedPlanner(null);
                                                    fetchPlanners();
                                                } catch (err: any) {
                                                    toast({ title: "Update failed", description: err.message || "Could not update planner.", variant: "destructive" });
                                                }
                                            }}
                                        />
                                    )}
                                <p className="text-white/90 text-sm md:text-base ml-14">
                                    Week of {new Date(selectedPlanner.weekCreatedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Planner Content */}
                    <div className="space-y-4">
                        {selectedPlanner.days.map((day, index) => (
                            <Card key={index} className="bg-white rounded-2xl border-0 shadow-lg">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-[#00aeef]" />
                                        {day.day}
                                        {day.date && <span className="text-sm font-normal text-gray-500 ml-2">({new Date(day.date).toLocaleDateString()})</span>}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {day.place && (
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-5 w-5 text-[#00aeef] mt-0.5" />
                                                <div>
                                                    <div className="text-xs text-gray-500 font-medium">Place</div>
                                                    <div className="text-sm text-gray-800">{day.place}</div>
                                                </div>
                                            </div>
                                        )}
                                        {day.means && (
                                            <div className="flex items-start gap-2">
                                                <Calendar className="h-5 w-5 text-[#00aeef] mt-0.5" />
                                                <div>
                                                    <div className="text-xs text-gray-500 font-medium">Means of Transport</div>
                                                    <div className="text-sm text-gray-800">{day.means}</div>
                                                </div>
                                            </div>
                                        )}
                                        {day.allowance && (
                                            <div className="flex items-start gap-2">
                                                <DollarSign className="h-5 w-5 text-[#00aeef] mt-0.5" />
                                                <div>
                                                    <div className="text-xs text-gray-500 font-medium">Allowance</div>
                                                    <div className="text-sm text-gray-800">KES {day.allowance}</div>
                                                </div>
                                            </div>
                                        )}
                                        {day.prospects && (
                                            <div className="flex items-start gap-2 md:col-span-2">
                                                <UsersIcon className="h-5 w-5 text-[#00aeef] mt-0.5" />
                                                <div className="flex-1">
                                                    <div className="text-xs text-gray-500 font-medium">Prospects</div>
                                                    <div className="text-sm text-gray-800 whitespace-pre-wrap">{day.prospects}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {selectedPlanner.notes && (
                        <Card className="bg-white rounded-2xl border-0 shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg font-bold text-gray-800">Additional Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700 whitespace-pre-wrap">{selectedPlanner.notes}</p>
                            </CardContent>
                        </Card>
                    )}
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
                                    <Calendar className="h-8 w-8 text-white" />
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-white">
                                    My Planners
                                </h1>
                            </div>
                            <p className="text-white/90 text-sm md:text-base ml-14">
                                View all your submitted weekly travel planners
                            </p>
                        </div>
                    </div>
                </div>

                {/* API Error Message */}
                {apiError && (
                    <Card className="bg-yellow-50 border-yellow-200 rounded-2xl shadow-lg">
                        <CardContent className="py-6">
                            <div className="flex items-start gap-3">
                                <div className="bg-yellow-100 rounded-full p-2">
                                    <Calendar className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-yellow-900 mb-2">API Endpoint Missing</h3>
                                    <p className="text-yellow-800 mb-4">
                                        The backend API endpoint <code className="bg-yellow-100 px-2 py-1 rounded text-sm">GET /api/planner/my</code> is not yet implemented.
                                        Please contact the backend team to implement this endpoint.
                                    </p>
                                    <Button
                                        onClick={() => router.push("/")}
                                        variant="outline"
                                        className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Dashboard
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Planners List */}
                {!apiError && planners.length === 0 ? (
                    <Card className="bg-white rounded-3xl border-0 shadow-xl">
                        <CardContent className="py-12 text-center">
                            <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Planners Yet</h3>
                            <p className="text-gray-500 mb-6">You haven't submitted any weekly planners yet.</p>
                            <Button
                                onClick={() => router.push("/")}
                                className="bg-gradient-to-r from-[#00aeef] to-[#0096d6] hover:from-[#0096d6] hover:to-[#00aeef] text-white"
                            >
                                <Calendar className="h-4 w-4 mr-2" />
                                Create Your First Planner
                            </Button>
                        </CardContent>
                    </Card>
                ) : !apiError && (
                    <div className="space-y-4">
                        {planners.map((planner) => (
                            <Card
                                key={planner._id}
                                className="bg-white rounded-2xl border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                                onClick={() => setSelectedPlanner(planner)}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Calendar className="h-5 w-5 text-[#00aeef]" />
                                                <h3 className="text-lg font-semibold text-gray-800">
                                                    Week of {new Date(planner.weekCreatedAt).toLocaleDateString()}
                                                </h3>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 ml-8">
                                                <div>
                                                    Submitted: {new Date(planner.createdAt).toLocaleDateString()}
                                                </div>
                                                <div>
                                                    {planner.days.filter(d => d.place).length} days planned
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-[#00aeef] hover:bg-[#00aeef]/10"
                                        >
                                            <Eye className="h-5 w-5" />
                                        </Button>
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
