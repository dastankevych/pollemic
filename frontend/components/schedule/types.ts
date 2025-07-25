// Type definitions for schedule components

// Form error messages
export interface FormErrors {
  [key: string]: string;
}

// Settings for weekly schedule
export interface WeekdaySettings {
  // Add properties as needed for weekly schedule settings
  time?: string;
  // Other potential properties based on application needs
}

// Configuration for specific dates
export interface SpecificDateConfig {
  startDate?: Date;
  endDate?: Date;
  time?: string;
  // Other potential properties based on application needs
}