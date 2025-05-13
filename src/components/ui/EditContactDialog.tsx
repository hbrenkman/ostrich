import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Plus, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { verifyAddress } from '@/lib/geocodio';
import { toast } from 'react-hot-toast';
import { createLocation } from '@/lib/actions/locations';

interface Company {
  id: string;
  name: string;
  industry_id: string;
  status: string;
  locations: Location[];
  industry?: {
    id: string;
    name: string;
  };
}

interface Location {
  id: string;
  name: string;
  company_id: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip: string;
  status: string;
  location_type_id: string;
  is_headquarters: boolean;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  direct_phone: string;
  role_id: string;
  role?: {
    id: string;
    name: string;
  };
  location_id: string;
  location?: {
    id: string;
    name: string;
    address_line1: string;
    address_line2: string;
    city: string;
    state: string;
    zip: string;
    company_id: string;
    company?: {
      id: string;
      name: string;
    }
  }
}

interface Role {
  id: string;
  name: string;
}

interface LocationType {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (contact: Contact) => void;
  initialContact: Contact;
  roles: Role[];
}

// Format phone number to (XXX) XXX-XXXX or +X (XXX) XXX-XXXX
const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');
  
  // Check if it starts with a country code (1 for US)
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // Format as +1 (XXX) XXX-XXXX
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    // Format as (XXX) XXX-XXXX
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Return original value if it doesn't match expected formats
  return value;
};

// Unformat phone number to just digits
const unformatPhoneNumber = (value: string): string => {
  return value.replace(/\D/g, '');
};

