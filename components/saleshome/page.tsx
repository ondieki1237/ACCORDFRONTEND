"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { authService, type User } from "@/lib/auth";
import { VisitList } from "@/components/visits/visit-list";
import { TrailList } from "@/components/trails/trail-list";
import { LogOut } from "lucide-react";

export default function SalesDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isTrailModalOpen, setIsTrailModalOpen] = useState(false);

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

  // Handlers for modals
  const handleCreateVisit = () => {
    setIsVisitModalOpen(true);
  };

  const handleViewVisit = (visitId: string) => {
    console.log(`Viewing visit: ${visitId}`);
    // Add logic to view a specific visit
  };

  const handleCreateTrail = () => {
    setIsTrailModalOpen(true);
  };

  const handleViewTrail = (trailId: string) => {
    console.log(`Viewing trail: ${trailId}`);
    // Add logic to view a specific trail
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      window.location.reload(); // Refresh to reflect logged-out state
    } catch (err) {
      setError("Failed to log out. Please try again.");
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Welcome, {user ? `${user.firstName} ${user.lastName}` : "User"}!
        </h1>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="flex items-center gap-2"
          aria-label="Log out"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Visits Section */}
        <Card className="shadow-lg border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-white transition-transform hover:scale-[1.02]">
          <CardHeader>
            <CardTitle className="text-blue-700 text-xl sm:text-2xl flex items-center gap-2">
              <span role="img" aria-label="visits">📅</span>
              My Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <VisitList onCreateVisit={handleCreateVisit} onViewVisit={handleViewVisit} />
            )}
          </CardContent>
        </Card>

        {/* Trails Section */}
        <Card className="shadow-lg border-2 border-green-100 bg-gradient-to-br from-green-50 to-white transition-transform hover:scale-[1.02]">
          <CardHeader>
            <CardTitle className="text-green-700 text-xl sm:text-2xl flex items-center gap-2">
              <span role="img" aria-label="trails">🗺️</span>
              My Trails
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <TrailList onCreateTrail={handleCreateTrail} onViewTrail={handleViewTrail} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals (Placeholder) */}
      {isVisitModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Create Visit</h2>
            <p>Modal content for creating a visit goes here.</p>
            <Button onClick={() => setIsVisitModalOpen(false)} className="mt-4">
              Close
            </Button>
          </div>
        </div>
      )}
      {isTrailModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Create Trail</h2>
            <p>Modal content for creating a trail goes here.</p>
            <Button onClick={() => setIsTrailModalOpen(false)} className="mt-4">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}