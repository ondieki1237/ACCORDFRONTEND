import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, MapPin, Car, DollarSign, Users, ChevronDown, ChevronUp } from "lucide-react";

interface DayPlan {
  day: string;
  date: string;
  place: string;
  means: string;
  allowance: string;
  prospects: string;
}

interface PlannerEditProps {
  open: boolean;
  onClose: () => void;
  planner: {
    _id: string;
    weekCreatedAt: string;
    days: DayPlan[];
    notes?: string;
  };
  onSave: (updated: { weekCreatedAt: string; days: DayPlan[]; notes?: string }) => void;
}

export function EditPlannerModal({ open, onClose, planner, onSave }: PlannerEditProps) {
  const [weekCreatedAt, setWeekCreatedAt] = useState(planner.weekCreatedAt);
  const [notes, setNotes] = useState(planner.notes || "");
  const [days, setDays] = useState<DayPlan[]>(planner.days);
  const [saving, setSaving] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(0);

  const handleDayChange = (idx: number, field: keyof DayPlan, value: string) => {
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ weekCreatedAt, days, notes });
    setSaving(false);
    onClose();
  };

  const toggleDay = (idx: number) => {
    setExpandedDay(expandedDay === idx ? null : idx);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        {/* Header with Actions */}
        <DialogHeader className="bg-gradient-to-r from-[#00aeef] to-[#0096d6] p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Edit Planner
            </DialogTitle>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={onClose} 
                disabled={saving}
                className="rounded-xl px-4 bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="rounded-xl px-4 bg-white text-[#00aeef] hover:bg-white/90 font-semibold"
              >
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
          <p className="text-white/80 text-sm mt-1">Update your weekly travel planner</p>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-4 sm:p-6 space-y-4 scroll-smooth overscroll-contain">
          {/* Week Start Date */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#00aeef]" />
              Week Start Date
            </label>
            <Input 
              type="date" 
              value={weekCreatedAt} 
              onChange={e => setWeekCreatedAt(e.target.value)}
              className="rounded-lg border-gray-200 focus:border-[#00aeef] focus:ring-[#00aeef]"
            />
          </div>

          {/* Days - Accordion Style */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Daily Plans</label>
            <div className="space-y-2">
              {days.map((day, idx) => (
                <Card key={idx} className="rounded-xl border-gray-200 overflow-hidden">
                  {/* Day Header - Clickable */}
                  <div 
                    className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleDay(idx)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-[#00aeef]" />
                      <span className="font-medium text-gray-800">
                        {day.day || `Day ${idx + 1}`}
                      </span>
                      {day.place && (
                        <span className="text-xs text-gray-500 hidden sm:inline">
                          - {day.place}
                        </span>
                      )}
                    </div>
                    {expandedDay === idx ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>

                  {/* Day Content - Expandable */}
                  {expandedDay === idx && (
                    <CardContent className="p-4 space-y-3 bg-white">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Day Name */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Day</label>
                          <Input 
                            type="text" 
                            value={day.day} 
                            onChange={e => handleDayChange(idx, "day", e.target.value)} 
                            placeholder="e.g. Monday"
                            className="rounded-lg text-sm"
                          />
                        </div>
                        {/* Date */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                          <Input 
                            type="date" 
                            value={day.date} 
                            onChange={e => handleDayChange(idx, "date", e.target.value)}
                            className="rounded-lg text-sm"
                          />
                        </div>
                      </div>

                      {/* Place */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> Place
                        </label>
                        <Input 
                          type="text" 
                          value={day.place} 
                          onChange={e => handleDayChange(idx, "place", e.target.value)} 
                          placeholder="Location to visit"
                          className="rounded-lg text-sm"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Means of Transport */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                            <Car className="h-3 w-3" /> Transport
                          </label>
                          <Input 
                            type="text" 
                            value={day.means} 
                            onChange={e => handleDayChange(idx, "means", e.target.value)} 
                            placeholder="e.g. Company car"
                            className="rounded-lg text-sm"
                          />
                        </div>
                        {/* Allowance */}
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> Allowance (KES)
                          </label>
                          <Input 
                            type="text" 
                            value={day.allowance} 
                            onChange={e => handleDayChange(idx, "allowance", e.target.value)} 
                            placeholder="e.g. 2000"
                            className="rounded-lg text-sm"
                          />
                        </div>
                      </div>

                      {/* Prospects */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                          <Users className="h-3 w-3" /> Prospects
                        </label>
                        <Textarea 
                          value={day.prospects} 
                          onChange={e => handleDayChange(idx, "prospects", e.target.value)} 
                          placeholder="List of prospects to visit"
                          rows={2}
                          className="rounded-lg text-sm resize-none"
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-gray-50 rounded-xl p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
            <Textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              rows={3}
              placeholder="Any additional notes for this week..."
              className="rounded-lg border-gray-200 focus:border-[#00aeef] focus:ring-[#00aeef] resize-none"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
