import { PDFGenerator, formatDate, formatDateOnly } from './pdfGenerator';
import { DefectFormData } from '@/types/forms';

export class DefectPDFGenerator extends PDFGenerator {
  constructor() {
    super('COMPACT'); // Use compact layout for single-page defect reports
  }

  async generate(data: DefectFormData, metadata?: any): Promise<Buffer> {
    // Add header with submission date
    const submissionDate = metadata?.timestamp ? formatDate(metadata.timestamp) : undefined;
    this.addHeader('Defect Report', submissionDate);

    // Person Reporting Section
    this.addSection('Person Reporting');
    this.addFieldPair('Role', data.role, 'Member Number', data.Member_Number || data.memberNumber);
    this.addFieldPair('First Name', data.Name1 || data.Reporter_First_Name || data.firstName, 'Last Name', data.Last_Name || data.lastName);
    this.addFieldPair('Email', data.Reporter_Email || data.email, 'Contact Phone', data.Contact_Phone || data.contactPhone);

    // Defect Information Section
    this.addSection('Defect Information');
    this.addField('Date Defect Identified', formatDate(data.Occurrence_Date1 || data.dateDefectIdentified));
    this.addFieldPair('State', data.State || data.state, 'Location', data.Location_of_aircraft_when_defect_was_found || data.Location || data.locationOfAircraft);
    
    // GPS Coordinates
    const hasGPS = (data.Latitude && data.Latitude !== '') || (data.Longitude && data.Longitude !== '');
    if (hasGPS) {
      const gpsDisplay = `Latitude: ${data.Latitude || 'N/A'}, Longitude: ${data.Longitude || 'N/A'}`;
      this.addField('GPS Coordinates', gpsDisplay, true);
    }

    this.addField('Defective Component', data.Defective_component || data.defectiveComponent, true);
    this.addField('Defect Description', data.Provide_description_of_defect || data.Description_of_Occurrence || data.defectDescription, true);
    
    if (data.Damage_to_aircraft) {
      this.addField('Damage to Aircraft', data.Damage_to_aircraft);
    }
    if (data.Part_of_aircraft_damaged) {
      this.addField('Part Damaged', data.Part_of_aircraft_damaged);
    }
    if (data.Description_of_damage_to_aircraft) {
      this.addField('Damage Description', data.Description_of_damage_to_aircraft, true);
    }

    // Maintainer Information Section
    const hasMaintainerData = data.Maintainer_Name || data.Maintainer_Last_Name || data.maintainerName || data.maintainerLastName;
    if (hasMaintainerData) {
      this.addSection('Maintainer Information');
      this.addFieldPair(
        'Maintainer First Name', 
        data.Maintainer_Name || data.maintainerName || 'N/A',
        'Maintainer Last Name',
        data.Maintainer_Last_Name || data.maintainerLastName || 'N/A'
      );
      this.addFieldPair(
        'Member Number',
        data.Maintainer_Member_Number || data.maintainerMemberNumber || 'N/A',
        'Maintainer Level',
        data.Maintainer_Level || data.maintainerLevel || 'N/A'
      );
    }

    // Prevention Suggestions
    const preventionSuggestions = data.Do_you_have_further_suggestions_on_how_to_PSO || data.Reporter_Suggestions || data.preventionSuggestions;
    if (preventionSuggestions) {
      this.addField('Prevention Suggestions', preventionSuggestions, true);
    }

    // Aircraft Information Section
    this.addSection('Aircraft Information');
    const regNumber = data.Registration_number || 
                     (data.registrationNumberPrefix && data.registrationNumberSuffix 
                       ? `${data.registrationNumberPrefix}-${data.registrationNumberSuffix}` 
                       : 'N/A');
    this.addField('Registration Number', regNumber);
    this.addFieldPair('Serial Number', data.Serial_number || data.serialNumber, 'Registration Status', data.Registration_status || data.registrationStatus);
    this.addFieldPair('Make', data.Make || data.make, 'Model', data.Model || data.model);
    this.addFieldPair('Type', data.Type1 || data.type, 'Year Built', data.Year_Built1 || data.yearBuilt);

    // Engine Details Section
    const hasEngineData = data.Engine_Details || data.Engine_model || data.Engine_serial || data.Total_engine_hours || data.Total_hours_since_service || 
                         data.engineMake || data.engineModel || data.engineSerial || data.totalEngineHours || data.totalHoursSinceService;
    if (hasEngineData) {
      this.addSection('Engine Details');
      this.addFieldPair('Engine Make', data.Engine_Details || data.engineMake, 'Engine Model', data.Engine_model || data.engineModel);
      this.addFieldPair('Engine Serial', data.Engine_serial || data.engineSerial, 'Total Engine Hours', data.Total_engine_hours || data.totalEngineHours);
      if (data.Total_hours_since_service || data.totalHoursSinceService) {
        this.addField('Hours Since Service', data.Total_hours_since_service || data.totalHoursSinceService);
      }
    }

    // Propeller Details Section
    const hasPropellerData = data.Propeller_make || data.Propeller_model || data.Propeller_serial || 
                            data.propellerMake || data.propellerModel || data.propellerSerial;
    if (hasPropellerData) {
      this.addSection('Propeller Details');
      this.addFieldPair('Propeller Make', data.Propeller_make || data.propellerMake, 'Propeller Model', data.Propeller_model || data.propellerModel);
      this.addField('Propeller Serial', data.Propeller_serial || data.propellerSerial);
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

export async function generateDefectPDF(
  data: DefectFormData,
  metadata?: any
): Promise<Buffer> {
  const generator = new DefectPDFGenerator();
  return generator.generate(data, metadata);
}
