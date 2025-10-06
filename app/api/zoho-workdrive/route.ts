import { NextRequest, NextResponse } from "next/server";
import { ZohoWorkDrive } from "@/lib/zoho/workdrive";

export async function POST(request: NextRequest) {
  try {
    console.log("WorkDrive API route called");
    const formData = await request.formData();
    const files: File[] = [];

    // Extract files from form data
    formData.forEach((value, key) => {
      console.log("FormData entry:", key, value instanceof File ? `File: ${value.name}` : value);
      if (value instanceof File) {
        files.push(value);
      }
    });

    console.log(`Extracted ${files.length} files from FormData`);

    if (files.length === 0) {
      console.error("No files found in FormData");
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Upload files
    console.log("Uploading files to Zoho WorkDrive...");
    const fileIds = await ZohoWorkDrive.uploadFiles(files);
    console.log("Upload successful, file IDs:", fileIds);

    // Get shareable links
    console.log("Getting shareable links...");
    const links = await ZohoWorkDrive.getShareableLinks(fileIds);
    console.log("Shareable links:", links);

    return NextResponse.json({
      success: true,
      fileIds,
      links,
    });
  } catch (error: any) {
    console.error("WorkDrive upload error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
    }
    return NextResponse.json(
      {
        error: "Failed to upload files to Zoho WorkDrive",
        details: error.message
      },
      { status: 500 }
    );
  }
}
