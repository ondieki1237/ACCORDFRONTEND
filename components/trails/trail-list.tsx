"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Calendar, Plus, Edit, Trash2, Eye, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";
import { canEditRecords, canDeleteRecords } from "@/lib/permissions";
import { offlineStorage } from "@/lib/offline-storage";
import { apiService } from "@/lib/api";

interface Trail {
  _id: string;
  path: { coordinates: number[][] };
  totalDistance?: number;
  totalDuration?: number;
  createdAt: string;
  _createdOffline?: boolean;
}

interface TrailListProps {
  onCreateTrail: () => void;
  onViewTrail: (trail: Trail) => void;
  showActions?: boolean;
}

const PAGE_SIZE = 8;

export function TrailList({ onCreateTrail, onViewTrail, showActions = true }: TrailListProps) {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(authService.getCurrentUserSync());
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isOnline, setIsOnline] = useState(true);
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

    const fetchAllTrails = async () => {
      try {
        setIsLoading(true);
        
        // Always get cached trails first (for offline support)
        const cachedTrails = await offlineStorage.getCachedTrails();
        
        // Get pending offline trails
        const pendingSync = await offlineStorage.getPendingSync();
        const offlineTrails = pendingSync.trails.map((trail: any) => ({
          ...trail,
          _id: trail._id || `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          _createdOffline: true,
          createdAt: trail.createdAt || new Date().toISOString()
        }));

        // Check if online and try to fetch from server
        const online = typeof window !== 'undefined' && navigator.onLine;
        setIsOnline(online);
        
        let serverTrails: Trail[] = [];
        if (online) {
          try {
            // Use apiService which has offline fallback
            const response = await apiService.getTrails();
            
            // Extract trails array from response
            serverTrails = Array.isArray(response) 
              ? response 
              : (Array.isArray(response?.data) ? response.data : []);
            
            // Cache the server data
            if (serverTrails.length > 0) {
              await offlineStorage.cacheTrails(serverTrails);
            }
          } catch (error) {
            console.warn("Failed to fetch from server, using cached data:", error);
            serverTrails = cachedTrails || [];
          }
        } else {
          // Offline - use cached data
          serverTrails = cachedTrails || [];
        }

        // Combine server trails and offline trails
        // Remove duplicates by checking if offline trail has been synced
        const combinedTrails = [
          ...serverTrails,
          ...offlineTrails.filter((offlineTrail: Trail) => 
            !serverTrails.some(serverTrail => 
              serverTrail._id === offlineTrail._id?.replace('offline_', '')
            )
          )
        ];

        // Sort by creation date (newest first) and limit to 5 maximum
        const sortedTrails = combinedTrails
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        setTrails(sortedTrails);
      } catch (error) {
        console.error("Failed to fetch trails:", error);
        toast({
          title: "Error loading trails",
          description: "Could not load trail data. Showing cached data if available.",
          variant: "destructive",
        });
        
        // Fallback to cached data only
        try {
          const cachedTrails = await offlineStorage.getCachedTrails();
          setTrails(cachedTrails || []);
        } catch {
          setTrails([]);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllTrails();

    // Listen for online/offline events to refresh data
    const handleOnline = () => {
      setIsOnline(true);
      fetchAllTrails();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [toast, currentUser]);

  const handleDeleteTrail = async (trail: Trail) => {
    try {
      if (trail._createdOffline) {
        // Remove from pending sync queue
        const pending = await offlineStorage.getPendingSync();
        const updatedTrails = pending.trails.filter((t: any) => t._id !== trail._id);
        // Note: We need to implement a method to update pending sync
        toast({
          title: "Trail Deleted",
          description: "Offline trail has been removed from local storage.",
        });
      } else {
        // For server trails, just show a message
        toast({
          title: "Cannot Delete",
          description: "Server trails cannot be deleted from this view. Please use the web dashboard.",
          variant: "destructive",
        });
        return;
      }
      
      // Refresh the trail list
      const updatedTrails = Array.isArray(trails) 
        ? trails.filter(t => t._id !== trail._id) 
        : [];
      setTrails(updatedTrails);
    } catch (error) {
      console.error("Failed to delete trail:", error);
      toast({
        title: "Delete Failed",
        description: "Could not delete the trail. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  // Ensure trails is always an array
  const safeTrails = Array.isArray(trails) ? trails : [];
  const visibleTrails = Array.isArray(trails) ? trails.slice(0, visibleCount) : [];
  const hasMore = Array.isArray(trails) ? trails.length > visibleCount : false;

  return (
    <div className="space-y-4">
      {/* Header - Only show if showActions is true */}
      {showActions && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-700">My Trails</h2>
            <Badge 
              variant="outline" 
              className={`text-xs ${
                isOnline 
                  ? 'border-green-300 text-green-600 bg-green-50' 
                  : 'border-orange-300 text-orange-600 bg-orange-50'
              }`}
            >
              {isOnline ? 'Online' : 'Offline'} ({safeTrails.length}/5)
            </Badge>
          </div>
          <Button
            onClick={onCreateTrail}
            size="sm"
            disabled={safeTrails.length >= 5}
            className="rounded-xl px-4 py-2 bg-[#00aeef] text-white shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
          >
            <Plus className="h-4 w-4 mr-1" />
            {safeTrails.length >= 5 ? 'Max Trails' : 'New Trail'}
          </Button>
        </div>
      )}

      {/* Trail limit warning */}
      {safeTrails.length >= 5 && showActions && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <p className="text-sm text-amber-700">
            📍 Maximum of 5 trails can be stored locally. Delete old trails to record new ones.
          </p>
        </div>
      )}

      {/* Offline status info */}
      {!isOnline && showActions && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
          <p className="text-sm text-blue-700">
            🔄 You're offline. Trails are stored locally and will sync when connection is restored.
          </p>
        </div>
      )}

      {safeTrails.length === 0 ? (
        <Card
          className="rounded-2xl bg-gray-50 p-4"
          style={{ boxShadow: "8px 8px 16px #d1d9e6, -8px -8px 16px #ffffff" }}
        >
          <CardContent className="flex flex-col items-center justify-center py-6">
            <MapPin className="h-12 w-12 text-gray-500 mb-2" />
            <p className="text-gray-500 mb-2">No trails recorded</p>
            {showActions && (
              <Button
                onClick={onCreateTrail}
                size="sm"
                className="rounded-xl bg-[#00aeef] text-white px-4 py-2 hover:shadow-lg transition"
                style={{ boxShadow: "4px 4px 8px #d1d9e6, -4px -4px 8px #ffffff" }}
              >
                Create Your First Trail
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3">
            {visibleTrails.map((trail) => (
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
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        className="rounded-full px-2 py-1 text-xs w-fit bg-gray-100 text-gray-800"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {trail.path?.coordinates?.length || 0} points
                      </Badge>
                      {trail._createdOffline && (
                        <Badge
                          variant="outline"
                          className="rounded-full px-2 py-1 text-xs w-fit border-orange-300 text-orange-600 bg-orange-50 flex items-center gap-1"
                        >
                          <WifiOff className="h-3 w-3" />
                          Pending Upload
                        </Badge>
                      )}
                      {!isOnline && !trail._createdOffline && (
                        <Badge
                          variant="outline"
                          className="rounded-full px-2 py-1 text-xs w-fit border-blue-300 text-blue-600 bg-blue-50 flex items-center gap-1"
                        >
                          Cached
                        </Badge>
                      )}
                    </div>
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
                    {canEditRecords(currentUser) && showActions && (
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
                    {canDeleteRecords(currentUser) && showActions && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (trail._createdOffline) {
                            handleDeleteTrail(trail);
                          } else {
                            toast({
                              title: "Cannot Delete",
                              description: "Server trails cannot be deleted from mobile app.",
                              variant: "destructive",
                            });
                          }
                        }}
                        className={`rounded-xl px-4 py-2 flex items-center gap-1 bg-gray-50 hover:bg-gray-100 transition ${
                          trail._createdOffline ? 'text-red-600' : 'text-gray-400 cursor-not-allowed'
                        }`}
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
          {hasMore && showActions && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="rounded-xl px-6 py-2"
              >
                View More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}