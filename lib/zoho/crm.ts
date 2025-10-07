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

      return response.data;
    } catch (error: any) {
      console.error("Failed to create CRM record:", error);
      if (error.response) {
        console.error("Response data:", JSON.stringify(error.response.data, null, 2));
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
        
        // Extract specific error message from Zoho CRM response
        if (error.response.data && error.response.data.data && error.response.data.data.length > 0) {
          const errorData = error.response.data.data[0];
          const errorCode = errorData.code || 'UNKNOWN_ERROR';
          const errorMessage = errorData.message || 'No error message provided';
          const errorDetails = errorData.details || {};
          
          throw new Error(`CRM API error: ${errorCode} - ${errorMessage}\nError details: ${JSON.stringify(errorDetails)}`);
        }
      }
      throw new Error(`Failed to submit to Zoho CRM: ${error.message}`);
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
      // Search for member by member number
      const response = await axios.get(
        `${this.apiDomain}/crm/v2/Contacts/search`,
        {
          params: {
            criteria: `(Member_Number:equals:${memberNumber})`,
          },
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
          },
        }
      );

      if (!response.data.data || response.data.data.length === 0) {
        return {
          valid: false,
          warning: `No member found with Member Number ${memberNumber}`,
        };
      }

      const member = response.data.data[0];

      // Check if names match
      const firstNameMatch =
        member.First_Name?.toLowerCase() === firstName.toLowerCase();
      const lastNameMatch =
        member.Last_Name?.toLowerCase() === lastName.toLowerCase();

      if (!firstNameMatch || !lastNameMatch) {
        return {
          valid: false,
          warning: `Member Number ${memberNumber} does not match the provided name. Please verify your details.`,
        };
      }

      return { valid: true };
    } catch (error) {
      console.error("Failed to validate member number:", error);
      // Don't block submission on validation errors
      return { valid: true };
    }
  }
}
