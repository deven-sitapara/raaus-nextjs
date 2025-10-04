"use client";

export default function AccidentForm() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Lodge a New Accident or Incident</h1>
        <p className="text-gray-600 mb-8">Form ID: 115 | Form Unique ID: 33565</p>

        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">
            This multi-step form is under construction. It will use the FormWizard component for a 3-page flow.
          </p>
          <p className="text-sm text-gray-500">
            Pages: Pilot Information → Occurrence Information → Aircraft Information
          </p>
        </div>
      </div>
    </div>
  );
}
