import PDFDocument from 'pdfkit';
import { AccidentFormData, DefectFormData, ComplaintFormData, HazardFormData } from '@/types/forms';
import * as fs from 'fs';
import * as path from 'path';
import SVGtoPDF from 'svg-to-pdfkit';

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
    labelFontSize: 9,
    valueFontSize: 10,
    headerHeight: 55,
    sectionSpacing: 12,
    fieldSpacing: 16,
    fieldPairSpacing: 16,
    fullWidthFieldSpacing: 24,
    topMargin: 35,
    bottomMargin: 85,
    initialY: 70,
  } as PDFLayoutConfig,

  // For complex forms (Accident) - Multi-page layout with enhanced styling
  STANDARD: {
    headerFontSize: 22,
    sectionFontSize: 13,
    labelFontSize: 9,
    valueFontSize: 10,
    headerHeight: 65,
    sectionSpacing: 14,
    fieldSpacing: 15,
    fieldPairSpacing: 15,
    fullWidthFieldSpacing: 25,
    topMargin: 40,
    bottomMargin: 85,
    initialY: 85,
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
   * Add header with logo, centered title, and submission time - enhanced design
   */
  protected addHeader(title: string, submissionDate?: string): void {
    // Header background with gradient effect (simulate with two rectangles)
    this.doc
      .rect(0, 0, this.doc.page.width, this.config.headerHeight)
      .fill(this.primaryColor);

    // Subtle bottom border for depth
    this.doc
      .rect(0, this.config.headerHeight - 3, this.doc.page.width, 3)
      .fill('#1e3a8a'); // Darker blue

    // Add white background rectangle for logo with rounded corners effect
    this.doc
      .rect(12, 10, 100, 35)
      .fill('#ffffff');

    // Add logo at top left (on top of white background)
    try {
      const logoPath = path.join(process.cwd(), 'public', 'raa-logo.svg');
      if (fs.existsSync(logoPath)) {
        const svgContent = fs.readFileSync(logoPath, 'utf8');
        // Position logo with constrained dimensions to prevent stretching
        SVGtoPDF(this.doc, svgContent, 14, 12, {
          width: 95,
          height: 30,
          preserveAspectRatio: 'xMidYMid meet'
        });
      }
    } catch (error) {
      console.warn('Failed to load logo:', error);
    }

    // Centered title with better positioning
    const titleY = (this.config.headerHeight - this.config.headerFontSize) / 2 + 2;
    this.doc
      .fontSize(this.config.headerFontSize)
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .text(title, 0, titleY, {
        width: this.doc.page.width,
        align: 'center'
      });

    // Add submission time at top right below header (if provided)
    if (submissionDate) {
      this.doc
        .fontSize(8.5)
        .fillColor(this.secondaryColor)
        .font('Helvetica')
        .text(`Submitted: ${submissionDate}`, this.doc.page.width - 210, this.config.headerHeight + 8, {
          width: 160,
          align: 'right'
        });
    }

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
   * Add section heading with enhanced styling
   */
  protected addSection(title: string): void {
    const sectionHeight = this.config.sectionFontSize + 18; // Increased padding
    const spaceNeeded = sectionHeight + this.config.sectionSpacing + 8;
    this.checkPageBreak(spaceNeeded);

    this.yPosition += this.config.sectionSpacing;

    // Draw section background box with gradient effect
    const boxY = this.yPosition;
    const boxHeight = sectionHeight;

    // Background box
    this.doc
      .rect(55, boxY, this.doc.page.width - 110, boxHeight)
      .fill('#dbeafe'); // Lighter blue background

    // Left accent border (thicker for more prominence)
    this.doc
      .rect(55, boxY, 5, boxHeight)
      .fill(this.primaryColor);

    // Right subtle border
    this.doc
      .rect(this.doc.page.width - 60, boxY, 5, boxHeight)
      .fill('#e0e7ff');

    // Section title text with better positioning (BLACK TEXT)
    this.doc
      .fontSize(this.config.sectionFontSize)
      .fillColor('#000000') // BLACK text
      .font('Helvetica-Bold')
      .text(title, 70, boxY + 10, {
        width: this.doc.page.width - 140
      });

    this.yPosition += boxHeight + 10;
    this.hasContent = true;
  }

  /**
   * Add a field with label and value - enhanced with better styling
   */
  protected addField(label: string, value: any, fullWidth: boolean = false): void {
    const displayValue = this.formatValue(value) || 'N/A';

    // Set fonts for accurate calculation
    this.doc.font('Helvetica-Bold').fontSize(this.config.labelFontSize);
    const labelWidth = fullWidth ? this.doc.page.width - 130 : 240;
    const valueWidth = fullWidth ? this.doc.page.width - 130 : 240;

    const labelHeight = this.doc.heightOfString(label + ':', { width: labelWidth });

    this.doc.font('Helvetica').fontSize(this.config.valueFontSize);
    const valueHeight = this.doc.heightOfString(displayValue, {
      width: valueWidth,
      paragraphGap: 0,
      lineGap: 2.5,
    });

    const padding = 10;
    const boxHeight = fullWidth
      ? labelHeight + valueHeight + padding * 3 + 3
      : Math.max(labelHeight, valueHeight) + padding * 2 + 2;

    const spaceNeeded = boxHeight + (fullWidth ? 10 : 6);

    this.checkPageBreak(spaceNeeded);

    const boxX = 55;
    const boxWidth = this.doc.page.width - 110;

    // Draw subtle background box for the field with slight border radius effect
    this.doc
      .rect(boxX, this.yPosition, boxWidth, boxHeight)
      .fill('#f8fafc'); // Very light gray background

    // Add subtle border
    this.doc
      .rect(boxX, this.yPosition, boxWidth, boxHeight)
      .strokeColor('#d1d5db')
      .lineWidth(0.5)
      .stroke();

    // Add label (BLACK TEXT - no blue accent bar)
    const labelY = this.yPosition + padding;
    this.doc
      .fontSize(this.config.labelFontSize)
      .fillColor('#000000') // BLACK text
      .font('Helvetica-Bold')
      .text(label + ':', boxX + 10, labelY, {
        width: labelWidth - 10,
        continued: false
      });

    // Add value
    const valueY = fullWidth ? labelY + labelHeight + 5 : labelY;
    const valueX = fullWidth ? boxX + 10 : boxX + 260;
    this.doc
      .fontSize(this.config.valueFontSize)
      .fillColor(this.textColor)
      .font('Helvetica')
      .text(displayValue, valueX, valueY, {
        width: valueWidth - 20,
        paragraphGap: 0,
        lineGap: 2.5,
        align: 'left'
      });

    this.yPosition += boxHeight + (fullWidth ? 10 : 6);
    this.hasContent = true;
  }

  /**
   * Add two fields side by side - enhanced with card-style boxes
   */
  protected addFieldPair(label1: string, value1: any, label2: string, value2: any): void {
    const displayValue1 = this.formatValue(value1) || 'N/A';
    const displayValue2 = this.formatValue(value2) || 'N/A';

    // Calculate heights for pair
    const labelWidth = 110;
    const valueWidth = 120;
    const padding = 10;

    this.doc.font('Helvetica-Bold').fontSize(this.config.labelFontSize);
    const labelHeight1 = this.doc.heightOfString(label1 + ':', { width: labelWidth });
    const labelHeight2 = this.doc.heightOfString(label2 + ':', { width: labelWidth });

    this.doc.font('Helvetica').fontSize(this.config.valueFontSize);
    const valueHeight1 = this.doc.heightOfString(displayValue1, { width: valueWidth, paragraphGap: 0, lineGap: 2.5 });
    const valueHeight2 = this.doc.heightOfString(displayValue2, { width: valueWidth, paragraphGap: 0, lineGap: 2.5 });

    const contentHeight = Math.max(
      labelHeight1 + valueHeight1,
      labelHeight2 + valueHeight2
    );
    const boxHeight = contentHeight + padding * 2 + 3;
    const spaceNeeded = boxHeight + 6;

    this.checkPageBreak(spaceNeeded);

    const boxWidth = (this.doc.page.width - 125) / 2; // Split evenly with gap
    const box1X = 55;
    const box2X = box1X + boxWidth + 12; // 12px gap between boxes

    // Left field box
    this.doc
      .rect(box1X, this.yPosition, boxWidth, boxHeight)
      .fill('#f8fafc');

    this.doc
      .rect(box1X, this.yPosition, boxWidth, boxHeight)
      .strokeColor('#d1d5db')
      .lineWidth(0.5)
      .stroke();

    // Left field label (BLACK TEXT - no accent bar)
    this.doc
      .fontSize(this.config.labelFontSize)
      .fillColor('#000000') // BLACK text
      .font('Helvetica-Bold')
      .text(label1 + ':', box1X + 10, this.yPosition + padding, { width: labelWidth - 5 });

    // Left field value
    this.doc
      .fontSize(this.config.valueFontSize)
      .fillColor(this.textColor)
      .font('Helvetica')
      .text(displayValue1, box1X + 10, this.yPosition + padding + labelHeight1 + 3, {
        width: boxWidth - 20,
        paragraphGap: 0,
        lineGap: 2.5
      });

    // Right field box
    this.doc
      .rect(box2X, this.yPosition, boxWidth, boxHeight)
      .fill('#f8fafc');

    this.doc
      .rect(box2X, this.yPosition, boxWidth, boxHeight)
      .strokeColor('#d1d5db')
      .lineWidth(0.5)
      .stroke();

    // Right field label (BLACK TEXT - no accent bar)
    this.doc
      .fontSize(this.config.labelFontSize)
      .fillColor('#000000') // BLACK text
      .font('Helvetica-Bold')
      .text(label2 + ':', box2X + 10, this.yPosition + padding, { width: labelWidth - 5 });

    // Right field value
    this.doc
      .fontSize(this.config.valueFontSize)
      .fillColor(this.textColor)
      .font('Helvetica')
      .text(displayValue2, box2X + 10, this.yPosition + padding + labelHeight2 + 3, {
        width: boxWidth - 20,
        paragraphGap: 0,
        lineGap: 2.5
      });

    this.yPosition += spaceNeeded;
    this.hasContent = true;
  }

  /**
   * Format value for display
   */
  protected formatValue(value: any): string {
    if (value === null || value === undefined || value === '') {
      return '-';
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