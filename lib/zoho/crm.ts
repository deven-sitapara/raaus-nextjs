import axios from "axios";
import { ZohoAuth } from "./auth";
import { ZohoCRMResponse } from "@/types/forms";

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching to handle minor spelling variations (e.g., "Raja" vs "Raju")
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Check if two strings are similar enough (fuzzy matching)
 * Returns true if similarity is >= 80%
 */
function isFuzzyMatch(str1: string, str2: string, threshold: number = 0.8): boolean {
  if (str1 === str2) return true;
  
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return true;
  
  const distance = levenshteinDistance(str1, str2);
  const similarity = 1 - (distance / maxLen);
  
  return similarity >= threshold;
}

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
          timeout: 15000, // 15 second timeout for creating records
        }
      );

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
          timeout: 15000, // 15 second timeout for updating records
        }
      );

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
            timeout: 10000, // 10 second timeout
          }
        );

        const occurrenceId = response.data.data?.[0]?.OccurrenceId;
        if (occurrenceId && occurrenceId.trim()) {
          return occurrenceId.trim();
        }

        if (i < retries) {
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
   * Create a note attached to a CRM record
   */
  static async createNote(
    parentModule: string,
    parentRecordId: string,
    noteTitle: string,
    noteContent: string
  ): Promise<{ success: boolean; noteId?: string; error?: string }> {
    const accessToken = await ZohoAuth.getAccessToken("crm");

    try {
      const noteData = {
        Note_Title: noteTitle,
        Note_Content: noteContent,
        Parent_Id: parentRecordId,
        se_module: parentModule,
      };

      const response = await axios.post<ZohoCRMResponse>(
        `${this.apiDomain}/crm/v2/Notes`,
        {
          data: [noteData],
        },
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
            "Content-Type": "application/json",
          },
          timeout: 15000, // 15 second timeout
        }
      );

      if (response.data.data && response.data.data.length > 0) {
        const firstRecord = response.data.data[0];
        
        if (firstRecord.code === "SUCCESS" && firstRecord.details && firstRecord.details.id) {
          return {
            success: true,
            noteId: firstRecord.details.id,
          };
        } else {
          return {
            success: false,
            error: firstRecord.message || "Failed to create note",
          };
        }
      } else {
        return {
          success: false,
          error: "No response data from Notes API",
        };
      }
    } catch (error: any) {
      console.error("Failed to create CRM note:", error);
      
      let errorMessage = "Failed to create note";
      if (error.response?.data?.data?.[0]?.message) {
        errorMessage = error.response.data.data[0].message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Create a name correction note for a member
   * Used when the system fuzzy matches a name but it's spelled differently in CRM
   */
  static async createNameCorrectionNote(
    memberNumber: string,
    recordId: string,
    userProvidedName: string,
    crmStoredName: string
  ): Promise<{ success: boolean; noteId?: string; error?: string }> {
    const noteTitle = `Name Correction - Member ${memberNumber}`;
    const noteContent = `Name correction request:\n\nUser entered: ${userProvidedName}\nStored in CRM: ${crmStoredName}\n\nThis name variation was fuzzy matched during form submission.`;
    
    return this.createNote("Contacts", recordId, noteTitle, noteContent);
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
  ): Promise<{ valid: boolean; warning?: string; isFuzzyMatch?: boolean; crmName?: string }> {
    const accessToken = await ZohoAuth.getAccessToken("crm");

    try {
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
          continue;
        }
      }

      if (!response) {
        throw lastError || new Error("All search criteria failed");
      }

      if (!response.data.data || response.data.data.length === 0) {
        return {
          valid: false,
          warning: `No member found with Member Number ${memberNumber}`,
        };
      }

      const member = response.data.data[0];

      // Check if names match (case-insensitive and flexible)
      let crmFirstName = (member.First_Name || member.Name1 || '').trim();
      let crmLastName = (member.Last_Name || '').trim();
      const crmFullName = (member.Full_Name || '').trim();

      // If separate fields are empty but Full_Name exists, try to split it
      if ((!crmFirstName || !crmLastName) && crmFullName) {
        const nameParts = crmFullName.split(/\s+/);
        if (nameParts.length >= 2) {
          crmFirstName = nameParts[0];
          crmLastName = nameParts.slice(1).join(' ');
        }
      }

      // Normalize function to handle whitespace and case
      const normalize = (str: string) => str.replace(/\s+/g, ' ').trim().toLowerCase();

      // Normalize all names for comparison
      const normalizedCrmFirstName = normalize(crmFirstName);
      const normalizedCrmLastName = normalize(crmLastName);
      const normalizedCrmFullName = normalize(crmFullName);
      const normalizedCrmCombined = normalize(`${crmFirstName} ${crmLastName}`);

      const normalizedProvidedFirstName = normalize(firstName);
      const normalizedProvidedLastName = normalize(lastName);
      const normalizedProvidedFullName = normalize(`${firstName} ${lastName}`);
      const normalizedProvidedFullNameReversed = normalize(`${lastName} ${firstName}`);

      // Check multiple matching strategies
      let nameMatches = false;
      let hasFuzzyMatch = false;
      let fuzzyMatchType = '';

      // Strategy 1: Exact match of separate fields
      const firstNameMatch = normalizedCrmFirstName === normalizedProvidedFirstName;
      const lastNameMatch = normalizedCrmLastName === normalizedProvidedLastName;

      // Strategy 1b: Fuzzy match of separate fields (handles "Raja" vs "Raju", "Aara" vs "Aarnav")
      // Using 75% threshold to allow 2-3 character differences in names
      const firstNameFuzzyMatch = isFuzzyMatch(normalizedCrmFirstName, normalizedProvidedFirstName, 0.75);
      const lastNameFuzzyMatch = isFuzzyMatch(normalizedCrmLastName, normalizedProvidedLastName, 0.75);

      // Strategy 2: Reversed match (user entered first/last swapped)
      const firstNameReversedMatch = normalizedCrmFirstName === normalizedProvidedLastName;
      const lastNameReversedMatch = normalizedCrmLastName === normalizedProvidedFirstName;

      // Strategy 2b: Fuzzy reversed match
      const firstNameReversedFuzzyMatch = isFuzzyMatch(normalizedCrmFirstName, normalizedProvidedLastName, 0.75);
      const lastNameReversedFuzzyMatch = isFuzzyMatch(normalizedCrmLastName, normalizedProvidedFirstName, 0.75);

      // Strategy 3: Full name match
      const fullNameMatch = normalizedCrmFullName === normalizedProvidedFullName;
      const fullNameReversedMatch = normalizedCrmFullName === normalizedProvidedFullNameReversed;

      // Strategy 3b: Fuzzy full name match
      const fullNameFuzzyMatch = isFuzzyMatch(normalizedCrmFullName, normalizedProvidedFullName, 0.75);
      const fullNameReversedFuzzyMatch = isFuzzyMatch(normalizedCrmFullName, normalizedProvidedFullNameReversed, 0.75);

      // Strategy 4: Combined name match
      const combinedMatch = normalizedCrmCombined === normalizedProvidedFullName;
      const combinedReversedMatch = normalizedCrmCombined === normalizedProvidedFullNameReversed;

      // Strategy 4b: Fuzzy combined match
      const combinedFuzzyMatch = isFuzzyMatch(normalizedCrmCombined, normalizedProvidedFullName, 0.75);
      const combinedReversedFuzzyMatch = isFuzzyMatch(normalizedCrmCombined, normalizedProvidedFullNameReversed, 0.75);

      // Strategy 5: Partial match - check if names are contained (for nicknames or variations)
      const crmHasFirstName = normalizedCrmFullName.includes(normalizedProvidedFirstName) ||
                             normalizedCrmCombined.includes(normalizedProvidedFirstName);
      const crmHasLastName = normalizedCrmFullName.includes(normalizedProvidedLastName) ||
                            normalizedCrmCombined.includes(normalizedProvidedLastName);
      const partialMatch = crmHasFirstName && crmHasLastName;

      if (firstNameMatch && lastNameMatch) {
        nameMatches = true;
      } else if (firstNameFuzzyMatch && lastNameFuzzyMatch && !(firstNameMatch && lastNameMatch)) {
        // Fuzzy match for both first and last names - detected name variation
        nameMatches = true;
        hasFuzzyMatch = true;
        fuzzyMatchType = 'separate_names';
      } else if (firstNameReversedMatch && lastNameReversedMatch) {
        nameMatches = true;
      } else if (firstNameReversedFuzzyMatch && lastNameReversedFuzzyMatch && !(firstNameReversedMatch && lastNameReversedMatch)) {
        // Fuzzy match for reversed first and last names
        nameMatches = true;
        hasFuzzyMatch = true;
        fuzzyMatchType = 'reversed_names';
      } else if (fullNameMatch) {
        nameMatches = true;
      } else if (fullNameFuzzyMatch && !fullNameMatch) {
        // Fuzzy match for full name
        nameMatches = true;
        hasFuzzyMatch = true;
        fuzzyMatchType = 'full_name';
      } else if (fullNameReversedMatch) {
        nameMatches = true;
      } else if (fullNameReversedFuzzyMatch && !fullNameReversedMatch) {
        // Fuzzy match for reversed full name
        nameMatches = true;
        hasFuzzyMatch = true;
        fuzzyMatchType = 'reversed_full_name';
      } else if (combinedMatch) {
        nameMatches = true;
      } else if (combinedFuzzyMatch && !combinedMatch) {
        // Fuzzy match for combined name
        nameMatches = true;
        hasFuzzyMatch = true;
        fuzzyMatchType = 'combined_name';
      } else if (combinedReversedMatch) {
        nameMatches = true;
      } else if (combinedReversedFuzzyMatch && !combinedReversedMatch) {
        // Fuzzy match for reversed combined name
        nameMatches = true;
        hasFuzzyMatch = true;
        fuzzyMatchType = 'reversed_combined_name';
      } else if (partialMatch) {
        nameMatches = true;
      }

      if (!nameMatches) {
        // Provide helpful error message with the name from CRM
        const crmName = crmFullName || `${crmFirstName} ${crmLastName}`.trim() || 'Unknown';
        return {
          valid: false,
          warning: `Member Number ${memberNumber} exists but name doesn't match. CRM has: "${crmName}"`,
        };
      }

      // If fuzzy match detected, return warning but still valid
      if (hasFuzzyMatch) {
        const crmName = crmFullName || `${crmFirstName} ${crmLastName}`.trim() || 'Unknown';
        const providedName = `${firstName} ${lastName}`.trim();
        return {
          valid: true,
          warning: `⚠️ Name spelling mismatch detected. You entered: "${providedName}" but CRM has: "${crmName}". Please correct the name if this is incorrect.`,
          isFuzzyMatch: true,
          crmName: crmName,
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
