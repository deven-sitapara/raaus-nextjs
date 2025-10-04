import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">
          RAAus Reporting System
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Recreational Aviation Australia - Safety Reporting Portal
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <Link
            href="/accident"
            className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <h2 className="text-xl font-semibold mb-3 text-gray-900">
              Lodge an Accident or Incident
            </h2>
            <p className="text-gray-600 text-sm">
              Report aviation accidents and incidents for investigation and safety improvement.
            </p>
          </Link>

          <Link
            href="/defect"
            className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <h2 className="text-xl font-semibold mb-3 text-gray-900">
              Lodge a Defect
            </h2>
            <p className="text-gray-600 text-sm">
              Report aircraft, engine, or component defects to prevent future issues.
            </p>
          </Link>

          <Link
            href="/complaint"
            className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
          >
            <h2 className="text-xl font-semibold mb-3 text-gray-900">
              Lodge a Complaint
            </h2>
            <p className="text-gray-600 text-sm">
              Submit complaints regarding aviation safety concerns or violations.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
