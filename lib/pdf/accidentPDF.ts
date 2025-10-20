import { PDFGenerator, formatDate, formatDateOnly } from './pdfGenerator';
import { AccidentFormData } from '@/types/forms';
import aerodromeData from '@/components/forms/aerodrome-codes.json';
import accountsData from '@/components/forms/accounts-codes.json';

export class AccidentPDFGenerator extends PDFGenerator {
  constructor() {
    super('STANDARD'); // Use standard layout for multi-page accident reports
  }

  private getAerodromeName(id: string | undefined): string | undefined {
    if (!id) return undefined;
    const aerodrome = aerodromeData.aerodromes.find(a => a.id === id);
    return aerodrome?.Name;
  }

  private getAccountName(id: string | undefined): string | undefined {
    if (!id) return undefined;
    const account = accountsData.accounts.find(a => a.id === id);
    return account?.Account_Name;
  }

  async generate(data: AccidentFormData, metadata?: any): Promise<Buffer> {
    // Add header with submission date
    const reportType = data.Accident_or_Incident || data.Is_this_occurrence_an_Accident_or_an_Incident || 'Accident/Incident';
    const submissionDate = metadata?.timestamp ? formatDate(metadata.timestamp) : undefined;
    this.addHeader(`${reportType} Report`, submissionDate);

    // Person Reporting Section
    this.addSection('Person Reporting');
    this.addFieldPair('Role', data.role, 'Member Number', data.Member_Number || data.memberNumber);
    this.addFieldPair('First Name', data.Name1 || data.firstName, 'Last Name', data.Last_Name || data.lastName);
    this.addFieldPair('Email', data.Reporter_Email || data.emailAddress, 'Contact Phone', data.Contact_Phone || data.contactPhone);

    // Pilot in Command Section (if different from reporter)
    if (data.role !== 'Pilot in Command' && (data.PIC_Name || data.PIC_Last_Name)) {
      this.addSection('Pilot in Command');
      this.addFieldPair('First Name', data.PIC_Name, 'Last Name', data.PIC_Last_Name);
      this.addFieldPair('Member Number', data.PIC_Member_Number, 'Date of Birth', formatDateOnly(data.Date_of_Birth));
      this.addFieldPair('Email', data.PIC_Email, 'Contact Phone', data.PIC_Contact_Phone || data.pilotContactPhone);
    }

    // Flying Hours Section
    this.addSection('Flying Hours');
    this.addFieldPair('Total Flying Hours', data.Total_flying_hours, 'Hours Last 90 Days', data.Hours_last_90_days);
    this.addFieldPair('Hours on Type', data.Hours_on_type, 'Hours on Type (90 Days)', data.Hours_on_type_last_90_days);

    // Occurrence Information Section
    this.addSection('Occurrence Information');
    this.addField('Date & Time', formatDate(data.Occurrence_Date1 || data.occurrenceDate));
    this.addFieldPair('State', data.State || data.state, 'Location', data.Location || data.location);
    this.addField('Incident/Accident Details', data.Details_of_incident_accident, true);
    
    // Damage and Injury
    this.addFieldPair('Damage to Aircraft', data.Damage_to_aircraft, 'Most Serious Injury to Pilot', data.Most_serious_injury_to_pilot);
    if (data.Description_of_damage_to_aircraft) {
      this.addField('Damage Description', data.Description_of_damage_to_aircraft, true);
    }
    if (data.Passenger_injury) {
      this.addFieldPair('Passenger Injury', data.Passenger_injury, 'Persons on Ground Injury', data.Persons_on_the_ground_injury);
    }

    // Classification
    this.addFieldPair('Type', reportType, 'ATSB Status', data.ATSB_reportable_status);
    
    if (data.Reporter_Suggestions) {
      this.addField('Prevention Suggestions', data.Reporter_Suggestions, true);
    }

    // Flight Details Section
    if (data.Departure_location || data.Destination_location || data.Type_of_operation) {
      this.addSection('Flight Details');
      this.addFieldPair('Departure', data.Departure_location, 'Destination', data.Destination_location);
      if (data.Landing) {
        this.addField('Landing Location', data.Landing);
      }
      this.addFieldPair('Type of Operation', data.Type_of_operation, 'Phase of Flight', data.Phase_of_flight);
      if (data.Lookup_5) {
        this.addField('Flight Training School', this.getAccountName(data.Lookup_5));
      }
      this.addFieldPair('Effect of Flight', data.Effect_of_flight, 'Flight Rules', data.Flight_Rules);
    }

    // Airspace Section
    if (data.Airspace_class || data.Airspace_type || data.Altitude) {
      this.addSection('Airspace');
      this.addFieldPair('Airspace Class', data.Airspace_class, 'Airspace Type', data.Airspace_type);
      this.addFieldPair('Altitude', data.Altitude ? `${data.Altitude}` : undefined, 'Altitude Type', data.Altitude_type);
    }

    // Environment Section
    if (data.Light_conditions || data.Wind_speed || data.Visibility) {
      this.addSection('Environment');
      this.addFieldPair('Light Conditions', data.Light_conditions, 'Visibility', data.Visibility ? `${data.Visibility} NM` : undefined);
      this.addFieldPair('Wind Speed', data.Wind_speed ? `${data.Wind_speed} knots` : undefined, 'Wind Direction', data.Wind_direction);
      this.addFieldPair('Wind Gusting', data.Wind_gusting, 'Temperature', data.Temperature ? `${data.Temperature}°C` : undefined);
      if (data.Visibility_reduced_by) {
        this.addField('Visibility Reduced By', Array.isArray(data.Visibility_reduced_by) ? data.Visibility_reduced_by.join(', ') : data.Visibility_reduced_by);
      }
      this.addField('PLB Carried', data.Personal_Locator_Beacon_carried);
    }

    // Bird/Animal Strike Section
    if (data.Bird_or_Animal_Strike) {
      this.addSection('Bird/Animal Strike');
      this.addFieldPair('Type of Strike', data.Type_of_strike, 'Size', data.Size);
      if (data.Species) {
        this.addField('Species', data.Species);
      }
      this.addFieldPair('Number (Approx)', data.Number_approx, 'Number Struck', data.Number_struck_approx);
    }

    // Near Collision Section
    if (data.Involve_near_miss_with_another_aircraft) {
      this.addSection('Near Collision with Another Aircraft');
      this.addFieldPair('Second Aircraft Registration', data.Second_aircraft_registration, 'Manufacturer', data.Second_Aircraft_Manufacturer);
      this.addField('Model', data.Second_Aircraft_Model);
      this.addFieldPair('Horizontal Proximity', data.Horizontal_Proximity ? `${data.Horizontal_Proximity} ${data.Horizontal_Proximity_Unit}` : undefined, 
                       'Vertical Proximity', data.Vertical_Proximity ? `${data.Vertical_Proximity} ${data.Vertical_Proximity_Unit}` : undefined);
      this.addFieldPair('Relative Track', data.Relative_Track, 'Avoidance Manoeuvre', data.Avoidance_manoeuvre_needed);
      this.addField('Alert Received', data.Alert_Received);
    }

    // Aircraft Information Section
    this.addSection('Aircraft Information');
    const regNumber = data.Registration_number && data.Serial_number1 
      ? `${data.Registration_number}-${data.Serial_number1}` 
      : data.Registration_number || 'N/A';
    this.addField('Registration Number', regNumber);
    this.addFieldPair('Serial Number', data.Serial_number, 'Registration Status', data.Registration_status);
    this.addFieldPair('Make', data.Make1, 'Model', data.Model);
    this.addFieldPair('Type', data.Type1, 'Year Built', data.Year_Built1);
    if (data.Total_airframe_hours) {
      this.addField('Total Airframe Hours', data.Total_airframe_hours);
    }

    // Engine Details Section
    if (data.Engine_Details || data.Engine_model) {
      this.addSection('Engine Details');
      this.addFieldPair('Engine Make', data.Engine_Details, 'Engine Model', data.Engine_model);
      this.addFieldPair('Engine Serial', data.Engine_serial, 'Total Engine Hours', data.Total_engine_hours);
      if (data.Total_hours_since_service) {
        this.addField('Hours Since Service', data.Total_hours_since_service);
      }
    }

    // Propeller Details Section
    if (data.Propeller_make || data.Propeller_model) {
      this.addSection('Propeller Details');
      this.addFieldPair('Propeller Make', data.Propeller_make, 'Propeller Model', data.Propeller_model);
      this.addField('Propeller Serial', data.Propeller_serial);
    }

    // Maintainer Information
    if (data.Maintainer_Name) {
      this.addSection('Maintainer Information');
      this.addFieldPair('Maintainer Name', data.Maintainer_Name, 'Member Number', data.Maintainer_Member_Number);
      this.addField('Maintainer Level', data.Maintainer_Level);
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

export async function generateAccidentPDF(
  data: AccidentFormData,
  metadata?: any
): Promise<Buffer> {
  const generator = new AccidentPDFGenerator();
  return generator.generate(data, metadata);
}