export const EditContactDialog: React.FC<EditContactDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  initialContact,
  roles,
}) => {
  console.log('EditContactDialog - initialContact:', initialContact);
  console.log('EditContactDialog - roles:', roles);
  console.log('EditContactDialog - initialContact.role_id:', initialContact?.role_id);
  console.log('EditContactDialog - initialContact.role:', initialContact?.role);

  const [contact, setContact] = useState<Contact>({
    ...initialContact,
    location_id: initialContact.location_id || '',
    role_id: initialContact.role_id || ''
  });
  const [error, setError] = useState<string>('');
  const [formattedMobile, setFormattedMobile] = useState<string>('');
  const [formattedDirectPhone, setFormattedDirectPhone] = useState<string>('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(initialContact.location?.company_id || '');
  const [isLoading, setIsLoading] = useState(true);
  const [isNewCompanyDialogOpen, setIsNewCompanyDialogOpen] = useState(false);
  const [isNewLocationDialogOpen, setIsNewLocationDialogOpen] = useState(false);
  const [newCompany, setNewCompany] = useState<Partial<Company>>({
    name: '',
    industry_id: '',
    status: 'Active'
  });
  const [newLocation, setNewLocation] = useState<Partial<Location>>({
    name: '',
    company_id: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
    status: 'Active',
    location_type_id: '',
    is_headquarters: false
  });
  const [industries, setIndustries] = useState<any[]>([]);
  const [addressInput, setAddressInput] = useState('');
  const [locationTypes, setLocationTypes] = useState<LocationType[]>([]);
  const [isLoadingLocationTypes, setIsLoadingLocationTypes] = useState(false);

  // Update contact and selectedCompanyId when initialContact changes
  useEffect(() => {
    setContact({
      ...initialContact,
      location_id: initialContact.location_id || '',
      role_id: initialContact.role_id || ''
    });
    setSelectedCompanyId(initialContact.location?.company_id || '');
  }, [initialContact]);

  // Fetch companies with their locations
  useEffect(() => {
    async function fetchCompanies() {
      try {
        const { data, error } = await supabase
          .from('companies')
          .select(`
            id,
            name,
            industry_id,
            status,
            locations (
              id,
              name,
              company_id,
              address_line1,
              address_line2,
              city,
              state,
              zip,
              status,
              location_type_id,
              is_headquarters
            ),
            industry:industries (
              id,
              name
            )
          `)
          .order('name');

        if (error) {
          console.error('Error fetching companies:', error);
          setError('Failed to load companies');
        } else {
          // Transform the data to match the Company interface
          const transformedData = data.map(company => ({
            ...company,
            industry: company.industry?.[0] || null
          })) as Company[];
          setCompanies(transformedData);
        }
      } catch (err) {
        console.error('Exception while fetching companies:', err);
        setError('Failed to load companies');
      } finally {
        setIsLoading(false);
      }
    }

    if (open) {
      fetchCompanies();
    }
  }, [open]);

  // Initialize formatted phone numbers when dialog opens or initialContact changes
  useEffect(() => {
    if (initialContact) {
      setFormattedMobile(formatPhoneNumber(initialContact.mobile || ''));
      setFormattedDirectPhone(formatPhoneNumber(initialContact.direct_phone || ''));
    }
  }, [initialContact]);

  // Fetch industries for new company dialog
  useEffect(() => {
    async function fetchIndustries() {
      try {
        const { data, error } = await supabase
          .from('industries')
          .select('*')
          .order('name');

        if (error) {
          console.error('Error fetching industries:', error);
          setError('Failed to load industries');
        } else {
          setIndustries(data || []);
        }
      } catch (err) {
        console.error('Exception while fetching industries:', err);
        setError('Failed to load industries');
      }
    }

    if (isNewCompanyDialogOpen) {
      fetchIndustries();
    }
  }, [isNewCompanyDialogOpen]);

  // Add useEffect to fetch location types
  useEffect(() => {
    async function fetchLocationTypes() {
      setIsLoadingLocationTypes(true);
      try {
        const { data, error } = await supabase
          .from('location_types')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('Error fetching location types:', error);
          toast.error('Failed to load location types');
        } else {
          setLocationTypes(data || []);
        }
      } catch (err) {
        console.error('Exception while fetching location types:', err);
        toast.error('Failed to load location types');
      } finally {
        setIsLoadingLocationTypes(false);
      }
    }

    if (open) {
      fetchLocationTypes();
    }
  }, [open]);

  const handlePhoneChange = (value: string, field: 'mobile' | 'direct_phone') => {
    // Store formatted value for display
    const formatted = formatPhoneNumber(value);
    if (field === 'mobile') {
      setFormattedMobile(formatted);
    } else {
      setFormattedDirectPhone(formatted);
    }

    // Store unformatted value in contact state
    const unformatted = unformatPhoneNumber(value);
    setContact(prev => ({
      ...prev,
      [field]: unformatted
    }));
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    // Reset location_id when company changes
    setContact(prev => ({
      ...prev,
      location_id: ''
    }));
  };

  const handleLocationChange = (locationId: string) => {
    setContact(prev => ({
      ...prev,
      location_id: locationId
    }));
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

  const handleAddCompany = async () => {
    if (!newCompany.name || !newCompany.industry_id) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([{
          name: newCompany.name,
          industry_id: newCompany.industry_id,
          status: newCompany.status
        }])
        .select()
        .single();

      if (error) throw error;

      // Fetch the industry data for the new company
      const { data: industryData } = await supabase
        .from('industries')
        .select('*')
        .eq('id', newCompany.industry_id)
        .single();

      const newCompanyWithIndustry = {
        ...data,
        industry: industryData,
        locations: []
      };

      setCompanies([...companies, newCompanyWithIndustry]);
      setSelectedCompanyId(newCompanyWithIndustry.id);
      setIsNewCompanyDialogOpen(false);
      setNewCompany({
        name: '',
        industry_id: '',
        status: 'Active'
      });
    } catch (err) {
      console.error('Error adding company:', err);
      setError('Failed to add company');
    }
  };

  const handleAddLocation = async () => {
    if (!newLocation.address_line1 || !newLocation.city || !newLocation.state || !newLocation.zip) {
      toast.error('Please enter a complete address');
      return;
    }

    if (!selectedCompanyId) {
      toast.error('Please select a company first');
      return;
    }

    if (!newLocation.location_type_id) {
      toast.error('Please select a location type');
      return;
    }

    try {
      // Create a name for the location based on the address
      const locationName = `${newLocation.address_line1}, ${newLocation.city}`;

      const data = await createLocation({
        name: locationName,
        company_id: selectedCompanyId,
        address_line1: newLocation.address_line1,
        address_line2: newLocation.address_line2 || '',
        city: newLocation.city,
        state: newLocation.state,
        zip: newLocation.zip,
        status: newLocation.status || 'Active',
        location_type_id: newLocation.location_type_id,
        is_headquarters: false
      });

      // Update the companies state with the new location
      setCompanies(prevCompanies => 
        prevCompanies.map(company => 
          company.id === selectedCompanyId
            ? { ...company, locations: [...company.locations, data] }
            : company
        )
      );

      // Set the new location as selected
      setContact(prev => ({
        ...prev,
        location_id: data.id
      }));

      setIsNewLocationDialogOpen(false);
      setNewLocation({
        name: '',
        company_id: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        zip: '',
        status: 'Active',
        location_type_id: '',
        is_headquarters: false
      });
      setAddressInput('');
      toast.success('Location added successfully');
    } catch (err) {
      console.error('Error adding location:', err);
      toast.error('Failed to add location');
    }
  };

  const handleSave = () => {
    console.log('EditContactDialog - handleSave called');
    console.log('EditContactDialog - current contact state:', contact);
    
    if (!contact.first_name || !contact.last_name || !contact.email) {
      console.log('EditContactDialog - validation failed:', {
        hasFirstName: !!contact.first_name,
        hasLastName: !!contact.last_name,
        hasEmail: !!contact.email
      });
      setError('First name, last name, and email are required');
      return;
    }

    if (!contact.location_id) {
      console.log('EditContactDialog - location validation failed');
      setError('Please select a location');
      return;
    }

    // Validate phone numbers if they exist
    const mobileDigits = unformatPhoneNumber(contact.mobile || '');
    const directPhoneDigits = unformatPhoneNumber(contact.direct_phone || '');

    if (contact.mobile && mobileDigits.length !== 10 && mobileDigits.length !== 11) {
      console.log('EditContactDialog - mobile validation failed:', { mobileDigits });
      setError('Mobile number must be 10 digits (or 11 digits with country code)');
      return;
    }

    if (contact.direct_phone && directPhoneDigits.length !== 10 && directPhoneDigits.length !== 11) {
      console.log('EditContactDialog - direct phone validation failed:', { directPhoneDigits });
      setError('Direct phone number must be 10 digits (or 11 digits with country code)');
      return;
    }

    console.log('EditContactDialog - validation passed, calling onSave');
    onSave(contact);
    onOpenChange(false);
  };

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);
  const availableLocations = selectedCompany?.locations || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background">
        <DialogHeader>
          <DialogTitle>{initialContact.id ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
          <DialogDescription>
            {initialContact.id ? 'Update' : 'Add'} the contact's information. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={contact.first_name}
                onChange={(e) => setContact({ ...contact, first_name: e.target.value })}
                className="mt-1"
                data-testid="edit-first-name-input"
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={contact.last_name}
                onChange={(e) => setContact({ ...contact, last_name: e.target.value })}
                className="mt-1"
                data-testid="edit-last-name-input"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={contact.email}
              onChange={(e) => setContact({ ...contact, email: e.target.value })}
              className="mt-1"
              data-testid="edit-email-input"
            />
          </div>

          <div>
            <Label htmlFor="role_id">Role</Label>
            <select
              id="role_id"
              value={contact.role_id ?? ''}
              onChange={(e) => {
                console.log('Role changed to:', e.target.value);
                setContact({ ...contact, role_id: e.target.value });
              }}
              className="w-full px-3 py-2 mt-1 border rounded-md"
              data-testid="edit-role-select"
            >
              <option value="">Select role...</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="company">Company</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNewCompanyDialogOpen(true)}
                className="h-7 px-2"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Company
              </Button>
            </div>
            <select
              id="company"
              value={selectedCompanyId ?? ''}
              onChange={(e) => handleCompanyChange(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md"
              disabled={isLoading}
            >
              <option value="">Select company...</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="location">Location</Label>
              {selectedCompanyId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsNewLocationDialogOpen(true)}
                  className="h-7 px-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Location
                </Button>
              )}
            </div>
            <select
              id="location"
              value={contact.location_id ?? ''}
              onChange={(e) => handleLocationChange(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md"
              disabled={!selectedCompanyId || isLoading}
            >
              <option value="">Select location...</option>
              {availableLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} - {[location.city, location.state].filter(Boolean).join(', ')}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="direct_phone">Direct Phone</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Format: (XXX) XXX-XXXX or +1 (XXX) XXX-XXXX</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="direct_phone"
                type="tel"
                value={formattedDirectPhone}
                onChange={(e) => handlePhoneChange(e.target.value, 'direct_phone')}
                placeholder="(XXX) XXX-XXXX"
                className="mt-1"
                data-testid="edit-direct-phone-input"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Format: (XXX) XXX-XXXX or +1 (XXX) XXX-XXXX</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="mobile"
                type="tel"
                value={formattedMobile}
                onChange={(e) => handlePhoneChange(e.target.value, 'mobile')}
                placeholder="(XXX) XXX-XXXX"
                className="mt-1"
                data-testid="edit-mobile-input"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center" data-testid="edit-error">
              {error}
            </div>
          )}
        </div>

        {/* New Company Dialog */}
        <Dialog open={isNewCompanyDialogOpen} onOpenChange={setIsNewCompanyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Company</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company-industry">Industry</Label>
                <select
                  id="company-industry"
                  value={newCompany.industry_id ?? ''}
                  onChange={(e) => setNewCompany({ ...newCompany, industry_id: e.target.value })}
                  className="w-full px-3 py-2 mt-1 border rounded-md"
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
                <Label htmlFor="company-status">Status</Label>
                <select
                  id="company-status"
                  value={newCompany.status ?? 'Active'}
                  onChange={(e) => setNewCompany({ ...newCompany, status: e.target.value })}
                  className="w-full px-3 py-2 mt-1 border rounded-md"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNewCompanyDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCompany}>
                Add Company
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* New Location Dialog */}
        <Dialog open={isNewLocationDialogOpen} onOpenChange={setIsNewLocationDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="locationType">Location Type</Label>
                <select
                  id="locationType"
                  value={newLocation.location_type_id ?? ''}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, location_type_id: e.target.value }))}
                  className="w-full px-3 py-2 mt-1 border rounded-md"
                  disabled={isLoadingLocationTypes}
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
                  onChange={(e) => handleAddressChange(e.target.value)}
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
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={newLocation.status ?? 'Active'}
                  onChange={(e) => setNewLocation(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 mt-1 border rounded-md"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsNewLocationDialogOpen(false);
                setAddressInput('');
                setNewLocation({
                  name: '',
                  company_id: '',
                  address_line1: '',
                  address_line2: '',
                  city: '',
                  state: '',
                  zip: '',
                  status: 'Active',
                  location_type_id: '',
                  is_headquarters: false
                });
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddLocation} 
                disabled={!newLocation.address_line1 || !newLocation.location_type_id}
              >
                Add Location
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {initialContact.id ? 'Save Changes' : 'Add Contact'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
