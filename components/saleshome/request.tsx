"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft } from "lucide-react";

export default function RequestQuotation() {
  const { toast } = useToast();
  const router = useRouter();
  const [formData, setFormData] = useState({
    hospital: "",
    location: "",
    equipmentRequired: "",
    urgency: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("https://accordbackend.onrender.com/api/quotation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to submit quotation request");

      toast({ description: "Quotation request submitted successfully!", variant: "success" });
      setFormData({
        hospital: "",
        location: "",
        equipmentRequired: "",
        urgency: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
      });
      setTimeout(() => router.back(), 1200);
    } catch (error) {
      toast({ description: "Error submitting request. Please try again.", variant: "destructive" });
      setTimeout(() => router.back(), 1200);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg">
        <div className="bg-[#00aeef] text-white p-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-white"
              disabled={isSubmitting}
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <h2 className="text-lg font-semibold">Request Quotation</h2>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Input
              name="hospital"
              placeholder="Hospital Name"
              value={formData.hospital}
              onChange={handleChange}
              className="rounded-full border-gray-300 focus:border-[#00aeef] px-4 py-2"
              required
            />
          </div>
          <div>
            <Input
              name="location"
              placeholder="Location"
              value={formData.location}
              onChange={handleChange}
              className="rounded-full border-gray-300 focus:border-[#00aeef] px-4 py-2"
              required
            />
          </div>
          <div>
            <Input
              name="equipmentRequired"
              placeholder="Equipment Required"
              value={formData.equipmentRequired}
              onChange={handleChange}
              className="rounded-full border-gray-300 focus:border-[#00aeef] px-4 py-2"
              required
            />
          </div>
          <div>
            <Input
              name="urgency"
              placeholder="Urgency (e.g., high, medium, low)"
              value={formData.urgency}
              onChange={handleChange}
              className="rounded-full border-gray-300 focus:border-[#00aeef] px-4 py-2"
              required
            />
          </div>
          <div>
            <Input
              name="contactName"
              placeholder="Contact Name"
              value={formData.contactName}
              onChange={handleChange}
              className="rounded-full border-gray-300 focus:border-[#00aeef] px-4 py-2"
              required
            />
          </div>
          <div>
            <Input
              type="email"
              name="contactEmail"
              placeholder="Contact Email"
              value={formData.contactEmail}
              onChange={handleChange}
              className="rounded-full border-gray-300 focus:border-[#00aeef] px-4 py-2"
              required
            />
          </div>
          <div>
            <Input
              type="tel"
              name="contactPhone"
              placeholder="Contact Phone"
              value={formData.contactPhone}
              onChange={handleChange}
              className="rounded-full border-gray-300 focus:border-[#00aeef] px-4 py-2"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full py-3 rounded-full bg-[#00aeef] hover:bg-[#0095d5] text-white transition"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </div>
    </div>
  );
}