import axios from "axios";
import { ZohoAuthResponse } from "@/types/forms";

export class ZohoAuth {
  private static accessToken: string | null = null;
  private static tokenExpiry: number = 0;

  private static getAccountsUrl(): string {
    // Extract region from API domain (e.g., https://www.zohoapis.com.au -> com.au)
    const apiDomain = process.env.ZOHO_CRM_API_DOMAIN || "https://www.zohoapis.com.au";
    const regionMatch = apiDomain.match(/\.zohoapis\.(com(?:\.\w+)?)/);
    const region = regionMatch ? regionMatch[1] : "com.au";
    return `https://accounts.zoho.${region}/oauth/v2/token`;
  }

  /**
   * Get access token using single token approach (like PHP version)
   * Both CRM and WorkDrive use the same token with combined scopes
   */
  static async getAccessToken(service: "crm" | "workdrive"): Promise<string> {
    // Check if we have a valid cached token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // Use single token approach - same credentials for both services
    // The refresh token should have scopes for both CRM and WorkDrive
    const clientId = process.env.ZOHO_CLIENT_ID;
    const clientSecret = process.env.ZOHO_CLIENT_SECRET;
    const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

    // Fallback to service-specific credentials if single token not configured
    if (!clientId || !clientSecret || !refreshToken) {
      return this.getServiceSpecificToken(service);
    }

    try {
      const accountsUrl = this.getAccountsUrl();
      const response = await axios.post<ZohoAuthResponse>(
        accountsUrl,
        null,
        {
          params: {
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
          },
        }
      );

      this.accessToken = response.data.access_token;
      // Set expiry to 5 minutes before actual expiry
      this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;

      console.log(`Zoho token obtained for ${service} using single token approach`);
      return this.accessToken;
    } catch (error: any) {
      console.error("Failed to get Zoho access token (single approach):", error);
      
      // Fallback to service-specific approach
      console.log("Falling back to service-specific token approach...");
      return this.getServiceSpecificToken(service);
    }
  }

  /**
   * Fallback method for service-specific tokens (backward compatibility)
   */
  private static async getServiceSpecificToken(service: "crm" | "workdrive"): Promise<string> {
    // Get credentials from environment
    const clientId =
      service === "crm"
        ? process.env.ZOHO_CRM_CLIENT_ID
        : process.env.ZOHO_WORKDRIVE_CLIENT_ID;
    const clientSecret =
      service === "crm"
        ? process.env.ZOHO_CRM_CLIENT_SECRET
        : process.env.ZOHO_WORKDRIVE_CLIENT_SECRET;
    const refreshToken =
      service === "crm"
        ? process.env.ZOHO_CRM_REFRESH_TOKEN
        : process.env.ZOHO_WORKDRIVE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error(`Zoho ${service} credentials not configured`);
    }

    try {
      const accountsUrl = this.getAccountsUrl();
      const response = await axios.post<ZohoAuthResponse>(
        accountsUrl,
        null,
        {
          params: {
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "refresh_token",
          },
        }
      );

      console.log(`Zoho token obtained for ${service} using service-specific approach`);
      return response.data.access_token;
    } catch (error: any) {
      console.error(`Failed to get Zoho access token for ${service}:`, error);
      if (error.response) {
        console.error("Auth response data:", error.response.data);
        console.error("Auth response status:", error.response.status);
      }
      throw new Error(`Failed to authenticate with Zoho ${service}`);
    }
  }

  static clearToken() {
    this.accessToken = null;
    this.tokenExpiry = 0;
  }
}
