import PDFDocument from 'pdfkit';
import { AccidentFormData, DefectFormData, ComplaintFormData, HazardFormData } from '@/types/forms';

/**
 * PDF Layout Configuration
 */
export interface PDFLayoutConfig {
  // Font sizes
  headerFontSize: number;
  sectionFontSize: number;
  labelFontSize: number;
  valueFontSize: number;
  
  // Spacing
  headerHeight: number;
  sectionSpacing: number;
  fieldSpacing: number;
  fieldPairSpacing: number;
  fullWidthFieldSpacing: number; // Now used as minimum; actual will be calculated
  
  // Margins
  topMargin: number;
  bottomMargin: number;
  
  // Initial position
  initialY: number;
}

/**
 * Preset configurations for different form types
 */
export const PDF_LAYOUTS = {
  // For simple forms (Complaint, Hazard, Defect) - Single page optimized
  COMPACT: {
    headerFontSize: 18,
    sectionFontSize: 12,
    labelFontSize: 8,
    valueFontSize: 9,
    headerHeight: 50,
    sectionSpacing: 8,
    fieldSpacing: 12, // Reduced for better single-page fit
    fieldPairSpacing: 12,
    fullWidthFieldSpacing: 20, // Reduced minimum for compaction
    topMargin: 35,
    bottomMargin: 80, // Increased slightly for footer space
    initialY: 65,
  } as PDFLayoutConfig,
  
  // For complex forms (Accident) - Multi-page layout (use COMPACT if forcing single-page)
  STANDARD: {
    headerFontSize: 20,
    sectionFontSize: 14,
    labelFontSize: 9,
    valueFontSize: 10,
    headerHeight: 60,
    sectionSpacing: 10,
    fieldSpacing: 16,
    fieldPairSpacing: 16,
    fullWidthFieldSpacing: 30, // Reduced minimum
    topMargin: 40,
    bottomMargin: 80,
    initialY: 80,
  } as PDFLayoutConfig,
};

/**
 * Base PDF Generator Class
 * Provides common formatting and styling methods
 */
export class PDFGenerator {
  protected doc: PDFKit.PDFDocument;
  private yPosition: number;
  protected config: PDFLayoutConfig;
  
  // Track if we've added any content to prevent empty pages
  private hasContent = false;
  private isFinalized = false;
  
  // Colors
  protected readonly primaryColor = '#1e40af'; // Blue-700
  protected readonly secondaryColor = '#475569'; // Slate-600
  protected readonly lightGray = '#f1f5f9'; // Slate-100
  protected readonly textColor = '#1e293b'; // Slate-800

  constructor(layout: 'COMPACT' | 'STANDARD' = 'COMPACT') { // Default to COMPACT for single-page
    this.config = PDF_LAYOUTS[layout];
    this.yPosition = this.config.initialY;
    
    this.doc = new PDFDocument({
      size: 'A4',
      margins: { 
        top: this.config.topMargin, 
        bottom: this.config.bottomMargin, 
        left: 50, 
        right: 50 
      },
      bufferPages: true, // Enable buffering to allow switching pages for footers
      autoFirstPage: true,
      compress: true,
    });
  }

  /**
   * Add header with centered title
   */
  protected addHeader(title: string): void {
    // Header background
    this.doc
      .rect(0, 0, this.doc.page.width, this.config.headerHeight)
      .fill(this.primaryColor);

    // Centered title
    const titleY = (this.config.headerHeight - this.config.headerFontSize) / 2;
    this.doc
      .fontSize(this.config.headerFontSize)
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .text(title, 0, titleY, {
        width: this.doc.page.width, 
        align: 'center'
      });

    this.yPosition = this.config.initialY;
    this.hasContent = true;
  }

