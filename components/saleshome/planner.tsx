"use client"

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/lib/auth";

// Use localhost:5000 for development (if backend is running locally), 
// otherwise use deployed URL for production
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://app.codewithseth.co.ke/api";

interface DayPlan {
  day: string;
  date?: string;
  place?: string;
  means?: string;
  allowance?: string;
  prospects?: string;
}

const defaultDays: DayPlan[] = [
  { day: "Monday" },
  { day: "Tuesday" },
  { day: "Wednesday" },
  { day: "Thursday" },
  { day: "Friday" },
];

interface PlannerProps {
  onSuccess?: () => void;
}

export default function Planner({ onSuccess }: PlannerProps) {
  const [days, setDays] = useState<DayPlan[]>(defaultDays);
  const [submitting, setSubmitting] = useState(false);
  const [lastSavedPayload, setLastSavedPayload] = useState<any | null>(null);
  const { toast } = useToast();

  const updateDay = (index: number, patch: Partial<DayPlan>) => {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = authService.getAccessToken();
      
      if (!token) {
        throw new Error("You must be logged in to submit a planner");
      }
      
      // Build payload matching backend API spec
      const payload = {
        weekCreatedAt: new Date().toISOString(),
        days: days.map(d => ({
          day: d.day,
          date: d.date || "",
          place: d.place || "",
          means: d.means || "",
          allowance: d.allowance || "",
          prospects: d.prospects || ""
        })),
        notes: "" // optional field
      };

      const res = await fetch(`${API_BASE}/planner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: "Failed to save planner" }));
        throw new Error(errorData.message || `Server error: ${res.status}`);
      }

      const responseData = await res.json();
      
      toast({ 
        title: "✅ Success!", 
        description: "Your weekly planner has been saved successfully.",
        duration: 5000,
      });
      
      setLastSavedPayload(payload);
      
      // Close dialog after short delay to show success message
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
      
      // Optionally clear form after successful save
      // setDays(defaultDays);
      
    } catch (err: any) {
      console.error("Planner save error:", err);
      toast({ 
        title: "Save failed", 
        description: err.message || "Could not save planner.", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {days.map((d, i) => (
        <div key={d.day} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-start bg-white rounded-lg p-3 shadow-inner">
          <div className="sm:col-span-1 font-semibold py-2">{d.day}</div>
          <div className="sm:col-span-1">
            <Label className="text-xs">Date</Label>
            <Input type="date" value={d.date || ""} onChange={(e) => updateDay(i, { date: e.target.value })} />
          </div>
          <div className="sm:col-span-1">
            <Label className="text-xs">Place</Label>
            <Input value={d.place || ""} onChange={(e) => updateDay(i, { place: e.target.value })} placeholder="Place" />
          </div>
          <div className="sm:col-span-1">
            <Label className="text-xs">Means</Label>
            <Input value={d.means || ""} onChange={(e) => updateDay(i, { means: e.target.value })} placeholder="e.g., Matatu" />
          </div>
          <div className="sm:col-span-1">
            <Label className="text-xs">Allowance</Label>
            <Input value={d.allowance || ""} onChange={(e) => updateDay(i, { allowance: e.target.value })} placeholder="Amount" />
          </div>
          <div className="sm:col-span-1">
            <Label className="text-xs">Prospects</Label>
            <Textarea value={d.prospects || ""} onChange={(e) => updateDay(i, { prospects: e.target.value })} rows={2} />
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button type="submit" className="bg-blue-600 text-white" disabled={submitting}>
          {submitting ? "Saving..." : "Save Planner"}
        </Button>
      </div>
    </form>
  );
}
