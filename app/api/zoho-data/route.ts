import { NextRequest, NextResponse } from "next/server";
import { ZohoCRM } from "@/lib/zoho/crm";
import { ZohoAuth } from "@/lib/zoho/auth";
import axios from "axios";

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("per_page") || "10");
    const searchQuery = searchParams.get("search") || "";
    const typeFilter = searchParams.get("type") || "";
    
    // Get access token
    const accessToken = await ZohoAuth.getAccessToken("crm");
    
    const apiDomain = process.env.ZOHO_CRM_API_DOMAIN || "https://www.zohoapis.com.au";
    
    // Build API URL with pagination
    let url = `${apiDomain}/crm/v2/Occurrence_Management?page=${page}&per_page=${perPage}`;
    
    // Build criteria for search and/or type filter
    const criteriaArray: string[] = [];
    
    // Always filter to only show records where Display_on_Website is true
    criteriaArray.push(`(Display_on_Website:equals:true)`);
    
    if (searchQuery) {
      // Search in multiple fields
      criteriaArray.push(`((Name1:contains:${searchQuery})or(Last_Name:contains:${searchQuery})or(OccurrenceId:contains:${searchQuery})or(Registration_number:contains:${searchQuery})or(Location:contains:${searchQuery}))`);
    }
    
    if (typeFilter) {
      // Filter by form type using Boolean fields
      // Each form type has a corresponding Boolean field in Zoho CRM
      criteriaArray.push(`(${typeFilter}:equals:true)`);
    }
    
    // If we have any criteria, use search endpoint
    if (criteriaArray.length > 0) {
      const criteria = criteriaArray.join("and");
      url = `${apiDomain}/crm/v2/Occurrence_Management/search?criteria=${encodeURIComponent(criteria)}&page=${page}&per_page=${perPage}`;
    }
    
    const response = await axios.get(url, {
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
      },
    });
    
    const records = response.data.data || [];
    const info = response.data.info || {};
    
    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        page,
        perPage,
        total: info.count || records.length,
        moreRecords: info.more_records || false,
      },
    });
  } catch (error: any) {
    console.error("Error fetching Zoho data:", error);
    
    // Fallback to mock data if Zoho fails
    return getFallbackMockData(request);
  }
}

