"use client";


import { useState, useEffect, useMemo, useRef } from "react";
import { Table, TableColumn } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import axios from "axios";

// The record type is flexible to support all form types
type OccurrenceRecord = Record<string, any>;

interface ColumnVisibility {
  [key: string]: boolean;
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
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({});
  const [columnSearchQuery, setColumnSearchQuery] = useState("");
  const columnSelectorRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Close column selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnSelectorRef.current && !columnSelectorRef.current.contains(event.target as Node)) {
        setShowColumnSelector(false);
      }
    };
    if (showColumnSelector) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColumnSelector]);

  // Sync scrollbars between top scroller and table container
  useEffect(() => {
    const topScroll = topScrollRef.current;
    const tableContainer = tableContainerRef.current;

    if (!topScroll || !tableContainer) return;

    const handleTopScroll = () => {
      if (tableContainer) {
        tableContainer.scrollLeft = topScroll.scrollLeft;
      }
    };

    const handleTableScroll = () => {
      if (topScroll) {
        topScroll.scrollLeft = tableContainer.scrollLeft;
      }
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
  }, [currentPage, perPage, occurrenceType]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        per_page: perPage.toString(),
      });
      if (occurrenceType) params.append("type", occurrenceType);
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

  // Client-side filtering based on search input
  const filteredData = useMemo(() => {
    if (!searchInput.trim()) return data;
    const query = searchInput.toLowerCase();
    return data.filter(row => {
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
  }, [data, searchInput]);

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

  // Utility: Get type badge
  function getTypeBadge(type: string) {
    if (type === "Accident") return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Accident</span>;
    if (type === "Incident") return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Incident</span>;
    if (type === "Defect") return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Defect</span>;
    if (type === "Hazard") return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Hazard</span>;
    if (type === "Complaint") return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Complaint</span>;
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{type}</span>;
  }

  // Column sets based on actual form fields (from forms.ts and form pages)
  const columnSets: Record<string, TableColumn<OccurrenceRecord>[]> = useMemo(() => ({
    Accident: [
      // Core Identifiers
      { key: "Type", header: "Type", sortable: false, width: "120px", accessor: (row) => getTypeBadge(getFormType(row)) },
      { key: "OccurrenceId", header: "Occurrence ID", sortable: true, width: "140px" },
      { key: "Occurrence_Date1", header: "Occurrence Date", sortable: true, width: "180px", accessor: (row) => formatDate(row.Occurrence_Date1) },
      { key: "Passenger_injury", header: "Passenger Injury", sortable: true, width: "140px", sortComparator: (a: OccurrenceRecord, b: OccurrenceRecord) => getInjurySeverityRank(a.Passenger_injury) - getInjurySeverityRank(b.Passenger_injury) },
      
      // Reporter Information
      { key: "Role", header: "Role", sortable: true, width: "150px" },
      { key: "Member_Number", header: "Member #", sortable: true, width: "110px" },
      { key: "Name1", header: "First Name", sortable: true, width: "120px" },
      { key: "Last_Name", header: "Last Name", sortable: true, width: "120px" },
      { key: "Reporter_Email", header: "Email", sortable: true, width: "180px" },
      { key: "Contact_Phone", header: "Contact Phone", sortable: true, width: "130px" },
      
      // PIC Information
      { key: "PIC_Member_Number", header: "PIC Member #", sortable: true, width: "130px" },
      { key: "Date_of_Birth", header: "PIC Date of Birth", sortable: true, width: "150px", accessor: (row) => formatDate(row.Date_of_Birth) },
      { key: "PIC_Name", header: "PIC First Name", sortable: true, width: "130px" },
      { key: "PIC_Last_Name", header: "PIC Last Name", sortable: true, width: "130px" },
      { key: "PIC_Contact_Phone", header: "PIC Phone", sortable: true, width: "130px" },
      { key: "PIC_Email", header: "PIC Email", sortable: true, width: "180px" },
      
      // Flying Hours
      { key: "Hours_last_90_days", header: "Hours Last 90 Days", sortable: true, width: "160px" },
      { key: "Total_flying_hours", header: "Total Flying Hours", sortable: true, width: "160px" },
      { key: "Hours_on_type", header: "Hours on Type", sortable: true, width: "140px" },
      { key: "Hours_on_type_last_90_days", header: "Hours on Type (90d)", sortable: true, width: "170px" },
      
      // Occurrence Details
      { key: "State", header: "State", sortable: true, width: "80px", align: "center" },
      { key: "Location", header: "Location", sortable: true, width: "180px" },
      { key: "Description_of_Occurrence", header: "Description of Incident/Accident", sortable: true, width: "300px" },
      { key: "Level_2_Maintainer_L2", header: "Contributing Factors", sortable: true, width: "250px" },
      { key: "Damage_to_aircraft", header: "Damage to Aircraft", sortable: true, width: "150px" },
      { key: "Most_serious_injury_to_pilot", header: "Pilot Injury", sortable: true, width: "130px" },
      { key: "Involve_IFR_or_Air_Transport_Operations", header: "IFR/Air Transport", sortable: true, width: "160px", accessor: (row) => row.Involve_IFR_or_Air_Transport_Operations ? "Yes" : "No" },
      { key: "In_controlled_or_special_use_airspace", header: "Controlled Airspace", sortable: true, width: "170px", accessor: (row) => row.In_controlled_or_special_use_airspace ? "Yes" : "No" },
      { key: "In_vicinity_of_aerodrome", header: "Near Aerodrome", sortable: true, width: "150px", accessor: (row) => row.In_vicinity_of_aerodrome ? "Yes" : "No" },
      { key: "Y_Code", header: "Aerodrome Y Code", sortable: true, width: "160px" },
      { key: "Passenger_details", header: "Passenger Details", sortable: true, width: "200px" },
      { key: "Persons_on_the_ground_injury", header: "Ground Injury", sortable: true, width: "140px" },
      { key: "Description_of_damage_to_aircraft", header: "Damage Description", sortable: true, width: "250px" },
      
      // Maintainer Info  
      { key: "Maintainer_Name", header: "Maintainer First Name", sortable: true, width: "160px" },
      { key: "Maintainer_Member_Number", header: "Maintainer Member #", sortable: true, width: "170px" },
      { key: "Maintainer_Last_Name", header: "Maintainer Last Name", sortable: true, width: "170px" },
      { key: "Maintainer_Level", header: "Maintainer Level", sortable: true, width: "150px" },
      
      // Accident/Incident Classification
      { key: "Accident_or_Incident", header: "Accident/Incident", sortable: true, width: "150px" },
      { key: "Reporter_Suggestions", header: "Contributions & Suggestions", sortable: true, width: "250px" },
      { key: "ATSB_reportable_status", header: "ATSB Status (IRM/RRM)", sortable: true, width: "160px" },
      
      // Flight Details
      { key: "Departure_location", header: "Departure Location", sortable: true, width: "160px" },
      { key: "Destination_location", header: "Destination Location", sortable: true, width: "170px" },
      { key: "Landing", header: "Landing", sortable: true, width: "150px" },
      { key: "Type_of_operation", header: "Type of Operation", sortable: true, width: "180px" },
      { key: "Phase_of_flight", header: "Phase of Flight", sortable: true, width: "150px" },
      { key: "Effect_of_flight", header: "Effect of Flight", sortable: true, width: "150px", accessor: (row) => Array.isArray(row.Effect_of_flight) ? row.Effect_of_flight.join(", ") : row.Effect_of_flight || "-" },
      { key: "Flight_Rules", header: "Flight Rules", sortable: true, width: "120px" },
      
      // Airspace
      { key: "Airspace_class", header: "Airspace Class", sortable: true, width: "130px" },
      { key: "Airspace_type", header: "Airspace Type", sortable: true, width: "130px" },
      { key: "Altitude", header: "Altitude", sortable: true, width: "110px" },
      { key: "Altitude_type", header: "Altitude Type", sortable: true, width: "140px" },
      
      // Environment
      { key: "Light_conditions", header: "Light Conditions", sortable: true, width: "150px" },
      { key: "Visibility", header: "Visibility (km)", sortable: true, width: "130px" },
      { key: "Wind_speed", header: "Wind Speed (knots)", sortable: true, width: "150px" },
      { key: "Wind_direction", header: "Wind Direction", sortable: true, width: "140px" },
      { key: "Visibility_reduced_by", header: "Visibility Reduced By", sortable: true, width: "180px", accessor: (row) => Array.isArray(row.Visibility_reduced_by) ? row.Visibility_reduced_by.join(", ") : row.Visibility_reduced_by || "-" },
      { key: "Temperature", header: "Temperature (°C)", sortable: true, width: "140px" },
      { key: "Wind_gusting", header: "Wind Gusting", sortable: true, width: "130px" },
      { key: "Personal_Locator_Beacon_carried", header: "PLB Carried", sortable: true, width: "120px" },
      
      // Near Miss / Wildlife Strike
      { key: "Involve_near_miss_with_another_aircraft", header: "Near Miss", sortable: true, width: "120px", accessor: (row) => row.Involve_near_miss_with_another_aircraft ? "Yes" : "No" },
      { key: "Bird_or_Animal_Strike", header: "Wildlife Strike", sortable: true, width: "140px", accessor: (row) => row.Bird_or_Animal_Strike ? "Yes" : "No" },
      { key: "Type_of_strike", header: "Strike Type", sortable: true, width: "120px" },
      { key: "Size", header: "Size", sortable: true, width: "100px" },
      { key: "Species", header: "Species", sortable: true, width: "140px" },
      { key: "Number_approx", header: "Number Approx", sortable: true, width: "140px" },
      { key: "Number_struck_approx", header: "Number Struck", sortable: true, width: "140px" },
      
      // Near Miss Details
      { key: "Second_aircraft_registration", header: "2nd Aircraft Rego", sortable: true, width: "160px" },
      { key: "Second_Aircraft_Manufacturer", header: "2nd Aircraft Make", sortable: true, width: "170px" },
      { key: "Second_Aircraft_Model", header: "2nd Aircraft Model", sortable: true, width: "170px" },
      { key: "Horizontal_Proximity", header: "Horizontal Proximity", sortable: true, width: "170px" },
      { key: "Horizontal_Proximity_Unit", header: "H Proximity Unit", sortable: true, width: "150px" },
      { key: "Vertical_Proximity", header: "Vertical Proximity", sortable: true, width: "160px" },
      { key: "Vertical_Proximity_Unit", header: "V Proximity Unit", sortable: true, width: "150px" },
      { key: "Relative_Track", header: "Relative Track", sortable: true, width: "140px" },
      { key: "Avoidance_manoeuvre_needed", header: "Avoidance Needed", sortable: true, width: "170px" },
      { key: "Alert_Received", header: "Alert Received", sortable: true, width: "140px" },
      
      // Aircraft Details
      { key: "Registration_number", header: "Aircraft Rego", sortable: true, width: "130px" },
      { key: "Make1", header: "Make", sortable: true, width: "120px" },
      { key: "Model", header: "Model", sortable: true, width: "120px" },
      { key: "Type1", header: "Aircraft Type", sortable: true, width: "180px" },
      { key: "Serial_number", header: "Serial Number", sortable: true, width: "150px" },
      { key: "Year_Built1", header: "Year Built", sortable: true, width: "110px" },
      { key: "Registration_status", header: "Rego Status", sortable: true, width: "140px" },
      { key: "Total_airframe_hours", header: "Total Airframe Hours", sortable: true, width: "170px" },
      
      // Engine Details
      { key: "Engine_model", header: "Engine Model", sortable: true, width: "140px" },
      { key: "Engine_serial", header: "Engine Serial", sortable: true, width: "140px" },
      { key: "Engine_Details", header: "Engine Details", sortable: true, width: "140px" },
      { key: "Total_engine_hours", header: "Total Engine Hours", sortable: true, width: "160px" },
      { key: "Total_hours_since_service", header: "Hours Since Service", sortable: true, width: "170px" },
      
      // Propeller Details
      { key: "Propeller_make", header: "Propeller Make", sortable: true, width: "150px" },
      { key: "Propeller_model", header: "Propeller Model", sortable: true, width: "150px" },
      { key: "Propeller_serial", header: "Propeller Serial", sortable: true, width: "150px" },
      
      // System Fields
      { key: "Created_Time", header: "Created", sortable: true, width: "180px", accessor: (row) => formatDate(row.Created_Time) },
    ],
    Defect: [
      // Core Identifiers
      { key: "Type", header: "Type", sortable: false, width: "120px", accessor: (row) => getTypeBadge(getFormType(row)) },
      { key: "OccurrenceId", header: "Defect ID", sortable: true, width: "140px" },
      { key: "Occurrence_Date1", header: "Date Identified", sortable: true, width: "180px", accessor: (row) => formatDate(row.Occurrence_Date1) },
      
      // Reporter Information
      { key: "Role", header: "Role", sortable: true, width: "150px" },
      { key: "Member_Number", header: "Member #", sortable: true, width: "110px" },
      { key: "Name1", header: "First Name", sortable: true, width: "120px" },
      { key: "Last_Name", header: "Last Name", sortable: true, width: "120px" },
      { key: "Reporter_Email", header: "Email", sortable: true, width: "180px" },
      { key: "Contact_Phone", header: "Contact Phone", sortable: true, width: "130px" },
      
      // Defect Location
      { key: "State", header: "State", sortable: true, width: "80px", align: "center" },
      { key: "Location_of_aircraft_when_defect_was_found", header: "Aircraft Location", sortable: true, width: "220px" },
      { key: "Defective_component", header: "Defective Component", sortable: true, width: "200px" },
      { key: "Provide_description_of_defect", header: "Defect Description", sortable: true, width: "300px" },
      
      // Maintainer Information
      { key: "Maintainer_Name", header: "Maintainer First Name", sortable: true, width: "160px" },
      { key: "Maintainer_Last_Name", header: "Maintainer Last Name", sortable: true, width: "170px" },
      { key: "Maintainer_Member_Number", header: "Maintainer Member #", sortable: true, width: "170px" },
      { key: "Maintainer_Level", header: "Maintainer Level", sortable: true, width: "160px" },
      { key: "Do_you_have_further_suggestions_on_how_to_PSO", header: "Prevention Suggestions", sortable: true, width: "250px" },
      
      // Aircraft Details
      { key: "Registration_number", header: "Aircraft Rego", sortable: true, width: "130px" },
      { key: "Serial_number", header: "Serial Number", sortable: true, width: "150px" },
      { key: "Registration_status", header: "Rego Status", sortable: true, width: "140px" },
      { key: "Make1", header: "Make", sortable: true, width: "120px" },
      { key: "Model", header: "Model", sortable: true, width: "120px" },
      { key: "Year_Built1", header: "Year Built", sortable: true, width: "110px" },
      { key: "Type1", header: "Aircraft Type", sortable: true, width: "180px" },
      
      // Engine Details
      { key: "Engine_Details", header: "Engine Details", sortable: true, width: "140px" },
      { key: "Engine_model", header: "Engine Model", sortable: true, width: "140px" },
      { key: "Engine_serial", header: "Engine Serial", sortable: true, width: "140px" },
      { key: "Total_engine_hours", header: "Total Engine Hours", sortable: true, width: "160px" },
      { key: "Total_hours_since_service", header: "Hours Since Service", sortable: true, width: "170px" },
      
      // Propeller Details
      { key: "Propeller_make", header: "Propeller Make", sortable: true, width: "150px" },
      { key: "Propeller_model", header: "Propeller Model", sortable: true, width: "150px" },
      { key: "Propeller_serial", header: "Propeller Serial", sortable: true, width: "150px" },
      
      // System Fields
      { key: "Created_Time", header: "Created", sortable: true, width: "180px", accessor: (row) => formatDate(row.Created_Time) },
    ],
    Hazard: [
      // Core Identifiers
      { key: "Type", header: "Type", sortable: false, width: "120px", accessor: (row) => getTypeBadge(getFormType(row)) },
      { key: "OccurrenceId", header: "Hazard ID", sortable: true, width: "140px" },
      { key: "Date_Hazard_Identified", header: "Date Identified", sortable: true, width: "180px", accessor: (row) => formatDate(row.Date_Hazard_Identified || row.Occurrence_Date1) },
      
      // Reporter Information
      { key: "Role", header: "Role", sortable: true, width: "150px" },
      { key: "Member_Number", header: "Member #", sortable: true, width: "110px" },
      { key: "Name1", header: "First Name", sortable: true, width: "120px" },
      { key: "Last_Name", header: "Last Name", sortable: true, width: "120px" },
      { key: "Reporter_Email", header: "Email", sortable: true, width: "180px" },
      { key: "Contact_Phone", header: "Contact Phone", sortable: true, width: "130px" },
      
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
      { key: "Type", header: "Type", sortable: false, width: "120px", accessor: (row) => getTypeBadge(getFormType(row)) },
      { key: "OccurrenceId", header: "Complaint ID", sortable: true, width: "140px" },
      { key: "Occurrence_Date1", header: "Occurrence Date", sortable: true, width: "180px", accessor: (row) => formatDate(row.Occurrence_Date1) },
      
      // Reporter Information
      { key: "Role", header: "Role", sortable: true, width: "150px" },
      { key: "Member_Number", header: "Member #", sortable: true, width: "110px" },
      { key: "Name1", header: "First Name", sortable: true, width: "120px" },
      { key: "Last_Name", header: "Last Name", sortable: true, width: "120px" },
      { key: "Reporter_Email", header: "Email", sortable: true, width: "180px" },
      { key: "Contact_Phone", header: "Contact Phone", sortable: true, width: "130px" },
      
      // Complaint Details
      { key: "Description_of_Occurrence", header: "Complaint Details", sortable: true, width: "400px" },
      
      // System Fields
      { key: "Created_Time", header: "Created", sortable: true, width: "180px", accessor: (row) => formatDate(row.Created_Time) },
    ],
    All: [
      { key: "Type", header: "Type", sortable: false, width: "120px", accessor: (row) => getTypeBadge(getFormType(row)) },
      { key: "OccurrenceId", header: "ID", sortable: true, width: "140px" },
      { key: "Occurrence_Date1", header: "Date", sortable: true, width: "180px", accessor: (row) => formatDate(row.Occurrence_Date1) },
      { key: "Name1", header: "First Name", sortable: true, width: "120px" },
      { key: "Last_Name", header: "Last Name", sortable: true, width: "120px" },
      { key: "Member_Number", header: "Member #", sortable: true, width: "110px" },
      { key: "Role", header: "Role", sortable: true, width: "150px" },
      { key: "Contact_Phone", header: "Contact Phone", sortable: true, width: "130px" },
      { key: "Reporter_Email", header: "Email", sortable: true, width: "180px" },
      { key: "State", header: "State", sortable: true, width: "80px", align: "center" },
      { key: "Location", header: "Location", sortable: true, width: "180px" },
      { key: "Registration_number", header: "Aircraft Rego", sortable: true, width: "120px" },
      { key: "Make1", header: "Make", sortable: true, width: "120px" },
      { key: "Model", header: "Model", sortable: true, width: "120px" },
      { key: "Accident_or_Incident", header: "Accident/Incident", sortable: true, width: "140px" },
      { key: "Damage_to_aircraft", header: "Damage", sortable: true, width: "120px" },
      { key: "Description_of_Occurrence", header: "Description", sortable: true, width: "300px" },
      { key: "Defective_component", header: "Defective Component", sortable: true, width: "180px" },
      { key: "Level", header: "Classification", sortable: true, width: "130px" },
      { key: "Occurence_Status", header: "Status", sortable: true, width: "120px" },
      { key: "ATSB_reportable_status", header: "ATSB Status", sortable: true, width: "120px" },
      { key: "Created_Time", header: "Created", sortable: true, width: "180px", accessor: (row) => formatDate(row.Created_Time) },
      { key: "Modified_Time", header: "Modified", sortable: true, width: "180px", accessor: (row) => formatDate(row.Modified_Time) },
    ],
  }), []);

  // Determine which columns to show based on filter
  const currentColumns = useMemo(() => {
    if (!occurrenceType) return columnSets.All;
    if (columnSets[occurrenceType]) return columnSets[occurrenceType];
    return columnSets.All;
  }, [occurrenceType, columnSets]);

  // Initialize column visibility when columns change
  useEffect(() => {
    if (currentColumns.length > 0) {
      setColumnVisibility(prev => {
        const updated: ColumnVisibility = {};
        currentColumns.forEach((col) => {
          // Keep previous visibility state if exists, otherwise default to true
          updated[col.key] = prev[col.key] !== undefined ? prev[col.key] : true;
        });
        return updated;
      });
    }
  }, [currentColumns]);

  // Filter columns based on visibility
  const visibleColumns = currentColumns.filter(col => columnVisibility[col.key]);

  // Filter columns based on search query
  const filteredColumnList = useMemo(() => {
    if (!columnSearchQuery.trim()) return currentColumns;
    const query = columnSearchQuery.toLowerCase();
    return currentColumns.filter(col => 
      col.header.toLowerCase().includes(query) || 
      col.key.toLowerCase().includes(query)
    );
  }, [currentColumns, columnSearchQuery]);

  const toggleColumnVisibility = (columnKey: string) => {
    setColumnVisibility(prev => ({ ...prev, [columnKey]: !prev[columnKey] }));
  };

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
              <option value="Accident">Accident</option>
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

            {/* Column Selector */}
            <div className="relative mb-2.5" ref={columnSelectorRef}>
              <Button
                onClick={() => {
                  setShowColumnSelector(!showColumnSelector);
                  setColumnSearchQuery(""); // Reset search when opening
                }}
                variant="outline"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Columns ({visibleColumns.length}/{currentColumns.length})
              </Button>
              {showColumnSelector && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4" onClick={() => setShowColumnSelector(false)}>
                  <div 
                    className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[80vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-lg flex-shrink-0">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-slate-900 text-lg">Manage Columns</h3>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {visibleColumns.length} of {currentColumns.length} columns visible
                          </p>
                        </div>
                        <button
                          onClick={() => setShowColumnSelector(false)}
                          className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-200"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Search Input */}
                      <div className="relative">
                        <svg 
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          placeholder="Search columns..."
                          value={columnSearchQuery}
                          onChange={(e) => setColumnSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                        />
                        {columnSearchQuery && (
                          <button
                            onClick={() => setColumnSearchQuery("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            const updated: ColumnVisibility = {};
                            currentColumns.forEach(col => { updated[col.key] = true; });
                            setColumnVisibility(updated);
                          }}
                          className="text-xs px-3 py-1.5 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => {
                            const updated: ColumnVisibility = {};
                            currentColumns.forEach(col => { updated[col.key] = false; });
                            setColumnVisibility(updated);
                          }}
                          className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    {/* Column List */}
                    <div className="p-4 overflow-y-auto flex-1">
                      {filteredColumnList.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <svg className="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm">No columns found matching &quot;{columnSearchQuery}&quot;</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {filteredColumnList.map((column) => (
                            <label
                              key={column.key}
                              className="flex items-start px-3 py-2.5 hover:bg-slate-50 rounded-md cursor-pointer transition-colors group border border-transparent hover:border-slate-200"
                            >
                              <input
                                type="checkbox"
                                checked={columnVisibility[column.key]}
                                onChange={() => toggleColumnVisibility(column.key)}
                                className="mr-3 mt-0.5 h-4 w-4 text-slate-600 border-slate-300 rounded focus:ring-2 focus:ring-slate-500 focus:ring-offset-0 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm text-slate-700 group-hover:text-slate-900 font-medium block">
                                  {column.header}
                                </span>
                                <span className="text-xs text-slate-500 block mt-0.5 truncate">
                                  {column.key}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 rounded-b-lg flex-shrink-0 flex justify-between items-center">
                      <span className="text-xs text-slate-600">
                        {columnSearchQuery && `${filteredColumnList.length} results • `}
                        {visibleColumns.length} visible
                      </span>
                      <Button
                        onClick={() => setShowColumnSelector(false)}
                        variant="primary"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

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

        {/* Table with Synchronized Top and Bottom Scrollbars */}
        <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
          {/* Top Scrollbar - Provides horizontal scroll without going to bottom */}
          <div className="relative bg-slate-50 border-b border-slate-200">
            <div 
              ref={topScrollRef}
              className="overflow-x-auto overflow-y-hidden"
              style={{ height: '17px' }}
            >
              <div style={{ 
                width: visibleColumns.length > 0 
                  ? `${visibleColumns.reduce((acc, col) => acc + parseInt(col.width || '150'), 0)}px` 
                  : '100%',
                height: '1px' 
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
              columns={visibleColumns}
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
      </div>
    </div>
  );
}
