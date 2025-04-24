export interface TextStyle {
  fontSize: string;
  fontWeight: string;
  color: string;
  alignment: 'left' | 'center' | 'right';
}

export interface ReportTemplateStyles {
  textStyles: {
    title: TextStyle;
    sectionHeaders: TextStyle;
    normalText: TextStyle;
    bodyText: TextStyle;
    footerText: TextStyle;
  };
  lists?: {
    bullet?: {
      style: 'disc' | 'circle' | 'square';
    };
    numbered?: {
      style: 'decimal' | 'lower-alpha' | 'upper-alpha' | 'lower-roman' | 'upper-roman';
    };
    spacing?: number;
  };
  header: {
    logo: {
      position: 'left' | 'center' | 'right';
      maxHeight: string;
    };
    companyName: string;
    companyAddress: string;
    companyPhone: string;
    companyEmail: string;
    companyWebsite: string;
  };
  footer: {
    showPageNumbers: boolean;
    showProjectReference: boolean;
    showDate: boolean;
    customText: string;
  };
  styling: {
    fontFamily: string;
    background: '#FFFFFF';  // Always white for letter page
    text: '#4A5A6B';  // Always use light mode text color
    accent: string;
    margins: {
      top: string;
      bottom: string;
      left: string;
      right: string;
    };
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  type: 'RFI' | 'CityComments' | 'FieldReview' | 'Custom';
  content: string;
  isDefault: boolean;
}