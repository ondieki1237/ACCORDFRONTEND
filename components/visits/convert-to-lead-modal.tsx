import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ConvertToLeadModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (expectedPurchaseDate: string) => void;
}

export function ConvertToLeadModal({ open, onClose, onConfirm }: ConvertToLeadModalProps) {
  const [expectedPurchaseDate, setExpectedPurchaseDate] = useState("");
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (!expectedPurchaseDate) return;
    setSaving(true);
    await onConfirm(expectedPurchaseDate);
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <h2 className="text-lg font-bold mb-4">Track as Lead</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Expected Purchase Date</label>
          <Input type="date" value={expectedPurchaseDate} onChange={e => setExpectedPurchaseDate(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={saving || !expectedPurchaseDate}>{saving ? "Converting..." : "Convert to Lead"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
