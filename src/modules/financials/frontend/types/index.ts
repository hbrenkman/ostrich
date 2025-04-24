export interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  description: string;
  project: string;
  company: string;
  contact: string;
}

export interface TextStyle {
  fontSize: string;
  fontWeight: string;
  color: string;
  alignment: 'left' | 'center' | 'right';
}

export interface AddressStyle extends TextStyle {
  format: 'inline' | 'multiline';
  separator: string;
}

export interface InvoiceTemplateStyles {
  textStyles: {
    companyName: TextStyle;
    invoiceTitle: TextStyle;
    sectionHeaders: TextStyle;
    normalText: TextStyle;
    footerText: TextStyle;
    notesText: TextStyle;
  };
  addressFormat: {
    billTo: AddressStyle;
    shipTo: AddressStyle;
  };
  layout: {
    margins: {
      top: string;
    };
    logo: {
      position: 'left' | 'center' | 'right';
      maxHeight: string;
    };
  };
  footer: {
    companyAddress: string;
    companyPhone: string;
    companyEmail: string;
    companyWebsite: string;
    notes: string;
  };
  styling: {
    fontFamily: string;
    background: string;
    text: string;
    accent: string;
    tableStyle: 'simple' | 'bordered' | 'striped';
    clientInfoLayout: 'standard' | 'compact' | 'detailed';
    addressFormat: 'standard' | 'international' | 'compact';
  };
}

export interface InvoiceTemplate {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}