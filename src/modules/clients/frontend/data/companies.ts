export interface Company {
  id: string;
  name: string;
  type: string;
  status: string;
  contacts?: {
    name: string;
    officeNumber: string;
    mobileNumber: string;
    officeAddress: string;
    email: string;
  }[];
}

// Generate sample companies for use across the application
export const generateCompanies = (): Company[] => {
  const baseCompanies = [
    {
      id: "1",
      name: "Acme Corporation",
      type: "Enterprise",
      status: "Active",
      contacts: [
        {
          name: "John Smith",
          officeNumber: "+1 (555) 123-4567",
          mobileNumber: "+1 (555) 987-6543",
          officeAddress: "123 Business Ave, Suite 100, New York, NY 10001",
          email: "john.smith@acme.com"
        },
        {
          name: "Sarah Johnson",
          officeNumber: "+1 (555) 234-5678",
          mobileNumber: "+1 (555) 876-5432",
          officeAddress: "123 Business Ave, Suite 100, New York, NY 10001",
          email: "sarah.johnson@acme.com"
        }
      ]
    },
    {
      id: "2",
      name: "Stellar Solutions",
      type: "SMB",
      status: "Active",
      contacts: [
        {
          name: "Michael Brown",
          officeNumber: "+1 (555) 345-6789",
          mobileNumber: "+1 (555) 765-4321",
          officeAddress: "456 Tech Park, Suite 200, San Francisco, CA 94105",
          email: "michael.brown@stellar.com"
        }
      ]
    },
    {
      id: "3",
      name: "Global Dynamics",
      type: "Enterprise",
      status: "Active",
      contacts: [
        {
          name: "Emily Davis",
          officeNumber: "+1 (555) 456-7890",
          mobileNumber: "+1 (555) 654-3210",
          officeAddress: "789 Corporate Drive, Chicago, IL 60601",
          email: "emily.davis@globaldynamics.com"
        },
        {
          name: "David Wilson",
          officeNumber: "+1 (555) 567-8901",
          mobileNumber: "+1 (555) 543-2109",
          officeAddress: "789 Corporate Drive, Chicago, IL 60601",
          email: "david.wilson@globaldynamics.com"
        }
      ]
    },
    {
      id: "4",
      name: "TechCorp",
      type: "SMB",
      status: "Active",
      contacts: [
        {
          name: "Alex Johnson",
          officeNumber: "+1 (555) 678-9012",
          mobileNumber: "+1 (555) 432-1098",
          officeAddress: "101 Tech Blvd, Austin, TX 78701",
          email: "alex.johnson@techcorp.com"
        }
      ]
    },
    {
      id: "5",
      name: "Innovative Systems",
      type: "Startup",
      status: "Active",
      contacts: [
        {
          name: "Jessica Lee",
          officeNumber: "+1 (555) 789-0123",
          mobileNumber: "+1 (555) 321-0987",
          officeAddress: "202 Innovation Way, Seattle, WA 98101",
          email: "jessica.lee@innovative.com"
        }
      ]
    }
  ];

  // For a real application, you would return more companies
  // For this example, we'll just return the base companies
  return baseCompanies;
};

// Export a list of companies for use in components
export const companies = generateCompanies();