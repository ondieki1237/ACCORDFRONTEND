"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { authService, type User } from "@/lib/auth";
import { VisitList } from "@/components/visits/visit-list";
import { TrailList } from "@/components/trails/trail-list";

interface Quotation {
  _id: string;
  hospital: string;
  equipmentRequired: string;
  responded: boolean;
  createdAt: string;
}

export default function SalesDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"visits" | "trails">("visits");
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [quotationsLoading, setQuotationsLoading] = useState(true);
  const [quotationsError, setQuotationsError] = useState<string | null>(null);
  const [checked, setChecked] = useState<{ [id: string]: boolean }>({});
  const router = useRouter();

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
        const res = await fetch("http://localhost:5000/api/quotation/my", {
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
              {quotations.map((q) => (
                <div
                  key={q._id}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white shadow-inner"
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
                    <Checkbox
                      checked={checked[q._id] ?? q.responded}
                      onCheckedChange={() =>
                        setChecked((prev) => ({
                          ...prev,
                          [q._id]: !(prev[q._id] ?? q.responded),
                        }))
                      }
                      disabled={!q.responded}
                      className={`border-2 ${
                        q.responded ? "border-green-400" : "border-gray-300"
                      }`}
                    />
                    <span
                      className={`text-xs ${
                        q.responded ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {q.responded ? "Responded" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Minimal Tabs */}
      <div className="flex border-b border-gray-200">
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
        {activeTab === "visits" && (
          <div className="space-y-4">
            <VisitList />
          </div>
        )}
        {activeTab === "trails" && (
          <div className="space-y-4">
            <TrailList />
          </div>
        )}
      </div>
    </div>
  );
}
