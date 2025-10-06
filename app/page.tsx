import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <p className="text-gray-700 text-sm mb-4">
            Welcome to the{" "}
            <span className="text-blue-600 font-medium">Recreational Aviation Australia Occurrence Management System</span>{" "}
            which enables online reporting of accidents, defects, hazards and confidential complaints. For further information on the reports please call Safety on{" "}
            <span className="font-medium">02 6280 4700</span> or email{" "}
            <a href="mailto:safety@raaus.com.au" className="text-blue-600 hover:underline">
              safety@raaus.com.au
            </a>.
          </p>
          <p className="text-gray-700 text-sm mb-6">
            RAAus maintains an{" "}
            <span className="text-blue-600 font-medium">Open and Fair Reporting Philosophy</span>.
          </p>
        </div>

        {/* Four main reporting options with blue buttons */}
        <div className="grid md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer group">
            <Link
              href="/accident"
              className="block bg-blue-600 text-white text-center py-4 px-6 group-hover:bg-blue-700 transition-all duration-300"
            >
              <h2 className="text-lg font-semibold">
                Report an accident or incident &gt;
              </h2>
            </Link>
            <div className="p-6 group-hover:bg-gray-50 transition-colors duration-300">
              <p className="text-gray-700 text-sm mb-4">
                Recreational Aviation Australia is required to meet statutory reporting requirements under the{" "}
                <em>Transport Safety Investigation Act 2003</em>.
              </p>
              <p className="text-gray-700 text-sm mb-4">
                Reportable matters are categorised as:
              </p>
              <p className="text-gray-700 text-sm mb-2">
                <strong>IRM:</strong> Immediately reportable matters
              </p>
              <p className="text-gray-700 text-sm mb-4">
                <strong>RRM:</strong> Routinely reportable matters
              </p>
              <p className="text-gray-700 text-sm mb-4">
                By submitting a report we are able to submit your information directly to the Australian Transport Safety Bureau.
              </p>
              <p className="text-gray-700 text-sm mb-4">
                Click below to acknowledge your approval for Recreational Aviation Australia to submit the report to the Australian Transport Safety Bureau on behalf of you.
              </p>
              <p className="text-gray-700 text-sm font-medium">
                By submitting an accident or incident report I acknowledge that my report will be submitted to the Australian Transport Safety Bureau on my behalf in accordance with requirements under the TSI Act.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer group">
            <Link
              href="/defect"
              className="block bg-blue-600 text-white text-center py-4 px-6 group-hover:bg-blue-700 transition-all duration-300"
            >
              <h2 className="text-lg font-semibold">
                Report a defect &gt;
              </h2>
            </Link>
            <div className="p-6 group-hover:bg-gray-50 transition-colors duration-300">
              <p className="text-gray-700 text-sm mb-4">
                Defect reports are raised to identify potential technical issues found in aircraft in order to reduce the chance of recurrence.
              </p>
              <p className="text-gray-700 text-sm">
                The defect reports are part of the statutory reporting that Recreational Aviation Australia is required to meet under the{" "}
                <em>Transport Safety Investigation Act 2003</em>.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer group">
            <Link
              href="/hazard"
              className="block bg-blue-600 text-white text-center py-4 px-6 group-hover:bg-blue-700 transition-all duration-300"
            >
              <h2 className="text-lg font-semibold">
                Report an identified hazard &gt;
              </h2>
            </Link>
            <div className="p-6 group-hover:bg-gray-50 transition-colors duration-300">
              <p className="text-gray-700 text-sm mb-4">
                Hazards can cause or contribute to unsafe operations of aircraft or aviation safety-related equipment, products and services.
              </p>
              <p className="text-gray-700 text-sm mb-4">
                As part of organisational safety please assist members by completing this report if you have identified hazards associated with the organisation.
              </p>
              <p className="text-gray-700 text-sm">
                Every event is an opportunity to learn valuable safety lessons.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer group">
            <Link
              href="/complaint"
              className="block bg-blue-600 text-white text-center py-4 px-6 group-hover:bg-blue-700 transition-all duration-300"
            >
              <h2 className="text-lg font-semibold">
                Report a confidential complaint &gt;
              </h2>
            </Link>
            <div className="p-6 group-hover:bg-gray-50 transition-colors duration-300">
              <p className="text-gray-700 text-sm">
                Anyone can report a safety concern confidentially to Recreational Aviation Australia. Using our complaints management system we will address reportable safety concerns.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-300">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Report a recreational aviation related occurrence with Recreational Aviation Australia
          </h2>
        </div>
      </div>
    </div>
  );
}
