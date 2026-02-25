import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

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

  const handleDayChange = (idx: number, field: keyof DayPlan, value: string) => {
    setDays((prev) => prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d)));
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ weekCreatedAt, days, notes });
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <h2 className="text-lg font-bold mb-4">Edit Planner</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Week Start Date</label>
          <Input type="date" value={weekCreatedAt} onChange={e => setWeekCreatedAt(e.target.value)} />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Notes</label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
        </div>
        <div className="mb-2">
          <label className="block text-sm font-medium mb-2">Days</label>
          {days.map((day, idx) => (
            <div key={idx} className="mb-2 border rounded p-2">
              <div className="flex gap-2 mb-1">
                <Input type="text" value={day.day} onChange={e => handleDayChange(idx, "day", e.target.value)} placeholder="Day (e.g. Monday)" className="w-1/3" />
                <Input type="date" value={day.date} onChange={e => handleDayChange(idx, "date", e.target.value)} className="w-1/3" />
                <Input type="text" value={day.place} onChange={e => handleDayChange(idx, "place", e.target.value)} placeholder="Place" className="w-1/3" />
              </div>
              <div className="flex gap-2 mb-1">
                <Input type="text" value={day.means} onChange={e => handleDayChange(idx, "means", e.target.value)} placeholder="Means" className="w-1/3" />
                <Input type="text" value={day.allowance} onChange={e => handleDayChange(idx, "allowance", e.target.value)} placeholder="Allowance" className="w-1/3" />
                <Input type="text" value={day.prospects} onChange={e => handleDayChange(idx, "prospects", e.target.value)} placeholder="Prospects" className="w-1/3" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
