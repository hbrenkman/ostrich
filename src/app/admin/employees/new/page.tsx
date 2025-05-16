"use client";

import { useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { verifyAddress } from '@/lib/geocodio';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';

interface NewEmployee {
  employee_id?: string; // display only
  first_name: string;
  middle_name: string;
  last_name: string;
  preferred_name: string;
  date_of_birth: string;
  gender: string;
  marital_status: string;
  nationality: string;
  email: string;
  phone_number: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  ssn: string;
  photo_url: string;
  created_at?: string; // display only
  updated_at?: string; // display only
}

export default function NewEmployeePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [employee, setEmployee] = useState<NewEmployee>({
    first_name: '',
    middle_name: '',
    last_name: '',
    preferred_name: '',
    date_of_birth: '',
    gender: '',
    marital_status: '',
    nationality: '',
    email: '',
    phone_number: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    ssn: '',
    photo_url: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employmentHistory, setEmploymentHistory] = useState<{
    date: string;
    employeeType: string;
    employmentStatus: string;
    jobTitle: string;
    manager: string;
    location: string;
    workSchedule: string;
    details: string;
  }[]>([]);
  const [historyForm, setHistoryForm] = useState({
    date: '',
    employeeType: '',
    employmentStatus: '',
    jobTitle: '',
    manager: '',
    location: '',
    workSchedule: '',
    details: '',
    editingIndex: -1,
  });
  const [showHistoryForm, setShowHistoryForm] = useState(false);
  const [compensation, setCompensation] = useState({
    bank_account_number: '',
    bank_routing_number: '',
    bonus: '',
    effective_date: '',
    end_date: '',
    overtime_eligible: false,
    pay_frequency: '',
    pay_grade: '',
    salary: '',
    tax_withholding_status: '',
  });
  const [benefits, setBenefits] = useState({
    beneficiary_name: '',
    beneficiary_relationship: '',
    benefit_type: '',
    contribution_rate: '',
    coverage_level: '',
    enrollment_date: '',
    plan_name: '',
    termination_date: '',
  });
  const [qualifications, setQualifications] = useState({
    name: '',
    qualification_type: '',
    institution: '',
    proficiency_level: '',
    issue_date: '',
    expiration_date: '',
  });
  const [complianceDocuments, setComplianceDocuments] = useState({
    document_number: '',
    document_type: '',
    file_url: '',
    issue_date: '',
    expiration_date: '',
    status: '',
  });
  const [accessControl, setAccessControl] = useState({
    access_level: '',
    clearance_status: '',
    device_id: '',
    issued_date: '',
    revoked_date: '',
    system_name: '',
  });
  const [performanceReviews, setPerformanceReviews] = useState({
    reviewer_id: '',
    review_date: '',
    rating: '',
    goals: '',
    comments: '',
  });
  const [leaveBalances, setLeaveBalances] = useState({
    accrual_date: '',
    balance: '',
    leave_type: '',
    transaction_amount: '',
    transaction_type: '',
  });
  const [addressInput, setAddressInput] = useState('');
  const [parsedAddress, setParsedAddress] = useState<{
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    zip: string;
  } | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [mobileError, setMobileError] = useState<string | null>(null);

  const ssnRefs = Array.from({ length: 9 }, () => useRef<HTMLInputElement>(null));
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);

  const categoryOptions = [
    'Hire', 'Promotion', 'Role Change', 'Resignation', 'Termination', 'Fire', 'Other'
  ];

  // Add state for edit mode and action selection
  const [editMode, setEditMode] = useState<{ index: number; action: string } | null>(null);
  const [editAction, setEditAction] = useState('');
  const editActions = [
    'Change Employment Status',
    'Change Role',
    'Change Manager',
    'Change Job Title',
    'Correction',
  ];

  // Example options for dropdowns
  const roleOptions = ['Employee', 'Manager', 'Admin', 'Contractor'];
  const jobTitleOptions = ['Software Engineer', 'Project Manager', 'Designer', 'Accountant'];
  const managerOptions = ['John Doe', 'Jane Smith', 'None'];
  const locationOptions = ['New York', 'San Francisco', 'Remote'];
  const workScheduleOptions = ['9am-5pm, M-F', '8am-4pm, M-F', 'Remote', 'Shift'];

  // Add validation state for employment details form
  const [historyFormError, setHistoryFormError] = useState<string | null>(null);

  // Add state for tracking completed sections
  const [completedSections, setCompletedSections] = useState<{
    employeeInfo: boolean;
    employmentHistory: boolean;
  }>({
    employeeInfo: false,
    employmentHistory: false,
  });

  // Function to check if employee info is complete
  const isEmployeeInfoComplete = () => {
    return !!(
      employee.first_name?.trim() &&
      employee.last_name?.trim() &&
      employee.email?.trim() &&
      employee.ssn?.trim() &&
      employee.date_of_birth?.trim() &&
      employee.gender?.trim()
    );
  };

  // Update completed sections when relevant fields change
  useEffect(() => {
    setCompletedSections(prev => ({
      ...prev,
      employeeInfo: isEmployeeInfoComplete(),
      employmentHistory: employmentHistory.length > 0,
    }));
  }, [employee, employmentHistory]);

  function handleSsnChange(index: number, value: string) {
    if (!/^[0-9]?$/.test(value)) return;
    const ssnArr = employee.ssn.padEnd(9, ' ').split('');
    ssnArr[index] = value;
    const newSsn = ssnArr.join('').replace(/ /g, '');
    setEmployee(prev => ({ ...prev, ssn: newSsn }));
    if (value && index < 8) {
      ssnRefs[index + 1].current?.focus();
    }
  }

  function handleSsnKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !employee.ssn[index] && index > 0) {
      ssnRefs[index - 1].current?.focus();
    }
  }

  async function handleAddressChange(value: string) {
    setAddressInput(value);
    setParsedAddress(null);
    setAddressError(null);
    if (value.length > 10) {
      const verified = await verifyAddress(value);
      if (verified) {
        // Parse the address components
        const addressParts = value.split(',').map(part => part.trim());
        const streetAddress = addressParts[0] || '';
        const city = verified.city || addressParts[1] || '';
        const stateZip = (verified.state + ' ' + verified.zip) || addressParts[2] || '';
        const [state, zip] = stateZip.split(' ').map(part => part.trim());

        setParsedAddress({
          address_line1: streetAddress,
          address_line2: null, // We can add address_line2 handling if needed
          city,
          state,
          zip
        });
        setEmployee(prev => ({ ...prev, address_line1: streetAddress, city, state, zip }));
      } else {
        // If verification fails, try to parse the address manually
        const addressParts = value.split(',').map(part => part.trim());
        if (addressParts.length >= 3) {
          const streetAddress = addressParts[0];
          const city = addressParts[1];
          const stateZip = addressParts[2].split(' ').map(part => part.trim());
          const state = stateZip[0];
          const zip = stateZip[1];

          setParsedAddress({
            address_line1: streetAddress,
            address_line2: null,
            city,
            state,
            zip
          });
          setEmployee(prev => ({ ...prev, address_line1: streetAddress, city, state, zip }));
        } else {
          setAddressError('Address could not be parsed. Please use format: Street, City, State ZIP');
        }
      }
    }
  }

  function validatePhone(value: string) {
    // Accepts +1 (555) 123-4567, (555) 123-4567, 555-123-4567, 5551234567, etc.
    const phoneRegex = /^\+?\d{0,3}?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
    return value === '' || phoneRegex.test(value);
  }

  function handleMobileChange(value: string) {
    setEmployee(prev => ({ ...prev, phone_number: value }));
    setMobileError(validatePhone(value) ? null : 'Invalid phone format');
  }

  function handlePhoneChange(value: string) {
    setEmployee(prev => ({ ...prev, phone_number: value }));
    setPhoneError(validatePhone(value) ? null : 'Invalid phone format');
  }

  const validateEmployeeData = () => {
    const errors: string[] = [];
    
    // Required fields
    if (!employee.first_name?.trim()) errors.push('First name is required');
    if (!employee.last_name?.trim()) errors.push('Last name is required');
    if (!employee.email?.trim()) errors.push('Email is required');
    if (!employee.ssn?.trim()) errors.push('SSN is required');
    if (!employee.date_of_birth?.trim()) errors.push('Date of birth is required');
    if (!employee.gender?.trim()) errors.push('Gender is required');
    
    // Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (employee.email && !emailRegex.test(employee.email)) {
      errors.push('Invalid email format');
    }
    
    // SSN format (9 digits)
    const ssnRegex = /^\d{9}$/;
    if (employee.ssn && !ssnRegex.test(employee.ssn.replace(/-/g, ''))) {
      errors.push('SSN must be 9 digits');
    }
    
    // Phone format (if provided)
    const phoneRegex = /^\+?\d{0,3}?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
    if (employee.phone_number && !phoneRegex.test(employee.phone_number)) {
      errors.push('Invalid phone format');
    }
    
    // Address validation - now just a warning
    if (employee.address_line1 && !parsedAddress) {
      console.warn('Address could not be verified - this is just a warning');
    }
    
    // Employment history is now optional
    // if (employmentHistory.length === 0) {
    //   errors.push('At least one employment history entry is required');
    // }
    
    return errors;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate all required fields
      const validationErrors = validateEmployeeData();
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('\n'));
      }

      if (!user) {
        throw new Error('You must be logged in to create an employee');
      }

      // Ensure we have address components even if verification failed
      const addressData = parsedAddress || (employee.address_line1 ? (() => {
        const parts = [employee.address_line1, employee.city, employee.state, employee.zip].map(part => part.trim());
        if (parts.length >= 3) {
          const streetAddress = parts[0];
          const city = parts[1];
          const stateZip = parts[2].split(' ').map(part => part.trim());
          return {
            address_line1: streetAddress,
            address_line2: null,
            city,
            state: stateZip[0],
            zip: stateZip[1]
          };
        }
        return null;
      })() : null);

      // Only save core employee information
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .insert({
          first_name: employee.first_name.trim(),
          middle_name: employee.middle_name?.trim() || null,
          last_name: employee.last_name.trim(),
          email: employee.email.trim().toLowerCase(),
          address_line1: addressData?.address_line1 || null,
          address_line2: addressData?.address_line2 || null,
          city: addressData?.city || null,
          state: addressData?.state || null,
          zip: addressData?.zip || null,
          phone_number: employee.phone_number?.trim() || null,
          ssn: employee.ssn.replace(/-/g, ''),
          date_of_birth: employee.date_of_birth,
          gender: employee.gender,
          marital_status: employee.marital_status || null,
          nationality: employee.nationality || null,
          emergency_contact_name: employee.emergency_contact_name || null,
          emergency_contact_phone: employee.emergency_contact_phone || null,
          photo_url: employee.photo_url || null,
          created_by: user.id,
          updated_by: user.id,
        })
        .select()
        .single();

      if (employeeError) {
        console.error('Error creating employee:', employeeError);
        throw new Error(employeeError.message);
      }

      if (!employeeData) {
        throw new Error('Failed to create employee record');
      }

      // Success - redirect to employee list
      router.push('/admin/employees');
    } catch (err) {
      console.error('Error in handleSave:', err);
      setError(err instanceof Error ? err.message : 'Failed to create employee');
    } finally {
      setLoading(false);
    }
  };

  function handleAddOrEditHistory() {
    if (!historyForm.date) {
      setHistoryFormError('Effective Date is required.');
      return;
    }
    setHistoryFormError(null);
    if (historyForm.editingIndex >= 0) {
      setEmploymentHistory(prev => prev.map((entry, i) =>
        i === historyForm.editingIndex ? {
          ...historyForm,
          editingIndex: undefined
        } : entry
      ));
    } else {
      setEmploymentHistory(prev => [
        ...prev,
        {
          ...historyForm,
          editingIndex: undefined
        }
      ]);
    }
    setHistoryForm({ date: '', employeeType: '', employmentStatus: '', jobTitle: '', manager: '', location: '', workSchedule: '', details: '', editingIndex: -1 });
    setShowHistoryForm(false);
  }

  function handleEditEntry(index: number) {
    const entry = employmentHistory[index];
    setHistoryForm({ ...entry, editingIndex: index });
    setShowHistoryForm(true);
  }

  function handleNewEntry() {
    setHistoryForm({ date: '', employeeType: '', employmentStatus: '', jobTitle: '', manager: '', location: '', workSchedule: '', details: '', editingIndex: -1 });
    setShowHistoryForm(true);
  }

  function handleDeleteEntry(index: number) {
    setEmploymentHistory(prev => prev.filter((_, i) => i !== index));
  }

  const employmentSummary = employmentHistory.map(e => `On ${e.date}: ${e.employeeType} | Status: ${e.employmentStatus} | Title: ${e.jobTitle} | Manager: ${e.manager} | Location: ${e.location} | Schedule: ${e.workSchedule}`).join('\n');

  function handlePhotoDrop(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPendingPhotoFile(files[0]);
    setError(null);
  }

  function handlePhotoZoneClick() {
    fileInputRef.current?.click();
  }

  return (
    <div className="flex flex-col min-h-screen p-6 gap-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <h1 className="text-3xl font-bold">New Employee</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/employees')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Employee'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}

      {/* Employee Information Card */}
      <Card className={!completedSections.employeeInfo ? "border-red-500 bg-red-50/50" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Employee Information
            {!completedSections.employeeInfo && (
              <span className="text-sm text-red-500">(Required fields incomplete)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Display employee_id, created_at, updated_at if present */}
            {employee.employee_id && (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label>Employee ID</Label>
                  <Input value={employee.employee_id} readOnly disabled />
                </div>
                <div className="space-y-1">
                  <Label>Created At</Label>
                  <Input value={employee.created_at || ''} readOnly disabled />
                </div>
                <div className="space-y-1">
                  <Label>Updated At</Label>
                  <Input value={employee.updated_at || ''} readOnly disabled />
                </div>
              </div>
            )}
            {/* Name fields in a single row */}
            <div className="grid grid-cols-4 gap-4">
              {/* First Name */}
              <div className="space-y-1">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={employee.first_name}
                  onChange={e => setEmployee(prev => ({ ...prev, first_name: e.target.value }))}
                  placeholder="First name"
                />
                {/* Nationality dropdown under First Name */}
                <div className="mt-2">
                  <Label htmlFor="nationality">Nationality</Label>
                  <select
                    id="nationality"
                    value={employee.nationality}
                    onChange={e => setEmployee(prev => ({ ...prev, nationality: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Select nationality</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="Mexico">Mexico</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="India">India</option>
                    <option value="China">China</option>
                    <option value="Japan">Japan</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Brazil">Brazil</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              {/* Middle Name/Initial */}
              <div className="space-y-1">
                <Label htmlFor="middle_name">Middle Name/Initial</Label>
                <Input
                  id="middle_name"
                  value={employee.middle_name}
                  onChange={e => setEmployee(prev => ({ ...prev, middle_name: e.target.value }))}
                  placeholder="Middle name or initial"
                />
                {/* SSN under Middle Name */}
                <div className="mt-2">
                  <Label htmlFor="ssn">SSN</Label>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <>
                        <input
                          key={i}
                          ref={ssnRefs[i]}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          className="w-8 h-10 text-center border rounded"
                          value={employee.ssn[i] || ''}
                          onChange={e => handleSsnChange(i, e.target.value)}
                          onKeyDown={e => handleSsnKeyDown(i, e)}
                          placeholder={i === 0 ? 'X' : ''}
                        />
                        {(i === 2 || i === 4) && <span className="mx-1">-</span>}
                      </>
                    ))}
                  </div>
                </div>
              </div>
              {/* Last Name */}
              <div className="space-y-1">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={employee.last_name}
                  onChange={e => setEmployee(prev => ({ ...prev, last_name: e.target.value }))}
                  placeholder="Last name"
                />
              </div>
              {/* Preferred Name */}
              <div className="space-y-1">
                <Label htmlFor="preferred_name">Preferred Name</Label>
                <Input
                  id="preferred_name"
                  value={employee.preferred_name}
                  onChange={e => setEmployee(prev => ({ ...prev, preferred_name: e.target.value }))}
                  placeholder="Preferred name"
                />
                {/* Date of Birth under Preferred Name */}
                <div className="w-full max-w-xs mt-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={employee.date_of_birth}
                    onChange={e => setEmployee(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    placeholder="Date of Birth"
                  />
                </div>
              </div>
            </div>
            {/* Address, Email, and Phone Number in one row */}
            <div className="grid grid-cols-3 gap-4">
              {/* Address field with validation */}
              <div className="space-y-1">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={addressInput}
                  onChange={e => handleAddressChange(e.target.value)}
                  placeholder="Paste full address from Google Maps"
                />
                {parsedAddress && (
                  <div className="text-xs text-green-700 mt-1">
                    Verified: {parsedAddress.address_line1}
                    {parsedAddress.address_line2 ? `, ${parsedAddress.address_line2}` : ''}, {parsedAddress.city}, {parsedAddress.state} {parsedAddress.zip}
                  </div>
                )}
                {addressError && (
                  <div className="text-xs text-red-600 mt-1">{addressError}</div>
                )}
                {addressInput && !parsedAddress && !addressError && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
                    <p className="font-medium">Address Verification Warning</p>
                    <p className="text-sm">The address could not be verified. You may proceed, but please verify the address manually.</p>
                  </div>
                )}
              </div>
              {/* Email Address */}
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={employee.email}
                  onChange={e => setEmployee(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email address"
                />
              </div>
              {/* Phone Number */}
              <div className="space-y-1">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={employee.phone_number}
                  onChange={e => setEmployee(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
            </div>
            {/* Emergency Contact Name, Emergency Contact Phone, Photo Upload Drop Zone */}
            <div className="grid grid-cols-3 gap-4 mt-2">
              {/* Emergency Contact Name */}
              <div className="space-y-1">
                <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={employee.emergency_contact_name}
                  onChange={e => setEmployee(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                  placeholder="Emergency contact name"
                />
              </div>
              {/* Emergency Contact Phone */}
              <div className="space-y-1">
                <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  value={employee.emergency_contact_phone}
                  onChange={e => setEmployee(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                  placeholder="Emergency contact phone"
                />
              </div>
              {/* Photo Upload Drop Zone */}
              <div className="space-y-1">
                <Label>Photo</Label>
                <div
                  className={`border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center cursor-pointer ${uploadingPhoto ? 'opacity-50' : 'hover:border-primary'}`}
                  tabIndex={0}
                  onClick={handlePhotoZoneClick}
                  onDragOver={e => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Drop event fired', e.dataTransfer.files);
                    handlePhotoDrop(e.dataTransfer.files);
                  }}
                  style={{ minHeight: 120 }}
                >
                  {pendingPhotoFile ? (
                    <img
                      src={URL.createObjectURL(pendingPhotoFile)}
                      alt="Preview"
                      className="h-24 w-24 object-cover rounded-full mb-2"
                    />
                  ) : employee.photo_url ? (
                    <img src={employee.photo_url} alt="Employee Photo" className="h-24 w-24 object-cover rounded-full mb-2" />
                  ) : null}
                  <span className="text-muted-foreground">
                    {pendingPhotoFile
                      ? pendingPhotoFile.name
                      : employee.photo_url
                      ? 'Current photo'
                      : 'Drag & drop or click to select photo'}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => handlePhotoDrop(e.target.files)}
                    disabled={uploadingPhoto}
                  />
                </div>
                {uploadingPhoto && <div className="text-xs text-muted-foreground mt-1">Uploading...</div>}
                {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6 items-end">
              {/* Marital Status (radio buttons) */}
              <div className="space-y-1">
                <Label>Marital Status</Label>
                <div className="flex items-center gap-4 mt-1">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="marital_status"
                      value="single"
                      checked={employee.marital_status === 'single'}
                      onChange={() => setEmployee(prev => ({ ...prev, marital_status: 'single' }))}
                    />
                    Single
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="marital_status"
                      value="married"
                      checked={employee.marital_status === 'married'}
                      onChange={() => setEmployee(prev => ({ ...prev, marital_status: 'married' }))}
                    />
                    Married
                  </label>
                </div>
              </div>
              {/* Gender (radio buttons) and Action Buttons in a row */}
              <div className="flex items-end gap-4">
                <div className="space-y-1">
                  <Label>Gender</Label>
                  <div className="flex items-center gap-4 mt-1">
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={employee.gender === 'male'}
                        onChange={() => setEmployee(prev => ({ ...prev, gender: 'male' }))}
                      />
                      Male
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={employee.gender === 'female'}
                        onChange={() => setEmployee(prev => ({ ...prev, gender: 'female' }))}
                      />
                      Female
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 ml-4 mb-1">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/employees')}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Employee'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employment Details */}
      <Card className={!completedSections.employmentHistory ? "border-yellow-500 bg-yellow-50/50" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Employment Details
            {!completedSections.employmentHistory && (
              <span className="text-sm text-yellow-600">(Optional - can be added later)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {employmentHistory.length === 0 ? (
              <div className="border rounded p-4 bg-muted/10 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="date">Effective Date</Label>
                    <Input id="date" type="date" value={historyForm.date} onChange={e => setHistoryForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="employmentStatus">Status</Label>
                    <Input id="employmentStatus" value={historyForm.employmentStatus || 'New Hire'} onChange={e => setHistoryForm(f => ({ ...f, employmentStatus: e.target.value }))} placeholder="Status" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="employeeType">Role</Label>
                    <select
                      id="employeeType"
                      value={historyForm.employeeType}
                      onChange={e => setHistoryForm(f => ({ ...f, employeeType: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Select Role</option>
                      {roleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <select
                      id="jobTitle"
                      value={historyForm.jobTitle}
                      onChange={e => setHistoryForm(f => ({ ...f, jobTitle: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Select Job Title</option>
                      {jobTitleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="manager">Manager</Label>
                    <select
                      id="manager"
                      value={historyForm.manager}
                      onChange={e => setHistoryForm(f => ({ ...f, manager: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Select Manager</option>
                      {managerOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="location">Location</Label>
                    <select
                      id="location"
                      value={historyForm.location}
                      onChange={e => setHistoryForm(f => ({ ...f, location: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Select Location</option>
                      {locationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="workSchedule">Work Schedule</Label>
                    <select
                      id="workSchedule"
                      value={historyForm.workSchedule}
                      onChange={e => setHistoryForm(f => ({ ...f, workSchedule: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">Select Work Schedule</option>
                      {workScheduleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" onClick={handleAddOrEditHistory}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => { setHistoryForm({ date: '', employeeType: '', employmentStatus: '', jobTitle: '', manager: '', location: '', workSchedule: '', details: '', editingIndex: -1 }); setHistoryFormError(null); }}>Cancel</Button>
                </div>
                {historyFormError && <div className="text-xs text-red-600 mt-1">{historyFormError}</div>}
              </div>
            ) : (
              <div className="space-y-4">
                {employmentHistory.map((entry, i) => (
                  <div key={i} className="border rounded p-4 bg-muted/10 space-y-2">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label>Effective Date</Label>
                        <div className="p-2 bg-white rounded border">{entry.date}</div>
                      </div>
                      <div className="space-y-1">
                        <Label>Status</Label>
                        <div className="p-2 bg-white rounded border">{entry.employmentStatus}</div>
                      </div>
                      <div className="space-y-1">
                        <Label>Role</Label>
                        <div className="p-2 bg-white rounded border">{entry.employeeType}</div>
                      </div>
                      <div className="space-y-1">
                        <Label>Job Title</Label>
                        <div className="p-2 bg-white rounded border">{entry.jobTitle}</div>
                      </div>
                      <div className="space-y-1">
                        <Label>Manager</Label>
                        <div className="p-2 bg-white rounded border">{entry.manager}</div>
                      </div>
                      <div className="space-y-1">
                        <Label>Location</Label>
                        <div className="p-2 bg-white rounded border">{entry.location}</div>
                      </div>
                      <div className="space-y-1">
                        <Label>Work Schedule</Label>
                        <div className="p-2 bg-white rounded border">{entry.workSchedule}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => setEditMode({ index: i, action: '' })}>Edit</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Edit dialog/row for employment history */}
            {editMode !== null && (
              <div className="mt-4 border rounded p-4 bg-muted/10">
                {!editAction ? (
                  <div className="space-y-2">
                    <Label>What do you want to do?</Label>
                    <div className="flex gap-2 flex-wrap">
                      {editActions.map(action => (
                        <Button key={action} size="sm" onClick={() => setEditAction(action)}>{action}</Button>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setEditMode(null); setEditAction(''); }}>Cancel</Button>
                  </div>
                ) : editAction === 'Correction' ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label>Effective Date</Label>
                        <Input type="date" value={historyForm.date} onChange={e => setHistoryForm(f => ({ ...f, date: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label>Status</Label>
                        <Input value={historyForm.employmentStatus} onChange={e => setHistoryForm(f => ({ ...f, employmentStatus: e.target.value }))} placeholder="Status" />
                      </div>
                      <div className="space-y-1">
                        <Label>Role</Label>
                        <select
                          id="employeeType"
                          value={historyForm.employeeType}
                          onChange={e => setHistoryForm(f => ({ ...f, employeeType: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Select Role</option>
                          {roleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Job Title</Label>
                        <select
                          id="jobTitle"
                          value={historyForm.jobTitle}
                          onChange={e => setHistoryForm(f => ({ ...f, jobTitle: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Select Job Title</option>
                          {jobTitleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Manager</Label>
                        <select
                          id="manager"
                          value={historyForm.manager}
                          onChange={e => setHistoryForm(f => ({ ...f, manager: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Select Manager</option>
                          {managerOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Location</Label>
                        <select
                          id="location"
                          value={historyForm.location}
                          onChange={e => setHistoryForm(f => ({ ...f, location: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Select Location</option>
                          {locationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Work Schedule</Label>
                        <select
                          id="workSchedule"
                          value={historyForm.workSchedule}
                          onChange={e => setHistoryForm(f => ({ ...f, workSchedule: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Select Work Schedule</option>
                          {workScheduleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Details</Label>
                      <Input value={historyForm.details} onChange={e => setHistoryForm(f => ({ ...f, details: e.target.value }))} placeholder="Details" />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => { setEditMode(null); setEditAction(''); }}>Cancel</Button>
                      <Button size="sm" onClick={() => {
                        setEmploymentHistory(prev => prev.map((entry, i) => i === editMode.index ? { ...historyForm, editingIndex: undefined } : entry));
                        setEditMode(null); setEditAction('');
                      }}>Save Correction</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label>Effective Date</Label>
                        <Input type="date" value={historyForm.date} onChange={e => setHistoryForm(f => ({ ...f, date: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <Label>Status</Label>
                        <Input value={historyForm.employmentStatus} onChange={e => setHistoryForm(f => ({ ...f, employmentStatus: e.target.value }))} placeholder="Status" />
                      </div>
                      <div className="space-y-1">
                        <Label>Role</Label>
                        <select
                          id="employeeType"
                          value={historyForm.employeeType}
                          onChange={e => setHistoryForm(f => ({ ...f, employeeType: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Select Role</option>
                          {roleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Job Title</Label>
                        <select
                          id="jobTitle"
                          value={historyForm.jobTitle}
                          onChange={e => setHistoryForm(f => ({ ...f, jobTitle: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Select Job Title</option>
                          {jobTitleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Manager</Label>
                        <select
                          id="manager"
                          value={historyForm.manager}
                          onChange={e => setHistoryForm(f => ({ ...f, manager: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Select Manager</option>
                          {managerOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Location</Label>
                        <select
                          id="location"
                          value={historyForm.location}
                          onChange={e => setHistoryForm(f => ({ ...f, location: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Select Location</option>
                          {locationOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label>Work Schedule</Label>
                        <select
                          id="workSchedule"
                          value={historyForm.workSchedule}
                          onChange={e => setHistoryForm(f => ({ ...f, workSchedule: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Select Work Schedule</option>
                          {workScheduleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label>Details</Label>
                      <Input value={historyForm.details} onChange={e => setHistoryForm(f => ({ ...f, details: e.target.value }))} placeholder="Details" />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => { setEditMode(null); setEditAction(''); }}>Cancel</Button>
                      <Button size="sm" onClick={() => {
                        setEmploymentHistory(prev => [
                          ...prev,
                          { ...historyForm, editingIndex: undefined }
                        ]);
                        setEditMode(null); setEditAction('');
                      }}>Add Entry</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Compensation */}
      <Card>
        <CardHeader>
          <CardTitle>Compensation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  value={compensation.salary}
                  onChange={e => setCompensation(prev => ({ ...prev, salary: e.target.value }))}
                  placeholder="Annual salary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonus">Bonus</Label>
                <Input
                  id="bonus"
                  type="number"
                  value={compensation.bonus}
                  onChange={e => setCompensation(prev => ({ ...prev, bonus: e.target.value }))}
                  placeholder="Bonus amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay_grade">Pay Grade</Label>
                <Input
                  id="pay_grade"
                  value={compensation.pay_grade}
                  onChange={e => setCompensation(prev => ({ ...prev, pay_grade: e.target.value }))}
                  placeholder="Pay grade"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay_frequency">Pay Frequency</Label>
                <Input
                  id="pay_frequency"
                  value={compensation.pay_frequency}
                  onChange={e => setCompensation(prev => ({ ...prev, pay_frequency: e.target.value }))}
                  placeholder="e.g. Bi-weekly, Monthly"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="effective_date">Effective Date</Label>
                <Input
                  id="effective_date"
                  type="date"
                  value={compensation.effective_date}
                  onChange={e => setCompensation(prev => ({ ...prev, effective_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={compensation.end_date}
                  onChange={e => setCompensation(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="overtime_eligible">Overtime Eligible</Label>
                <select
                  id="overtime_eligible"
                  value={compensation.overtime_eligible ? 'yes' : 'no'}
                  onChange={e => setCompensation(prev => ({ ...prev, overtime_eligible: e.target.value === 'yes' }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_withholding_status">Tax Withholding Status</Label>
                <Input
                  id="tax_withholding_status"
                  value={compensation.tax_withholding_status}
                  onChange={e => setCompensation(prev => ({ ...prev, tax_withholding_status: e.target.value }))}
                  placeholder="e.g. Single, Married, Exempt"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account_number">Bank Account Number</Label>
                <Input
                  id="bank_account_number"
                  value={compensation.bank_account_number}
                  onChange={e => setCompensation(prev => ({ ...prev, bank_account_number: e.target.value }))}
                  placeholder="Bank account number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_routing_number">Bank Routing Number</Label>
                <Input
                  id="bank_routing_number"
                  value={compensation.bank_routing_number}
                  onChange={e => setCompensation(prev => ({ ...prev, bank_routing_number: e.target.value }))}
                  placeholder="Bank routing number"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="benefit_type">Benefit Type</Label>
                <Input
                  id="benefit_type"
                  value={benefits.benefit_type}
                  onChange={e => setBenefits(prev => ({ ...prev, benefit_type: e.target.value }))}
                  placeholder="e.g. Health, Dental, Vision"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan_name">Plan Name</Label>
                <Input
                  id="plan_name"
                  value={benefits.plan_name}
                  onChange={e => setBenefits(prev => ({ ...prev, plan_name: e.target.value }))}
                  placeholder="Plan name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coverage_level">Coverage Level</Label>
                <Input
                  id="coverage_level"
                  value={benefits.coverage_level}
                  onChange={e => setBenefits(prev => ({ ...prev, coverage_level: e.target.value }))}
                  placeholder="e.g. Individual, Family"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contribution_rate">Contribution Rate</Label>
                <Input
                  id="contribution_rate"
                  type="number"
                  value={benefits.contribution_rate}
                  onChange={e => setBenefits(prev => ({ ...prev, contribution_rate: e.target.value }))}
                  placeholder="Contribution rate (%)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enrollment_date">Enrollment Date</Label>
                <Input
                  id="enrollment_date"
                  type="date"
                  value={benefits.enrollment_date}
                  onChange={e => setBenefits(prev => ({ ...prev, enrollment_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="termination_date">Termination Date</Label>
                <Input
                  id="termination_date"
                  type="date"
                  value={benefits.termination_date}
                  onChange={e => setBenefits(prev => ({ ...prev, termination_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="beneficiary_name">Beneficiary Name</Label>
                <Input
                  id="beneficiary_name"
                  value={benefits.beneficiary_name}
                  onChange={e => setBenefits(prev => ({ ...prev, beneficiary_name: e.target.value }))}
                  placeholder="Beneficiary name"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="beneficiary_relationship">Beneficiary Relationship</Label>
                <Input
                  id="beneficiary_relationship"
                  value={benefits.beneficiary_relationship}
                  onChange={e => setBenefits(prev => ({ ...prev, beneficiary_relationship: e.target.value }))}
                  placeholder="Relationship to beneficiary"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Qualifications */}
      <Card>
        <CardHeader>
          <CardTitle>Qualifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Qualification Name</Label>
                <Input
                  id="name"
                  value={qualifications.name}
                  onChange={e => setQualifications(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. PMP, CPA, RN"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qualification_type">Qualification Type</Label>
                <Input
                  id="qualification_type"
                  value={qualifications.qualification_type}
                  onChange={e => setQualifications(prev => ({ ...prev, qualification_type: e.target.value }))}
                  placeholder="e.g. Certification, Degree"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institution">Institution</Label>
                <Input
                  id="institution"
                  value={qualifications.institution}
                  onChange={e => setQualifications(prev => ({ ...prev, institution: e.target.value }))}
                  placeholder="Issuing institution"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proficiency_level">Proficiency Level</Label>
                <Input
                  id="proficiency_level"
                  value={qualifications.proficiency_level}
                  onChange={e => setQualifications(prev => ({ ...prev, proficiency_level: e.target.value }))}
                  placeholder="e.g. Beginner, Intermediate, Expert"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue_date">Issue Date</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={qualifications.issue_date}
                  onChange={e => setQualifications(prev => ({ ...prev, issue_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration_date">Expiration Date</Label>
                <Input
                  id="expiration_date"
                  type="date"
                  value={qualifications.expiration_date}
                  onChange={e => setQualifications(prev => ({ ...prev, expiration_date: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="document_type">Document Type</Label>
                <Input
                  id="document_type"
                  value={complianceDocuments.document_type}
                  onChange={e => setComplianceDocuments(prev => ({ ...prev, document_type: e.target.value }))}
                  placeholder="e.g. License, Certification, ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document_number">Document Number</Label>
                <Input
                  id="document_number"
                  value={complianceDocuments.document_number}
                  onChange={e => setComplianceDocuments(prev => ({ ...prev, document_number: e.target.value }))}
                  placeholder="Document number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file_url">File URL</Label>
                <Input
                  id="file_url"
                  value={complianceDocuments.file_url}
                  onChange={e => setComplianceDocuments(prev => ({ ...prev, file_url: e.target.value }))}
                  placeholder="Link to file or upload"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issue_date">Issue Date</Label>
                <Input
                  id="issue_date"
                  type="date"
                  value={complianceDocuments.issue_date}
                  onChange={e => setComplianceDocuments(prev => ({ ...prev, issue_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiration_date">Expiration Date</Label>
                <Input
                  id="expiration_date"
                  type="date"
                  value={complianceDocuments.expiration_date}
                  onChange={e => setComplianceDocuments(prev => ({ ...prev, expiration_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Input
                  id="status"
                  value={complianceDocuments.status}
                  onChange={e => setComplianceDocuments(prev => ({ ...prev, status: e.target.value }))}
                  placeholder="e.g. Active, Expired, Pending"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Access Control */}
      <Card>
        <CardHeader>
          <CardTitle>Access Control</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="access_level">Access Level</Label>
                <Input
                  id="access_level"
                  value={accessControl.access_level}
                  onChange={e => setAccessControl(prev => ({ ...prev, access_level: e.target.value }))}
                  placeholder="e.g. Admin, User, Guest"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clearance_status">Clearance Status</Label>
                <Input
                  id="clearance_status"
                  value={accessControl.clearance_status}
                  onChange={e => setAccessControl(prev => ({ ...prev, clearance_status: e.target.value }))}
                  placeholder="e.g. Active, Suspended"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="device_id">Device ID</Label>
                <Input
                  id="device_id"
                  value={accessControl.device_id}
                  onChange={e => setAccessControl(prev => ({ ...prev, device_id: e.target.value }))}
                  placeholder="Device ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="system_name">System Name</Label>
                <Input
                  id="system_name"
                  value={accessControl.system_name}
                  onChange={e => setAccessControl(prev => ({ ...prev, system_name: e.target.value }))}
                  placeholder="System name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="issued_date">Issued Date</Label>
                <Input
                  id="issued_date"
                  type="date"
                  value={accessControl.issued_date}
                  onChange={e => setAccessControl(prev => ({ ...prev, issued_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="revoked_date">Revoked Date</Label>
                <Input
                  id="revoked_date"
                  type="date"
                  value={accessControl.revoked_date}
                  onChange={e => setAccessControl(prev => ({ ...prev, revoked_date: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reviewer_id">Reviewer ID</Label>
                <Input
                  id="reviewer_id"
                  value={performanceReviews.reviewer_id}
                  onChange={e => setPerformanceReviews(prev => ({ ...prev, reviewer_id: e.target.value }))}
                  placeholder="Reviewer ID (UUID)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review_date">Review Date</Label>
                <Input
                  id="review_date"
                  type="date"
                  value={performanceReviews.review_date}
                  onChange={e => setPerformanceReviews(prev => ({ ...prev, review_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Rating</Label>
                <Input
                  id="rating"
                  type="number"
                  value={performanceReviews.rating}
                  onChange={e => setPerformanceReviews(prev => ({ ...prev, rating: e.target.value }))}
                  placeholder="Rating (e.g. 1-5)"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="goals">Goals</Label>
                <Input
                  id="goals"
                  value={performanceReviews.goals}
                  onChange={e => setPerformanceReviews(prev => ({ ...prev, goals: e.target.value }))}
                  placeholder="Goals discussed in review"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="comments">Comments</Label>
                <Input
                  id="comments"
                  value={performanceReviews.comments}
                  onChange={e => setPerformanceReviews(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Additional comments"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Balances */}
      <Card>
        <CardHeader>
          <CardTitle>Leave Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leave_type">Leave Type</Label>
                <Input
                  id="leave_type"
                  value={leaveBalances.leave_type}
                  onChange={e => setLeaveBalances(prev => ({ ...prev, leave_type: e.target.value }))}
                  placeholder="e.g. Vacation, Sick, Personal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accrual_date">Accrual Date</Label>
                <Input
                  id="accrual_date"
                  type="date"
                  value={leaveBalances.accrual_date}
                  onChange={e => setLeaveBalances(prev => ({ ...prev, accrual_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="balance">Balance</Label>
                <Input
                  id="balance"
                  type="number"
                  value={leaveBalances.balance}
                  onChange={e => setLeaveBalances(prev => ({ ...prev, balance: e.target.value }))}
                  placeholder="Leave balance"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction_amount">Transaction Amount</Label>
                <Input
                  id="transaction_amount"
                  type="number"
                  value={leaveBalances.transaction_amount}
                  onChange={e => setLeaveBalances(prev => ({ ...prev, transaction_amount: e.target.value }))}
                  placeholder="Transaction amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction_type">Transaction Type</Label>
                <Input
                  id="transaction_type"
                  value={leaveBalances.transaction_type}
                  onChange={e => setLeaveBalances(prev => ({ ...prev, transaction_type: e.target.value }))}
                  placeholder="e.g. Accrual, Usage, Adjustment"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 