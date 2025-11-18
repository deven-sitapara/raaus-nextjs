import { NextRequest, NextResponse } from "next/server";
import { ZohoCRM } from "@/lib/zoho/crm";

export async function POST(request: NextRequest) {
  try {
    const { memberNumber, firstName, lastName } = await request.json();

    if (!memberNumber || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await ZohoCRM.validateMemberNumber(
      memberNumber,
      firstName,
      lastName
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Member validation error:", error.message);

    // Provide more specific error messages
    const isTimeout = error.message?.includes('timeout') || error.code === 'ETIMEDOUT';
    const errorMessage = isTimeout
      ? "Connection timeout - unable to reach validation service. Please try again."
      : "Failed to validate member number. Please try again later.";

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.message
      },
      { status: 500 }
    );
  }
}
