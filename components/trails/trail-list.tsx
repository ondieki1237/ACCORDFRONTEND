"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Calendar, Plus, Edit, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { canEditRecords, canDeleteRecords } from "@/lib/permissions";

interface Trail {
  _id: string;
  path: { coordinates: number[][] };
  totalDistance?: number;
  totalDuration?: number;
  createdAt: string;
}

interface TrailListProps {
  onCreateTrail: () => void;
  onViewTrail: (trail: Trail) => void;
}

export function TrailList({ onCreateTrail, onViewTrail }: TrailListProps) {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUserSync());
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await authService.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to get current user:", error);
      }
    };

    if (!currentUser) {
      fetchUser();
    }

    const fetchMyTrails = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("accessToken");
        const response = await fetch("http://localhost:5000/api/dashboard/my-trails", {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await response.json();
        const trailsData = data?.data || [];
        setTrails(Array.isArray(trailsData) ? trailsData : []);
      } catch (error) {
        console.error("Failed to fetch trails:", error);
        toast({
          title: "Error loading trails",
          description: "Could not load trail data. Please try again later.",
          variant: "destructive",
        });
        setTrails([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyTrails();
  }, [toast, currentUser]);

  const calculateDistance = (distance?: number) => {
    if (!distance) return "0 km";
    return `${distance.toFixed(1)} km`;
  };

  const calculateDuration = (duration?: number) => {
    if (!duration) return "0m";
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return `${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-xl bg-gray-100 shadow-inner animate-pulse"
            style={{ boxShadow: "inset 4px 4px 8px #d1d9e6, inset -4px -4px 8px #ffffff" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-gray-700">My Trails</h2>
        <Button
          onClick={onCreateTrail}
          size="sm"
          className="rounded-xl px-4 py-2 bg-[#00aeef] text-white shadow-md hover:shadow-lg transition"
          style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
        >
          <Plus className="h-4 w-4 mr-1" />
          New Trail
        </Button>
      </div>

      {trails.length === 0 ? (
        <Card
          className="rounded-2xl bg-gray-50 p-4"
          style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
        >
          <CardContent className="flex flex-col items-center justify-center py-6">
            <MapPin className="h-12 w-12 text-gray-500 mb-2" />
            <p className="text-gray-500 mb-2">No trails recorded</p>
            <Button
              onClick={onCreateTrail}
              size="sm"
              className="rounded-xl bg-[#00aeef] text-white px-4 py-2 hover:shadow-lg transition"
              style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
            >
              Create Your First Trail
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {trails.map((trail) => (
            <Card
              key={trail._id}
              className="px-4 py-3 rounded-2xl bg-gray-50"
              style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
            >
              <div className="flex items-center justify-between">
                {/* Left: Trail Info */}
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-base text-gray-700">
                    Trail {trail._id.slice(-6)}
                  </span>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    {new Date(trail.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="h-3 w-3" />
                    {calculateDuration(trail.totalDuration)}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <MapPin className="h-3 w-3" />
                    {calculateDistance(trail.totalDistance)}
                  </div>
                  <Badge
                    className="rounded-full px-2 py-1 text-xs mt-1 w-fit bg-gray-100 text-gray-800"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    {trail.path?.coordinates?.length || 0} points
                  </Badge>
                </div>
                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewTrail(trail)}
                    className="rounded-xl px-4 py-2 flex items-center gap-1 text-[#00aeef] bg-gray-50 hover:bg-gray-100 transition"
                    style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                  {canEditRecords(currentUser) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast({
                          title: "Edit feature",
                          description: "Edit functionality coming soon.",
                        });
                      }}
                      className="rounded-xl px-4 py-2 flex items-center gap-1 text-gray-700 bg-gray-50 hover:bg-gray-100 transition"
                      style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {canDeleteRecords(currentUser) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Implement delete if needed
                      }}
                      className="rounded-xl px-4 py-2 flex items-center gap-1 text-red-600 bg-gray-50 hover:bg-gray-100 transition"
                      style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}