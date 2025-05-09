'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database } from '@/types/supabase';
import { Building2, MapPin, Phone, Plus, Trash, ArrowLeft, Search, Tag, Edit } from 'lucide-react';
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { updateContactLocation } from '@/lib/actions/updateContact';
import React from 'react';
import dynamic from 'next/dynamic';
import { verifyAddress } from '@/lib/geocodio';
import { toast } from 'react-hot-toast';
import { createLocation, updateLocation, deleteLocation } from '@/lib/actions/locations';
import { Toaster } from 'react-hot-toast';

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
  is_headquarters: boolean;
  created_at: string;
  updated_at: string;
  status: string;
  latitude?: number;
  longitude?: number;
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
  mobile?: string;
  direct_phone?: string;
  location_id: string | null;
  created_at: string;
  updated_at: string;
}

interface CompanyWithRelations extends Company {
  locations?: Location[];
  industry?: Industry;
  contacts?: Contact[];
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

const UnassignedContacts = dynamic(() => Promise.resolve(({ 
  contacts, 
  searchValue, 
  onSearchChange,
  isUpdatingContact
}: { 
  contacts: Contact[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  isUpdatingContact: string | null;
}) => {
  const unassignedContacts = contacts.filter(contact => !contact.location_id);

  const sortedContacts = [...unassignedContacts].sort((a, b) => 
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unassigned Contacts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <SearchInput 
            value={searchValue}
            onChange={onSearchChange}
          />
          <div className="space-y-2">
            {sortedContacts
              .filter(contact => 
                `${contact.first_name} ${contact.last_name}`
                  .toLowerCase()
                  .includes(searchValue.toLowerCase())
              )
              .map(contact => (
                <div
                  key={contact.id}
                  draggable={!isUpdatingContact}
                  onDragStart={(e) => handleDragStart(e, contact.id)}
                  onDragEnd={handleDragEnd}
                  className={`p-2 rounded border cursor-move hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    isUpdatingContact === contact.id ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                      {contact.email && (
                        <p className="text-sm text-gray-500">{contact.email}</p>
                      )}
                      <div className="flex flex-col gap-1 text-sm text-gray-500">
                        {contact.mobile && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>Mobile: {formatPhoneNumber(contact.mobile)}</span>
                          </div>
                        )}
                        {contact.direct_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>Direct: {formatPhoneNumber(contact.direct_phone)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            {sortedContacts.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No unassigned contacts found
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}), { ssr: false });

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
  isEditing
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
                      className="text-[#374151] dark:text-[#E5E7EB] hover:text-[#374151]/80 dark:hover:text-[#E5E7EB]/80"
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
                        <div className="space-y-1">
                          <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                          {contact.email && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{contact.email}</p>
                          )}
                          <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
                            {contact.mobile && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>Mobile: {formatPhoneNumber(contact.mobile)}</span>
                              </div>
                            )}
                            {contact.direct_phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>Direct: {formatPhoneNumber(contact.direct_phone)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onUnassignContact(contact.id)}
                          disabled={isUpdatingContact === contact.id}
                          className="bg-[#C05621] dark:bg-[#F97316] text-white hover:bg-[#C05621]/80 dark:hover:bg-[#F97316]/80"
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

const CompanyDetails = dynamic(() => Promise.resolve(({ 
  company, 
  industries, 
  error, 
  onSave, 
  onBack,
  onCompanyChange
}: { 
  company: CompanyWithRelations;
  industries: Industry[];
  error: string | null;
  onSave: () => void;
  onBack: () => void;
  onCompanyChange: (company: CompanyWithRelations) => void;
}) => (
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
            onChange={(e) => onCompanyChange({ ...company, name: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="industry">Industry</Label>
          <select
            id="industry"
            value={company.industry_id || ''}
            onChange={(e) => onCompanyChange({ ...company, industry_id: e.target.value })}
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
            onChange={(e) => onCompanyChange({ ...company, status: e.target.value })}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button onClick={onSave}>
            Save Changes
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
)), { ssr: false });

CompanyDetails.displayName = 'CompanyDetails';

export default function EditCompany() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [company, setCompany] = useState<CompanyWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [isUpdatingContact, setIsUpdatingContact] = useState<string | null>(null);
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

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const companyId = params?.id;
    if (!companyId) return;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch company data with locations
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select(`
            *,
            industry:industries(*),
            locations(*)
          `)
          .eq('id', companyId)
          .single();

        if (companyError) throw companyError;
        if (!companyData) throw new Error('Company not found');

        // Fetch all contacts for the company (including unassigned)
        const locationIds = companyData.locations?.map((loc: Location) => loc.id) || [];
        const { data: contactsData, error: contactsError } = await supabase
          .from('contacts')
          .select('*')
          .or(`location_id.in.(${locationIds.join(',')}),location_id.is.null`);

        if (contactsError) throw contactsError;

        // Combine the data
        const companyWithRelations = {
          ...companyData,
          contacts: contactsData || []
        };

        setCompany(companyWithRelations);

        // Fetch industries
        const { data: industriesData, error: industriesError } = await supabase
          .from('industries')
          .select('*')
          .order('name');

        if (industriesError) throw industriesError;
        setIndustries(industriesData || []);

        // Fetch location types
        const { data: locationTypesData, error: locationTypesError } = await supabase
          .from('location_types')
          .select('*')
          .order('name');

        if (locationTypesError) throw locationTypesError;
        setLocationTypes(locationTypesData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params?.id]);

  // Show loading state on both server and client
  if (!isClient || loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          <p>Company not found</p>
        </div>
      </div>
    );
  }

  const handleDropContact = async (contactId: string, locationId: string) => {
    try {
      setIsUpdatingContact(contactId);
      await updateContactLocation(contactId, locationId);
      // Refresh contacts after update
      const locationIds = company.locations?.map(loc => loc.id) || [];
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .or(`location_id.in.(${locationIds.join(',')}),location_id.is.null`);

      if (contactsError) throw contactsError;

      setCompany({
        ...company,
        contacts: contactsData || []
      });

      console.log('Contact assigned:', { contactId, locationId });
    } catch (err) {
      console.error('Error assigning contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign contact');
    } finally {
      setIsUpdatingContact(null);
    }
  };

  const handleUnassignContact = async (contactId: string) => {
    try {
      setIsUpdatingContact(contactId);
      await updateContactLocation(contactId, null);
      // Refresh contacts after update
      const locationIds = company.locations?.map(loc => loc.id) || [];
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .or(`location_id.in.(${locationIds.join(',')}),location_id.is.null`);

      if (contactsError) throw contactsError;

      setCompany({
        ...company,
        contacts: contactsData || []
      });

      console.log('Contact unassigned:', { contactId });
    } catch (err) {
      console.error('Error unassigning contact:', err);
      setError(err instanceof Error ? err.message : 'Failed to unassign contact');
    } finally {
      setIsUpdatingContact(null);
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
      const assignedContacts = company?.contacts?.filter(contact => contact.location_id === locationId) || [];
      
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
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <CompanyDetails 
              company={company}
              industries={industries}
              error={error}
              onSave={() => {}}
              onBack={() => router.back()}
              onCompanyChange={setCompany}
            />
            <LocationsList
              locations={company.locations || []}
              locationTypes={locationTypes}
              contacts={company.contacts || []}
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
              isUpdatingContact={isUpdatingContact}
              onEditLocation={handleEditLocation}
              isEditing={!!editingLocation}
            />
          </div>
          <div className="col-span-1">
            <UnassignedContacts 
              key={company.contacts?.length || 0}
              contacts={company.contacts || []}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              isUpdatingContact={isUpdatingContact}
            />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}