// Fallback mock data for development/testing
function getFallbackMockData(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("per_page") || "10");
  const typeFilter = searchParams.get("type") || "";
  
  const mockOccurrenceData = [
  {
    id: "5678901234567890123",
    Occurrence_ID: "OCC-2024-001",
    Name1: "John",
    Last_Name: "Smith",
    Role: "Pilot in Command",
    Member_Number: "123456",
    Occurrence_Date1: "2024-10-05T14:30:00",
    State: "NSW",
    Location: "Bankstown Airport",
    Occurrence_Type: "Accident",
    Accident_or_Incident: "Accident",
    Damage_to_aircraft: "Minor",
    Most_serious_injury_to_pilot: "Nil",
    Passenger_injury: "Nil",
    Persons_on_the_ground_injury: "Nil",
    Registration_number: "24-1234",
    Make1: "Jabiru",
    Model: "J230",
    ATSB_reportable_status: "Yes",
    Created_Time: "2024-10-05T15:00:00",
    Display_on_Website: true,
    Public_Outcome1: "Investigation completed. The incident was caused by pilot error during landing. Corrective actions have been implemented including additional training for the pilot.",
    Accident: true,
    Defect: false,
    Hazard: false,
    Complaint: false,
  },
  {
    id: "5678901234567890124",
    Occurrence_ID: "OCC-2024-002",
    Name1: "Sarah",
    Last_Name: "Johnson",
    Role: "Pilot in Command",
    Member_Number: "234567",
    Occurrence_Date1: "2024-09-28T10:15:00",
    State: "VIC",
    Location: "Moorabbin Airport",
    Occurrence_Type: "Accident",
    Accident_or_Incident: "Incident",
    Damage_to_aircraft: "Nil",
    Most_serious_injury_to_pilot: "Nil",
    Passenger_injury: "Nil",
    Persons_on_the_ground_injury: "Nil",
    Registration_number: "10-5678",
    Make1: "Tecnam",
    Model: "P92",
    ATSB_reportable_status: "No",
    Created_Time: "2024-09-28T11:30:00",
    Display_on_Website: true,
    Public_Outcome1: "Minor incident during taxiing. Aircraft struck a runway marker due to poor visibility conditions. No injuries reported. Pilot has been advised on improved situational awareness techniques.",
    Accident: true,
    Defect: false,
    Hazard: false,
    Complaint: false,
  },
  {
    id: "5678901234567890125",
    Occurrence_ID: "DEF-2024-001",
    Name1: "Michael",
    Last_Name: "Chen",
    Role: "Maintainer",
    Member_Number: "345678",
    Occurrence_Date1: "2024-09-15T16:45:00",
    State: "QLD",
    Location: "Archerfield Airport",
    Occurrence_Type: "Defect",
    Accident_or_Incident: "",
    Damage_to_aircraft: "None",
    Most_serious_injury_to_pilot: "N/A",
    Registration_number: "19-9012",
    Make1: "Foxbat",
    Model: "A22LS",
    ATSB_reportable_status: "No",
    Created_Time: "2024-09-15T17:00:00",
    Display_on_Website: true,
    Accident: false,
    Defect: true,
    Hazard: false,
    Complaint: false,
  },
  {
    id: "5678901234567890126",
    Occurrence_ID: "HAZ-2024-001",
    Name1: "Emma",
    Last_Name: "Williams",
    Role: "Member",
    Member_Number: "456789",
    Occurrence_Date1: "2024-08-30T09:20:00",
    State: "WA",
    Location: "Jandakot Airport",
    Occurrence_Type: "Hazard",
    Accident_or_Incident: "",
    Damage_to_aircraft: "N/A",
    Most_serious_injury_to_pilot: "N/A",
    Registration_number: "",
    Make1: "",
    Model: "",
    ATSB_reportable_status: "No",
    Created_Time: "2024-08-30T10:00:00",
    Display_on_Website: false, // This record won't be shown
    Accident: false,
    Defect: false,
    Hazard: true,
    Complaint: false,
  },
  {
    id: "5678901234567890127",
    Occurrence_ID: "COMP-2024-001",
    Name1: "David",
    Last_Name: "Brown",
    Role: "Member",
    Member_Number: "567890",
    Occurrence_Date1: "2024-08-12T13:00:00",
    State: "SA",
    Location: "Parafield Airport",
    Occurrence_Type: "Complaint",
    Accident_or_Incident: "",
    Damage_to_aircraft: "N/A",
    Most_serious_injury_to_pilot: "N/A",
    Registration_number: "",
    Make1: "",
    Model: "",
    ATSB_reportable_status: "No",
    Created_Time: "2024-08-12T14:15:00",
    Display_on_Website: true,
    Accident: false,
    Defect: false,
    Hazard: false,
    Complaint: true,
  },
  {
    id: "5678901234567890128",
    Occurrence_ID: "OCC-2024-006",
    Name1: "Lisa",
    Last_Name: "Taylor",
    Role: "Pilot in Command",
    Member_Number: "678901",
    Occurrence_Date1: "2024-07-25T11:30:00",
    State: "TAS",
    Location: "Cambridge Airport",
    Occurrence_Type: "Accident",
    Accident_or_Incident: "Accident",
    Damage_to_aircraft: "Destroyed",
    Most_serious_injury_to_pilot: "Serious",
    Passenger_injury: "Minor",
    Persons_on_the_ground_injury: "Nil",
    Registration_number: "32-2345",
    Make1: "Rans",
    Model: "S6",
    ATSB_reportable_status: "Yes",
    Created_Time: "2024-07-25T12:00:00",
    Display_on_Website: true,
    Accident: true,
    Defect: false,
    Hazard: false,
    Complaint: false,
  },
  {
    id: "5678901234567890129",
    Occurrence_ID: "DEF-2024-002",
    Name1: "James",
    Last_Name: "Anderson",
    Role: "L2 Maintainer",
    Member_Number: "789012",
    Occurrence_Date1: "2024-07-10T15:45:00",
    State: "ACT",
    Location: "Canberra Airport",
    Occurrence_Type: "Defect",
    Accident_or_Incident: "",
    Damage_to_aircraft: "None",
    Most_serious_injury_to_pilot: "N/A",
    Registration_number: "24-6789",
    Make1: "SportStar",
    Model: "RTC",
    ATSB_reportable_status: "No",
    Created_Time: "2024-07-10T16:30:00",
    Display_on_Website: true,
    Accident: false,
    Defect: true,
    Hazard: false,
    Complaint: false,
  },
  {
    id: "5678901234567890130",
    Occurrence_ID: "OCC-2024-008",
    Name1: "Rachel",
    Last_Name: "Lee",
    Role: "Pilot in Command",
    Member_Number: "890123",
    Occurrence_Date1: "2024-06-18T08:00:00",
    State: "NSW",
    Location: "Camden Airport",
    Occurrence_Type: "Incident",
    Accident_or_Incident: "Incident",
    Damage_to_aircraft: "Minor",
    Most_serious_injury_to_pilot: "Nil",
    Registration_number: "10-1122",
    Make1: "Eurofox",
    Model: "3K",
    ATSB_reportable_status: "No",
    Created_Time: "2024-06-18T09:00:00",
    Display_on_Website: false, // This record won't be shown
    Accident: true,
    Defect: false,
    Hazard: false,
    Complaint: false,
  },
];

  // Filter by type if specified using Boolean fields
  let filteredData = mockOccurrenceData;
  if (typeFilter) {
    filteredData = mockOccurrenceData.filter((item: any) => {
      // Check the Boolean field corresponding to the filter type
      return item[typeFilter] === true;
    });
  }
  
  // Always filter to only show records where Display_on_Website is true
  filteredData = filteredData.filter((item: any) => item.Display_on_Website === true);

  const start = (page - 1) * perPage;
  const end = start + perPage;
  const paginatedData = filteredData.slice(start, end);

  return NextResponse.json({
    success: true,
    data: paginatedData,
    pagination: {
      page,
      perPage,
      total: filteredData.length,
      moreRecords: end < filteredData.length,
    },
  });
}
