import { PDFGenerator, formatDate } from './pdfGenerator';
import { HazardFormData } from '@/types/forms';

export class HazardPDFGenerator extends PDFGenerator {
  constructor() {
    super('COMPACT'); // Use compact layout for single-page hazard reports
  }

  async generate(data: HazardFormData, metadata?: any): Promise<Buffer> {
    // Add header
    this.addHeader('Hazard Report');

    // Person Reporting Section
    this.addSection('Person Reporting');
    this.addFieldPair('Role', data.Role, 'Member Number', data.Member_Number);
    this.addFieldPair('First Name', data.Name1, 'Last Name', data.Last_Name);
    this.addFieldPair('Email', data.Reporter_Email, 'Contact Phone', data.Contact_Phone);

    // Hazard Information Section
    this.addSection('Hazard Information');
    this.addField('Date Identified', formatDate(data.Date_Hazard_Identified || data.Occurrence_Date1));
    this.addFieldPair('State', data.State, 'Location', data.Location_of_Hazard || data.Location_of_hazard);
    this.addField('Hazard Description', data.Hazard_Description || data.Please_fully_describe_the_identified_hazard || data.Description_of_Occurrence, true);
    
    if (data.Potential_Consequences_of_Hazard) {
      this.addField('Potential Consequences', data.Potential_Consequences_of_Hazard, true);
    }
    
    if (data.Do_you_have_further_suggestions_on_how_to_PSO || data.Reporter_Suggestions) {
      this.addField('Prevention Suggestions', data.Do_you_have_further_suggestions_on_how_to_PSO || data.Reporter_Suggestions, true);
    }

    // Metadata Section
    if (metadata) {
      this.addSection('Submission Information');
      if (metadata.occurrenceId) {
        this.addField('Occurrence ID', metadata.occurrenceId);
      }
      if (metadata.recordId) {
        this.addField('CRM Record ID', metadata.recordId);
      }
      if (metadata.timestamp) {
        this.addField('Submitted On', formatDate(metadata.timestamp));
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
