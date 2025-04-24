'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, Plus, Mail, Key, Shield, Building2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Subcontractor {
  id: string;
  name: string;
  email: string;
  company: string;
  specialty: string;
  status: 'Active' | 'Inactive';
  rate: number;
  permissions: {
    projectAccess: boolean;
    timeTracking: boolean;
    documentAccess: boolean;
  };
}

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  profession: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  officeNumber?: string;
  mobileNumber?: string;
  role?: string;
}

export default function SubcontractorsPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [isNewCompanyDialogOpen, setIsNewCompanyDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [contactSearchOpen, setContactSearchOpen] = useState(false);

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  // Generate sample contacts for the dropdown
  const generateContacts = () => {
    return [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@example.com',
        company: 'Smith Engineering',
        profession: 'Structural Engineer'
      },
      {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@example.com',
        company: 'Johnson Design',
        profession: 'Interior Designer'
      },
      {
        id: '3',
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@example.com',
        company: 'Brown Consulting',
        profession: 'Mechanical Engineer'
      },
      {
        id: '4',
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@example.com',
        company: 'Davis Architecture',
        profession: 'Architect'
      }
    ];
  };

  // List of companies for the dropdown
  const [companies, setCompanies] = useState([
    "Smith Engineering",
    "Johnson Design",
    "Brown Consulting",
    "Davis Architecture",
    "Global Dynamics"
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

  const contacts = generateContacts();

  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@contractor.com',
      company: 'Smith Engineering',
      specialty: 'Structural Engineering',
      status: 'Active',
      rate: 150,
      permissions: {
        projectAccess: true,
        timeTracking: true,
        documentAccess: true
      }
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@contractor.com',
      company: 'Johnson Design',
      specialty: 'Interior Design',
      status: 'Active',
      rate: 125,
      permissions: {
        projectAccess: true,
        timeTracking: true,
        documentAccess: false
      }
    }
  ]);

  const [isNewSubcontractorDialogOpen, setIsNewSubcontractorDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<Subcontractor | null>(null);
  const [newContact, setNewContact] = useState<Partial<Contact>>({});
  const [newSubcontractor, setNewSubcontractor] = useState<Partial<Subcontractor>>({
    status: 'Active',
    permissions: {
      projectAccess: true,
      timeTracking: true,
      documentAccess: false
    }
  });

  const [newCompany, setNewCompany] = useState({
    name: '',
    type: 'SMB',
    status: 'Active'
  });

  const handleAddSubcontractor = () => {
    if (newSubcontractor.name && newSubcontractor.email && newSubcontractor.company && newSubcontractor.specialty) {
      const subcontractor: Subcontractor = {
        id: Date.now().toString(),
        name: newSubcontractor.name,
        email: newSubcontractor.email,
        company: newSubcontractor.company,
        specialty: newSubcontractor.specialty,
        status: newSubcontractor.status as 'Active' | 'Inactive',
        rate: newSubcontractor.rate || 0,
        permissions: newSubcontractor.permissions as Subcontractor['permissions'],
      };
      setSubcontractors([...subcontractors, subcontractor]);
      setNewSubcontractor({
        status: 'Active',
        permissions: {
          projectAccess: true,
          timeTracking: true,
          documentAccess: false
        }
      });
      setIsNewSubcontractorDialogOpen(false);
    }
  };

  const handleAddCompany = () => {
    if (newCompany.name) {
      setCompanies([...companies, newCompany.name]);
      setNewContact({
        ...newContact,
        company: newCompany.name
      });
      setIsNewCompanyDialogOpen(false);
      setNewCompany({
        name: '',
        type: 'SMB',
        status: 'Active'
      });
    }
  };

  const handleAddContact = () => {
    if (newContact.firstName && newContact.lastName && newContact.email) {
      setNewSubcontractor({
        ...newSubcontractor,
        name: `${newContact.firstName} ${newContact.lastName}`,
        email: newContact.email,
        company: newContact.company || ''
      });
      setIsContactDialogOpen(false);
      setNewContact({});
    }
  };

  const handleUpdatePermissions = () => {
    if (selectedSubcontractor) {
      setSubcontractors(subcontractors.map(sub => 
        sub.id === selectedSubcontractor.id ? selectedSubcontractor : sub
      ));
      setIsPermissionsDialogOpen(false);
      setSelectedSubcontractor(null);
    }
  };

  const handlePasswordReset = (email: string) => {
    alert(`Password reset email sent to ${email}`);
  };

  const handleStatusToggle = (subcontractorId: string) => {
    setSubcontractors(subcontractors.map(sub => 
      sub.id === subcontractorId
        ? { ...sub, status: sub.status === 'Active' ? 'Inactive' : 'Active' }
        : sub
    ));
  };

  const handleSelectContact = (contact: Contact) => {
    setNewSubcontractor({
      ...newSubcontractor,
      name: `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      company: contact.company || ''
    });
    setContactSearchOpen(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <h1 className="text-2xl font-semibold">Subcontractor Management</h1>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Subcontractors
          </CardTitle>
          <button
            onClick={() => setIsNewSubcontractorDialogOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Subcontractor
          </button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                placeholder="Search subcontractors..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Company</th>
                  <th className="text-left py-3 px-4">Specialty</th>
                  <th className="text-left py-3 px-4">Rate</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subcontractors.map((subcontractor) => (
                  <tr key={subcontractor.id} className="hover:bg-muted/5">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium">{subcontractor.name}</div>
                        <div className="text-sm text-muted-foreground">{subcontractor.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{subcontractor.company}</td>
                    <td className="py-3 px-4">{subcontractor.specialty}</td>
                    <td className="py-3 px-4">${subcontractor.rate}/hr</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={subcontractor.status === 'Active'}
                          onCheckedChange={() => handleStatusToggle(subcontractor.id)}
                        />
                        <span className={`text-sm ${
                          subcontractor.status === 'Active' ? 'text-green-600' : 'text-muted-foreground'
                        }`}>
                          {subcontractor.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 hover:bg-muted rounded-full transition-colors">
                            <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 3C8.55228 3 9 2.55228 9 2C9 1.44772 8.55228 1 8 1C7.44772 1 7 1.44772 7 2C7 2.55228 7.44772 3 8 3Z" fill="currentColor"/>
                              <path d="M8 9C8.55228 9 9 8.55228 9 8C9 7.44772 8.55228 7 8 7C7.44772 7 7 7.44772 7 8C7 8.55228 7.44772 9 8 9Z" fill="currentColor"/>
                              <path d="M8 15C8.55228 15 9 14.5523 9 14C9 13.4477 8.55228 13 8 13C7.44772 13 7 13.4477 7 14C7 14.5523 7.44772 15 8 15Z" fill="currentColor"/>
                            </svg>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSubcontractor(subcontractor);
                              setIsPermissionsDialogOpen(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Shield className="w-4 h-4" />
                            <span>Permissions</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handlePasswordReset(subcontractor.email)}
                            className="flex items-center gap-2"
                          >
                            <Key className="w-4 h-4" />
                            <span>Reset Password</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                          >
                            <Mail className="w-4 h-4" />
                            <span>Send Email</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* New Subcontractor Dialog */}
      <Dialog open={isNewSubcontractorDialogOpen} onOpenChange={setIsNewSubcontractorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Subcontractor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <div className="flex gap-2">
                <button
                  onClick={() => setIsContactDialogOpen(true)}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                </button>
                <Popover open={contactSearchOpen} onOpenChange={setContactSearchOpen}>
                  <PopoverTrigger asChild>
                    <button
                      className="flex-1 flex items-center justify-between px-3 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted-foreground dark:placeholder:text-[#6B7280]"
                    >
                      {newSubcontractor.name || "Select a contact..."}
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[300px]">
                    <Command>
                      <CommandInput placeholder="Search contacts..." />
                      <CommandEmpty>
                        No contact found. 
                        <button 
                          onClick={() => {
                            setContactSearchOpen(false);
                            setIsContactDialogOpen(true);
                          }}
                          className="ml-1 text-primary hover:underline"
                        >
                          Add new contact
                        </button>
                      </CommandEmpty>
                      <CommandGroup>
                        {contacts.map((contact) => (
                          <CommandItem
                            key={contact.id}
                            onSelect={() => handleSelectContact(contact)}
                            className="flex flex-col items-start"
                          >
                            <div className="font-medium">{contact.firstName} {contact.lastName}</div>
                            <div className="text-sm text-muted-foreground">{contact.email}</div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="bg-muted/5 p-4 rounded-md border border-[#4DB6AC] dark:border-[#4DB6AC]">
              <div className="text-sm text-muted-foreground mb-2">Contact Details</div>
              <div className="text-sm">
                {newSubcontractor.name && (
                  <div className="font-medium">{newSubcontractor.name}</div>
                )}
                {newSubcontractor.company && (
                  <div>{newSubcontractor.company}</div>
                )}
                {newContact.addressLine1 && (
                  <div>
                    {newContact.addressLine1}
                    {newContact.addressLine2 && `, ${newContact.addressLine2}`}
                    {newContact.city && `, ${newContact.city}`}
                    {newContact.state && `, ${newContact.state}`}
                    {newContact.zip && ` ${newContact.zip}`}
                  </div>
                )}
                {newSubcontractor.email && (
                  <div>{newSubcontractor.email}</div>
                )}
                {(newContact.officeNumber || newContact.mobileNumber) && (
                  <div>
                    {newContact.officeNumber && `Office: ${newContact.officeNumber}`}
                    {newContact.officeNumber && newContact.mobileNumber && ' | '}
                    {newContact.mobileNumber && `Mobile: ${newContact.mobileNumber}`}
                  </div>
                )}
              </div>
            </div>
            {newSubcontractor.company && (
              <div className="bg-muted/5 p-4 rounded-md border border-[#4DB6AC] dark:border-[#4DB6AC]">
                <h3 className="text-sm font-medium mb-2">Contact Information</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-start">
                    <span className="w-20 text-muted-foreground">Company:</span>
                    <span className="flex-1">{newSubcontractor.company}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-20 text-muted-foreground">Email:</span>
                    <span className="flex-1">{newSubcontractor.email}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-20 text-muted-foreground">Address:</span>
                    <span className="flex-1">
                      {newContact.addressLine1 && `${newContact.addressLine1}, `}
                      {newContact.city && `${newContact.city}, `}
                      {newContact.state && `${newContact.state} `}
                      {newContact.zip && newContact.zip}
                    </span>
                  </div>
                  <div className="flex items-start">
                    <span className="w-20 text-muted-foreground">Phone:</span>
                    <span className="flex-1">
                      {newContact.officeNumber && `Office: ${newContact.officeNumber}`}
                      {newContact.officeNumber && newContact.mobileNumber && <br />}
                      {newContact.mobileNumber && `Mobile: ${newContact.mobileNumber}`}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div>
              <input
                type="number"
                value={newSubcontractor.rate || ''}
                onChange={(e) => setNewSubcontractor({ ...newSubcontractor, rate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted-foreground dark:placeholder:text-[#6B7280]"
                min="0"
                step="0.01"
                placeholder="Hourly Rate"
              />
            </div>
            
            <div>
              <select
                value={newSubcontractor.permissions?.projectAccess ? "full" : "limited"}
                onChange={(e) => {
                  const value = e.target.value;
                  setNewSubcontractor({
                    ...newSubcontractor,
                    permissions: {
                      projectAccess: value === "full",
                      timeTracking: value === "full",
                      documentAccess: value === "full"
                    }
                  });
                }}
                className="w-full px-3 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted-foreground dark:placeholder:text-[#6B7280]"
              >
                <option value="">Select permissions level...</option>
                <option value="full">Full Access</option>
                <option value="limited">Limited Access</option>
              </select>
            </div>
            <div>
              <select
                value={newSubcontractor.role || ''}
                onChange={(e) => setNewSubcontractor({ ...newSubcontractor, role: e.target.value })}
                className="w-full px-3 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted-foreground dark:placeholder:text-[#6B7280]"
              >
                <option value="">Select a role...</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsNewSubcontractorDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium bg-muted/10 hover:bg-muted/20 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddSubcontractor}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-2"
            >
              Add Subcontractor
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Contact Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2"> 
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  value={newContact.firstName || ''}
                  onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border rounded-md"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={newContact.lastName || ''}
                  onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border rounded-md"
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="tel"
                  value={newContact.officeNumber || ''}
                  onChange={(e) => setNewContact({ ...newContact, officeNumber: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border rounded-md"
                  placeholder="Enter office number"
                />
              </div>

              <div>
                <input
                  type="tel"
                  value={newContact.mobileNumber || ''}
                  onChange={(e) => setNewContact({ ...newContact, mobileNumber: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border rounded-md"
                  placeholder="Enter mobile number"
                />
              </div>
            </div>

            <div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={newContact.addressLine1 || ''}
                  onChange={(e) => setNewContact({ ...newContact, addressLine1: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border rounded-md"
                  placeholder="Address Line 1"
                />
                <input
                  type="text"
                  value={newContact.addressLine2 || ''}
                  onChange={(e) => setNewContact({ ...newContact, addressLine2: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border rounded-md"
                  placeholder="Address Line 2 (Optional)"
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newContact.city || ''}
                    onChange={(e) => setNewContact({ ...newContact, city: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded-md"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={newContact.state || ''}
                    onChange={(e) => setNewContact({ ...newContact, state: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded-md"
                    placeholder="State"
                  />
                  <input
                    type="text"
                    value={newContact.zip || ''}
                    onChange={(e) => setNewContact({ ...newContact, zip: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded-md"
                    placeholder="ZIP Code"
                  />
                </div>
              </div>
            </div>

            <div>
              <input
                type="email"
                value={newContact.email || ''}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border rounded-md"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <select
                value={newContact.profession || ''}
                onChange={(e) => setNewContact({ ...newContact, profession: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border rounded-md"
              >
                <option value="">Select a profession...</option>
                {professions.map((profession) => (
                  <option key={profession} value={profession}>{profession}</option>
                ))}
              </select>
            </div>
            
            <div>
              <select
                value={newContact.role || ''}
                onChange={(e) => setNewContact({ ...newContact, role: e.target.value })}
                className="w-full px-3 py-1.5 text-sm border rounded-md"
              >
                <option value="">Select a role...</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>
            
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
                className="flex-1 px-3 py-1.5 text-sm border rounded-md"
              >
                <option value="">Select a company...</option>
                {companies.map((company) => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsContactDialogOpen(false)}
              className="px-3 py-1.5 text-sm font-medium bg-muted/10 hover:bg-muted/20 rounded-md transition-colors"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Company Type
              </label>
              <select
                value={newCompany.type}
                onChange={(e) => setNewCompany({ ...newCompany, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="SMB">Small/Medium Business</option>
                <option value="Enterprise">Enterprise</option>
                <option value="Startup">Startup</option>
                <option value="Freelancer">Freelancer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Status
              </label>
              <select
                value={newCompany.status}
                onChange={(e) => setNewCompany({ ...newCompany, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsNewCompanyDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium bg-muted/10 hover:bg-muted/20 rounded-md transition-colors"
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