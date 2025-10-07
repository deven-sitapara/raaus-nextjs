import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // This endpoint is deprecated. All file uploads should go through /api/submit-form
  // which properly handles occurrence ID-based folder organization.
  
  return NextResponse.json(
    { 
      error: "This endpoint is deprecated. Please use /api/submit-form for file uploads with proper occurrence management.",
      deprecationNotice: "Direct WorkDrive uploads are no longer supported to maintain proper file organization."
    },
    { status: 410 } // Gone
  );
}
