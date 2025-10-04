import axios from "axios";
import { ZohoAuth } from "./auth";
import { ZohoCRMResponse } from "@/types/forms";

export class ZohoCRM {
  private static apiDomain = process.env.ZOHO_CRM_API_DOMAIN || "https://www.zohoapis.com";

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
    } catch (error) {
      console.error("Failed to create CRM record:", error);
      throw new Error("Failed to submit to Zoho CRM");
    }
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
