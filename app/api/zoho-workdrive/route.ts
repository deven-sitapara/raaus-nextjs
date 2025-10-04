import { NextRequest, NextResponse } from "next/server";
import { ZohoWorkDrive } from "@/lib/zoho/workdrive";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files: File[] = [];

    // Extract files from form data
    formData.forEach((value) => {
      if (value instanceof File) {
        files.push(value);
      }
    });

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Upload files
    const fileIds = await ZohoWorkDrive.uploadFiles(files);

    // Get shareable links
    const links = await ZohoWorkDrive.getShareableLinks(fileIds);

    return NextResponse.json({
      success: true,
      fileIds,
      links,
    });
  } catch (error) {
    console.error("WorkDrive upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload files to Zoho WorkDrive" },
      { status: 500 }
    );
  }
}
