import axios from "axios";
import { ZohoAuthResponse } from "@/types/forms";

export class ZohoAuth {
  private static accessToken: string | null = null;
  private static tokenExpiry: number = 0;

  private static getAccountsUrl(): string {
    // Extract region from API domain (e.g., https://www.zohoapis.com.au -> com.au)
    const apiDomain = process.env.ZOHO_CRM_API_DOMAIN || "https://www.zohoapis.com.au";
    const regionMatch = apiDomain.match(/\.zohoapis\.(com(?:\.\w+)?)/);
    const region = regionMatch ? regionMatch[1] : "com";
    return `https://accounts.zoho.${region}/oauth/v2/token`;
  }

  static async getAccessToken(service: "crm" | "workdrive"): Promise<string> {
    // Check if we have a valid cached token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

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
      throw new Error("Zoho credentials not configured");
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

      return this.accessToken;
    } catch (error: any) {
      console.error("Failed to get Zoho access token:", error);
      if (error.response) {
        console.error("Auth response data:", error.response.data);
        console.error("Auth response status:", error.response.status);
      }
      throw new Error("Failed to authenticate with Zoho");
    }
  }

  static clearToken() {
    this.accessToken = null;
    this.tokenExpiry = 0;
  }
}
