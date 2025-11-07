import { PDFGenerator, formatDate } from './pdfGenerator';
import { HazardFormData } from '@/types/forms';
import aerodromeData from '@/components/forms/aerodrome-codes.json';

export class HazardPDFGenerator extends PDFGenerator {
  constructor() {
    super('COMPACT'); // Use compact layout for single-page hazard reports
  }

  private getAerodromeName(id: string | undefined): string | undefined {
    if (!id) return undefined;
    const aerodrome = aerodromeData.aerodromes.find(a => a.id === id);
    return aerodrome?.Name;
  }

  private hasValue(value: any): boolean {
    if (value === null || value === undefined || value === '' || value === 'N/A') {
      return false;
    }
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
    return true;
  }

  async generate(data: HazardFormData, metadata?: any): Promise<Buffer> {
    // Add header with submission date
    const submissionDate = metadata?.timestamp ? formatDate(metadata.timestamp) : undefined;
    this.addHeader('Hazard Report', submissionDate);

    // Person Reporting Section
    this.addSection('Person Reporting');
    if (this.hasValue(data.role) || this.hasValue(data.Member_Number)) {
      this.addFieldPair('Role', data.role, 'Member Number', data.Member_Number);
    }
    if (this.hasValue(data.Name1) || this.hasValue(data.Last_Name)) {
      this.addFieldPair('First Name', data.Name1, 'Last Name', data.Last_Name);
    }
    if (this.hasValue(data.Reporter_Email) || this.hasValue(data.Contact_Phone)) {
      this.addFieldPair('Email', data.Reporter_Email, 'Contact Phone', data.Contact_Phone);
    }

    // Hazard Information Section
    this.addSection('Hazard Information');
    if (this.hasValue(data.Date_Hazard_Identified || data.Occurrence_Date1)) {
      this.addField('Date Identified', formatDate(data.Date_Hazard_Identified || data.Occurrence_Date1));
    }
    if (this.hasValue(data.State) || this.hasValue(data.Location_of_Hazard || data.Location_of_hazard)) {
      this.addFieldPair('State', data.State, 'Location', data.Location_of_Hazard || data.Location_of_hazard);
    }
    if (this.hasValue(data.hazardRelatesToSpecificAerodrome)) {
      this.addField('Relates to Specific Aerodrome', data.hazardRelatesToSpecificAerodrome);
    }
    if (this.hasValue(data.Y_Code)) {
      this.addField('Hazard Aerodrome', this.getAerodromeName(data.Y_Code) || data.Y_Code);
    }
    if (this.hasValue(data.Hazard_Description || data.Please_fully_describe_the_identified_hazard || data.Description_of_Occurrence)) {
      this.addField('Hazard Description', data.Hazard_Description || data.Please_fully_describe_the_identified_hazard || data.Description_of_Occurrence, true);
    }
    if (this.hasValue(data.Potential_Consequences_of_Hazard)) {
      this.addField('Potential Consequences', data.Potential_Consequences_of_Hazard, true);
    }
    if (this.hasValue(data.Latitude) && this.hasValue(data.Longitude)) {
      this.addField('GPS Coordinates', `Latitude: ${data.Latitude}, Longitude: ${data.Longitude}`);
    }
    if (this.hasValue(data.Do_you_have_further_suggestions_on_how_to_PSO || data.Reporter_Suggestions)) {
      this.addField('Prevention Suggestions', data.Do_you_have_further_suggestions_on_how_to_PSO || data.Reporter_Suggestions, true);
    }

    // Metadata Section
    if (metadata) {
      this.addSection('Submission Information');
      if (metadata.occurrenceId) {
        this.addField('Occurrence ID', metadata.occurrenceId);
      }
      if (metadata.attachmentCount) {
        this.addField('Attachments', `${metadata.attachmentCount} file(s) uploaded`);
      }
    }

    // Add footer
    this.addFooter(
      formatDate(metadata?.timestamp || new Date().toISOString()),
      metadata?.occurrenceId
    );

    return this.getBuffer();
  }
}

export async function generateHazardPDF(
  data: HazardFormData,
  metadata?: any
): Promise<Buffer> {
  const generator = new HazardPDFGenerator();
  return generator.generate(data, metadata);
}
