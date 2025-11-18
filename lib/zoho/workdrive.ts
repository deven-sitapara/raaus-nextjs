import axios from "axios";
import { ZohoAuth } from "./auth";
import { ZohoWorkDriveUploadResponse } from "@/types/forms";

export class ZohoWorkDrive {
  private static apiDomain = "https://workdrive.zoho.com.au";

  /**
   * Validate and get information about a folder (parent folder validation)
   */
  static async validateFolder(folderId: string): Promise<{
    ok: boolean;
    type: string | null;
    name: string | null;
    error?: string;
  }> {
    const accessToken = await ZohoAuth.getAccessToken("workdrive");

    try {
      // Try as a regular file/folder first
      const response = await axios.get(
        `${this.apiDomain}/api/v1/files/${folderId}`,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            Accept: "application/vnd.api+json",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      const data = response.data.data;
      const attributes = data?.attributes || {};
      const type = attributes.type?.toLowerCase();
      const isFolder = attributes.is_folder === true || type === 'folder';
      const name = attributes.name || attributes.display_attr_name;

      if (type === 'workspace') {
        return { ok: true, type: 'workspace', name };
      }
      if (isFolder || type === 'folder') {
        return { ok: true, type: 'folder', name };
      }
      
      return { ok: false, type, name, error: "Not a folder or workspace" };
    } catch (error: any) {
      // If regular files API fails, try teamfolders API
      try {
        const teamResponse = await axios.get(
          `${this.apiDomain}/api/v1/teamfolders/${folderId}`,
          {
            headers: {
              Authorization: `Zoho-oauthtoken ${accessToken}`,
              Accept: "application/vnd.api+json",
            },
            timeout: 10000, // 10 second timeout
          }
        );

        const data = teamResponse.data.data;
        const name = data?.attributes?.name;
        return { ok: true, type: 'teamfolder', name };
      } catch (teamError: any) {
        console.error("Failed to validate folder:", error);
        return { 
          ok: false, 
          type: null, 
          name: null, 
          error: `Invalid folder ID or access denied: ${folderId}` 
        };
      }
    }
  }

  /**
   * Search for an existing child folder by name
   */
  static async findChildFolder(parentId: string, folderName: string): Promise<string | null> {
    const accessToken = await ZohoAuth.getAccessToken("workdrive");
    const normalizedName = folderName.toLowerCase().trim();

    try {
      let page = 1;
      const perPage = 200;
      const maxPages = 10;

      do {
        const offset = (page - 1) * perPage;
        const response = await axios.get(
          `${this.apiDomain}/api/v1/files/${parentId}/files`,
          {
            params: {
              'page[limit]': perPage,
              'page[offset]': offset,
            },
            headers: {
              Authorization: `Zoho-oauthtoken ${accessToken}`,
              Accept: "application/vnd.api+json",
            },
            timeout: 15000, // 15 second timeout for listing files
          }
        );

        const children = response.data.data || [];
        
        for (const child of children) {
          const attributes = child.attributes || {};
          const childName = (attributes.name || '').toLowerCase().trim();
          const isFolder = attributes.is_folder === true || attributes.type?.toLowerCase() === 'folder';
          
          if (isFolder && childName === normalizedName) {
            return child.id || attributes.resource_id;
          }
        }

        const meta = response.data.meta || {};
        const totalCount = meta.total_count || meta.count || children.length;
        const totalPages = Math.ceil(totalCount / perPage);
        
        page++;
        if (page > totalPages || page > maxPages) break;
        
      } while (true);

      return null;
    } catch (error: any) {
      console.error(`Failed to search for child folder "${folderName}":`, error);
      return null;
    }
  }

  /**
   * Create a new folder in the specified parent
   */
  static async createFolder(parentId: string, folderName: string): Promise<string> {
    const accessToken = await ZohoAuth.getAccessToken("workdrive");

    // Try JSON API first
    try {
      const response = await axios.post(
        `${this.apiDomain}/api/v1/files`,
        {
          data: {
            type: "files",
            attributes: {
              name: folderName,
              parent_id: parentId,
            },
          },
        },
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            "Content-Type": "application/vnd.api+json",
            Accept: "application/vnd.api+json",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      const folderId = response.data.data?.id || 
                      response.data.data?.[0]?.id || 
                      response.data.data?.attributes?.resource_id;
      
      if (folderId) {
        return folderId;
      }
    } catch (jsonError: any) {
      // Fallback to form data approach
    }

    // Fallback to form data approach
    try {
      const formData = new FormData();
      formData.append("name", folderName);
      formData.append("parent_id", parentId);
      formData.append("type", "folder");

      const response = await axios.post(
        `${this.apiDomain}/api/v1/files`,
        formData,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            Accept: "application/vnd.api+json",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      const folderId = response.data.data?.id || 
                      response.data.data?.[0]?.id || 
                      response.data.data?.attributes?.resource_id;
      
      if (folderId) {
        return folderId;
      }
    } catch (formError: any) {
      console.error("Both folder creation methods failed:", formError);
    }

    throw new Error(`Failed to create folder "${folderName}"`);
  }

  /**
   * Ensure a subfolder exists (create if not found)
   */
  static async ensureSubfolder(parentId: string, folderName: string): Promise<string> {
    // Validate that we have a valid folder name (occurrence ID)
    if (!folderName || typeof folderName !== 'string' || folderName.trim().length === 0) {
      throw new Error(`Invalid folder name provided: "${folderName}"`);
    }
    
    // Additional validation for occurrence ID format (should start with OCC)
    const trimmedName = folderName.trim();
    if (!trimmedName.startsWith('OCC') || trimmedName.length < 5) {
      throw new Error(`Invalid occurrence ID format: "${folderName}". Expected format: OCC##### `);
    }
    
    // Sanitize folder name
    const sanitizedName = this.sanitizeFolderName(trimmedName);
    
    // First, validate the parent folder
    const parentValidation = await this.validateFolder(parentId);
    if (!parentValidation.ok) {
      throw new Error(`Parent folder validation failed: ${parentValidation.error}`);
    }

    // Check if folder already exists
    const existingFolderId = await this.findChildFolder(parentId, sanitizedName);
    if (existingFolderId) {
      return existingFolderId;
    }

    // Create new folder
    return await this.createFolder(parentId, sanitizedName);
  }

  /**
   * Sanitize folder name for WorkDrive compatibility
   */
  static sanitizeFolderName(name: string): string {
    if (!name || typeof name !== 'string') return 'Untitled';
    
    // Replace invalid characters with underscores
    let sanitized = name.replace(/[^\w\s\-\.\(\)]/g, '_');
    sanitized = sanitized.trim();
    
    if (!sanitized) sanitized = 'Untitled';
    
    // Limit length
    if (sanitized.length > 200) {
      sanitized = sanitized.substring(0, 200);
    }
    
    return sanitized;
  }

  /**
   * Upload files to a specific WorkDrive folder with original filenames
   */
  static async uploadFilesToFolder(
    files: File[], 
    folderId: string, 
    keepOriginalNames: boolean = true
  ): Promise<{ fileId: string; fileName: string; status: string }[]> {
    const accessToken = await ZohoAuth.getAccessToken("workdrive");
    const results: { fileId: string; fileName: string; status: string }[] = [];

    for (const file of files) {
      try {
        // Use original filename or generate unique name
        const fileName = keepOriginalNames 
          ? file.name 
          : `${Date.now()}_${file.name}`;

        const formData = new FormData();
        formData.append("content", file);
        formData.append("parent_id", folderId);
        formData.append("filename", fileName);
        formData.append("override-name-exist", "false");

        const response = await axios.post<ZohoWorkDriveUploadResponse>(
          `${this.apiDomain}/api/v1/upload`,
          formData,
          {
            headers: {
              Authorization: `Zoho-oauthtoken ${accessToken}`,
              Accept: "application/vnd.api+json",
            },
            timeout: 300000, // 5 minutes timeout for large files
          }
        );

        if (response.data.data && response.data.data.length > 0) {
          const fileId = response.data.data[0].id;
          results.push({ 
            fileId, 
            fileName, 
            status: 'uploaded_successfully' 
          });
        } else {
          results.push({ 
            fileId: '', 
            fileName, 
            status: 'upload_failed' 
          });
        }
      } catch (error: any) {
        console.error(`Failed to upload file ${file.name}:`, error);
        results.push({ 
          fileId: '', 
          fileName: file.name, 
          status: 'upload_failed' 
        });
      }
    }

    return results;
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
          `${this.apiDomain}/api/v1/files/${fileId}/share`,
          {
            permissions: { type: "user", role: "view" },
          },
          {
            headers: {
              Authorization: `Zoho-oauthtoken ${accessToken}`,
              "Content-Type": "application/json",
            },
            timeout: 10000, // 10 second timeout
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
