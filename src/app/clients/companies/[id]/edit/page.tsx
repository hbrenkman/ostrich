'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database } from '@/types/supabase';
import { Building2, MapPin, Phone, Plus, Trash, ArrowLeft, Search, Tag } from 'lucide-react';
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { updateContactLocation } from '@/lib/actions/updateContact';
import React from 'react';
import dynamic from 'next/dynamic';

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

const LocationsList = dynamic(() => Promise.resolve(({ 
  locations,
  locationTypes,
  contacts,
  onDeleteLocation,
  onAddLocation,
  onLocationTypeChange,
  onAddressChange,
  onPhoneChange,
  onClearLocation,
  newLocation,
  fullAddress,
  onDropContact,
  onUnassignContact,
  isUpdatingContact
}: { 
  locations: Location[];
  locationTypes: LocationType[];
  contacts: Contact[];
  onDeleteLocation: (id: string) => void;
  onAddLocation: () => void;
  onLocationTypeChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onAddressChange: (address: string) => void;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearLocation: () => void;
  newLocation: Partial<Location>;
  fullAddress: string;
  onDropContact: (contactId: string, locationId: string) => Promise<void>;
  onUnassignContact: (contactId: string) => Promise<void>;
  isUpdatingContact: string | null;
}) => {
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteLocation(location.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
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
                  value={fullAddress}
                  onChange={(e) => onAddressChange(e.target.value)}
                  placeholder="Enter address"
                  className="mt-1"
                />
              </div>
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
                  Add Location
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
    is_headquarters: false
  });

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
    setNewLocation(prev => ({
      ...prev,
      location_type_id: e.target.value
    }));
  };

  const handleAddressChange = async (address: string) => {
    try {
      // Basic address parsing
      const parts = address.split(',').map(part => part.trim());
      
      if (parts.length >= 3) {
        const [addressLine1, cityState, zip] = parts;
        const cityStateParts = cityState.split(' ').filter(Boolean);
        const state = cityStateParts.pop() || '';
        const city = cityStateParts.join(' ');

        setNewLocation(prev => ({
          ...prev,
          address_line1,
          city,
          state,
          zip: zip.replace(/\D/g, '') // Remove non-digits from zip
        }));
      } else {
        // If we don't have enough parts, just set the address line
        setNewLocation(prev => ({
          ...prev,
          address_line1: address
        }));
      }
    } catch (err) {
      console.error('Error parsing address:', err);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value.replace(/\D/g, '');
    if (phone.length <= 10) {
      setNewLocation(prev => ({
        ...prev,
        phone
      }));
    }
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
      is_headquarters: false
    });
  };

  const handleAddLocation = async () => {
    try {
      if (!newLocation.location_type_id || !newLocation.address_line1) {
        setError('Location type and address are required');
        return;
      }

      const { data, error } = await supabase
        .from('locations')
        .insert({
          company_id: params.id,
          location_type_id: newLocation.location_type_id,
          address_line1: newLocation.address_line1,
          address_line2: newLocation.address_line2,
          city: newLocation.city,
          state: newLocation.state,
          zip: newLocation.zip,
          phone: newLocation.phone,
          is_headquarters: newLocation.is_headquarters
        })
        .select()
        .single();

      if (error) throw error;

      setCompany(prev => {
        if (!prev) return null;
        return {
          ...prev,
          locations: [...(prev.locations || []), data]
        };
      });

      handleClearLocation();
    } catch (err) {
      console.error('Error adding location:', err);
      setError(err instanceof Error ? err.message : 'Failed to add location');
    }
  };

  return (
    <ErrorBoundary>
      <div className="container mx-auto py-6">
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
              onDeleteLocation={(id) => {}}
              onAddLocation={handleAddLocation}
              onLocationTypeChange={handleLocationTypeChange}
              onAddressChange={handleAddressChange}
              onPhoneChange={handlePhoneChange}
              onClearLocation={handleClearLocation}
              newLocation={newLocation}
              fullAddress={`${newLocation.address_line1}${newLocation.address_line2 ? `, ${newLocation.address_line2}` : ''}${newLocation.city ? `, ${newLocation.city}` : ''}${newLocation.state ? `, ${newLocation.state}` : ''}${newLocation.zip ? ` ${newLocation.zip}` : ''}`}
              onDropContact={handleDropContact}
              onUnassignContact={handleUnassignContact}
              isUpdatingContact={isUpdatingContact}
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