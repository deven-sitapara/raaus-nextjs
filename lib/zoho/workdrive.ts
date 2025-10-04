import axios from "axios";
import { ZohoAuth } from "./auth";
import { ZohoWorkDriveUploadResponse } from "@/types/forms";

export class ZohoWorkDrive {
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
        const formData = new FormData();
        formData.append("content", file);
        formData.append("parent_id", folderId);
        formData.append("filename", file.name);

        const response = await axios.post<ZohoWorkDriveUploadResponse>(
          "https://www.zohoapis.com/workdrive/api/v1/upload",
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
      } catch (error) {
        console.error(`Failed to upload file ${file.name}:`, error);
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
          `https://www.zohoapis.com/workdrive/api/v1/files/${fileId}/share`,
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
