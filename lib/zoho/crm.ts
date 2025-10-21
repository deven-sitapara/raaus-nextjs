import axios from "axios";
import { ZohoAuth } from "./auth";
import { ZohoCRMResponse } from "@/types/forms";

export class ZohoCRM {
  private static apiDomain = process.env.ZOHO_CRM_API_DOMAIN || "https://www.zohoapis.com.au";

  /**
   * Submit a record to Zoho CRM
   */
  static async createRecord(module: string, data: any): Promise<ZohoCRMResponse> {
    const accessToken = await ZohoAuth.getAccessToken("crm");

    // Log the exact payload being sent
    console.log(`Creating CRM record in module: ${module}`);
    console.log(`Payload field count: ${Object.keys(data).length}`);
    console.log("Full payload being sent to Zoho:", JSON.stringify({data: [data]}, null, 2));

    try {
      const response = await axios.post<ZohoCRMResponse>(
        `${this.apiDomain}/crm/v2/${module}`,
        {
          data: [data],
        },
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("CRM response received:", JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error("Failed to create CRM record - Full error:", error);
      
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
        console.error("Full response data:", JSON.stringify(error.response.data, null, 2));
        
        // Extract specific error message from Zoho CRM response
        if (error.response.data && error.response.data.data && error.response.data.data.length > 0) {
          const errorData = error.response.data.data[0];
          const errorCode = errorData.code || 'UNKNOWN_ERROR';
          const errorMessage = errorData.message || 'No error message provided';
          const errorDetails = errorData.details || {};
          
          // Log the problematic field if available
          if (errorDetails.api_name || errorDetails.field_name) {
            console.error(`Problematic field: ${errorDetails.api_name || errorDetails.field_name}`);
            console.error(`Expected data type: ${errorDetails.expected_data_type || 'unknown'}`);
            console.error(`Received value: ${errorDetails.value || 'unknown'}`);
          }
          
          throw new Error(`CRM API error: ${errorCode} - ${errorMessage}\nField: ${errorDetails.api_name || errorDetails.field_name || 'unknown'}\nExpected: ${errorDetails.expected_data_type || 'unknown'}\nError details: ${JSON.stringify(errorDetails, null, 2)}`);
        }
      } else if (error.request) {
        console.error("No response received:", error.request);
        throw new Error(`No response from Zoho CRM API: ${error.message}`);
      } else {
        console.error("Request setup error:", error.message);
        throw new Error(`Request error: ${error.message}`);
      }
      
      throw new Error(`Failed to submit to Zoho CRM: ${error.message}`);
    }
  }

  /**
   * Update a record in Zoho CRM
   */
  static async updateRecord(module: string, recordId: string, data: any): Promise<ZohoCRMResponse> {
    const accessToken = await ZohoAuth.getAccessToken("crm");

    console.log(`Updating CRM record ${recordId} in module: ${module}`);
    console.log("Update payload:", JSON.stringify({data: [data]}, null, 2));

    try {
      const response = await axios.put<ZohoCRMResponse>(
        `${this.apiDomain}/crm/v2/${module}/${recordId}`,
        {
          data: [data],
        },
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("CRM update response:", JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error: any) {
      console.error("Failed to update CRM record:", error);
      
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", JSON.stringify(error.response.data, null, 2));
        
        if (error.response.data && error.response.data.data && error.response.data.data.length > 0) {
          const errorData = error.response.data.data[0];
          const errorCode = errorData.code || 'UNKNOWN_ERROR';
          const errorMessage = errorData.message || 'No error message provided';
          
          throw new Error(`CRM API update error: ${errorCode} - ${errorMessage}`);
        }
      }
      
      throw new Error(`Failed to update Zoho CRM record: ${error.message}`);
    }
  }

  /**
   * Fetch OccurrenceId from a CRM record with retry logic
   * This is needed because OccurrenceId is populated server-side after record creation
   */
  static async fetchOccurrenceId(
    module: string, 
    recordId: string, 
    retries: number = 5, 
    sleepMs: number = 2000
  ): Promise<string | null> {
    const accessToken = await ZohoAuth.getAccessToken("crm");

    for (let i = 0; i <= retries; i++) {
      try {
        const response = await axios.get(
          `${this.apiDomain}/crm/v2/${module}/${recordId}?fields=OccurrenceId`,
          {
            headers: {
              Authorization: `Zoho-oauthtoken ${accessToken}`,
            },
          }
        );

        const occurrenceId = response.data.data?.[0]?.OccurrenceId;
        if (occurrenceId && occurrenceId.trim()) {
          console.log(`OccurrenceId fetched: ${occurrenceId}`);
          return occurrenceId.trim();
        }

        if (i < retries) {
          console.log(`OccurrenceId not yet populated, retrying in ${sleepMs}ms... (attempt ${i + 1}/${retries})`);
          await this.sleep(sleepMs);
        }
      } catch (error: any) {
        console.error(`Failed to fetch OccurrenceId (attempt ${i + 1}):`, error);
        if (i < retries) {
          await this.sleep(sleepMs);
        }
      }
    }

    console.error(`OccurrenceId not found after ${retries} retries for record ${recordId}`);
    return null;
  }

  /**
   * Helper function to sleep/delay execution
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate member number against CRM records
   */
  static async validateMemberNumber(
    memberNumber: string,
    firstName: string,
    lastName: string
  ): Promise<{ valid: boolean; warning?: string }> {
    const accessToken = await ZohoAuth.getAccessToken("crm");

    try {
      console.log(`🔍 Validating member: ${memberNumber} - ${firstName} ${lastName}`);

      // Try different search criteria formats
      const searchCriteria = [
        `(Member_Number:equals:${memberNumber})`,
        `Member_Number:equals:${memberNumber}`,
        `((Member_Number:equals:${memberNumber}))`,
        `(Member_Number:equals:"${memberNumber}")`
      ];

      let response;
      let lastError;

      for (const criteria of searchCriteria) {
        try {
          console.log(`Trying search criteria: ${criteria}`);
          response = await axios.get(
            `${this.apiDomain}/crm/v2/Contacts/search`,
            {
              params: {
                criteria: criteria,
              },
              headers: {
                Authorization: `Zoho-oauthtoken ${accessToken}`,
              },
              timeout: 10000, // 10 second timeout
            }
          );

          // If we get a successful response, break out of the loop
          if (response.status === 200) {
            break;
          }
        } catch (error: any) {
          lastError = error;
          console.log(`Search criteria "${criteria}" failed:`, error.response?.status, error.response?.data?.message);
          continue;
        }
      }

      if (!response) {
        throw lastError || new Error("All search criteria failed");
      }

      console.log(`Search response:`, response.data);

      if (!response.data.data || response.data.data.length === 0) {
        return {
          valid: false,
          warning: `No member found with Member Number ${memberNumber}`,
        };
      }

      const member = response.data.data[0];
      console.log(`Found member:`, member);

      // Check if names match (case-insensitive and flexible)
      const crmFirstName = member.First_Name || member.Name1 || '';
      const crmLastName = member.Last_Name || '';
      const crmFullName = member.Full_Name || '';

      // Create full name from provided input
      const providedFullName = `${firstName} ${lastName}`.trim();
      const providedFullNameReversed = `${lastName} ${firstName}`.trim();

      // Check multiple matching strategies
      let nameMatches = false;

      // Strategy 1: Exact match of separate fields
      const firstNameMatch = crmFirstName.toLowerCase() === firstName.toLowerCase();
      const lastNameMatch = crmLastName.toLowerCase() === lastName.toLowerCase();

      // Strategy 2: Reversed match (user entered first/last swapped)
      const firstNameReversedMatch = crmFirstName.toLowerCase() === lastName.toLowerCase();
      const lastNameReversedMatch = crmLastName.toLowerCase() === firstName.toLowerCase();

      // Strategy 3: Full name match (CRM full name vs provided full name)
      const fullNameMatch = crmFullName.toLowerCase() === providedFullName.toLowerCase();
      const fullNameReversedMatch = crmFullName.toLowerCase() === providedFullNameReversed.toLowerCase();

      // Strategy 4: Flexible matching - check if provided names are contained in CRM names
      const crmFullNameCombined = `${crmFirstName} ${crmLastName}`.trim().toLowerCase();
      const flexibleMatch = crmFullNameCombined === providedFullName.toLowerCase() ||
                           crmFullName.toLowerCase() === providedFullName.toLowerCase();

      if (firstNameMatch && lastNameMatch) {
        nameMatches = true;
      } else if (firstNameReversedMatch && lastNameReversedMatch) {
        nameMatches = true;
      } else if (fullNameMatch) {
        nameMatches = true;
      } else if (fullNameReversedMatch) {
        nameMatches = true;
      } else if (flexibleMatch) {
        nameMatches = true;
      }

      console.log(`Name comparison:`, {
        provided: providedFullName,
        providedReversed: providedFullNameReversed,
        crm: {
          separate: `${crmFirstName} ${crmLastName}`,
          full: crmFullName,
          combined: crmFullNameCombined
        },
        matches: {
          separate: firstNameMatch && lastNameMatch,
          reversed: firstNameReversedMatch && lastNameReversedMatch,
          full: fullNameMatch,
          fullReversed: fullNameReversedMatch,
          flexible: flexibleMatch,
          overall: nameMatches
        }
      });

      if (!nameMatches) {
        return {
          valid: false,
          warning: `Member Number ${memberNumber} does not match the provided name.`,
        };
      }

      return { valid: true };
    } catch (error: any) {
      console.error("Failed to validate member number:", error);
      
      // Check if it's a specific API error
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;
        
        // If it's a 400 Bad Request with INVALID_QUERY, the field might not exist
        if (status === 400 && errorData?.code === 'INVALID_QUERY') {
          console.error("Invalid search query - field may not exist:", errorData);
          return {
            valid: false,
            warning: `Unable to validate member number - system configuration issue`,
          };
        }
        
        // If it's a 404, module might not exist
        if (status === 404) {
          console.error("Contacts module not found:", errorData);
          return {
            valid: false,
            warning: `Unable to validate member number - module not found`,
          };
        }
      }
      
      // For other errors, don't block submission but log the issue
      console.error("Member validation failed with error:", error.message);
      return {
        valid: false,
        warning: `Unable to validate member number at this time. Please proceed with submission.`,
      };
    }
  }
}