  /**
   * Add footer with page numbers and timestamp
   */
  protected addFooter(submissionDate: string, occurrenceId?: string): void {
    if (!this.hasContent || this.isFinalized) {
      return;
    }

    this.isFinalized = true;

    this.doc
      .fontSize(9)
      .fillColor(this.secondaryColor)
      .font('Helvetica');

    const leftText = 'Recreational Aviation Australia - Occurrence Report';
    const footerRight = occurrenceId 
      ? `ID: ${occurrenceId} | Submitted: ${submissionDate}`
      : `Submitted: ${submissionDate}`;

    const range = this.doc.bufferedPageRange();

    for (let p = 0; p < range.count; p++) {
      this.doc.switchToPage(p + range.start);

      // Footer line
      this.doc
        .moveTo(50, this.doc.page.height - 70)
        .lineTo(this.doc.page.width - 50, this.doc.page.height - 70)
        .strokeColor('#cbd5e1')
        .lineWidth(1)
        .stroke();

      // Left text - no width, force single line
      this.doc.text(leftText, 50, this.doc.page.height - 55, { lineBreak: false });

      // Right text - manual right align, no width, force single line
      const rightWidth = this.doc.widthOfString(footerRight);
      const rightX = this.doc.page.width - 50 - rightWidth;
      this.doc.text(footerRight, rightX, this.doc.page.height - 55, { lineBreak: false });

      // Page number - manual center, no width, force single line
      const pageStr = `Page ${p + 1} of ${range.count}`;
      const pageStrWidth = this.doc.widthOfString(pageStr);
      const pageX = (this.doc.page.width - pageStrWidth) / 2;
      this.doc.text(pageStr, pageX, this.doc.page.height - 40, { lineBreak: false });
    }
  }

  /**
   * Add section heading
   */
  protected addSection(title: string): void {
    const spaceNeeded = this.config.sectionFontSize + this.config.sectionSpacing * 2 + 2; // Approx
    this.checkPageBreak(spaceNeeded);
    
    this.yPosition += this.config.sectionSpacing;
    
    this.doc
      .fontSize(this.config.sectionFontSize)
      .fillColor(this.primaryColor)
      .font('Helvetica-Bold')
      .text(title, 50, this.yPosition);
    
    this.yPosition += this.config.sectionFontSize + 2;
    
    // Underline
    this.doc
      .moveTo(50, this.yPosition)
      .lineTo(this.doc.page.width - 50, this.yPosition)
      .strokeColor(this.primaryColor)
      .lineWidth(1.5)
      .stroke();
    
    this.yPosition += this.config.sectionSpacing;
    this.hasContent = true;
  }

  /**
   * Add a field with label and value
   */
  protected addField(label: string, value: any, fullWidth: boolean = false): void {
    const displayValue = this.formatValue(value) || 'N/A';
    
    // Set fonts for accurate calculation
    this.doc.font('Helvetica-Bold').fontSize(this.config.labelFontSize);
    const labelHeight = this.doc.heightOfString(label + ':', {
      width: fullWidth ? this.doc.page.width - 100 : 250
    });
    
    this.doc.font('Helvetica').fontSize(this.config.valueFontSize);
    const valueHeight = this.doc.heightOfString(displayValue, {
      width: fullWidth ? this.doc.page.width - 100 : 250,
      paragraphGap: 0,
      lineGap: 0,
    });
    
    const totalHeight = fullWidth 
      ? labelHeight + 2 + valueHeight 
      : Math.max(labelHeight, valueHeight);
    const spaceNeeded = totalHeight + (fullWidth ? this.config.fullWidthFieldSpacing : this.config.fieldSpacing);
    
    this.checkPageBreak(spaceNeeded);
    
    // If totalHeight > available page space, warn (could truncate displayValue here if needed)
    const available = this.doc.page.height - this.config.bottomMargin - this.yPosition;
    if (totalHeight > available) {
      console.warn(`Field "${label}" is too long for remaining space; may cause overflow. Consider truncating.`);
      // Optional: Truncate displayValue to fit, but for now, let PDFKit handle (may still overflow if extreme)
    }
    
    // Add label
    this.doc
      .fontSize(this.config.labelFontSize)
      .fillColor(this.secondaryColor)
      .font('Helvetica-Bold')
      .text(label + ':', 50, this.yPosition, { 
        width: fullWidth ? this.doc.page.width - 100 : 250,
        continued: false
      });
    
    // Add value
    const valueY = fullWidth ? this.yPosition + labelHeight + 2 : this.yPosition;
    const valueX = fullWidth ? 50 : 310;
    this.doc
      .fontSize(this.config.valueFontSize)
      .fillColor(this.textColor)
      .font('Helvetica')
      .text(displayValue, valueX, valueY, {
        width: fullWidth ? this.doc.page.width - 100 : 250,
        paragraphGap: 0,
        lineGap: 0
      });
    
    this.yPosition += totalHeight + (fullWidth ? this.config.fullWidthFieldSpacing - valueHeight : this.config.fieldSpacing - valueHeight); // Advance dynamically
    this.hasContent = true;
  }

