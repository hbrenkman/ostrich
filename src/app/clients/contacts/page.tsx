"use client";

import { useState } from 'react';
import { Users, Search, Plus, Mail, Phone, MapPin, Briefcase, UserCog } from 'lucide-react';
import { Building2, UserPlus } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Contacts() {
  const { user } = useAuth();
  const canCreateContact = user?.role === 'admin' || user?.role === 'project_management';
  const [isNewContactDialogOpen, setIsNewContactDialogOpen] = useState(false);
  const [isNewCompanyDialogOpen, setIsNewCompanyDialogOpen] = useState(false);
  const [isEditContactDialogOpen, setIsEditContactDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    officeNumber: '',
    mobileNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
    email: '',
    profession: '',
    role: '',
    company: ''
  });

  const [newCompany, setNewCompany] = useState({
    name: '',
    type: 'SMB',
    status: 'Active'
  });

  // List of companies for the dropdown
  const [companies, setCompanies] = useState([
    "Acme Corporation",
    "Stellar Solutions",
    "Global Dynamics",
    "TechCorp",
    "Innovative Systems"
  ]);

  const professions = [
    'Architect',
    'Engineer',
    'Project Manager',
    'Contractor',
    'Consultant',
    'Designer',
    'Other'
  ];

  const roles = [
    'Principal',
    'Project Lead',
    'Team Member',
    'Consultant',
    'Client Representative',
    'Stakeholder',
    'Other'
  ];

  const generateContacts = () => {
    const baseContacts = [
      {
        firstName: "John",
        lastName: "Smith",
        officeNumber: "+1 (555) 123-4567",
        mobileNumber: "+1 (555) 987-6543",
        addressLine1: "123 Business Ave",
        addressLine2: "Suite 100",
        city: "New York",
        state: "NY",
        zip: "10001",
        profession: "Architect",
        role: "Principal",
        email: "john.smith@example.com"
      },
      {
        firstName: "Sarah",
        lastName: "Johnson",
        officeNumber: "+1 (555) 234-5678",
        mobileNumber: "+1 (555) 876-5432",
        addressLine1: "456 Corporate Blvd",
        addressLine2: "Floor 15",
        city: "Chicago",
        state: "IL",
        zip: "60601",
        profession: "Engineer",
        role: "Project Lead",
        email: "sarah.johnson@example.com"
      },
      {
        firstName: "Michael",
        lastName: "Brown",
        officeNumber: "+1 (555) 345-6789",
        mobileNumber: "+1 (555) 765-4321",
        addressLine1: "789 Enterprise St",
        addressLine2: "Building B",
        city: "San Francisco",
        state: "CA",
        zip: "94105",
        profession: "Consultant",
        role: "Team Member",
        email: "michael.brown@example.com"
      }
    ];

    return Array.from({ length: 250 }, (_, index) => {
      const baseContact = baseContacts[index % baseContacts.length];
      return {
        ...baseContact,
        firstName: `${baseContact.firstName} ${Math.floor(index / baseContacts.length) + 1}`,
        email: `${baseContact.email.split('@')[0]}${Math.floor(index / baseContacts.length) + 1}@example.com`,
      };
    });
  };

  const contacts = generateContacts();

  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    currentItems: paginatedContacts,
    totalPages,
    totalItems
  } = usePagination({
    items: contacts,
    itemsPerPage: 100
  });

  const handleAddContact = () => {
    if (newContact.firstName && newContact.lastName && newContact.email) {
      // In a real app, this would be an API call
      setIsNewContactDialogOpen(false);
      setNewContact({
        firstName: '',
        lastName: '',
        officeNumber: '',
        mobileNumber: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zip: '',
        email: '',
        profession: '',
        role: '',
        company: ''
      });
    }
  };

  const handleAddCompany = () => {
    if (newCompany.name) {
      // Add the new company to the list
      setCompanies([...companies, newCompany.name]);
      
      // Update the contact with the new company
      setNewContact({
        ...newContact,
        company: newCompany.name
      });
      
      // Close the dialog
      setIsNewCompanyDialogOpen(false);
      setNewCompany({
        name: '',
        type: 'SMB',
        status: 'Active'
      });
    }
  };

  const handleEditContact = () => {
    if (editingContact.firstName && editingContact.lastName && editingContact.email) {
      // In a real app, this would be an API call to update the contact
      setIsEditContactDialogOpen(false);
      setEditingContact(null);
    }
  };

  const handleContactClick = (contact: any) => {
    setEditingContact(contact);
    setIsEditContactDialogOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-h1">Contacts</h1>
        </div>
        {canCreateContact && (
          <button
            onClick={() => setIsNewContactDialogOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Contact</span>
          </button>
        )}
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
          <input
            type="text"
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-[var(--placeholder-text)] dark:placeholder:text-[var(--placeholder-text)]"
          />
        </div>
      </div>

      <div className="bg-card text-card-foreground rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted text-muted-foreground border-b border-border">
                <th className="px-4 py-2 text-left text-button">Name</th>
                <th className="px-4 py-2 text-left text-button">Office Number</th>
                <th className="px-4 py-2 text-left text-button">Mobile Number</th>
                <th className="px-4 py-2 text-left text-button">Office Address</th>
                <th className="px-4 py-2 text-left text-button">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedContacts.map((contact, index) => (
                <tr
                  key={contact.email}
                  onClick={() => handleContactClick(contact)}
                  className="hover:bg-muted/5 transition-colors duration-150"
                >
                  <td className="px-4 py-2 text-foreground font-medium">
                    {contact.firstName} {contact.lastName}
                  </td>
                  <td className="px-4 py-2 text-foreground">
                    {contact.officeNumber}
                  </td>
                  <td className="px-4 py-2 text-foreground">
                    {contact.mobileNumber}
                  </td>
                  <td className="px-4 py-2 text-foreground">
                    {[contact.addressLine1, contact.addressLine2, contact.city, contact.state, contact.zip]
                      .filter(Boolean)
                      .join(', ')}
                  </td>
                  <td className="px-4 py-2">
                    <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                      {contact.email}
                    </a>
                  </td>
                </tr>
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

      {/* New Contact Dialog */}
      <Dialog open={isNewContactDialogOpen} onOpenChange={setIsNewContactDialogOpen}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg">New Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2"> 
            <div className="grid grid-cols-2 gap-4">
              <div>
               <input
                 type="text"
                 value={newContact.firstName}
                 onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                 className="w-full px-3 py-1.5 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted dark:placeholder:text-[#6B7280]"
                 placeholder="Enter first name"
               />
              </div>
              <div>
                <input
                  type="text"
                  value={newContact.lastName}
                  onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted dark:placeholder:text-[#6B7280]"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="tel"
                  value={newContact.officeNumber}
                  onChange={(e) => setNewContact({ ...newContact, officeNumber: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted dark:placeholder:text-[#6B7280]"
                  placeholder="Enter office number"
                />
              </div>

              <div>
                <input
                  type="tel"
                  value={newContact.mobileNumber}
                  onChange={(e) => setNewContact({ ...newContact, mobileNumber: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted dark:placeholder:text-[#6B7280]"
                  placeholder="Enter mobile number"
                />
              </div>
            </div>

            <div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newContact.addressLine1}
                  onChange={(e) => setNewContact({ ...newContact, addressLine1: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted dark:placeholder:text-[#6B7280]"
                  placeholder="Address Line 1"
                />
                <input
                  type="text"
                  value={newContact.addressLine2}
                  onChange={(e) => setNewContact({ ...newContact, addressLine2: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted dark:placeholder:text-[#6B7280]"
                  placeholder="Address Line 2 (Optional)"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newContact.city}
                    onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted dark:placeholder:text-[#6B7280]"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={newContact.state}
                    onChange={(e) => setNewContact({ ...newContact, state: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted dark:placeholder:text-[#6B7280]"
                    placeholder="State"
                  />
                  <input
                    type="text"
                    value={newContact.zip}
                    onChange={(e) => setNewContact({ ...newContact, zip: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted dark:placeholder:text-[#6B7280]"
                    placeholder="ZIP Code"
                  />
                </div>
              </div>
            </div>

            <div>
              <input
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted dark:placeholder:text-[#6B7280]"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <select
                value={newContact.profession}
                onChange={(e) => setNewContact({ ...newContact, profession: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted dark:placeholder:text-[#6B7280]"
              >
                <option value="">Select a profession...</option>
                {professions.map((profession) => (
                  <option key={profession} value={profession}>{profession}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={newContact.role}
                onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted dark:placeholder:text-[#6B7280]"
              >
                <option value="">Select a role...</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCompanyDialogOpen(true)}
                  className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Building2 className="w-4 h-4" />
                </button>
                <select
                  value={newContact.company || ''}
                  onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                  className="flex-1 px-3 py-1.5 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted dark:placeholder:text-[#6B7280]"
                >
                  <option value="">Select a company...</option>
                  {companies.map((company) => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsNewContactDialogOpen(false)}
              className="px-3 py-1.5 text-sm font-medium bg-muted/10 hover:bg-muted/20 rounded-md transition-colors text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleAddContact}
              className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-2"
            >
              Add Contact
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                className="w-full px-3 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-card-muted"
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Company Type
              </label>
              <select
                value={newCompany.type}
                onChange={(e) => setNewCompany({ ...newCompany, type: e.target.value })}
                className="w-full px-3 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
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
                value={newCompany.status}
                onChange={(e) => setNewCompany({ ...newCompany, status: e.target.value })}
                className="w-full px-3 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
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

      {/* Edit Contact Dialog */}
      <Dialog open={isEditContactDialogOpen} onOpenChange={setIsEditContactDialogOpen}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg">Edit Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2"> 
            <div className="grid grid-cols-2 gap-4">
              <div>
               <input
                 type="text"
                 value={editingContact?.firstName || ''}
                 onChange={(e) => setEditingContact({ ...editingContact, firstName: e.target.value })}
                 className="w-full px-3 py-1.5 text-sm border border-[var(--accent)] dark:border-[var(--accent)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background dark:bg-[var(--card)] text-foreground placeholder:text-[var(--placeholder-text)] dark:placeholder:text-[var(--placeholder-text)]"
                 placeholder="Enter first name"
               />
              </div>
              <div>
                <input
                  type="text"
                  value={editingContact?.lastName || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, lastName: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-[var(--accent)] dark:border-[var(--accent)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background dark:bg-[var(--card)] text-foreground placeholder:text-[var(--placeholder-text)] dark:placeholder:text-[var(--placeholder-text)]"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="tel"
                  value={editingContact?.officeNumber || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, officeNumber: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-[var(--accent)] dark:border-[var(--accent)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background dark:bg-[var(--card)] text-foreground placeholder:text-[var(--placeholder-text)] dark:placeholder:text-[var(--placeholder-text)]"
                  placeholder="Enter office number"
                />
              </div>

              <div>
                <input
                  type="tel"
                  value={editingContact?.mobileNumber || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, mobileNumber: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-[var(--accent)] dark:border-[var(--accent)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background dark:bg-[var(--card)] text-foreground placeholder:text-[var(--placeholder-text)] dark:placeholder:text-[var(--placeholder-text)]"
                  placeholder="Enter mobile number"
                />
              </div>
            </div>

            <div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={editingContact?.addressLine1 || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, addressLine1: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-[var(--accent)] dark:border-[var(--accent)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background dark:bg-[var(--card)] text-foreground placeholder:text-[var(--placeholder-text)] dark:placeholder:text-[var(--placeholder-text)]"
                  placeholder="Address Line 1"
                />
                <input
                  type="text"
                  value={editingContact?.addressLine2 || ''}
                  onChange={(e) => setEditingContact({ ...editingContact, addressLine2: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-[var(--accent)] dark:border-[var(--accent)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background dark:bg-[var(--card)] text-foreground placeholder:text-[var(--placeholder-text)] dark:placeholder:text-[var(--placeholder-text)]"
                  placeholder="Address Line 2 (Optional)"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={editingContact?.city || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, city: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-[var(--accent)] dark:border-[var(--accent)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background dark:bg-[var(--card)] text-foreground placeholder:text-[var(--placeholder-text)] dark:placeholder:text-[var(--placeholder-text)]"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={editingContact?.state || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, state: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-[var(--accent)] dark:border-[var(--accent)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background dark:bg-[var(--card)] text-foreground placeholder:text-[var(--placeholder-text)] dark:placeholder:text-[var(--placeholder-text)]"
                    placeholder="State"
                  />
                  <input
                    type="text"
                    value={editingContact?.zip || ''}
                    onChange={(e) => setEditingContact({ ...editingContact, zip: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border border-[var(--accent)] dark:border-[var(--accent)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background dark:bg-[var(--card)] text-foreground placeholder:text-[var(--placeholder-text)] dark:placeholder:text-[var(--placeholder-text)]"
                    placeholder="ZIP Code"
                  />
                </div>
              </div>
            </div>

            <div>
              <input
                type="email"
                value={editingContact?.email || ''}
                onChange={(e) => setEditingContact({ ...editingContact, email: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-[var(--accent)] dark:border-[var(--accent)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background dark:bg-[var(--card)] text-foreground placeholder:text-[var(--placeholder-text)] dark:placeholder:text-[var(--placeholder-text)]"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <select
                value={editingContact?.profession || ''}
                onChange={(e) => setEditingContact({ ...editingContact, profession: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-[var(--accent)] dark:border-[var(--accent)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background dark:bg-[var(--card)] text-foreground placeholder:text-[var(--placeholder-text)] dark:placeholder:text-[var(--placeholder-text)]"
              >
                <option value="">Select a profession...</option>
                {professions.map((profession) => (
                  <option key={profession} value={profession}>{profession}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={editingContact?.role || ''}
                onChange={(e) => setEditingContact({ ...editingContact, role: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-[var(--accent)] dark:border-[var(--accent)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background dark:bg-[var(--card)] text-foreground placeholder:text-[var(--placeholder-text)] dark:placeholder:text-[var(--placeholder-text)]"
              >
                <option value="">Select a role...</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <div>
              <input
                type="text"
                value={editingContact?.company || ''}
                onChange={(e) => setEditingContact({ ...editingContact, company: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border border-[var(--accent)] dark:border-[var(--accent)] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background dark:bg-[var(--card)] text-foreground placeholder:text-[var(--placeholder-text)] dark:placeholder:text-[var(--placeholder-text)]"
                placeholder="Enter company name"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsEditContactDialogOpen(false)}
              className="px-3 py-1.5 text-sm font-medium bg-muted/10 hover:bg-muted/20 rounded-md transition-colors text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleEditContact}
              className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-2"
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}