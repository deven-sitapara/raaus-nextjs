import { NextRequest, NextResponse } from "next/server";
import { generateAccidentPDF } from "@/lib/pdf/accidentPDF";
import { generateDefectPDF } from "@/lib/pdf/defectPDF";
import { generateComplaintPDF } from "@/lib/pdf/complaintPDF";
import { generateHazardPDF } from "@/lib/pdf/hazardPDF";
import { AccidentFormData, DefectFormData, ComplaintFormData, HazardFormData } from "@/types/forms";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { formType, formData, metadata } = body;

    if (!formType || !formData) {
      return NextResponse.json(
        { 
          success: false,
          error: "Missing form type or form data",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    let pdfBuffer: Buffer;
    let filename: string;

    // Generate PDF based on form type
    switch (formType.toLowerCase()) {
      case 'accident':
      case 'accident report':
        pdfBuffer = await generateAccidentPDF(formData as AccidentFormData, metadata);
        filename = `RAAus_Accident_Report_${metadata?.occurrenceId || Date.now()}.pdf`;
        break;

      case 'defect':
      case 'defect report':
        pdfBuffer = await generateDefectPDF(formData as DefectFormData, metadata);
        filename = `RAAus_Defect_Report_${metadata?.occurrenceId || Date.now()}.pdf`;
        break;

      case 'complaint':
      case 'complaint report':
        pdfBuffer = await generateComplaintPDF(formData as ComplaintFormData, metadata);
        filename = `RAAus_Complaint_Report_${metadata?.occurrenceId || Date.now()}.pdf`;
        break;

      case 'hazard':
      case 'hazard report':
        pdfBuffer = await generateHazardPDF(formData as HazardFormData, metadata);
        filename = `RAAus_Hazard_Report_${metadata?.occurrenceId || Date.now()}.pdf`;
        break;

      default:
        return NextResponse.json(
          { 
            success: false,
            error: `Unsupported form type: ${formType}`,
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
    }

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error("[PDF Generation Error]:", error.message);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to generate PDF",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
