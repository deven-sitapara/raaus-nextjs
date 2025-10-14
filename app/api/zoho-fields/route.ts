import { NextRequest, NextResponse } from "next/server";
import { ZohoAuth } from "@/lib/zoho/auth";
import axios from "axios";

/**
 * GET endpoint to fetch recent records from Zoho CRM and list their fields
 * This helps verify the exact field names (api_name) used in actual records
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const module = searchParams.get("module") || "Occurrences";
    const perPage = parseInt(searchParams.get("perPage") || "5");
    
    const accessToken = await ZohoAuth.getAccessToken("crm");
    const apiDomain = process.env.ZOHO_CRM_API_DOMAIN || "https://www.zohoapis.com.au";

    console.log(`Fetching recent records from module: ${module}`);

    const response = await axios.get(
      `${apiDomain}/crm/v2/${module}`,
      {
        params: {
          per_page: perPage,
          sort_order: "desc",
          sort_by: "Created_Time",
        },
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
      }
    );

    const records = response.data.data || [];
    
    if (records.length === 0) {
      return NextResponse.json({
        success: true,
        module,
        total_records: 0,
        message: "No records found in this module",
        fields: [],
      });
    }

    // Extract field names from the first record
    const firstRecord = records[0];
    const fieldNames = Object.keys(firstRecord).sort();
    
    // Get fields that appear in our architect's mapping
    const architectFields = [
      "Date_5",
      "Occurrence_Date2",
      "Maintainer_Name",
      "Maintainer_Last_Name",
      "Reporter_Suggestions",
      "Make1",
      "Level_2_Maintainer_L2",
      "In_vicinity_of_aerodrome",
      "Y_Code",
      "Lookup_5",
      "Bird_or_animal_activity",
      "Was_the_pilot_warned_of_birds_or_animals",
    ];

    const presentArchitectFields = architectFields.filter(field => 
      fieldNames.includes(field)
    );
    
    const missingArchitectFields = architectFields.filter(field => 
      !fieldNames.includes(field)
    );

    console.log(`Found ${records.length} records with ${fieldNames.length} fields each`);
    console.log(`Architect fields present: ${presentArchitectFields.length}/${architectFields.length}`);

    return NextResponse.json({
      success: true,
      module,
      total_records: records.length,
      total_fields: fieldNames.length,
      all_fields: fieldNames,
      architect_fields: {
        present: presentArchitectFields,
        missing: missingArchitectFields,
        total: architectFields.length,
      },
      sample_record: firstRecord,
    });
  } catch (error: any) {
    console.error("Failed to fetch Zoho CRM records:", error);
    
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", JSON.stringify(error.response.data, null, 2));
    }

    return NextResponse.json(
      { 
        success: false,
        error: "Failed to fetch Zoho CRM records",
        message: error.message,
        details: error.response?.data
      },
      { status: 500 }
    );
  }
}
