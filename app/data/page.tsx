"use client";


import { useState, useEffect, useMemo, useRef } from "react";
import { Table, TableColumn } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import axios from "axios";
import { 
  getColumnMetadata
} from "@/lib/utils/columnCategories";

// The record type is flexible to support all form types
type OccurrenceRecord = Record<string, any>;

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
    occurrenceStatus: "",
    engineMake: "",
    state: "",
    injury: "",
    damage: ""
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
      if (filters.occurrenceStatus) params.append("occurrence_status", filters.occurrenceStatus);
      if (filters.engineMake) params.append("engine_make", filters.engineMake);
      if (filters.state) params.append("state", filters.state);
      if (filters.injury) params.append("injury", filters.injury);
      if (filters.damage) params.append("damage", filters.damage);
      
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
        const searchableFields = [
          row.Name1,
          row.Last_Name,
          row.OccurrenceId,
          row.Occurrence_ID,
          row.Registration_number,
          row.Location,
          row.Member_Number,
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

    if (filters.occurrenceStatus) {
      filtered = filtered.filter(row => 
        row.Occurrence_Status?.toLowerCase().includes(filters.occurrenceStatus.toLowerCase())
      );
    }

    if (filters.engineMake) {
      filtered = filtered.filter(row => 
        row.Engine_Details?.toLowerCase().includes(filters.engineMake.toLowerCase()) ||
        row.Engine_model?.toLowerCase().includes(filters.engineMake.toLowerCase())
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
  }, [data, searchInput, filters]);

  // Utility: Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-AU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
   * 
   * COLUMN CATEGORIZATION SYSTEM:
   * Categories are automatically applied via getColumnMetadata() from columnCategories.ts
   * - MANDATORY (Red): Required form fields - always needed for records
   * - IMPORTANT (Orange): High-priority fields like OccurrenceId, Passenger_injury, PIC info
   * - OPTIONAL (Yellow): Supplementary fields for detailed analysis
   * 
   * Category metadata is used for:
   * 1. Table header colors (light tint matching category)
   * 2. Column filter organization (3-section segregated popup)
   * 3. Priority ordering within each category
   */
  const columnSets: Record<string, TableColumn<OccurrenceRecord>[]> = useMemo(() => {
    // Get metadata for categorization
    const accidentMeta = getColumnMetadata('Accident');
    const defectMeta = getColumnMetadata('Defect');
    const hazardMeta = getColumnMetadata('Hazard');
    const complaintMeta = getColumnMetadata('Complaint');
    const allMeta = getColumnMetadata('All');
    
    return {
    Accident: [
      // Core Identifiers
      { key: "Occurrence_Date1", header: "Occurrence Date", sortable: true, width: "180px", accessor: (row) => formatDate(row.Occurrence_Date1), category: accidentMeta.Occurrence_Date1?.category, priority: accidentMeta.Occurrence_Date1?.priority },
   
      { key: "OccurrenceId", header: "Occurrence ID", sortable: true, width: "140px", category: accidentMeta.OccurrenceId?.category, priority: accidentMeta.OccurrenceId?.priority },
      { key: "Occurrence_Status", header: "Occurrence Status", sortable: true, width: "160px" },
      { key: "Location", header: "Location", sortable: true, width: "180px", category: accidentMeta.Location?.category, priority: accidentMeta.Location?.priority },
      
      { key: "State", header: "State", sortable: true, width: "80px", align: "center" },
      { key: "Make1", header: "Make", sortable: true, width: "120px" },
      { key: "Model", header: "Model", sortable: true, width: "120px" },
      { key: "Engine_Details", header: "Engine Details", sortable: true, width: "140px" },
      { key: "Engine_model", header: "Engine Model", sortable: true, width: "140px" },
        // { key: "Passenger_injury", header: "Passenger Injury", sortable: true, width: "140px", sortComparator: (a: OccurrenceRecord, b: OccurrenceRecord) => getInjurySeverityRank(a.Passenger_injury) - getInjurySeverityRank(b.Passenger_injury), category: accidentMeta.Passenger_injury?.category, priority: accidentMeta.Passenger_injury?.priority },
        // { key: "Most_serious_injury_to_pilot", header: "Pilot Injury", sortable: true, width: "130px" },
        //  { key: "Persons_on_the_ground_injury", header: "Ground Injury", sortable: true, width: "140px" },
         { key: "Highest_Injury", header: "Highest Injury", sortable: true, width: "130px", accessor: (row) => getHighestInjury(row.Most_serious_injury_to_pilot, row.Passenger_injury, row.Persons_on_the_ground_injury), sortComparator: (a: OccurrenceRecord, b: OccurrenceRecord) => getInjurySeverityRank(getHighestInjury(a.Most_serious_injury_to_pilot, a.Passenger_injury, a.Persons_on_the_ground_injury)) - getInjurySeverityRank(getHighestInjury(b.Most_serious_injury_to_pilot, b.Passenger_injury, b.Persons_on_the_ground_injury)) },
         { key: "Description_of_damage_to_aircraft", header: "Damage Description", sortable: true, width: "250px" },
            { key: "Description_of_Occurrence", header: "Description of Incident/Accident", sortable: true, width: "300px" }
    ],
    Defect: [
      // Core Identifiers
     
     
      { key: "Occurrence_Date1", header: "Occurrence Date", sortable: true, width: "180px", accessor: (row) => formatDate(row.Occurrence_Date1), category: defectMeta.Occurrence_Date1?.category, priority: defectMeta.Occurrence_Date1?.priority },
       { key: "OccurrenceId", header: "Occurrence ID", sortable: true, width: "140px", category: defectMeta.OccurrenceId?.category, priority: defectMeta.OccurrenceId?.priority },
       { key: "Occurrence_Status", header: "Occurrence Status", sortable: true, width: "160px" },
      { key: "Location", header: "Location", sortable: true, width: "180px" },
      { key: "State", header: "State", sortable: true, width: "80px", align: "center" },
      { key: "Make1", header: "Make", sortable: true, width: "120px" },
      { key: "Model", header: "Model", sortable: true, width: "120px" },
      { key: "Engine_Details", header: "Engine Details", sortable: true, width: "140px" },
      { key: "Engine_model", header: "Engine Model", sortable: true, width: "140px" },
      { key: "Provide_description_of_defect", header: "Defect Description", sortable: true, width: "300px" },
      
    ],
    Hazard: [
      // Core Identifiers
      { key: "Date_Hazard_Identified", header: "Date Identified", sortable: true, width: "180px", accessor: (row) => formatDate(row.Date_Hazard_Identified || row.Occurrence_Date1) },
      { key: "OccurrenceId", header: "Hazard ID", sortable: true, width: "140px" },
      { key: "Occurrence_Status", header: "Occurrence Status", sortable: true, width: "160px" },
      
      
      // Hazard Information
      { key: "State", header: "State", sortable: true, width: "80px", align: "center" },
      { key: "Location_of_hazard", header: "Location of Hazard", sortable: true, width: "200px" },
      { key: "Please_fully_describe_the_identified_hazard", header: "Hazard Description", sortable: true, width: "350px" },
      { key: "Do_you_have_further_suggestions_on_how_to_PSO", header: "Prevention Suggestions", sortable: true, width: "300px" },
      
      // System Fields
      { key: "Created_Time", header: "Created", sortable: true, width: "180px", accessor: (row) => formatDate(row.Created_Time) },
    ],
    Complaint: [
      // Core Identifiers
      
      { key: "Occurrence_Date1", header: "Occurrence Date", sortable: true, width: "180px", accessor: (row) => formatDate(row.Occurrence_Date1) },
      { key: "OccurrenceId", header: "Complaint ID", sortable: true, width: "140px" },
      { key: "Occurrence_Status", header: "Occurrence Status", sortable: true, width: "160px" },
      // Complaint Details
      { key: "Description_of_Occurrence", header: "Complaint Details", sortable: true, width: "400px" },
      
      // System Fields
      { key: "Created_Time", header: "Created", sortable: true, width: "180px", accessor: (row) => formatDate(row.Created_Time) },
    ],
    All: [
      { key: "Type", header: "Type", sortable: false, width: "120px", accessor: (row) => getTypeBadge(getFormType(row)) },
      { key: "OccurrenceId", header: "ID", sortable: true, width: "140px" },
      { key: "Occurrence_Status", header: "Occurrence Status", sortable: true, width: "160px" },
      { key: "Occurrence_Date1", header: "Date", sortable: true, width: "180px", accessor: (row) => formatDate(row.Occurrence_Date1) },
      { key: "State", header: "State", sortable: true, width: "80px", align: "center" },
      { key: "Location", header: "Location", sortable: true, width: "180px" },
      { key: "Make1", header: "Make", sortable: true, width: "120px" },
      { key: "Model", header: "Model", sortable: true, width: "120px" },
      // { key: "Passenger_injury", header: "Passenger Injury", sortable: true, width: "140px", sortComparator: (a: OccurrenceRecord, b: OccurrenceRecord) => getInjurySeverityRank(a.Passenger_injury) - getInjurySeverityRank(b.Passenger_injury) },
      // { key: "Most_serious_injury_to_pilot", header: "Pilot Injury", sortable: true, width: "130px" },
      // { key: "Persons_on_the_ground_injury", header: "Ground Injury", sortable: true, width: "140px" },
      { key: "Highest_Injury", header: "Highest Injury", sortable: true, width: "130px", accessor: (row) => getHighestInjury(row.Most_serious_injury_to_pilot, row.Passenger_injury, row.Persons_on_the_ground_injury), sortComparator: (a: OccurrenceRecord, b: OccurrenceRecord) => getInjurySeverityRank(getHighestInjury(a.Most_serious_injury_to_pilot, a.Passenger_injury, a.Persons_on_the_ground_injury)) - getInjurySeverityRank(getHighestInjury(b.Most_serious_injury_to_pilot, b.Passenger_injury, b.Persons_on_the_ground_injury)) },
      { key: "Accident_or_Incident", header: "Accident/Incident", sortable: true, width: "140px" },
      { key: "Damage_to_aircraft", header: "Damage", sortable: true, width: "120px" },
      { key: "Description_of_Occurrence", header: "Description", sortable: true, width: "300px" },
      { key: "Created_Time", header: "Created", sortable: true, width: "180px", accessor: (row) => formatDate(row.Created_Time) },
    ],
  };
  }, []);

  // Determine which columns to show based on filter and apply category metadata
  const currentColumns = useMemo(() => {
    const formType = occurrenceType || 'All';
    const baseColumns = columnSets[formType] || columnSets.All;
    const metadata = getColumnMetadata(formType);
    
    // Apply category and priority metadata to each column
    return baseColumns.map(col => {
      const meta = metadata[col.key];
      return {
        ...col,
        category: meta?.category || 'optional',
        priority: meta?.priority || 999
      };
    });
  }, [occurrenceType, columnSets]);

  const handleRowClick = (row: OccurrenceRecord) => {
    // You can implement navigation or modal here
    // console.log("Row clicked:", row);
  };

  const totalPages = Math.ceil(totalRecords / perPage);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Occurrence Management</h1>
          <p className="text-gray-600 mt-1">View and manage occurrence records from Zoho CRM</p>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-lg shadow p-4 pb-2 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Type Filter */}
            <select
              value={occurrenceType}
              onChange={(e) => {
                setOccurrenceType(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by occurrence type"
              className="h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white"
            >
              <option value="">All Forms</option>
              <option value="Accident">Accident & Incident</option>
              <option value="Defect">Defect</option>
              <option value="Hazard">Hazard</option>
              <option value="Complaint">Complaint</option>
            </select>

            {/* Client-side Search */}
            <div className="flex-1 min-w-[300px]">
              <input
                type="text"
                placeholder="Search data in the table ..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>

            {/* Filter Toggle Button */}
            <Button 
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="mb-2.5"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters {Object.values(filters).some(v => v) && dateFilterMode === "range" && <span className="ml-1 text-blue-600">●</span>}
            </Button>

            {/* Per Page Selector */}
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Items per page"
              className="h-10 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 bg-white"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>

            {/* Refresh Button */}
            <Button onClick={fetchData} variant="outline" className="mb-2.5" disabled={loading}>
              <svg
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
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

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              {/* Date Filter Mode Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Filter
                </label>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center">
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
                  <label className="flex items-center">
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

                {/* Occurrence Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occurrence Status
                  </label>
                  <select
                    value={filters.occurrenceStatus}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, occurrenceStatus: e.target.value }));
                      setCurrentPage(1);
                    }}
                    className="w-full h-9 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">All Statuses</option>
                    <option value="Open">Open</option>
                    <option value="Closed">Closed</option>
                    <option value="sm_review">sm_review</option>
                    <option value="im_review">im_review</option>
                    <option value="assigned_for_delegation">assigned_for_delegation</option>
                    <option value="risk_assessment">risk_assessment</option>
                    <option value="under_investigation">under_investigation</option>
                    <option value="outcome_approved">outcome_approved</option>
                    <option value="unassigned">unassigned</option>
                    <option value="outcome_sent">outcome_sent</option>
                    <option value="assigned_for_investigation">assigned_for_investigation</option>
                    <option value="Awaiting Further Information">Awaiting Further Information</option>
                    <option value="Awaiting Initial Review">Awaiting Initial Review</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Safety Closure Review">Safety Closure Review</option>
                    <option value="Under Closure Review">Under Closure Review</option>
                  </select>
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
              </div>

              {/* Clear Filters Button - Positioned on the right side */}
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => {
                    setFilters({
                      dateFrom: "",
                      dateTo: "",
                      location: "",
                      make: "",
                      occurrenceStatus: "",
                      engineMake: "",
                      state: "",
                      injury: "",
                      damage: ""
                    });
                    setDateFilterMode("none");
                    setCurrentPage(1);
                  }}
                  variant="outline"
                  className="px-4 py-2 text-sm"
                >
                  Clear All Filters
                </Button>
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

        {/* Table with Synchronized Top and Bottom Scrollbars - Only show when there are records */}
        {totalRecords > 0 && !loading && (
          <>
            <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
              {/* Top Scrollbar - Provides horizontal scroll without going to bottom */}
              <div className="relative bg-slate-50 border-b border-slate-200">
                <div
                  ref={topScrollRef}
                  className="overflow-x-auto overflow-y-hidden scrollbar-hide"
                  style={{ height: '17px' }}
                >
                  <div style={{
                    width: currentColumns.length > 0
                      ? `${currentColumns.reduce((acc, col) => acc + parseInt(col.width || '150'), 0)}px`
                      : '100%',
                    height: '17px'
                  }} />
                </div>
                <div className="absolute top-0 left-4 text-xs text-slate-500 pointer-events-none py-0.5">
                  {/* ← Scroll horizontally → */}
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
            <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-700">
                  {searchInput ? (
                    <>Showing {filteredData.length} of {totalRecords} records (filtered)</>
                  ) : (
                    <>Showing {data.length > 0 ? (currentPage - 1) * perPage + 1 : 0} to {Math.min(currentPage * perPage, totalRecords)} of {totalRecords} records</>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1 || loading}
                  variant="outline"
                >
                  First
                </Button>
                <Button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm text-gray-700">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <Button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!hasMore || loading}
                  variant="outline"
                >
                  Next
                </Button>
                <Button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || loading}
                  variant="outline"
                >
                  Last
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Show message when no records are available for display */}
        {totalRecords === 0 && !loading && !error && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Available</h3>
            <p className="text-gray-600">
              There are currently no occurrence records approved for display on the website.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
