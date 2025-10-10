import { PDFGenerator, formatDate } from './pdfGenerator';
import { ComplaintFormData } from '@/types/forms';

export class ComplaintPDFGenerator extends PDFGenerator {
  constructor() {
    super('COMPACT'); // Use compact layout for single-page complaint reports
  }

  async generate(data: ComplaintFormData, metadata?: any): Promise<Buffer> {
    // Add header
    this.addHeader('Confidential Complaint Report');

    // Person Reporting Section
    this.addSection('Person Reporting');
    this.addFieldPair('Role', data.Role, 'Member Number', data.Member_Number);
    this.addFieldPair('First Name', data.Name1, 'Last Name', data.Last_Name);
    this.addFieldPair('Email', data.Reporter_Email, 'Contact Phone', data.Contact_Phone);
    
    // Complaint Information Section
    this.addSection('Complaint Information');
    this.addField('Occurrence Date & Time', formatDate(data.Occurrence_Date1));
    this.addField('Complaint Details', data.Description_of_Occurrence, true);
    this.addField('Wish to Remain Anonymous', data.wishToRemainAnonymous ? 'Yes' : 'No');

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

export async function generateComplaintPDF(
  data: ComplaintFormData,
  metadata?: any
): Promise<Buffer> {
  const generator = new ComplaintPDFGenerator();
  return generator.generate(data, metadata);
}
