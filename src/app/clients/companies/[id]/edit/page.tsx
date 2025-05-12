'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database } from '@/types/supabase';
import { Building2, MapPin, Phone, Plus, Trash, ArrowLeft, Search, Tag, Edit, UserPlus, User } from 'lucide-react';
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { updateContactLocation } from '@/lib/actions/updateContact';
import React from 'react';
import dynamic from 'next/dynamic';
import { verifyAddress } from '@/lib/geocodio';
import { toast } from 'react-hot-toast';
import { createLocation, updateLocation, deleteLocation } from '@/lib/actions/locations';
import { Toaster } from 'react-hot-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

// Error Boundary Component
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto p-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p>Something went wrong. Please try refreshing the page.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Utility to debounce a function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Custom throttle function
function throttle(func: (...args: any[]) => void, wait: number) {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: any[]) => {
    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null;
        func(...args);
      }, wait);
    }
  };
}

// Throttled mousemove handler
const handleMouseMove = throttle((e: MouseEvent) => {
  console.log('Throttled mousemove:', {
    clientX: e.clientX,
    clientY: e.clientY,
    timestamp: new Date().toISOString()
  });
}, 100);

type Industry = Database['public']['Tables']['industries']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];

interface Location {
  id: string;
  company_id: string;
  location_type_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
  contacts: Contact[];
  is_headquarters: boolean;
  status: string;
}

interface LocationType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  direct_phone: string;
  role_id: string;
  role?: Role;
  location_id: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

interface CompanyWithRelations {
  id: string;
  name: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
  industries: { industry: { id: string; name: string } }[];
  locations: Location[];
  unassignedContacts: Contact[];
  status: string;
  industry_id?: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

const SearchInput = dynamic(() => Promise.resolve(({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(value);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setLocalValue('');
      onChange('');
    }
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search contacts..."
        className="w-full pr-10"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        spellCheck="false"
      />
      <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
    </div>
  );
}), { ssr: false });

SearchInput.displayName = 'SearchInput';

interface UnassignedContactsProps {
  contacts: Contact[];
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contact: Contact) => void;
}

