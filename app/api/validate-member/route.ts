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
    return NextResponse.json(
      { error: "Failed to validate member number" },
      { status: 500 }
    );
  }
}
