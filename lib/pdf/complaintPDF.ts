import { PDFGenerator, formatDate } from './pdfGenerator';
import { ComplaintFormData } from '@/types/forms';

export class ComplaintPDFGenerator extends PDFGenerator {
  constructor() {
    super('COMPACT'); // Use compact layout for single-page complaint reports
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

  async generate(data: ComplaintFormData, metadata?: any): Promise<Buffer> {
    // Add header with submission date
    const submissionDate = metadata?.timestamp ? formatDate(metadata.timestamp) : undefined;
    this.addHeader('Confidential Complaint Report', submissionDate);

    // Anonymous Status - Show prominently at top
    if (data.wishToRemainAnonymous) {
      this.addSection('Anonymity Notice');
      this.addField('Wish to Remain Anonymous', 'Yes', true);
    }

    // Person Reporting Section - Only if not anonymous or if data exists
    if (!data.wishToRemainAnonymous || this.hasValue(data.Role) || this.hasValue(data.Member_Number) ||
        this.hasValue(data.Name1) || this.hasValue(data.Last_Name)) {
      this.addSection('Person Reporting');

      if (this.hasValue(data.Role) || this.hasValue(data.Member_Number)) {
        this.addFieldPair('Role', data.Role, 'Member Number', data.Member_Number);
      }
      if (this.hasValue(data.Name1) || this.hasValue(data.Last_Name)) {
        this.addFieldPair('First Name', data.Name1, 'Last Name', data.Last_Name);
      }
      if (this.hasValue(data.Reporter_Email) || this.hasValue(data.Contact_Phone)) {
        this.addFieldPair('Email', data.Reporter_Email, 'Contact Phone', data.Contact_Phone);
      }
    }

    // Complaint Information Section
    this.addSection('Complaint Information');
    if (this.hasValue(data.Occurrence_Date1)) {
      this.addField('Occurrence Date & Time', formatDate(data.Occurrence_Date1));
    }
    if (this.hasValue(data.Occurrence_Date2)) {
      this.addField('Secondary Date & Time', formatDate(data.Occurrence_Date2));
    }
    if (this.hasValue(data.Description_of_Occurrence)) {
      this.addField('Complaint Details', data.Description_of_Occurrence, true);
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

export async function generateComplaintPDF(
  data: ComplaintFormData,
  metadata?: any
): Promise<Buffer> {
  const generator = new ComplaintPDFGenerator();
  return generator.generate(data, metadata);
}
