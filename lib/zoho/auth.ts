import axios from "axios";
import { ZohoAuthResponse } from "@/types/forms";

export class ZohoAuth {
  private static accessToken: string | null = null;
  private static tokenExpiry: number = 0;

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
      const response = await axios.post<ZohoAuthResponse>(
        "https://accounts.zoho.com/oauth/v2/token",
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
    } catch (error) {
      console.error("Failed to get Zoho access token:", error);
      throw new Error("Failed to authenticate with Zoho");
    }
  }

  static clearToken() {
    this.accessToken = null;
    this.tokenExpiry = 0;
  }
}