  /**
   * Add two fields side by side
   */
  protected addFieldPair(label1: string, value1: any, label2: string, value2: any): void {
    const displayValue1 = this.formatValue(value1) || 'N/A';
    const displayValue2 = this.formatValue(value2) || 'N/A';

    // Calculate heights for pair
    this.doc.font('Helvetica-Bold').fontSize(this.config.labelFontSize);
    const labelHeight1 = this.doc.heightOfString(label1 + ':', {width: 120});
    const labelHeight2 = this.doc.heightOfString(label2 + ':', {width: 120});

    this.doc.font('Helvetica').fontSize(this.config.valueFontSize);
    const valueHeight1 = this.doc.heightOfString(displayValue1, {width: 120, paragraphGap: 0, lineGap: 0});
    const valueHeight2 = this.doc.heightOfString(displayValue2, {width: 120, paragraphGap: 0, lineGap: 0});

    const totalHeight = Math.max(labelHeight1, valueHeight1, labelHeight2, valueHeight2);
    const spaceNeeded = totalHeight + this.config.fieldPairSpacing;

    this.checkPageBreak(spaceNeeded);
    
    // Left field
    this.doc
      .fontSize(this.config.labelFontSize)
      .fillColor(this.secondaryColor)
      .font('Helvetica-Bold')
      .text(label1 + ':', 50, this.yPosition, { width: 120 });

    this.doc
      .fontSize(this.config.valueFontSize)
      .fillColor(this.textColor)
      .font('Helvetica')
      .text(displayValue1, 175, this.yPosition, { width: 120, paragraphGap: 0, lineGap: 0 });
    
    // Right field
    this.doc
      .fontSize(this.config.labelFontSize)
      .fillColor(this.secondaryColor)
      .font('Helvetica-Bold')
      .text(label2 + ':', 310, this.yPosition, { width: 120 });
    
    this.doc
      .fontSize(this.config.valueFontSize)
      .fillColor(this.textColor)
      .font('Helvetica')
      .text(displayValue2, 435, this.yPosition, { width: 120, paragraphGap: 0, lineGap: 0 });
    
    this.yPosition += spaceNeeded;
    this.hasContent = true;
  }

  /**
   * Format value for display
   */
  protected formatValue(value: any): string {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (typeof value === 'object' && value instanceof Date) {
      return value.toLocaleString('en-AU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    return String(value);
  }

  /**
   * Check if we need a page break
   */
  protected checkPageBreak(requiredSpace: number): void {
    // A4 page height ~842. Reserve for footer
    const maxY = this.doc.page.height - this.config.bottomMargin - 30; // Extra buffer for footer
    
    if (this.yPosition + requiredSpace > maxY) {
      this.doc.addPage();
      this.yPosition = this.config.initialY;
    }
  }

  /**
   * Get the PDF as a buffer
   */
  async getBuffer(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      this.doc.on('data', (chunk) => chunks.push(chunk));
      this.doc.on('end', () => resolve(Buffer.concat(chunks)));
      this.doc.on('error', reject);
      
      // End the document
      this.doc.end();
    });
  }
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Australia/Sydney',
    });
  } catch {
    return dateString;
  }
}

/**
 * Format date only (no time)
 */
export function formatDateOnly(dateString: string | undefined | null): string {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Australia/Sydney',
    });
  } catch {
    return dateString;
  }
}