"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, Save, Clock, AlertCircle, Edit3, FileText, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService, type User } from "@/lib/auth";

interface ReportSection {
  id: string;
  title: string;
  content: string;
  isRequired?: boolean;
}

const defaultSections: ReportSection[] = [
  {
    id: "summary",
    title: "Weekly Summary",
    content: "",
    isRequired: true
  },
  {
    id: "visits",
    title: "Customer Visits",
    content: "",
    isRequired: true
  },
  {
    id: "quotations",
    title: "Quotations Generated",
    content: "",
    isRequired: true
  },
  {
    id: "leads",
    title: "New Leads",
    content: "",
    isRequired: false
  },
  {
    id: "challenges",
    title: "Challenges Faced",
    content: "",
    isRequired: false
  },
  {
    id: "next-week",
    title: "Next Week's Plan",
    content: "",
    isRequired: true
  }
];

interface CreateReportProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function CreateReport({ onClose, onSuccess }: CreateReportProps = {}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [sections, setSections] = useState<ReportSection[]>(defaultSections);
  const [isDirty, setIsDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  const [shouldValidate, setShouldValidate] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  // Move all hooks to top level
  const validateRequiredFields = useCallback(() => {
    const errors = new Set<string>();
    const requiredSections = sections.filter(s => s.isRequired);
    
    requiredSections.forEach(section => {
      if (!section.content.trim()) {
        errors.add(section.id);
      }
    });

    if (!weekStart || !weekEnd) {
      errors.add("dates");
    }

    setValidationErrors(errors);
    return errors.size === 0;
  }, [sections, weekStart, weekEnd]);

  const calculateProgress = useCallback(() => {
    const totalRequired = sections.filter(s => s.isRequired).length;
    const completedRequired = sections.filter(s => s.isRequired && s.content.trim()).length;
    return Math.round((completedRequired / totalRequired) * 100);
  }, [sections]);

  // Initialize user and set default dates
  useEffect(() => {
    const init = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);

        // Set default dates to current week (Monday to Friday)
        const today = new Date();
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const friday = new Date(monday);
        friday.setDate(monday.getDate() + 4);

        const mondayStr = monday.toISOString().split('T')[0];
        const fridayStr = friday.toISOString().split('T')[0];
        
        setWeekStart(mondayStr);
        setWeekEnd(fridayStr);
      } catch (error) {
        toast({
          title: "Authentication Error",
          description: "Please log in to create reports.",
          variant: "destructive",
        });
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router, toast]);

  // Run validation only when explicitly triggered
  useEffect(() => {
    if (shouldValidate) {
      validateRequiredFields();
      setShouldValidate(false);
    }
  }, [shouldValidate, validateRequiredFields]);

  // Mark as dirty when any field changes
  const handleFieldChange = useCallback((sectionId: string, content: string) => {
    setSections(prev => 
      prev.map(section => 
        section.id === sectionId 
          ? { ...section, content }
          : section
      )
    );
    setIsDirty(true);
  }, []);

  // Handle date changes
  const handleDateChange = useCallback((field: 'weekStart' | 'weekEnd', value: string) => {
    if (field === 'weekStart') {
      setWeekStart(value);
    } else {
      setWeekEnd(value);
    }
    setIsDirty(true);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trigger validation
    setShouldValidate(true);
    
    // Wait one tick for validation to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    if (!validateRequiredFields()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken");
      
      // Prepare report data as JSON structure
      const reportData = {
        weekStart,
        weekEnd,
        content: {
          metadata: {
            author: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Anonymous',
            submittedAt: new Date().toISOString(),
            weekRange: `${new Date(weekStart).toLocaleDateString()} - ${new Date(weekEnd).toLocaleDateString()}`
          },
          sections: sections.map(section => ({
            id: section.id,
            title: section.title,
            content: section.content
          }))
        },
        isDraft: false
      };

      const response = await fetch("https://app.codewithseth.co.ke/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      toast({
        title: "Report Submitted",
        description: "Your weekly report has been successfully submitted and will be converted to PDF for admin review.",
      });

      // Clear form and call onSuccess
      setSections(defaultSections);
      setWeekStart("");
      setWeekEnd("");
      setValidationErrors(new Set());
      setIsDirty(false);
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard");
      }
      
    } catch (error: any) {
      console.error("Submit error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "There was an error submitting your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }, [validateRequiredFields, sections, weekStart, weekEnd, user, onSuccess, router, toast]);

  const handleSaveDraft = useCallback(async () => {
    // Trigger validation for draft (but don't block saving)
    setShouldValidate(true);
    await new Promise(resolve => setTimeout(resolve, 0));
    
    try {
      const token = localStorage.getItem("accessToken");
      
      const draftData = {
        weekStart,
        weekEnd,
        content: {
          metadata: {
            author: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Anonymous',
            lastEdited: new Date().toISOString(),
            weekRange: `${new Date(weekStart).toLocaleDateString()} - ${new Date(weekEnd).toLocaleDateString()}`
          },
          sections: sections.map(section => ({
            id: section.id,
            title: section.title,
            content: section.content
          }))
        },
        isDraft: true
      };

      const response = await fetch("https://app.codewithseth.co.ke/api/reports/draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(draftData),
      });

      if (response.ok) {
        toast({
          title: "Draft Saved",
          description: "Your report draft has been saved.",
        });
        setIsDirty(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save draft");
      }
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Could not save draft. Please try again.",
        variant: "destructive",
      });
    }
  }, [sections, weekStart, weekEnd, user, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-center text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-8 h-8 text-blue-600" />
              Create Weekly Report
            </h1>
            {weekStart && weekEnd && (
              <p className="text-gray-600 mt-1">
                Week of {new Date(weekStart).toLocaleDateString()} - {new Date(weekEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isDirty && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Unsaved changes
              </Badge>
            )}
            {onClose && (
              <Button variant="ghost" onClick={onClose} size="sm">
                Close
              </Button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{calculateProgress()}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Range */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Calendar className="w-5 h-5" />
                Week Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weekStart" className="text-sm font-medium">
                    Start Date
                  </Label>
                  <Input
                    id="weekStart"
                    type="date"
                    value={weekStart}
                    onChange={(e) => handleDateChange('weekStart', e.target.value)}
                    className={validationErrors.has("dates") ? "border-red-300 focus:border-red-500" : ""}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="weekEnd" className="text-sm font-medium">
                    End Date
                  </Label>
                  <Input
                    id="weekEnd"
                    type="date"
                    value={weekEnd}
                    onChange={(e) => handleDateChange('weekEnd', e.target.value)}
                    className={validationErrors.has("dates") ? "border-red-300 focus:border-red-500" : ""}
                    required
                  />
                </div>
              </div>
              {validationErrors.has("dates") && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Please select both start and end dates
                </p>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Report Sections */}
          <div className="space-y-6">
            {sections.map((section) => (
              <Card key={section.id} className="bg-white shadow-sm border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Edit3 className="w-4 h-4" />
                      {section.title}
                    </CardTitle>
                    {section.isRequired && (
                      <Badge variant="secondary" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={section.content}
                    onChange={(e) => handleFieldChange(section.id, e.target.value)}
                    placeholder={`Write your ${section.title.toLowerCase()} here...`}
                    rows={section.isRequired ? 6 : 4}
                    className={`min-h-[120px] ${
                      validationErrors.has(section.id) 
                        ? "border-red-300 focus:border-red-500" 
                        : "border-gray-200"
                    }`}
                  />
                  {validationErrors.has(section.id) && (
                    <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      This section is required
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              className="flex-1"
              disabled={submitting}
            >
              <Save className="w-4 h-4 mr-2" />
              {isDirty ? "Save Draft" : "Saved"}
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Submit Report
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-center text-sm text-gray-500 pt-4">
            <p>After submission, your report will be automatically converted to PDF format for admin review.</p>
          </div>
        </form>
      </div>
    </div>
  );
}