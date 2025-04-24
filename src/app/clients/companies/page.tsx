"use client";

import { Building2, Search, Plus, ChevronDown, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePagination } from '@/hooks/usePagination';
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';

interface Company {
  name: string;
  type: string;
  status: string;
  contacts: {
    name: string;
    officeNumber: string;
    mobileNumber: string;
    officeAddress: string;
    email: string;
  }[];
}

const generateCompanies = () => {
  const baseCompanies = [
    {
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
      name: "Stellar Solutions",
      type: "SMB",
      status: "Pending",
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
      name: "Global Dynamics",
      type: "Enterprise",
      status: "Inactive",
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
    }
  ];

  return Array.from({ length: 250 }, (_, index) => {
    const baseCompany = baseCompanies[index % baseCompanies.length];
    return {
      ...baseCompany,
      name: `${baseCompany.name} ${Math.floor(index / baseCompanies.length) + 1}`,
    };
  });
};

// Export companies for use in other components
export const companies = generateCompanies();

export default function Companies() {
  const { user } = useAuth();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [isNewCompanyDialogOpen, setIsNewCompanyDialogOpen] = useState(false);
  const [newCompany, setNewCompany] = useState<Partial<Company>>({
    name: '',
    type: 'SMB',
    status: 'Active',
    contacts: []
  });

  const canCreateCompany = user?.role === 'admin' || user?.role === 'project_management';

  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    currentItems: paginatedCompanies,
    totalPages,
    totalItems
  } = usePagination({
    items: companies,
    itemsPerPage: 100
  });

  const toggleRow = (index: number) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedRows(newExpandedRows);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-primary text-primary-foreground';
      case 'Pending':
        return 'bg-secondary text-secondary-foreground';
      case 'Inactive':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const handleAddCompany = () => {
    if (newCompany.name) {
      // In a real app, this would be an API call to create the company
      setIsNewCompanyDialogOpen(false);
      setNewCompany({
        name: '',
        type: 'SMB',
        status: 'Active',
        contacts: []
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-primary" />
          <h1 className="text-h1">Companies</h1>
        </div>
        {canCreateCompany && (
          <button 
            onClick={() => setIsNewCompanyDialogOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Company</span>
          </button>
        )}
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
          <input
            type="text"
            placeholder="Search companies..."
            className="w-full pl-10 pr-4 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-card-muted"
          />
        </div>
      </div>

      <div className="bg-card text-card-foreground rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted text-muted-foreground">
                <th className="w-10 px-4 py-2"></th>
                <th className="px-4 py-2 text-left text-button">Name</th>
                <th className="px-4 py-2 text-left text-button">Type</th>
                <th className="px-4 py-2 text-left text-button">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedCompanies.map((company, index) => (
                <>
                  <tr
                    key={`company-${index}`}
                    className="hover:bg-muted/5 transition-colors duration-150"
                  >
                    <td className="px-4 py-2">
                      <button
                        onClick={() => toggleRow(index)}
                        className="icon-button"
                      >
                        {expandedRows.has(index) ? (
                          <ChevronDown className="w-4 h-4 text-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-foreground" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-body font-medium">
                      {company.name}
                    </td>
                    <td className="px-4 py-2 text-foreground">
                      {company.type}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(company.status)}`}>
                        {company.status}
                      </span>
                    </td>
                  </tr>
                  {expandedRows.has(index) && (
                    <tr key={`contacts-${index}`} className="bg-muted/10">
                      <td colSpan={4} className="px-4 py-2">
                        <div className="ml-4 space-y-2">
                          <h3 className="text-sm font-semibold text-foreground">Contacts</h3>
                          <div className="space-y-2">
                            {company.contacts.map((contact, contactIndex) => (
                              <div
                                key={contactIndex}
                                className="bg-card p-3 rounded-lg border border-border"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{contact.name}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-foreground">Office: {contact.officeNumber}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-foreground">Mobile: {contact.mobileNumber}</span>
                                  </div>
                                  <div className="flex items-center gap-2 md:col-span-2">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-foreground">{contact.officeAddress}</span>
                                  </div>
                                  <div className="flex items-center gap-2 md:col-span-2">
                                    <Mail className="w-4 h-4 text-muted-foreground" />
                                    <a
                                      href={`mailto:${contact.email}`}
                                      className="text-primary hover:underline"
                                    >
                                      {contact.email}
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={totalItems}
          />
        </div>
      </div>

      {/* New Company Dialog */}
      <Dialog open={isNewCompanyDialogOpen} onOpenChange={setIsNewCompanyDialogOpen}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg">New Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={newCompany.name || ''}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-card-muted"
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Company Type
              </label>
              <select
                value={newCompany.type || 'SMB'}
                onChange={(e) => setNewCompany({ ...newCompany, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
              >
                <option value="Enterprise">Enterprise</option>
                <option value="SMB">SMB</option>
                <option value="Startup">Startup</option>
                <option value="Government">Government</option>
                <option value="Non-Profit">Non-Profit</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Status
              </label>
              <select
                value={newCompany.status || 'Active'}
                onChange={(e) => setNewCompany({ ...newCompany, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsNewCompanyDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium bg-muted/10 hover:bg-muted/20 rounded-md transition-colors text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCompany}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-2"
            >
              Add Company
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}