"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { HazardFormData } from "@/types/forms";

interface HazardPreviewProps {
  data: HazardFormData;
  hazardDate: string;
  hazardTime: string;
  contactPhone: string;
  attachments: FileList | null;
  onBack: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export default function HazardPreview({
  data,
  hazardDate,
  hazardTime,
  contactPhone,
  attachments,
  onBack,
  onConfirm,
  isSubmitting,
}: HazardPreviewProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return "N/A";
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const PreviewSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-5 pb-3 border-b-2 border-gray-300">
        {title}
      </h2>
      {children}
    </div>
  );

  const PreviewField = ({ 
    label, 
    value, 
    fullWidth = false 
  }: { 
    label: string; 
    value: string | undefined;
    fullWidth?: boolean;
  }) => {
    if (!value) return null;
    
    // Check if it's a long text field (multi-line)
    const isLongText = value.length > 100 || value.includes('\n');
    
    return (
      <div className={`${fullWidth ? 'col-span-2' : ''} mb-5`}>
        <dt className="text-sm font-semibold text-gray-700 mb-2">
          {label}
        </dt>
        <dd className={`text-base text-gray-900 bg-gray-50 border-l-4 border-gray-400 px-4 py-3 ${
          isLongText ? 'whitespace-pre-wrap max-h-60 overflow-y-auto' : ''
        }`}>
          {value}
        </dd>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center text-md text-gray-600" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z" />
                  </svg>
                  Home
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  /<span className="text-slate-900 ml-2">Hazard Form</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Your Submission</h1>
          <p className="text-gray-600">
            Please review all information carefully before submitting
          </p>
        </div>

        {/* Preview Content */}
        <div className="bg-white border border-gray-300 rounded-md shadow-sm p-8 mb-6">
          {/* Person Reporting */}
          <PreviewSection title="Person Reporting">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <PreviewField label="Role" value={data.role} />
              <PreviewField label="Member Number" value={data.Member_Number} />
              <PreviewField label="First Name" value={data.Name1} />
              <PreviewField label="Last Name" value={data.Last_Name} />
              <PreviewField label="Email" value={data.Reporter_Email} />
              <PreviewField label="Contact Phone" value={contactPhone} />
            </dl>
          </PreviewSection>

          {/* Hazard Information */}
          <PreviewSection title="Hazard Information">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <PreviewField
                label="Date & Time Identified"
                value={formatDateTime(hazardDate, hazardTime)}
              />
              <PreviewField label="State" value={data.State} />
              <PreviewField 
                label="Location of Hazard" 
                value={data.Location_of_Hazard}
                fullWidth
              />
              <PreviewField
                label="Hazard Description"
                value={data.Hazard_Description}
                fullWidth
              />
              {data.Do_you_have_further_suggestions_on_how_to_PSO && (
                <PreviewField
                  label="Prevention Suggestions"
                  value={data.Do_you_have_further_suggestions_on_how_to_PSO}
                  fullWidth
                />
              )}
            </dl>
          </PreviewSection>

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <PreviewSection title="Attachments">
              <div className="space-y-2">
                {Array.from(attachments).map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-4 py-3 bg-gray-50 border-l-4 border-gray-400"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <svg
                        className="w-5 h-5 text-gray-600 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      <span className="text-sm text-gray-900 truncate font-medium">
                        {file.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 ml-4">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            </PreviewSection>
          )}

          {/* Important Notice */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-gray-800">
              <strong>Important:</strong> Immediately reportable matters are required to be notified 
              to RAAus via phone as soon as practicable. RAAus can be contacted on{" "}
              <strong>02 6280 4700</strong>.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              onBack();
            }}
            disabled={isSubmitting}
          >
            ← Back to Edit
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Confirm & Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
