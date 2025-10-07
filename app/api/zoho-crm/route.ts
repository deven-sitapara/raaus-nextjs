import { NextRequest, NextResponse } from "next/server";
import { ZohoCRM } from "@/lib/zoho/crm";

export async function POST(request: NextRequest) {
  try {
    const { module, data } = await request.json();

    if (!module || !data) {
      return NextResponse.json(
        { error: "Missing module or data" },
        { status: 400 }
      );
    }

    const result = await ZohoCRM.createRecord(module, data);

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to submit to Zoho CRM" },
      { status: 500 }
    );
  }
}
