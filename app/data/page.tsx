"use client";


import { useState, useEffect, useMemo, useRef } from "react";
import { Table, TableColumn } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import axios from "axios";

// The record type is flexible to support all form types
type OccurrenceRecord = Record<string, any>;

// Expandable Description Cell Component
function ExpandableDescription({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text || text === "-") return <span>-</span>;
  
  const shouldTruncate = text.length > 100;
  const displayText = isExpanded ? text : text.substring(0, 100);
  
  return (
    <div className="relative">
      <div className="whitespace-pre-wrap break-words">
        {displayText}
        {shouldTruncate && !isExpanded && "..."}
      </div>
      {shouldTruncate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="text-blue-600 hover:text-blue-800 font-medium text-xs mt-1 underline"
        >
          {isExpanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

export default function DataPage() {
  const [data, setData] = useState<OccurrenceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [occurrenceType, setOccurrenceType] = useState("");
  const [searchInput, setSearchInput] = useState("");
  
  // New filter states
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    location: "",
    make: "",
    model: "",
    engineMake: "",
    engineModel: "",
    state: "",
    injury: "",
    damage: "",
    occurrenceCategory: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  const [dateFilterMode, setDateFilterMode] = useState<"none" | "range">("none");
  
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Sync scrollbars between top scroller and table container
  useEffect(() => {
    const topScroll = topScrollRef.current;
    const tableContainer = tableContainerRef.current;

    if (!topScroll || !tableContainer) return;

    let isSyncingTop = false;
    let isSyncingTable = false;

    const handleTopScroll = () => {
      if (isSyncingTop) return;
      isSyncingTable = true;
      tableContainer.scrollLeft = topScroll.scrollLeft;
      setTimeout(() => { isSyncingTable = false; }, 0);
    };

    const handleTableScroll = () => {
      if (isSyncingTable) return;
      isSyncingTop = true;
      topScroll.scrollLeft = tableContainer.scrollLeft;
      setTimeout(() => { isSyncingTop = false; }, 0);
    };

    topScroll.addEventListener('scroll', handleTopScroll);
    tableContainer.addEventListener('scroll', handleTableScroll);

    return () => {
      topScroll.removeEventListener('scroll', handleTopScroll);
      tableContainer.removeEventListener('scroll', handleTableScroll);
    };
  }, []);

  // Fetch data from API
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [currentPage, perPage, occurrenceType, filters]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
      });
      if (occurrenceType) params.append("type", occurrenceType);
      
      // Add filter parameters
      if (dateFilterMode === "range" && filters.dateFrom) params.append("date_from", filters.dateFrom);
      if (dateFilterMode === "range" && filters.dateTo) params.append("date_to", filters.dateTo);
      if (filters.location) params.append("location", filters.location);
      if (filters.make) params.append("make", filters.make);
      if (filters.model) params.append("model", filters.model);
      if (filters.engineMake) params.append("engine_make", filters.engineMake);
      if (filters.engineModel) params.append("engine_model", filters.engineModel);
      if (filters.state) params.append("state", filters.state);
      if (filters.injury) params.append("injury", filters.injury);
      if (filters.damage) params.append("damage", filters.damage);
      if (filters.occurrenceCategory) params.append("primary_cause", filters.occurrenceCategory);
      
      const response = await axios.get(`/api/zoho-data?${params}`);
      if (response.data.success) {
        setData(response.data.data);
        setTotalRecords(response.data.pagination?.total || response.data.data.length);
        setHasMore(response.data.pagination?.moreRecords || false);
      } else {
        setError("Failed to load data");
      }
    } catch (err) {
      setError("An error occurred while fetching data");
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering based on search input and filters
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search input filter
    if (searchInput.trim()) {
      const query = searchInput.toLowerCase();
      filtered = filtered.filter(row => {
        // Create an array of searchable values from the row
        const searchableFields = [
          row.Name1,
          row.Last_Name,
          row.OccurrenceId,
          row.Occurrence_ID,
          row.Registration_number,
          row.Location,
          row.Location_of_hazard,
          row.Member_Number,
          row.Make1,
          row.Make,
          row.Model,
          row.State,
          row.Engine_Details,
          row.Engine_model,
        ];
        return searchableFields.some(field => 
          field?.toString().toLowerCase().includes(query)
        );
      });
    }

    // Apply additional filters
    if (filters.location) {
      filtered = filtered.filter(row => 
        row.Location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.make) {
      filtered = filtered.filter(row => 
        row.Make1?.toLowerCase().includes(filters.make.toLowerCase()) ||
        row.Make?.toLowerCase().includes(filters.make.toLowerCase())
      );
    }

    if (filters.model) {
      filtered = filtered.filter(row => 
        row.Model?.toLowerCase().includes(filters.model.toLowerCase())
      );
    }

    if (filters.engineMake) {
      filtered = filtered.filter(row => 
        row.Engine_Details?.toLowerCase().includes(filters.engineMake.toLowerCase()) ||
        row.Engine_model?.toLowerCase().includes(filters.engineMake.toLowerCase())
      );
    }

    if (filters.engineModel) {
      filtered = filtered.filter(row => 
        row.Engine_model?.toLowerCase().includes(filters.engineModel.toLowerCase())
      );
    }

    if (filters.state) {
      filtered = filtered.filter(row => 
        row.State?.toLowerCase().includes(filters.state.toLowerCase())
      );
    }

    if (filters.injury) {
      filtered = filtered.filter(row => {
        const highestInjury = getHighestInjury(row.Most_serious_injury_to_pilot, row.Passenger_injury, row.Persons_on_the_ground_injury);
        return highestInjury?.toLowerCase().includes(filters.injury.toLowerCase());
      });
    }

    if (filters.damage) {
      filtered = filtered.filter(row => 
        row.Damage_to_aircraft?.toLowerCase().includes(filters.damage.toLowerCase()) ||
        row.Description_of_damage_to_aircraft?.toLowerCase().includes(filters.damage.toLowerCase())
      );
    }

    if (filters.occurrenceCategory) {
      filtered = filtered.filter(row => 
        row.Primary_Cause?.toLowerCase() === filters.occurrenceCategory.toLowerCase()
      );
    }

    // Apply date range filter only when date filter mode is enabled
    if (dateFilterMode === "range" && (filters.dateFrom || filters.dateTo)) {
      filtered = filtered.filter(row => {
        const occurrenceDate = row.Occurrence_Date1;
        if (!occurrenceDate) return false;
        
        const date = new Date(occurrenceDate);
        if (isNaN(date.getTime())) return false;
        
        if (filters.dateFrom) {
          const fromDate = new Date(filters.dateFrom);
          if (date < fromDate) return false;
        }
        
        if (filters.dateTo) {
          const toDate = new Date(filters.dateTo);
          toDate.setHours(23, 59, 59, 999); // End of day
          if (date > toDate) return false;
        }
        
        return true;
      });
    }

    return filtered;
  }, [data, searchInput, filters, dateFilterMode]);

  // Utility: Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Utility: Get form type from record (using Tag array or Boolean fields)
  function getFormType(row: OccurrenceRecord): string {
    if (Array.isArray(row.Tag) && row.Tag.length > 0) {
      // Tag array from real Zoho data
      if (row.Tag.includes("Accident")) return "Accident";
      if (row.Tag.includes("Defect")) return "Defect";
      if (row.Tag.includes("Hazard")) return "Hazard";
      if (row.Tag.includes("Complaint")) return "Complaint";
      if (row.Tag.includes("Incident")) return "Incident";
    }
    // Fallback to Boolean fields (mock data)
    if (row.Accident) return row.Accident_or_Incident === "Incident" ? "Incident" : "Accident";
    if (row.Defect) return "Defect";
    if (row.Hazard) return "Hazard";
    if (row.Complaint) return "Complaint";
    return row.Occurrence_Type || row.Accident_or_Incident || "-";
  }

  // Utility: Get injury severity rank for sorting (lower number = more serious)
  function getInjurySeverityRank(injury: string | undefined): number {
    if (!injury) return 999; // Empty values go to bottom
    const normalized = injury.toLowerCase();
    if (normalized === "fatal") return 1;
    if (normalized === "serious") return 2;
    if (normalized === "minor") return 3;
    if (normalized === "nil") return 4;
    if (normalized === "unknown") return 5;
    return 999; // Unknown values go to bottom
  }

  // Utility: Get the highest injury severity among pilot, passenger, and ground injuries
  function getHighestInjury(pilotInjury: string | undefined, passengerInjury: string | undefined, groundInjury: string | undefined): string {
    const injuries = [pilotInjury, passengerInjury, groundInjury].filter((injury): injury is string => injury !== undefined && injury !== null && injury !== "");
    
    if (injuries.length === 0) return "-";
    
    // Find the injury with the lowest rank (most severe)
    const highestSeverityInjury = injuries.reduce((highest, current) => {
      return getInjurySeverityRank(current) < getInjurySeverityRank(highest) ? current : highest;
    });
    
    return highestSeverityInjury;
  }

  // Utility: Get type badge
  function getTypeBadge(type: string) {
    if (type === "Accident") return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Accident</span>;
    if (type === "Incident") return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Incident</span>;
    if (type === "Defect") return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Defect</span>;
    if (type === "Hazard") return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Hazard</span>;
    if (type === "Complaint") return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Complaint</span>;
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{type}</span>;
  }

  /**
   * Column sets based on actual form fields (from forms.ts and form pages)
   */
  const columnSets: Record<string, TableColumn<OccurrenceRecord>[]> = useMemo(() => {
    return {
    Accident: [
      // Core Identifiers
      { key: "Occurrence_Date1", header: "Occurrence Date", sortable: true, width: "180px", accessor: (row) => formatDate(row.Occurrence_Date1) },
      { key: "OccurrenceId", header: "occurrence number", sortable: true, width: "140px" },
      { key: "Location", header: "Location", sortable: true, width: "180px" },
      { key: "State", header: "State", sortable: true, width: "80px", align: "center" },
      { key: "Primary_Cause", header: "Occurrence Category", sortable: true, width: "180px" },
      { key: "Make1", header: "Make", sortable: true, width: "120px" },
      { key: "Model", header: "Model", sortable: true, width: "120px" },
      { key: "Engine_Details", header: "Engine Details", sortable: true, width: "140px" },
      { key: "Engine_model", header: "Engine Model", sortable: true, width: "140px" },
      { key: "Highest_Injury", header: "Highest Injury", sortable: true, width: "130px", accessor: (row) => getHighestInjury(row.Most_serious_injury_to_pilot, row.Passenger_injury, row.Persons_on_the_ground_injury), sortComparator: (a: OccurrenceRecord, b: OccurrenceRecord) => getInjurySeverityRank(getHighestInjury(a.Most_serious_injury_to_pilot, a.Passenger_injury, a.Persons_on_the_ground_injury)) - getInjurySeverityRank(getHighestInjury(b.Most_serious_injury_to_pilot, b.Passenger_injury, b.Persons_on_the_ground_injury)) },
      { key: "Description_of_damage_to_aircraft", header: "Damage Description", sortable: true, width: "250px" },
      { key: "PUBLIC_OUTCOME", header: "Description", sortable: true, width: "700px", accessor: (row) => <ExpandableDescription text={row.PUBLIC_OUTCOME || "-"} /> },
    ],
    Defect: [
      { key: "Occurrence_Date1", header: "Occurrence Date", sortable: true, width: "180px", accessor: (row) => formatDate(row.Occurrence_Date1) },
      { key: "OccurrenceId", header: "occurrence number", sortable: true, width: "140px" },
      { key: "Location", header: "Location", sortable: true, width: "180px" },
      { key: "State", header: "State", sortable: true, width: "80px", align: "center" },
      { key: "Primary_Cause", header: "Occurrence Category", sortable: true, width: "180px" },
      { key: "Make1", header: "Make", sortable: true, width: "120px" },
      { key: "Model", header: "Model", sortable: true, width: "120px" },
      { key: "Engine_Details", header: "Engine Details", sortable: true, width: "140px" },
      { key: "Engine_model", header: "Engine Model", sortable: true, width: "140px" },
      { key: "Provide_description_of_defect", header: "Defect Description", sortable: true, width: "300px" },
      { key: "PUBLIC_OUTCOME", header: "Description", sortable: true, width: "600px", accessor: (row) => <ExpandableDescription text={row.PUBLIC_OUTCOME || "-"} /> },
    ],
    Hazard: [
      { key: "Date_Hazard_Identified", header: "Date Identified", sortable: true, width: "180px", accessor: (row) => formatDate(row.Date_Hazard_Identified || row.Occurrence_Date1) },
      { key: "OccurrenceId", header: "occurrence number", sortable: true, width: "140px" },
      { key: "State", header: "State", sortable: true, width: "80px", align: "center" },
      { key: "Primary_Cause", header: "Occurrence Category", sortable: true, width: "180px" },
      { key: "Location_of_hazard", header: "Location of Hazard", sortable: true, width: "200px" },
      { key: "Please_fully_describe_the_identified_hazard", header: "Hazard Description", sortable: true, width: "350px" },
      { key: "Do_you_have_further_suggestions_on_how_to_PSO", header: "Prevention Suggestions", sortable: true, width: "300px" },
      { key: "PUBLIC_OUTCOME", header: "Description", sortable: true, width: "600px", accessor: (row) => <ExpandableDescription text={row.PUBLIC_OUTCOME || "-"} /> },
      { key: "Created_Time", header: "Created", sortable: true, width: "180px", accessor: (row) => formatDate(row.Created_Time) },
    ],
    Complaint: [
      { key: "Occurrence_Date1", header: "Occurrence Date", sortable: true, width: "180px", accessor: (row) => formatDate(row.Occurrence_Date1) },
      { key: "OccurrenceId", header: "occurrence number", sortable: true, width: "140px" },
      { key: "Primary_Cause", header: "Occurrence Category", sortable: true, width: "180px" },
      { key: "Description_of_Occurrence", header: "Complaint Details", sortable: true, width: "400px" },
      { key: "PUBLIC_OUTCOME", header: "Description", sortable: true, width: "600px", accessor: (row) => <ExpandableDescription text={row.PUBLIC_OUTCOME || "-"} /> },
      { key: "Created_Time", header: "Created", sortable: true, width: "180px", accessor: (row) => formatDate(row.Created_Time) },
    ],
    All: [
      { key: "Type", header: "Type", sortable: false, width: "120px", accessor: (row) => getTypeBadge(getFormType(row)) },
      { key: "Occurrence_Number", header: "occurrence number", sortable: true, width: "140px" },
      { key: "Occurrence_Date1", header: "Date", sortable: true, width: "180px", accessor: (row) => formatDate(row.Occurrence_Date1) },
      { key: "State", header: "State", sortable: true, width: "80px", align: "center" },
      { key: "Location", header: "Location", sortable: true, width: "180px" },
      { key: "Primary_Cause", header: "Occurrence Category", sortable: true, width: "180px" },
      { key: "PUBLIC_OUTCOME", header: "Description", sortable: true, width: "600px", accessor: (row) => <ExpandableDescription text={row.PUBLIC_OUTCOME || "-"} /> },
      { key: "Make1", header: "Aircraft Make", sortable: true, width: "120px" },
      { key: "Model", header: "Aircraft Model", sortable: true, width: "120px" },
      { key: "Engine_Details", header: "Engine Make", sortable: true, width: "140px" },
      { key: "Engine_model", header: "Engine Model", sortable: true, width: "140px" },
      { key: "Highest_Injury", header: "Highest Injury", sortable: true, width: "130px", accessor: (row) => getHighestInjury(row.Most_serious_injury_to_pilot, row.Passenger_injury, row.Persons_on_the_ground_injury), sortComparator: (a: OccurrenceRecord, b: OccurrenceRecord) => getInjurySeverityRank(getHighestInjury(a.Most_serious_injury_to_pilot, a.Passenger_injury, a.Persons_on_the_ground_injury)) - getInjurySeverityRank(getHighestInjury(b.Most_serious_injury_to_pilot, b.Passenger_injury, b.Persons_on_the_ground_injury)) },
      { key: "Damage_to_aircraft", header: "Damage", sortable: true, width: "120px" },
    ],
  };
  }, []);

  // Determine which columns to show based on filter
  const currentColumns = useMemo(() => {
    const formType = occurrenceType || 'All';
    return columnSets[formType] || columnSets.All;
  }, [occurrenceType, columnSets]);

  const handleRowClick = (row: OccurrenceRecord) => {
    // You can implement navigation or modal here
    // console.log("Row clicked:", row);
  };

  const totalPages = Math.ceil(totalRecords / perPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Occurrence Management</h1>
          <p className="text-lg text-gray-600">View and analyze occurrence records</p>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Enhanced Search Bar */}
            <div className="flex-1 min-w-[300px] max-w-3xl relative h-11">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by occurrence number, location, make, model..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-full pl-10 pr-10 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Action Buttons Container */}
            <div className="flex items-center gap-2">
              {/* Filter Toggle Button */}
              <Button 
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="h-11 px-4 bg-white border border-gray-300 hover:bg-gray-50 whitespace-nowrap text-sm"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {(Object.values(filters).some(v => v) || dateFilterMode === "range") && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    {Object.values(filters).filter(v => v).length + (dateFilterMode === "range" ? 1 : 0)}
                  </span>
                )}
              </Button>

              {/* Per Page Selector */}
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                aria-label="Items per page"
                className="h-11 px-3 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 whitespace-nowrap appearance-none cursor-pointer"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>

              {/* Refresh Button */}
              <Button onClick={fetchData} variant="outline" className="h-11 px-4 bg-white border border-gray-300 hover:bg-gray-50" disabled={loading} title="Refresh data">
                <svg
                  className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(Object.entries(filters).some(([_, v]) => v) || dateFilterMode === "range") && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>
              
              {dateFilterMode === "range" && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Date Range
                  {filters.dateFrom && `: ${filters.dateFrom}`}
                  {filters.dateTo && ` to ${filters.dateTo}`}
                </span>
              )}
              
              {filters.location && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Location: {filters.location}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, location: "" }))}
                    className="ml-1.5 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {filters.make && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Make: {filters.make}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, make: "" }))}
                    className="ml-1.5 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {filters.model && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Model: {filters.model}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, model: "" }))}
                    className="ml-1.5 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {filters.engineMake && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Engine Make: {filters.engineMake}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, engineMake: "" }))}
                    className="ml-1.5 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {filters.engineModel && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Engine Model: {filters.engineModel}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, engineModel: "" }))}
                    className="ml-1.5 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {filters.state && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  State: {filters.state}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, state: "" }))}
                    className="ml-1.5 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {filters.injury && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Injury: {filters.injury}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, injury: "" }))}
                    className="ml-1.5 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {filters.damage && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Damage: {filters.damage}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, damage: "" }))}
                    className="ml-1.5 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              {filters.occurrenceCategory && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  Category: {filters.occurrenceCategory}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, occurrenceCategory: "" }))}
                    className="ml-1.5 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              
              <button
                onClick={() => {
                  setFilters({
                    dateFrom: "",
                    dateTo: "",
                    location: "",
                    make: "",
                    model: "",
                    engineMake: "",
                    engineModel: "",
                    state: "",
                    injury: "",
                    damage: "",
                    occurrenceCategory: ""
                  });
                  setDateFilterMode("none");
                  setCurrentPage(1);
                }}
                className="ml-2 text-sm font-medium text-blue-600 hover:text-blue-800 underline"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              {/* Date Filter Mode Selection */}
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Date Filter
                </label>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="dateFilterMode"
                      value="none"
                      checked={dateFilterMode === "none"}
                      onChange={(e) => {
                        setDateFilterMode(e.target.value as "none" | "range");
                        if (e.target.value === "none") {
                          setFilters(prev => ({ ...prev, dateFrom: "", dateTo: "" }));
                        }
                        setCurrentPage(1);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">No date filter</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="dateFilterMode"
                      value="range"
                      checked={dateFilterMode === "range"}
                      onChange={(e) => {
                        setDateFilterMode(e.target.value as "none" | "range");
                        setCurrentPage(1);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">Date range</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Date Range Filters - Only show when date filter mode is range */}
                {dateFilterMode === "range" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date From
                      </label>
                      <input
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => {
                          setFilters(prev => ({ ...prev, dateFrom: e.target.value }));
                          setCurrentPage(1);
                        }}
                        className="w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date To
                      </label>
                      <input
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => {
                          setFilters(prev => ({ ...prev, dateTo: e.target.value }));
                          setCurrentPage(1);
                        }}
                        className="w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    placeholder="Enter location..."
                    value={filters.location}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, location: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Aircraft Make Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aircraft Make
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Cessna, Piper..."
                    value={filters.make}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, make: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Aircraft Model Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aircraft Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 172, PA-28..."
                    value={filters.model}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, model: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Engine Make Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Engine Make
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Rotax, Lycoming..."
                    value={filters.engineMake}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, engineMake: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Engine Model Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Engine Model
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 912, IO-360..."
                    value={filters.engineModel}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, engineModel: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* State Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <select
                    value={filters.state}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, state: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">All States</option>
                    <option value="ACT">ACT</option>
                    <option value="NSW">NSW</option>
                    <option value="NT">NT</option>
                    <option value="QLD">QLD</option>
                    <option value="SA">SA</option>
                    <option value="TAS">TAS</option>
                    <option value="VIC">VIC</option>
                    <option value="WA">WA</option>
                  </select>
                </div>

                {/* Injury Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Highest Injury
                  </label>
                  <select
                    value={filters.injury}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, injury: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">All Injuries</option>
                    <option value="Fatal">Fatal</option>
                    <option value="Serious">Serious</option>
                    <option value="Minor">Minor</option>
                    <option value="Nil">Nil</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                {/* Damage Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Damage Level
                  </label>
                  <select
                    value={filters.damage}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, damage: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">All Damage Levels</option>
                    <option value="Destroyed">Destroyed</option>
                    <option value="Major">Major</option>
                    <option value="Minor">Minor</option>
                    <option value="Nil">Nil</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                {/* Occurrence Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occurrence Category
                  </label>
                  <select
                    value={filters.occurrenceCategory}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, occurrenceCategory: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">All Categories</option>
                    <option value="Operational">Operational</option>
                    <option value="Technical">Technical</option>
                    <option value="Airspace">Airspace</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Environment">Environment</option>
                    <option value="Consequential Event">Consequential Event</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          </div>
        )}

        {/* Results Counter */}
        {!loading && totalRecords > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            {searchInput || Object.values(filters).some(v => v) || dateFilterMode === "range" ? (
              <span>
                Showing <span className="font-semibold text-gray-900">{filteredData.length}</span> of{" "}
                <span className="font-semibold text-gray-900">{totalRecords}</span> records (filtered)
              </span>
            ) : (
              <span>
                Showing <span className="font-semibold text-gray-900">{totalRecords}</span> records
              </span>
            )}
          </div>
        )}

        {/* Table with Synchronized Top and Bottom Scrollbars - Only show when there are records */}
        {totalRecords > 0 && !loading && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Top Scrollbar - Provides horizontal scroll without going to bottom */}
              <div className="relative bg-gray-50 border-b border-gray-200">
                <div
                  ref={topScrollRef}
                  className="overflow-x-auto overflow-y-hidden scrollbar-hide"
                  style={{ height: '20px' }}
                >
                  <div style={{
                    width: currentColumns.length > 0
                      ? `${currentColumns.reduce((acc, col) => acc + parseInt(col.width || '150'), 0)}px`
                      : '100%',
                    height: '20px'
                  }} />
                </div>
              </div>

              {/* Table Content with Bottom Scrollbar */}
              <div 
                ref={tableContainerRef}
                className="max-h-[75vh] overflow-auto"
              >
                <Table
                  columns={currentColumns}
                  data={filteredData}
                  loading={loading}
                  onRowClick={handleRowClick}
                  striped
                  hoverable
                  bordered
                  emptyMessage={searchInput ? "No records match your search" : "No occurrence records found"}
                />
              </div>
            </div>

            {/* Pagination */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="text-sm text-gray-700">
                Page <span className="font-semibold text-gray-900">{currentPage}</span> of{" "}
                <span className="font-semibold text-gray-900">{totalPages || 1}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1 || loading}
                  variant="outline"
                  className="h-10 px-3 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </Button>
                
                <Button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  variant="outline"
                  className="h-10 px-3 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
                
                <span className="px-4 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg border border-gray-200">
                  {currentPage} / {totalPages || 1}
                </span>
                
                <Button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!hasMore || loading}
                  variant="outline"
                  className="h-10 px-3 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
                
                <Button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || loading}
                  variant="outline"
                  className="h-10 px-3 border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last page"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Show message when no records are available for display */}
        {totalRecords === 0 && !loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <svg
              className="w-20 h-20 mx-auto mb-6 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Records Available</h3>
            <p className="text-gray-600 max-w-md mx-auto">
              There are currently no occurrence records approved for display on the website.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
