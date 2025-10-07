import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const registration = searchParams.get('registration') || '19-4455'; // Default test value
  
  try {
    // Call our aircraft lookup API
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/aircraft-lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aircraftConcat: registration
      })
    });
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      registration: registration,
      status: response.status,
      api_response: data,
      test_results: {
        aircraft_found: data.success,
        propeller_fields: data.data ? {
          Propeller_make: data.data.Propeller_make,
          Propeller_model: data.data.Propeller_model, 
          Propeller_serial: data.data.Propeller_serial,
          propeller_found_flag: data.data.propeller_found
        } : null
      }
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      registration: registration
    }, { status: 500 });
  }
}