function UnassignedContacts({ contacts, onEditContact, onDeleteContact }: UnassignedContactsProps) {
  const [isAddContactDialogOpen, setIsAddContactDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    direct_phone: '',
    role_id: '',
    location_id: '',
    is_primary: false
  });

  const handleAddContact = async () => {
    try {
      if (!newContact.first_name || !newContact.last_name || !newContact.email) {
        toast.error('First name, last name, and email are required');
        return;
      }

      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          ...newContact,
          location_id: null,
          status: 'Active'
        }])
        .select()
        .single();

      if (error) throw error;

      // Update the local state with the new contact
      onEditContact(data);

      setNewContact({
        first_name: '',
        last_name: '',
        email: '',
        mobile: '',
        direct_phone: '',
        role_id: '',
        location_id: '',
        is_primary: false
      });
      setIsAddContactDialogOpen(false);
      toast.success('Contact added successfully');
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add contact');
    }
  };

  const sortedContacts = [...contacts].sort((a, b) => 
    `${a.first_name}${a.last_name}`.localeCompare(`${b.first_name}${b.last_name}`)
  );

  const formatPhoneNumber = (phone: string | undefined | null) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, contactId: string) => {
    e.dataTransfer.setData('contactId', contactId);
    e.currentTarget.classList.add('opacity-50');
    document.addEventListener('mousemove', handleMouseMove);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
    document.removeEventListener('mousemove', handleMouseMove);
  };

  const filteredContacts = sortedContacts.filter(contact => {
    const searchLower = searchQuery.trim().toLowerCase();
    if (!searchLower) return true; // Show all contacts when search is empty or only whitespace

    const normalizeString = (str: string | null | undefined) => 
      (str || '').toLowerCase().trim().replace(/\s+/g, ' ');

    // Create normalized versions of first and last name
    const firstName = normalizeString(contact.first_name);
    const lastName = normalizeString(contact.last_name);
    const fullName = `${firstName} ${lastName}`;
    
    // Split search query into words for more flexible matching
    const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);

    // First check if the search matches the full name
    if (fullName.includes(searchLower)) return true;

    // Then check if each word matches either first name or last name
    return searchWords.every(word => 
      firstName.includes(word) || lastName.includes(word) ||
      // Also check other fields for exact matches
      normalizeString(contact.email) === word ||
      normalizeString(contact.role?.name) === word ||
      normalizeString(contact.mobile) === word ||
      normalizeString(contact.direct_phone) === word
    );
  });

  return (
    <Card className="h-[800px] flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Unassigned Contacts</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAddContactDialogOpen(true)}
            className="h-8 w-8"
          >
            <UserPlus className="h-4 w-4" />
            <span className="sr-only">Add Contact</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          <SearchInput 
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <div className="space-y-2">
            {filteredContacts
              .map(contact => (
                <div
                  key={contact.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, contact.id)}
                  onDragEnd={handleDragEnd}
                  className="p-2 rounded border cursor-move hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditContact(contact)}
                            className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteContact(contact)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 text-sm text-gray-500 mt-1">
                        {contact.role?.name && (
                          <p className="text-sm font-medium text-gray-600 capitalize">{contact.role.name}</p>
                        )}
                        {contact.email && (
                          <p className="text-sm text-gray-500 truncate">{contact.email}</p>
                        )}
                        {contact.mobile && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span className="truncate">Mobile: {formatPhoneNumber(contact.mobile)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            {filteredContacts.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No unassigned contacts found
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <Dialog open={isAddContactDialogOpen} onOpenChange={setIsAddContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Fill in the contact details below. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={newContact.first_name}
                  onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={newContact.last_name}
                  onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role_id"
                value={newContact.role_id}
                onChange={(e) => setNewContact({ ...newContact, role_id: e.target.value })}
                className="w-full px-3 py-2 mt-1 border rounded-md"
              >
                <option value="">Select role...</option>
                {/* Add role options here */}
              </select>
            </div>

            <div>
              <Label htmlFor="mobile">Mobile Phone</Label>
              <Input
                id="mobile"
                value={newContact.mobile}
                onChange={(e) => setNewContact({ ...newContact, mobile: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="direct_phone">Direct Phone</Label>
              <Input
                id="direct_phone"
                value={newContact.direct_phone}
                onChange={(e) => setNewContact({ ...newContact, direct_phone: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddContactDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddContact}>
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

UnassignedContacts.displayName = 'UnassignedContacts';

interface LocationsListProps {
  locations: Location[];
  locationTypes: LocationType[];
  contacts: Contact[];
  onDeleteLocation: (id: string) => void;
  onAddLocation: () => void;
  onLocationTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onAddressChange: (address: string) => void;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onStatusChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onClearLocation: () => void;
  newLocation: Partial<Location>;
  addressInput: string;
  onDropContact: (contactId: string, locationId: string) => Promise<void>;
  onUnassignContact: (contactId: string) => Promise<void>;
  isUpdatingContact: string | null;
  onEditLocation: (location: Location) => void;
  isEditing: boolean;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contact: Contact) => void;
}

const LocationsList = dynamic(() => Promise.resolve(({ 
  locations,
  locationTypes,
  contacts,
  onDeleteLocation,
  onAddLocation,
  onLocationTypeChange,
  onAddressChange,
  onPhoneChange,
  onStatusChange,
  onClearLocation,
  newLocation,
  addressInput,
  onDropContact,
  onUnassignContact,
  isUpdatingContact,
  onEditLocation,
  isEditing,
  onEditContact,
  onDeleteContact
}: LocationsListProps & { isEditing: boolean }) => {
  const formatPhoneNumber = (phone: string | undefined | null) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-400', 'bg-blue-50', 'transition-colors');
    e.currentTarget.style.cursor = 'grab';
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50', 'transition-colors');
    e.currentTarget.style.cursor = 'default';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, locationId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50', 'transition-colors');
    e.currentTarget.style.cursor = 'default';
    const contactId = e.dataTransfer.getData('contactId');
    if (contactId) {
      onDropContact(contactId, locationId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Locations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {locations.map((location) => {
            const locationType = locationTypes.find(type => type.id === location.location_type_id);
            return (
              <div
                key={location.id}
                className="p-4 border rounded-lg transition-all duration-200 hover:border-gray-300"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, location.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    {locationType && (
                      <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-gray-500" />
                        <span className="text-lg font-bold text-gray-900">{locationType.name}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                      <div className="space-y-1">
                        <span className="font-medium">
                          {location.address_line1}
                          {location.address_line2 && `, ${location.address_line2}`}
                        </span>
                        <div className="text-sm text-gray-600">
                          {location.city}, {location.state} {location.zip}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{location.phone || 'No phone number'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditLocation(location)}
                      className="text-[#374151] dark:text-[#E5E7EB] hover:text-[#374151]/80 dark:hover:text-[#E5E7EB]/80"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteLocation(location.id)}
                      className="text-[#E11D48] dark:text-[#FB7185] hover:text-[#E11D48]/80 dark:hover:text-[#FB7185]/80"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {contacts
                    .filter(contact => contact.location_id === location.id)
                    .map(contact => (
                      <div
                        key={contact.id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-[#2D3748] rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {contact.first_name} {contact.last_name}
                            </p>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditContact(contact)}
                                className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteContact(contact)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 text-sm text-gray-500">
                            <p className="text-sm text-gray-500 truncate capitalize">{contact.role?.name}</p>
                            {contact.email && (
                              <p className="text-sm text-gray-500 truncate">{contact.email}</p>
                            )}
                            {contact.mobile && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span className="truncate">Mobile: {formatPhoneNumber(contact.mobile)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUnassignContact(contact.id)}
                          disabled={isUpdatingContact === contact.id}
                          className="shrink-0 bg-[#C05621] dark:bg-[#F97316] text-white hover:bg-[#C05621]/80 dark:hover:bg-[#F97316]/80"
                        >
                          Unassign
                        </Button>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
          <div className="p-4 border rounded-lg">
            <div className="space-y-4">
              <div>
                <Label htmlFor="locationType">Location Type</Label>
                <select
                  id="locationType"
                  value={newLocation.location_type_id || ''}
                  onChange={onLocationTypeChange}
                  className="w-full px-3 py-2 mt-1 border rounded-md"
                >
                  <option value="">Select Location Type</option>
                  {locationTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={addressInput}
                  onChange={(e) => onAddressChange(e.target.value)}
                  placeholder="Paste full address from Google Maps"
                  className="mt-1"
                />
              </div>
              {newLocation.address_line1 && (
                <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                    <div className="space-y-1">
                      <span className="font-medium">
                        {newLocation.address_line1}
                        {newLocation.address_line2 && `, ${newLocation.address_line2}`}
                      </span>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {newLocation.city}, {newLocation.state} {newLocation.zip}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newLocation.phone || ''}
                  onChange={onPhoneChange}
                  placeholder="Enter phone number"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={newLocation.status || 'Active'}
                  onChange={onStatusChange}
                  className="w-full px-3 py-2 mt-1 border rounded-md"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={onClearLocation}
                >
                  Clear
                </Button>
                <Button
                  onClick={onAddLocation}
                  disabled={!newLocation.location_type_id || !newLocation.address_line1}
                >
                  {isEditing ? 'Update Location' : 'Add Location'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}), { ssr: false });

LocationsList.displayName = 'LocationsList';

interface CompanyDetailsProps {
  company: CompanyWithRelations;
  industries: Industry[];
  onSave: (companyData: Partial<CompanyWithRelations>) => Promise<void>;
}

function CompanyDetails({ company, industries, onSave }: CompanyDetailsProps) {
  const handleSave = async (companyData: Partial<CompanyWithRelations>) => {
    try {
      console.log('Saving company:', companyData);
      const { industries: companyIndustries, locations, industry_id, ...companyWithoutRelations } = companyData;
      
      // Update company
      const { data, error } = await supabase
        .from('companies')
        .update({
          ...companyWithoutRelations,
          industry_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', company.id)
        .select(`
          *,
          industry:industries(*),
          locations(*)
        `)
        .single();

      if (error) throw error;

      // Update local state
      onSave(data);
      toast.success('Company updated successfully');
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Failed to save company');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 max-w-2xl">
          <div className="grid gap-2">
            <Label htmlFor="name">Company Name</Label>
            <Input
              id="name"
              value={company.name}
              onChange={(e) => onSave({ ...company, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="industry">Industry</Label>
            <select
              id="industry"
              value={company.industry_id || ''}
              onChange={(e) => onSave({ ...company, industry_id: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="">Select Industry</option>
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={company.status}
              onChange={(e) => onSave({ ...company, status: e.target.value })}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onSave(company)}>
              Save Changes
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Update the ContactDialog component
interface ContactDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (contact: any) => void;
  contact?: any;
  locations: any[];
  roles: Role[];
}

// Update the phone validation function to handle international numbers
const validateAndFormatPhone = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle different phone number formats
  if (digits.length === 10) {
    // Standard US number: (XXX) XXX-XXXX
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    // US number with country code: +1 (XXX) XXX-XXXX
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  } else if (digits.length > 10) {
    // International number: +XX (XXX) XXX-XXXX
    const countryCode = digits.slice(0, -10);
    const number = digits.slice(-10);
    return `+${countryCode} (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
  }
  
  // If not a valid format, return the original input
  return phone;
};

function ContactDialog({ open, onClose, onSave, contact, locations, roles }: ContactDialogProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    direct_phone: '',
    role_id: '',
    location_id: '',
    is_primary: false
  });

  // Add handlers for phone number formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const formattedPhone = validateAndFormatPhone(value);
    
    // Only update if the formatted number is different from the input
    // This prevents cursor jumping while typing
    if (formattedPhone !== value) {
      e.target.value = formattedPhone;
    }
    
    setFormData(prev => ({ ...prev, [name]: formattedPhone }));
  };

  useEffect(() => {
    if (contact) {
      // Format phone numbers when loading contact data
      setFormData({
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        mobile: validateAndFormatPhone(contact.mobile || ''),
        direct_phone: validateAndFormatPhone(contact.direct_phone || ''),
        role_id: contact.role_id || '',
        location_id: contact.location_id || '',
        is_primary: contact.is_primary || false
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        mobile: '',
        direct_phone: '',
        role_id: '',
        location_id: '',
        is_primary: false
      });
    }
  }, [contact, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Ensure select values are never null
    setFormData(prev => ({ 
      ...prev, 
      [name]: value || '' 
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.first_name || !formData.last_name || !formData.email) {
      alert('Please fill in all required fields (First Name, Last Name, Email)');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Validate phone format if provided
    const phoneRegex = /^\+?[\d\s-()]+$/;
    if (formData.mobile && !phoneRegex.test(formData.mobile)) {
      alert('Please enter a valid mobile number');
      return;
    }
    if (formData.direct_phone && !phoneRegex.test(formData.direct_phone)) {
      alert('Please enter a valid direct phone number');
      return;
    }

    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
          <DialogDescription>
            Fill in the contact details below. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="mobile">Mobile Phone</Label>
            <Input
              id="mobile"
              name="mobile"
              type="tel"
              value={formData.mobile}
              onChange={handlePhoneChange}
              placeholder="+1 (XXX) XXX-XXXX"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter with country code (optional). Example: +1 (555) 123-4567
            </p>
          </div>
          <div>
            <Label htmlFor="direct_phone">Direct Phone</Label>
            <Input
              id="direct_phone"
              name="direct_phone"
              type="tel"
              value={formData.direct_phone}
              onChange={handlePhoneChange}
              placeholder="+1 (XXX) XXX-XXXX"
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter with country code (optional). Example: +1 (555) 123-4567
            </p>
          </div>
          <div>
            <Label htmlFor="role">Role *</Label>
            <select
              id="role_id"
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="location">Location *</Label>
            <select
              id="location_id"
              name="location_id"
              value={formData.location_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="">Select a location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.address_line1}, {location.city}, {location.state}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EditCompany() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [company, setCompany] = useState<CompanyWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [newLocation, setNewLocation] = useState<Partial<Location>>({
    location_type_id: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    is_headquarters: false,
    status: 'Active'
  });
  const [addressInput, setAddressInput] = useState('');
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  // Ensure we're on the client side before fetching data
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch data only after we confirm we're on the client side
  useEffect(() => {
    if (!isClient) return;

    const companyId = params?.id;
    if (!companyId) {
      console.error('No company ID provided');
      setError('Company ID is missing');
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        console.log('Fetching company data for ID:', companyId);
        setLoading(true);
        setError(null);

        // First fetch company data with locations
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select(`
            *,
            industry:industries(*),
            locations(
              *,
              contacts(
                *,
                role:roles(*)
              )
            )
          `)
          .eq('id', companyId)
          .single();

        if (companyError) {
          console.error('Error fetching company:', companyError);
          throw companyError;
        }

        // Get all unassigned contacts (where location_id is NULL)
        const { data: unassignedContacts, error: unassignedError } = await supabase
          .from('contacts')
          .select(`
            *,
            role:roles(*)
          `)
          .is('location_id', null);

        if (unassignedError) {
          console.error('Error fetching unassigned contacts:', unassignedError);
          throw unassignedError;
        }

        // Combine the data
        const companyWithUnassigned = {
          ...companyData,
          unassignedContacts: unassignedContacts || []
        };

        console.log('Company data fetched:', companyWithUnassigned);

        // Fetch industries
        console.log('Fetching industries...');
        const { data: industriesData, error: industriesError } = await supabase
          .from('industries')
          .select('*')
          .order('name');

        if (industriesError) {
          console.error('Error fetching industries:', industriesError);
          throw industriesError;
        }
        console.log('Industries fetched:', industriesData);

        // Fetch location types
        console.log('Fetching location types...');
        const { data: locationTypesData, error: locationTypesError } = await supabase
          .from('location_types')
          .select('*')
          .order('name');

        if (locationTypesError) {
          console.error('Error fetching location types:', locationTypesError);
          throw locationTypesError;
        }
        console.log('Location types fetched:', locationTypesData);

        // Fetch roles
        console.log('Fetching roles...');
        const { data: rolesData, error: rolesError } = await supabase
          .from('roles')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
          throw rolesError;
        }
        console.log('Roles fetched:', rolesData);

        setCompany(companyWithUnassigned);
        setIndustries(industriesData);
        setLocationTypes(locationTypesData);
        setRoles(rolesData);
        setLoading(false);
      } catch (error) {
        console.error('Error in fetchData:', error);
        setError('Failed to load company data');
        setLoading(false);
      }
    }

    fetchData();
  }, [isClient, params?.id, supabase]);

  // Show loading state
  if (!isClient || loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <div className="h-48 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
            <div className="col-span-1">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Error loading company data</p>
          <p className="mt-1">{error}</p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!company) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p className="font-medium">Company not found</p>
          <p className="mt-1">The company you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const handleDropContact = async (contactId: string, locationId: string) => {
    try {
      await updateContactLocation(contactId, locationId);
      // Refresh contacts after update
      const locationIds = company.locations?.map(loc => loc.id) || [];
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .or(`location_id.in.(${locationIds.join(',')}),location_id.is.null`);

      if (contactsError) throw contactsError;

      setCompany(prev => {
        if (!prev) return null;
        return {
          ...prev,
          // Update locations with their contacts
          locations: prev.locations?.map(loc => 
            loc.id === locationId ? { ...loc, contacts: contactsData.filter((contact: any) => contact.location_id === loc.id) } : loc
          ) || [],
          // Update unassigned contacts list by filtering out the assigned contact
          unassignedContacts: prev.unassignedContacts.filter(contact => contact.id !== contactId)
        };
      });

      console.log('Contact assigned:', { contactId, locationId });
    } catch (err) {
      console.error('Error assigning contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign contact');
    }
  };

  const handleUnassignContact = async (contactId: string) => {
    try {
      await updateContactLocation(contactId, null);
      // Refresh contacts after update
      const locationIds = company.locations?.map(loc => loc.id) || [];
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select(`
          *,
          role:roles(*)
        `)
        .or(`location_id.in.(${locationIds.join(',')}),location_id.is.null`);

      if (contactsError) throw contactsError;

      setCompany(prev => {
        if (!prev) return null;
        // Find the contact that was unassigned
        const unassignedContact = contactsData.find((contact: any) => contact.id === contactId);
        return {
          ...prev,
          // Update locations by removing the unassigned contact
          locations: prev.locations?.map(loc => ({
            ...loc,
            contacts: loc.contacts.filter(contact => contact.id !== contactId)
          })) || [],
          // Add the unassigned contact back to the unassigned list
          unassignedContacts: unassignedContact 
            ? [...prev.unassignedContacts, unassignedContact]
            : prev.unassignedContacts
        };
      });

      console.log('Contact unassigned:', { contactId });
    } catch (err) {
      console.error('Error unassigning contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to unassign contact');
    }
  };

  const handleLocationTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = locationTypes.find(type => type.id === e.target.value);
    const isHeadquarters = selectedType?.name.toLowerCase().includes('headquarters') || 
                          selectedType?.name.toLowerCase().includes('main');

    // If this is being set as headquarters, unset any existing headquarters
    if (isHeadquarters && company?.locations) {
      const updatedLocations = company.locations.map(loc => ({
        ...loc,
        is_headquarters: false
      }));
      setCompany(prev => prev ? { ...prev, locations: updatedLocations } : null);
    }

    setNewLocation(prev => ({
      ...prev,
      location_type_id: e.target.value,
      is_headquarters: isHeadquarters
    }));
  };

  const stateMap: { [key: string]: string } = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
    'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
    'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
    'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
    'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
    'district of columbia': 'DC', 'american samoa': 'AS', 'guam': 'GU', 'northern mariana islands': 'MP',
    'puerto rico': 'PR', 'united states virgin islands': 'VI', 'united states minor outlying islands': 'UM'
  };

  const validateAndFormatState = (state: string): string => {
    // Clean and normalize the input
    const normalizedState = state.toLowerCase().trim();
    console.log('Validating state:', { input: state, normalized: normalizedState });

    // If it's already a valid 2-letter code
    if (state.length === 2) {
      const upperState = state.toUpperCase();
      if (Object.values(stateMap).includes(upperState)) {
        console.log('Found valid 2-letter code:', upperState);
        return upperState;
      }
    }

    // Try exact match first
    const exactMatch = stateMap[normalizedState];
    if (exactMatch) {
      console.log('Found exact match:', exactMatch);
      return exactMatch;
    }

    // Try fuzzy matching with improved spelling tolerance
    const fuzzyMatch = Object.keys(stateMap).find(key => {
      // Remove all non-alphabetic characters and normalize spaces
      const cleanKey = key.replace(/[^a-z\s]/gi, '').toLowerCase();
      const cleanInput = normalizedState.replace(/[^a-z\s]/gi, '').toLowerCase();
      
      // If the input is very close to the key (allowing for one character difference)
      if (cleanInput.length >= 3) {
        // Check if the input is a subset of the key or vice versa
        if (cleanKey.includes(cleanInput) || cleanInput.includes(cleanKey)) {
          return true;
        }
        
        // Check for common misspellings
        const commonMisspellings: { [key: string]: string[] } = {
          'idaho': ['idaaho', 'idahoe', 'idahow'],
          'utah': ['uta', 'utahh'],
          'nevada': ['nevadaa', 'neveda'],
          'arizona': ['arizonaa', 'arizona'],
          'california': ['californa', 'califonia'],
          'florida': ['floridaa', 'florida'],
          'texas': ['texass', 'texas'],
          'new york': ['newyork', 'new yorkk'],
          'washington': ['washinton', 'washingtonn'],
          'oregon': ['oregonn', 'oregon'],
          'colorado': ['coloradoo', 'colorado'],
          'montana': ['montanaa', 'montana'],
          'wyoming': ['wyomingg', 'wyoming'],
          'alaska': ['alaskaa', 'alaska'],
          'hawaii': ['hawai', 'hawaii'],
          'alabama': ['alabam', 'alabamaa'],
          'arkansas': ['arkansass', 'arkansas'],
          'connecticut': ['connecticutt', 'connecticut'],
          'delaware': ['delawar', 'delawaree'],
          'georgia': ['georga', 'georgiaa'],
          'illinois': ['illinoiss', 'illinois'],
          'indiana': ['indianna', 'indiana'],
          'iowa': ['iowaa', 'iowa'],
          'kansas': ['kansass', 'kansas'],
          'kentucky': ['kentuckey', 'kentuckyy'],
          'louisiana': ['louisianna', 'louisiana'],
          'maine': ['main', 'maine'],
          'maryland': ['marylandd', 'maryland'],
          'massachusetts': ['massachusets', 'massachusetts'],
          'michigan': ['michigann', 'michigan'],
          'minnesota': ['minnesotta', 'minnesota'],
          'mississippi': ['missisippi', 'mississippi'],
          'missouri': ['missourii', 'missouri'],
          'nebraska': ['nebraskaa', 'nebraska'],
          'new hampshire': ['newhampshire', 'new hampshire'],
          'new jersey': ['newjersey', 'new jersey'],
          'new mexico': ['newmexico', 'new mexico'],
          'north carolina': ['northcarolina', 'north carolina'],
          'north dakota': ['northdakota', 'north dakota'],
          'ohio': ['ohioo', 'ohio'],
          'oklahoma': ['oklahomaa', 'oklahoma'],
          'pennsylvania': ['pennsylvannia', 'pennsylvania'],
          'rhode island': ['rhodeisland', 'rhode island'],
          'south carolina': ['southcarolina', 'south carolina'],
          'south dakota': ['southdakota', 'south dakota'],
          'tennessee': ['tennesse', 'tennessee'],
          'vermont': ['vermontt', 'vermont'],
          'virginia': ['virginiaa', 'virginia'],
          'west virginia': ['westvirginia', 'west virginia'],
          'wisconsin': ['wisconsinn', 'wisconsin']
        };

        // Check if the input matches any common misspelling
        for (const [correctState, misspellings] of Object.entries(commonMisspellings)) {
          if (misspellings.includes(cleanInput) || cleanInput.includes(correctState)) {
            return key === correctState;
          }
        }

        // Calculate similarity score
        let similarity = 0;
        const minLength = Math.min(cleanInput.length, cleanKey.length);
        const maxLength = Math.max(cleanInput.length, cleanKey.length);
        
        for (let i = 0; i < minLength; i++) {
          if (cleanInput[i] === cleanKey[i]) {
            similarity++;
          }
        }
        
        // If similarity is high enough (80% or more), consider it a match
        return (similarity / maxLength) >= 0.8;
      }
      
      return false;
    });

    if (fuzzyMatch) {
      console.log('Found fuzzy match:', { input: normalizedState, match: fuzzyMatch, result: stateMap[fuzzyMatch] });
      return stateMap[fuzzyMatch];
    }

    console.log('No match found for state:', normalizedState);
    return state;
  };

  const validateZipCode = (zip: string): string => {
    // Remove all non-digits
    const digits = zip.replace(/\D/g, '');
    
    // Check if it's a valid US zip code (5 digits or 9 digits with hyphen)
    if (digits.length === 5) {
      return digits;
    } else if (digits.length === 9) {
      return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    }
    
    // If invalid, return the original input
    return zip;
  };

  const handleAddressChange = async (address: string) => {
    setAddressInput(address);
    
    // Only verify if the address is complete enough
    if (address.length > 10) {
      console.log('Attempting to verify address:', address);
      const verifiedAddress = await verifyAddress(address);
      console.log('Verification result:', verifiedAddress);
      
      if (verifiedAddress) {
        setNewLocation(prev => ({
          ...prev,
          address_line1: verifiedAddress.address_line1,
          address_line2: verifiedAddress.address_line2,
          city: verifiedAddress.city,
          state: verifiedAddress.state,
          zip: verifiedAddress.zip
        }));
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    const formattedPhone = validateAndFormatPhone(phone);
    
    // Only update if the formatted number is different from the input
    // This prevents cursor jumping while typing
    if (formattedPhone !== phone) {
      e.target.value = formattedPhone;
    }
    
    setNewLocation(prev => ({
      ...prev,
      phone: formattedPhone
    }));
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewLocation(prev => ({
      ...prev,
      status: e.target.value
    }));
  };

  const handleClearLocation = () => {
    setNewLocation({
      location_type_id: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      is_headquarters: false,
      status: 'Active'
    });
    setAddressInput('');
    setEditingLocation(null);
  };

  const handleDeleteLocation = async (locationId: string) => {
    try {
      // Check if there are any contacts assigned to this location
      const assignedContacts = company?.locations?.find(loc => loc.id === locationId)?.contacts || [];
      
      if (assignedContacts.length > 0) {
        toast.error(`Cannot delete location. Please unassign ${assignedContacts.length} contact${assignedContacts.length > 1 ? 's' : ''} first.`);
        return;
      }

      await deleteLocation(locationId);
      
      // Update the company state to remove the deleted location
      setCompany(prev => {
        if (!prev) return null;
        return {
          ...prev,
          locations: prev.locations?.filter(loc => loc.id !== locationId) || []
        };
      });
      
      toast.success('Location deleted successfully');
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    }
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setNewLocation({
      location_type_id: location.location_type_id,
      address_line1: location.address_line1,
      address_line2: location.address_line2,
      city: location.city,
      state: location.state,
      zip: location.zip,
      phone: location.phone,
      is_headquarters: location.is_headquarters,
      status: location.status
    });
    setAddressInput(`${location.address_line1}, ${location.city}, ${location.state}, ${location.zip}`);
  };

  const handleAddLocation = async () => {
    try {
      if (!newLocation?.address_line1 || !newLocation?.city || !newLocation?.state || !newLocation?.zip) {
        toast.error('Please enter a complete address');
        return;
      }

      if (!params?.id) {
        toast.error('Company ID is missing');
        return;
      }

      if (!newLocation.location_type_id) {
        toast.error('Please select a location type');
        return;
      }

      // Create a name for the location based on the address
      const locationName = `${newLocation.address_line1}, ${newLocation.city}`;

      if (editingLocation) {
        // Update existing location
        const updatedLocation = await updateLocation(editingLocation.id, {
          name: locationName,
          address_line1: newLocation.address_line1,
          address_line2: newLocation.address_line2 || '',
          city: newLocation.city,
          state: newLocation.state,
          zip: newLocation.zip,
          location_type_id: newLocation.location_type_id,
          is_headquarters: newLocation.is_headquarters || false,
          status: newLocation.status || 'Active',
          phone: newLocation.phone || ''
        });

        setCompany(prev => {
          if (!prev) return null;
          return {
            ...prev,
            locations: prev.locations?.map(loc => 
              loc.id === editingLocation.id ? updatedLocation : loc
            ) || []
          };
        });

        toast.success('Location updated successfully');
      } else {
        // Create new location
        const location = await createLocation({
          name: locationName,
          company_id: params.id,
          address_line1: newLocation.address_line1,
          address_line2: newLocation.address_line2 || '',
          city: newLocation.city,
          state: newLocation.state,
          zip: newLocation.zip,
          location_type_id: newLocation.location_type_id,
          is_headquarters: newLocation.is_headquarters || false,
          status: newLocation.status || 'Active',
          phone: newLocation.phone || ''
        });

        setCompany(prev => {
          if (!prev) return null;
          return {
            ...prev,
            locations: [...(prev.locations || []), location]
          };
        });

        toast.success('Location added successfully');
      }

      handleClearLocation();
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Failed to save location');
    }
  };

  const handleSaveCompany = async (companyData: Partial<CompanyWithRelations>) => {
    try {
      console.log('Saving company:', companyData);
      const { industries: companyIndustries, locations, industry_id, ...companyWithoutRelations } = companyData;
      
      // Update company
      const { data, error } = await supabase
        .from('companies')
        .update({
          ...companyWithoutRelations,
          industry_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', params?.id)
        .select(`
          *,
          industry:industries(*),
          locations(*)
        `)
        .single();

      if (error) throw error;

      // Update local state
      setCompany(data);
      toast.success('Company updated successfully');
    } catch (error) {
      console.error('Error saving company:', error);
      toast.error('Failed to save company');
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsContactDialogOpen(true);
  };

  const handleSaveContact = async (contactData: any) => {
    try {
      console.log('Saving contact:', contactData);
      
      // Only include the fields that exist in the database schema
      const updateData = {
        first_name: contactData.first_name,
        last_name: contactData.last_name,
        email: contactData.email,
        mobile: contactData.mobile || null,
        direct_phone: contactData.direct_phone || null,
        role_id: contactData.role_id || null,
        location_id: contactData.location_id || null,
        updated_at: new Date().toISOString()
      };

      // Log the update data for debugging
      console.log('Update data:', updateData);
      
      if (editingContact) {
        // First update the contact
        const { error: updateError } = await supabase
          .from('contacts')
          .update(updateData)
          .eq('id', editingContact.id);

        if (updateError) {
          console.error('Update error:', updateError);
          throw updateError;
        }

        // Then fetch the updated contact with its role
        const { data, error: fetchError } = await supabase
          .from('contacts')
          .select(`
            *,
            role:roles(*)
          `)
          .eq('id', editingContact.id)
          .single();

        if (fetchError) throw fetchError;

        // Update the contact in the local state
        setCompany(prev => {
          if (!prev) return null;
          return {
            ...prev,
            // Update contacts in locations
            locations: prev.locations.map(location => ({
              ...location,
              contacts: location.contacts.map(contact =>
                contact.id === editingContact.id ? data : contact
              )
            })),
            // Update contact in unassigned contacts if it exists there
            unassignedContacts: prev.unassignedContacts.map(contact =>
              contact.id === editingContact.id ? data : contact
            )
          };
        });

        toast.success('Contact updated successfully');
      } else {
        // First insert the contact
        const { data: insertData, error: insertError } = await supabase
          .from('contacts')
          .insert({
            ...updateData,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Then fetch the new contact with its role
        const { data, error: fetchError } = await supabase
          .from('contacts')
          .select(`
            *,
            role:roles(*)
          `)
          .eq('id', insertData.id)
          .single();

        if (fetchError) throw fetchError;

        // Add the new contact to the local state
        setCompany(prev => {
          if (!prev) return null;
          const updatedCompany = {
            ...prev,
            locations: prev.locations.map(location =>
              location.id === contactData.location_id
                ? { ...location, contacts: [...location.contacts, data] }
                : location
            )
          };

          // If the contact has no location_id, add it to unassigned contacts
          if (!contactData.location_id) {
            updatedCompany.unassignedContacts = [...prev.unassignedContacts, data];
          }

          return updatedCompany;
        });

        toast.success('Contact created successfully');
      }

      setIsContactDialogOpen(false);
      setEditingContact(null);
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Failed to save contact');
    }
  };

  const handleDeleteContact = async (contact: Contact) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contact.id);

      if (error) throw error;

      // Update local state
      setCompany(prev => {
        if (!prev) return null;
        return {
          ...prev,
          locations: prev.locations.map(location => ({
            ...location,
            contacts: location.contacts.filter(c => c.id !== contact.id)
          }))
        };
      });

      toast.success('Contact deleted successfully');
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 py-8">
        <Toaster position="top-right" />
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Edit Company</h1>
        </div>
        <div className="max-w-[1400px] mx-auto space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="grid grid-rows-[auto_1fr] gap-8">
              <CompanyDetails
                company={company}
                industries={industries}
                onSave={handleSaveCompany}
              />
              <LocationsList
                locations={company.locations}
                locationTypes={locationTypes}
                contacts={company.locations.flatMap(location => location.contacts)}
                onDeleteLocation={handleDeleteLocation}
                onAddLocation={handleAddLocation}
                onLocationTypeChange={handleLocationTypeChange}
                onAddressChange={handleAddressChange}
                onPhoneChange={handlePhoneChange}
                onStatusChange={handleStatusChange}
                onClearLocation={handleClearLocation}
                newLocation={newLocation}
                addressInput={addressInput}
                onDropContact={handleDropContact}
                onUnassignContact={handleUnassignContact}
                isUpdatingContact={null}
                onEditLocation={handleEditLocation}
                isEditing={!!editingLocation}
                onEditContact={handleEditContact}
                onDeleteContact={handleDeleteContact}
              />
            </div>
            <div className="grid grid-rows-[1fr]">
              <UnassignedContacts
                contacts={company.unassignedContacts || []}
                onEditContact={handleEditContact}
                onDeleteContact={handleDeleteContact}
              />
            </div>
          </div>
          <ContactDialog
            open={isContactDialogOpen}
            onClose={() => {
              setIsContactDialogOpen(false);
              setEditingContact(null);
            }}
            onSave={handleSaveContact}
            contact={editingContact}
            locations={company.locations}
            roles={roles}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}