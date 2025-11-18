import { NextRequest, NextResponse } from "next/server";
import { ZohoAuth } from "@/lib/zoho/auth";
import axios from "axios";

const API_DOMAIN = process.env.ZOHO_CRM_API_DOMAIN || "https://www.zohoapis.com.au";

export async function POST(request: NextRequest) {
  try {
    const { aircraftConcat } = await request.json();

    if (!aircraftConcat) {
      return NextResponse.json(
        {
          success: false,
          error: "Aircraft registration is required",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Get Zoho access token
    const accessToken = await ZohoAuth.getAccessToken("crm");
    if (!accessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to get Zoho access token",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }

    const headers = {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    };

    // Search for aircraft by Aircraft_Concat
    const aircraftResponse = await axios.get(
      `${API_DOMAIN}/crm/v2.2/Aircraft/search`,
      {
        params: {
          criteria: `(Aircraft_Concat:equals:${aircraftConcat})`,
        },
        headers,
        timeout: 30000,
      }
    );

    if (!aircraftResponse.data.data || aircraftResponse.data.data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: `No aircraft found with registration ${aircraftConcat}`,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const aircraftData = aircraftResponse.data.data[0];
    const aircraftId = aircraftData.id;

    // Fetch engine data
    let engineData = null;
    try {
      const engineResponse = await axios.get(
        `${API_DOMAIN}/crm/v2.2/Engines/search`,
        {
          params: {
            criteria: `(Aircraft:equals:${aircraftId})`,
          },
          headers,
          timeout: 30000,
        }
      );

      if (engineResponse.data.data && engineResponse.data.data.length > 0) {
        engineData = engineResponse.data.data[0];
      }
    } catch (engineError) {
      console.error(`[AIRCRAFT LOOKUP] Engine lookup error:`, engineError);
    }

    // Fetch propeller data
    let propellerData = null;
    try {
      // Try multiple search criteria for propellers - based on screenshot, use Aircraft Concat first
      const propellerCriteria = [
        `(Aircraft_Concat:equals:${aircraftConcat})`,
        `(Aircraft:equals:${aircraftId})`,
        `(Aircraft_ID:equals:${aircraftId})`,
        `(Aircraft_Name:equals:${aircraftData.Name})`,
        `(Registration:equals:${aircraftConcat})`
      ];

      for (const criteria of propellerCriteria) {
        const propellerResponse = await axios.get(
          `${API_DOMAIN}/crm/v2.2/Propellers/search`,
          {
            params: { criteria },
            headers,
            timeout: 30000,
          }
        );

        if (propellerResponse.data.data && propellerResponse.data.data.length > 0) {
          propellerData = propellerResponse.data.data[0];
          break;
        }
      }
    } catch (propellerError) {
      console.error(`[AIRCRAFT LOOKUP] Propeller lookup error:`, propellerError);
    }

    // Helper function to get value or empty string
    const getValue = (obj: any, key: string): string => {
      const value = obj?.[key];
      return value === null || value === undefined ? "" : String(value);
    };

    // Combine all data
    const combinedData = {
      // Aircraft basic information
      Serial_Number1: getValue(aircraftData, "Serial_Number1"),
      Model: getValue(aircraftData, "Model"),
      Registration_Type: getValue(aircraftData, "Registration_Type"),
      Manufacturer: getValue(aircraftData, "Manufacturer"),
      Aircraft_Concat: getValue(aircraftData, "Aircraft_Concat"),
      Type: getValue(aircraftData, "Type"),
      Year_Built: getValue(aircraftData, "Year_Built1") || getValue(aircraftData, "Manufacturer_Date"),

      // Additional aircraft fields
      Registration_status: getValue(aircraftData, "Registration_Type"),
      Aircraft_Type: getValue(aircraftData, "Type"),
      Registration_Group: getValue(aircraftData, "Registration_Group"),

      // Engine information
      Engine_Details: engineData ? getValue(engineData, "Engines_Type") || getValue(engineData, "Engine_Make") : "",
      Engine_model: engineData ? getValue(engineData, "Engines_Model") || getValue(engineData, "Engine_Model") : "",
      Engines_Serial: engineData ? getValue(engineData, "Engines_Serial") || getValue(engineData, "Engine_Serial") : "",

      // Propeller information - try multiple field name variations
      Propeller_make: propellerData ? (
        getValue(propellerData, "Propellers_Make") ||
        getValue(propellerData, "Propeller_Make") ||
        getValue(propellerData, "Make") ||
        getValue(propellerData, "Manufacturer")
      ) : "",
      Propeller_model: propellerData ? (
        getValue(propellerData, "Propellers_Model") ||
        getValue(propellerData, "Propeller_Model") ||
        getValue(propellerData, "Model") ||
        getValue(propellerData, "Type")
      ) : "",
      Propeller_serial: propellerData ? (
        getValue(propellerData, "Propellers_Serial") ||
        getValue(propellerData, "Propeller_Serial") ||
        getValue(propellerData, "Serial_Number") ||
        getValue(propellerData, "Serial")
      ) : "",

      // Metadata
      aircraft_id: aircraftId,
      engine_found: !!engineData,
      propeller_found: !!propellerData,
    };

    return NextResponse.json({
      success: true,
      message: `Aircraft data found for ${aircraftConcat}`,
      data: combinedData,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("[AIRCRAFT LOOKUP] Error:", error.message || error);

    // Handle timeout errors
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return NextResponse.json(
        {
          success: false,
          error: "Request timeout - unable to reach Zoho CRM. Please try again.",
          timestamp: new Date().toISOString(),
        },
        { status: 504 }
      );
    }

    // Handle Zoho API specific errors
    if (error.response?.status === 401) {
      return NextResponse.json(
        {
          success: false,
          error: "Zoho API authentication failed",
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }

    if (error.response?.status === 404) {
      return NextResponse.json(
        {
          success: false,
          error: "Aircraft not found in CRM",
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to lookup aircraft data",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}