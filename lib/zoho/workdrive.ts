import axios from "axios";
import { ZohoAuth } from "./auth";
import { ZohoWorkDriveUploadResponse } from "@/types/forms";

export class ZohoWorkDrive {
  private static apiDomain = process.env.ZOHO_CRM_API_DOMAIN || "https://www.zohoapis.com.au";

  /**
   * Upload files to Zoho WorkDrive
   */
  static async uploadFiles(files: File[]): Promise<string[]> {
    const accessToken = await ZohoAuth.getAccessToken("workdrive");
    const folderId = process.env.ZOHO_WORKDRIVE_FOLDER_ID;

    if (!folderId) {
      throw new Error("Zoho WorkDrive folder ID not configured");
    }

    const uploadedFileIds: string[] = [];

    for (const file of files) {
      try {
        // Generate unique filename with timestamp to avoid conflicts
        const timestamp = Date.now();
        const fileExt = file.name.substring(file.name.lastIndexOf('.'));
        const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
        const uniqueFilename = `${baseName}_${timestamp}${fileExt}`;

        const formData = new FormData();
        formData.append("content", file);
        formData.append("parent_id", folderId);
        formData.append("filename", uniqueFilename);

        const response = await axios.post<ZohoWorkDriveUploadResponse>(
          `${this.apiDomain}/workdrive/api/v1/upload`,
          formData,
          {
            headers: {
              Authorization: `Zoho-oauthtoken ${accessToken}`,
            },
          }
        );

        if (response.data.data && response.data.data.length > 0) {
          uploadedFileIds.push(response.data.data[0].id);
        }
      } catch (error: any) {
        console.error(`Failed to upload file ${file.name}:`, error);
        if (error.response) {
          console.error("Upload response data:", error.response.data);
          console.error("Upload response status:", error.response.status);
        }
        throw new Error(`Failed to upload ${file.name}`);
      }
    }

    return uploadedFileIds;
  }

  /**
   * Get shareable link for uploaded files
   */
  static async getShareableLinks(fileIds: string[]): Promise<string[]> {
    const accessToken = await ZohoAuth.getAccessToken("workdrive");
    const links: string[] = [];

    for (const fileId of fileIds) {
      try {
        const response = await axios.post(
          `${this.apiDomain}/workdrive/api/v1/files/${fileId}/share`,
          {
            permissions: { type: "user", role: "view" },
          },
          {
            headers: {
              Authorization: `Zoho-oauthtoken ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.data?.link) {
          links.push(response.data.data.link);
        }
      } catch (error) {
        console.error(`Failed to get shareable link for file ${fileId}:`, error);
      }
    }

    return links;
  }
}
