"use client";

import { useSearchParams } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ArrowLeft, Pencil, Trash2, FileText, Image as ImageIcon, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { verifyAddress } from '@/lib/geocodio';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { formatPhoneNumber, isValidPhoneNumber } from '@/lib/phone-format';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import Select from 'react-select';

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

interface JobTitle {
  role_id: number;  // Changed from string to number
  role_name: string;
  description: string | null;
}

interface EmploymentStatus {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

// Add these interfaces after the existing interfaces
interface PayGrade {
  grade_id: string;
  grade_code: string;
  grade_name: string;
  description: string | null;
  is_active: boolean;
}

interface PayFrequency {
  frequency_id: string;
  frequency_code: string;
  frequency_name: string;
  description: string | null;
  is_active: boolean;
}

// Add interface for compliance document history
interface ComplianceDocument {
  document_id: string;  // Changed from id to document_id
  date: string;
  document_type: string;
  document_number: string;
  file_url: string;
  issue_date: string;
  expiration_date: string;
  calculated_status: string;
}

// Add to the interfaces section at the top
interface DocumentType {
  document_type_id: string;
  code: string;
  name: string;
  description: string | null;
  requires_expiration: boolean;
  requires_verification: boolean;
  requires_issue: boolean;
  requires_number: boolean;  // Added this property
  is_active: boolean;
}

// Remove the duplicate compensationHistory state declaration
// Keep only the first one and update the interface
interface CompensationHistoryEntry {
  id: string;
  date: string;
  compensation_type: string;
  compensation_value: string;
  bonus: string;
  pay_grade: string;
  pay_frequency: string;
  overtime_eligible: boolean;
}

// Add interfaces for the raw data types
interface RawEmploymentStatus {
  id: string;  // Changed from status_id to id to match the database
  code: string;
  name: string;
}

interface RawPayGrade {
  grade_id: string;
  grade_code: string;
  description: string | null;
}

// Add a type for the raw job title data
interface RawJobTitle {
  role_id: number;
  role_name: string;
  description: string | null;
}

// Add this helper function before the component
const getFileIcon = (fileUrl: string | null): JSX.Element | null => {
  if (!fileUrl) return null;
  const extension = fileUrl.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return <FileText className="h-5 w-5 text-red-500" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
      return <ImageIcon className="h-5 w-5 text-blue-500" />;
    default:
      return <File className="h-5 w-5 text-gray-500" />;
  }
};

export default function NewEmployeePage({ params }: { params?: { id?: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const employeeId = params?.id;
  const isEditMode = !!employeeId;
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  // Add global styles for react-select
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .css-k7n6up-control,
      .css-k7n6up-control > div,
      .css-19lfoqt,
      .css-1e54rgn-placeholder,
      .css-1u5jcnq,
      .css-1u5jcnq input,
      .css-1h0z3v5,
      .css-7isucl-indicatorContainer {
        background-color: #F5F5F0 !important;
      }
      @media (prefers-color-scheme: dark) {
        .css-k7n6up-control,
        .css-k7n6up-control > div,
        .css-19lfoqt,
        .css-1e54rgn-placeholder,
        .css-1u5jcnq,
        .css-1u5jcnq input,
        .css-1h0z3v5,
        .css-7isucl-indicatorContainer {
          background-color: rgb(17 24 39) !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
    id: string;
    date: string;
    employmentStatus: string;
    jobTitle: string;
    jobTitleId: number | null;
    manager: string;
    location: string;
    workSchedule: string;
    details: string;
  }[]>([]);
  const [historyForm, setHistoryForm] = useState({
    id: '',
    date: '',
    employmentStatus: '',
    jobTitle: '',
    jobTitleId: null as number | null,
    manager: '',
    location: '',
    workSchedule: '',
    details: '',
    editingIndex: -1,
  });
  const [showHistoryForm, setShowHistoryForm] = useState(false);
  const [compensation, setCompensation] = useState({
    bonus: '',
    effective_date: '',
    overtime_eligible: false,
    grade_id: '',
    frequency_id: '',
    compensation_type: 'salary', // Changed from '1' to 'salary'
    compensation_rate: '',
  });
  const [compensationError, setCompensationError] = useState<string | null>(null);
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
    document_type: '',
    document_number: '',
    file_url: '',
    issue_date: '',
    expiration_date: '',
    editingIndex: -1  // Add this to track which entry is being edited
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

  // Add these state variables near the other state declarations
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

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
  const managerOptions = ['John Doe', 'Jane Smith', 'None'];
  const locationOptions = ['New York', 'San Francisco', 'Remote'];
  const workScheduleOptions = ['8:00 - 17:00', 'Flex'];

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

  // Add state for job titles
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [loadingJobTitles, setLoadingJobTitles] = useState(false);

  // Add state for employment statuses
  const [employmentStatuses, setEmploymentStatuses] = useState<EmploymentStatus[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);

  // Add validation state for each field
  const [formValidation, setFormValidation] = useState({
    date: false,
    employmentStatus: false,
    jobTitle: false,
    manager: false,
    location: false,
    workSchedule: false
  });

  // Add new state for pay grades and frequencies
  const [payGrades, setPayGrades] = useState<PayGrade[]>([]);
  const [payFrequencies, setPayFrequencies] = useState<PayFrequency[]>([]);
  const [loadingPayGrades, setLoadingPayGrades] = useState(false);
  const [loadingPayFrequencies, setLoadingPayFrequencies] = useState(false);

  // Add state for compliance document history
  const [compensationHistory, setCompensationHistory] = useState<CompensationHistoryEntry[]>([]);
  const [complianceError, setComplianceError] = useState<string | null>(null);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loadingDocumentTypes, setLoadingDocumentTypes] = useState(false);
  const [complianceHistory, setComplianceHistory] = useState<ComplianceDocument[]>([]);

  // Add this to the state declarations at the top of the component
  const [photoLoading, setPhotoLoading] = useState(true);
  const [photoSignedUrl, setPhotoSignedUrl] = useState<string | null>(null);

  // Add the fetch function with the other fetch functions
  async function fetchDocumentTypes() {
    try {
      setLoadingDocumentTypes(true);
      const { data, error } = await supabase
        .from('employee_document_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching document types:', error);
        throw error;
      }

      console.log('Fetched document types:', data);
      setDocumentTypes(data || []);
    } catch (err) {
      console.error('Error in fetchDocumentTypes:', err);
      setError('Failed to load document types');
    } finally {
      setLoadingDocumentTypes(false);
    }
  }

  // Add useEffect to fetch pay grades and frequencies
  useEffect(() => {
    async function fetchPayGrades() {
      try {
        setLoadingPayGrades(true);
        const { data, error } = await supabase
          .from('pay_grade_reference')
          .select('*')
          .eq('is_active', true)
          .order('grade_code');

        if (error) {
          console.error('Error fetching pay grades:', error);
          return;
        }

        // Sort pay grades numerically by extracting the number from grade_code
        const sortedData = (data || []).sort((a, b) => {
          const numA = parseInt(a.grade_code.replace(/[^0-9]/g, ''));
          const numB = parseInt(b.grade_code.replace(/[^0-9]/g, ''));
          return numA - numB;
        });

        setPayGrades(sortedData);
      } catch (err) {
        console.error('Error fetching pay grades:', err);
      } finally {
        setLoadingPayGrades(false);
      }
    }

    async function fetchPayFrequencies() {
      try {
        setLoadingPayFrequencies(true);
        const { data, error } = await supabase
          .from('pay_frequency_reference')
          .select('*')
          .eq('is_active', true)
          .order('frequency_code');

        if (error) {
          console.error('Error fetching pay frequencies:', error);
          return;
        }

        setPayFrequencies(data || []);
      } catch (err) {
        console.error('Error fetching pay frequencies:', err);
      } finally {
        setLoadingPayFrequencies(false);
      }
    }

    fetchPayGrades();
    fetchPayFrequencies();
  }, []);

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

  // Add useEffect to load employee data in edit mode
  useEffect(() => {
    async function loadEmployeeData() {
      if (!employeeId) return;
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('employee_id', employeeId)
          .single();

        if (error) throw error;
        if (data) {
          // Construct the full address string from the database fields
          const addressParts = [
            data.address_line1,
            data.address_line2,
            data.city,
            data.state,
            data.zip
          ].filter(Boolean); // Remove any null/undefined/empty values
          
          const fullAddress = addressParts.join(', ');
          setAddressInput(fullAddress);
          
          // Set the parsed address immediately since we know it's valid
          setParsedAddress({
            address_line1: data.address_line1 || '',
            address_line2: data.address_line2 || null,
            city: data.city || '',
            state: data.state || '',
            zip: data.zip || ''
          });

          // Get signed URL for photo if exists
          if (data.photo_url) {
            const { data: signedUrlData } = await supabase.storage
              .from('employee-photos')
              .createSignedUrl(`${data.employee_id}.JPG`, 3600);
            if (signedUrlData) {
              setEmployee({ ...data, photo_url: signedUrlData.signedUrl });
            } else {
              setEmployee(data);
            }
          } else {
            setEmployee(data);
          }
        }
      } catch (err) {
        console.error('Error loading employee:', err);
        setError('Failed to load employee data');
      }
    }

    loadEmployeeData();
  }, [employeeId]);

  // Add useEffect to format phone numbers when component loads or employee data changes
  useEffect(() => {
    if (employee.phone_number) {
      const formattedPhone = formatPhoneNumber(employee.phone_number);
      if (formattedPhone !== employee.phone_number) {
        setEmployee(prev => ({ ...prev, phone_number: formattedPhone }));
      }
    }
    if (employee.emergency_contact_phone) {
      const formattedEmergency = formatPhoneNumber(employee.emergency_contact_phone);
      if (formattedEmergency !== employee.emergency_contact_phone) {
        setEmployee(prev => ({ ...prev, emergency_contact_phone: formattedEmergency }));
      }
    }
  }, [employee.phone_number, employee.emergency_contact_phone]);

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
    
    // Don't try to verify if the address is too short
    if (value.length < 10) {
      setParsedAddress(null);
      setAddressError(null);
      return;
    }

    // If we're in edit mode and this is the initial load, don't verify
    if (isEditMode && value === addressInput && parsedAddress) {
      return;
    }

    try {
      const verified = await verifyAddress(value);
      if (verified) {
        // Parse the address components
        const addressParts = value.split(',').map(part => part.trim());
        const streetAddress = addressParts[0] || '';
        const city = verified.city || addressParts[1] || '';
        const stateZip = (verified.state + ' ' + verified.zip) || addressParts[2] || '';
        const [state, zip] = stateZip.split(' ').map(part => part.trim());

        const newParsedAddress = {
          address_line1: streetAddress,
          address_line2: null,
          city,
          state,
          zip
        };

        setParsedAddress(newParsedAddress);
        setAddressError(null);
        
        // Update employee state with the verified address
        setEmployee(prev => ({
          ...prev,
          address_line1: streetAddress,
          city,
          state,
          zip
        }));
      } else {
        // If verification fails, try to parse the address manually
        const addressParts = value.split(',').map(part => part.trim());
        if (addressParts.length >= 3) {
          const streetAddress = addressParts[0];
          const city = addressParts[1];
          const stateZip = addressParts[2].split(' ').map(part => part.trim());
          const state = stateZip[0];
          const zip = stateZip[1];

          const newParsedAddress = {
            address_line1: streetAddress,
            address_line2: null,
            city,
            state,
            zip
          };

          setParsedAddress(newParsedAddress);
          setAddressError(null);
          
          // Update employee state with the manually parsed address
          setEmployee(prev => ({
            ...prev,
            address_line1: streetAddress,
            city,
            state,
            zip
          }));
        } else {
          setAddressError('Address could not be parsed. Please use format: Street, City, State ZIP');
        }
      }
    } catch (err) {
      console.error('Error verifying address:', err);
      setAddressError('Error verifying address. Please check the format and try again.');
    }
  }

  function handlePhoneChange(value: string, field: 'phone_number' | 'emergency_contact_phone') {
    // Remove any non-digit characters except 'x' for extension
    const cleanedValue = value.replace(/[^\dx]/gi, '');
    
    // Format the phone number
    const formattedValue = formatPhoneNumber(cleanedValue);
    
    // Update the state with the formatted value
    setEmployee(prev => ({ ...prev, [field]: formattedValue }));
    
    // Validate the phone number
    const isValid = isValidPhoneNumber(formattedValue);
    if (field === 'phone_number') {
      setPhoneError(isValid ? null : 'Invalid phone format');
    } else {
      setMobileError(isValid ? null : 'Invalid phone format');
    }
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

  async function handleSave() {
    if (!user) {
      console.log('Save failed: No user logged in');
      setError('You must be logged in to save employee data');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('=== Starting save operation ===');
      console.log('Current user:', user.id);
      console.log('Edit mode:', isEditMode);
      console.log('Employee ID:', employeeId);

      // Validate required fields
      const validationErrors = validateEmployeeData();
      if (validationErrors.length > 0) {
        console.error('Validation errors:', validationErrors);
        setError(validationErrors.join(', '));
        return;
      }
      console.log('Validation passed');

      // Extract just the filename from photo_url if it exists
      let photoFilename = null;
      if (employee.photo_url) {
        // If it's a signed URL, extract the filename
        if (employee.photo_url.includes('/')) {
          const urlParts = employee.photo_url.split('/');
          photoFilename = urlParts[urlParts.length - 1].split('?')[0];
        } else {
          // If it's already just a filename
          photoFilename = employee.photo_url;
        }
      }

      // First, create/update the employee record to get the employee_id
      const employeeData = {
        first_name: employee.first_name.trim(),
        middle_name: employee.middle_name?.trim() || null,
        last_name: employee.last_name.trim(),
        preferred_name: employee.preferred_name?.trim() || null,
        email: employee.email.trim().toLowerCase(),
        address_line1: employee.address_line1 || null,
        address_line2: employee.address_line2 || null,
        city: employee.city || null,
        state: employee.state || null,
        zip: employee.zip || null,
        phone_number: employee.phone_number?.trim() || null,
        ssn: employee.ssn.replace(/-/g, ''),
        date_of_birth: employee.date_of_birth,
        gender: employee.gender,
        marital_status: employee.marital_status || null,
        nationality: employee.nationality || null,
        emergency_contact_name: employee.emergency_contact_name || null,
        emergency_contact_phone: employee.emergency_contact_phone || null,
        photo_url: pendingPhotoFile ? `${employee.employee_id}.JPG` : photoFilename,
        updated_by: user.id,
      };

      console.log('Prepared employee data:', employeeData);

      let result;
      if (isEditMode) {
        console.log('Updating existing employee...');
        result = await supabase
          .from('employees')
          .update(employeeData)
          .eq('employee_id', employeeId)
          .select()
          .single();
        console.log('Update result:', result);
      } else {
        console.log('Creating new employee...');
        result = await supabase
          .from('employees')
          .insert({
            ...employeeData,
            created_by: user.id,
          })
          .select()
          .single();
        console.log('Insert result:', result);
      }

      if (result.error) {
        console.error('Error saving employee:', result.error);
        throw new Error(result.error.message);
      }

      if (!result.data) {
        console.error('No data returned from save operation');
        throw new Error('Failed to save employee record');
      }

      const savedEmployee = result.data;
      console.log('Employee saved successfully:', savedEmployee);

      // After successful save, get a signed URL for the photo if it exists
      if (savedEmployee.photo_url) {
        const { data: signedUrlData } = await supabase.storage
          .from('employee-photos')
          .createSignedUrl(savedEmployee.photo_url, 3600);
        
        if (signedUrlData) {
          setEmployee(prev => ({ ...prev, photo_url: signedUrlData.signedUrl }));
        }
      }

      // Save employment details
      if (employmentHistory.length > 0) {
        console.log('=== Saving employment details ===');
        console.log('Number of employment details to save:', employmentHistory.length);
        console.log('Employment details to save:', employmentHistory);
        
        // If in edit mode, delete existing details first
        if (isEditMode) {
          console.log('Deleting existing employment details for employee:', savedEmployee.employee_id);
          const { error: deleteError } = await supabase
            .from('employment_details')
            .delete()
            .eq('employee_id', savedEmployee.employee_id);
          
          if (deleteError) {
            console.error('Error deleting existing employment details:', deleteError);
            throw new Error('Failed to update employment details');
          }
          console.log('Successfully deleted existing employment details');
        }

        // Insert new employment details entries
        const detailsEntries = employmentHistory.map(entry => {
          // No need to convert jobTitleId since it's already a number
          console.log('Using job title ID:', { id: entry.jobTitleId, type: typeof entry.jobTitleId });
          return {
          employee_id: savedEmployee.employee_id,
          effective_date: entry.date,
          employment_status: entry.employmentStatus,
            job_title_id: entry.jobTitleId,  // Already a number
          manager: entry.manager,
          location: entry.location,
          work_schedule: entry.workSchedule,
          details: entry.details,
          created_by: user.id,
          updated_by: user.id
          };
        });

        console.log('Prepared employment details entries:', detailsEntries);

        const { data: insertData, error: detailsError } = await supabase
          .from('employment_details')
          .insert(detailsEntries)
          .select();

        if (detailsError) {
          console.error('Error saving employment details:', detailsError);
          console.error('Error details:', {
            code: detailsError.code,
            message: detailsError.message,
            details: detailsError.details,
            hint: detailsError.hint
          });
          throw new Error('Failed to save employment details');
        }

        console.log('Employment details saved successfully:', insertData);
      } else {
        console.log('No employment details to save');
      }

      // Handle photo upload if there's a pending file
      if (pendingPhotoFile) {
        console.log('=== Starting photo upload ===');
        try {
          setUploadingPhoto(true);
          
          const fileName = `${savedEmployee.employee_id}.JPG`;
          
          console.log('Photo upload details:', {
            fileName,
            fileType: pendingPhotoFile.type,
            fileSize: pendingPhotoFile.size
          });

          // If this is an edit and there's an existing photo, delete it
          if (isEditMode && employee.photo_url) {
            console.log('Deleting old photo:', employee.photo_url);
            const { error: deleteError } = await supabase.storage
              .from('employee-photos')
              .remove([employee.photo_url]);
            
            if (deleteError) {
              console.error('Error deleting old photo:', deleteError);
            } else {
              console.log('Old photo deleted successfully');
            }
          }

          // Upload the new photo
          console.log('Uploading new photo...');
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('employee-photos')
            .upload(fileName, pendingPhotoFile, {
              cacheControl: '3600',
              upsert: true
            });

          if (uploadError) {
            console.error('Error uploading photo:', uploadError);
            throw new Error('Failed to upload photo');
          }

          console.log('Photo uploaded successfully:', uploadData);

          // Update the employee record with just the filename
          console.log('Updating employee record with photo filename...');
          const { error: updateError } = await supabase
            .from('employees')
            .update({ photo_url: fileName })
            .eq('employee_id', savedEmployee.employee_id);

          if (updateError) {
            console.error('Error updating photo URL:', updateError);
            throw new Error('Failed to update photo URL');
          }

          // Get a signed URL for immediate display
          const { data: signedUrlData } = await supabase.storage
            .from('employee-photos')
            .createSignedUrl(fileName, 3600);
          
          if (signedUrlData) {
            setEmployee(prev => ({ ...prev, photo_url: signedUrlData.signedUrl }));
          }

          console.log('Employee record updated with photo filename');
        } catch (error: unknown) {
          console.error('Error handling photo upload:', error);
          throw new Error('Failed to upload photo');
        } finally {
          setUploadingPhoto(false);
        }
      } else {
        console.log('No photo to upload');
      }

      console.log('=== Save operation completed successfully ===');
      // Success - redirect to employee list
      router.push('/admin/employees');
    } catch (err) {
      console.error('=== Error in handleSave ===');
      console.error('Error details:', err);
      setError(err instanceof Error ? err.message : 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddOrEditHistory() {
    // Reset validation state
    const newValidation = {
      date: !historyForm.date,
      employmentStatus: !historyForm.employmentStatus,
      jobTitle: !historyForm.jobTitleId,
      manager: !historyForm.manager,
      location: !historyForm.location,
      workSchedule: !historyForm.workSchedule
    };
    setFormValidation(newValidation);

    // Check if any field is invalid
    if (Object.values(newValidation).some(v => v)) {
      setHistoryFormError('Please fill in all required fields.');
      return;
    }

    console.log('=== Employment Details Save Button Clicked ===');
    console.log('Current form state:', {
      ...historyForm,
      jobTitleId: historyForm.jobTitleId,
      jobTitle: historyForm.jobTitle
    });
    
    if (!historyForm.date) {
      console.log('Validation failed: Effective Date is required');
      setHistoryFormError('Effective Date is required.');
      return;
    }
    
    if (!employeeId) {
      console.log('Validation failed: No employee ID available');
      setHistoryFormError('Employee must be saved first before adding employment details.');
      return;
    }

    if (!historyForm.jobTitleId) {
      console.log('Validation failed: Job Title is required');
      setHistoryFormError('Job Title is required.');
      return;
    }

    console.log('Validation passed, proceeding with save');
    console.log('Looking for job title with ID:', historyForm.jobTitleId);
    console.log('Type of jobTitleId:', typeof historyForm.jobTitleId);
    setHistoryFormError(null);

    try {
      // Convert jobTitleId to number for comparison
      const jobTitleIdNum = Number(historyForm.jobTitleId);
      console.log('Converted job title ID to number:', jobTitleIdNum);

      // Find the selected job title to get its name
      const selectedTitle = jobTitles.find(t => {
        console.log('Comparing:', {
          jobTitleId: jobTitleIdNum,
          roleId: t.role_id,
          roleIdType: typeof t.role_id,
          matches: t.role_id === jobTitleIdNum
        });
        return t.role_id === jobTitleIdNum;
      });
      
      console.log('Selected job title search result:', selectedTitle);
      
      if (!selectedTitle) {
        console.error('Job title not found for ID:', jobTitleIdNum);
        console.error('Available job title IDs:', jobTitles.map(t => t.role_id));
        setHistoryFormError('Selected job title not found');
        return;
      }

      const jobTitleName = selectedTitle.role_name;
      console.log('Job title name to be saved:', jobTitleName);

      // Find the employment status
      const selectedStatus = employmentStatuses.find(s => s.code === historyForm.employmentStatus);
      if (!selectedStatus) {
        console.error('Employment status not found for code:', historyForm.employmentStatus);
        setHistoryFormError('Selected employment status not found');
        return;
      }

      // Prepare the data for database
      const employmentDetail = {
        employee_id: employeeId,
        effective_date: historyForm.date,
        employment_status_id: selectedStatus.id,
        job_title_id: jobTitleIdNum,
        manager: historyForm.manager,
        location: historyForm.location,
        work_schedule: historyForm.workSchedule,
        details: historyForm.details,
        created_by: user?.id,
        updated_by: user?.id
      };

      console.log('Saving employment detail to database:', employmentDetail);

      // If we're editing an existing entry, delete it first
    if (historyForm.editingIndex >= 0) {
        console.log('Deleting existing employment detail for date:', historyForm.date);
        const { error: deleteError } = await supabase
          .from('employment_details')
          .delete()
          .eq('employee_id', employeeId)
          .eq('effective_date', historyForm.date);

        if (deleteError) {
          console.error('Error deleting existing employment detail:', deleteError);
          setHistoryFormError('Failed to update employment detail: ' + deleteError.message);
          return;
        }
      }

      // Save to database
      const { data, error } = await supabase
        .from('employment_details')
        .insert([{
          employee_id: employeeId,
          effective_date: historyForm.date,
          employment_status_id: selectedStatus.id,
          job_title_id: jobTitleIdNum,
          manager: historyForm.manager,
          location: historyForm.location,
          work_schedule: historyForm.workSchedule,
          details: historyForm.details,
          created_by: user?.id,
          updated_by: user?.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving employment detail:', error);
        setHistoryFormError('Failed to save employment detail: ' + error.message);
        return;
      }

      const newEntry = {
        id: data.id,
        date: historyForm.date,
        employmentStatus: historyForm.employmentStatus,
        jobTitle: historyForm.jobTitle,
        jobTitleId: historyForm.jobTitleId,
        manager: historyForm.manager,
        location: historyForm.location,
        workSchedule: historyForm.workSchedule,
        details: historyForm.details,
      };

      setEmploymentHistory(prev => {
        if (historyForm.editingIndex >= 0) {
          const updated = [...prev];
          updated[historyForm.editingIndex] = newEntry;
          return updated;
        }
        return [...prev, newEntry];
      });

      // Reset form
    setHistoryForm({ 
        id: '',
      date: '', 
      employmentStatus: '', 
      jobTitle: '', 
        jobTitleId: null as number | null,
      manager: '', 
      location: '', 
      workSchedule: '', 
      details: '', 
      editingIndex: -1 
    });
    setShowHistoryForm(false);
      console.log('=== Employment Details Save Completed ===');
    } catch (err) {
      console.error('Error in handleAddOrEditHistory:', err);
      setHistoryFormError('An unexpected error occurred while saving employment detail.');
    }
  }

  function handleEditEntry(index: number) {
    const entry = employmentHistory[index];
    setHistoryForm({ 
      id: entry.id,
      date: entry.date,
      employmentStatus: entry.employmentStatus,
      jobTitle: entry.jobTitle,
      jobTitleId: entry.jobTitleId,
      manager: entry.manager,
      location: entry.location,
      workSchedule: entry.workSchedule,
      details: entry.details,
      editingIndex: index
    });
    setShowHistoryForm(true);
  }

  function handleNewEntry() {
    setHistoryForm({ 
      id: '',
      date: '', 
      employmentStatus: '', 
      jobTitle: '', 
      jobTitleId: null as number | null,
      manager: '', 
      location: '', 
      workSchedule: '', 
      details: '', 
      editingIndex: -1 
    });
    setShowHistoryForm(true);
  }

  async function handleDeleteEntry(index: number) {
    try {
      const { error } = await supabase
        .from('employment_details')
        .delete()
        .eq('id', employmentHistory[index].id);

      if (error) {
        console.error('Error deleting employment detail:', error);
        setHistoryFormError('Failed to delete employment detail: ' + error.message);
        return;
      }

    setEmploymentHistory(prev => prev.filter((_, i) => i !== index));
      setHistoryForm({ 
        id: '',
        date: '', 
        employmentStatus: '', 
        jobTitle: '', 
        jobTitleId: null as number | null,
        manager: '', 
        location: '', 
        workSchedule: '', 
        details: '', 
        editingIndex: -1 
      });
    } catch (err) {
      console.error('Error in handleDeleteEntry:', err);
      setHistoryFormError('An unexpected error occurred while deleting the entry.');
    }
  }

  const employmentSummary = employmentHistory.map(e => `On ${e.date}: ${e.employmentStatus} | Title: ${e.jobTitle} | Manager: ${e.manager} | Location: ${e.location} | Schedule: ${e.workSchedule}`).join('\n');

  function handlePhotoDrop(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPendingPhotoFile(files[0]);
    setError(null);
  }

  function handlePhotoZoneClick() {
    fileInputRef.current?.click();
  }

  // Add useEffect to fetch job titles
  useEffect(() => {
    async function fetchJobTitles() {
      try {
        setLoadingJobTitles(true);
        const { data, error } = await supabase
          .from('employee_job_title')
          .select('*')
          .order('role_name');

        if (error) {
          console.error('Error fetching job titles:', error);
          return;
        }

        // Convert role_id to number when setting job titles
        const formattedData = data?.map(title => ({
          ...title,
          role_id: Number(title.role_id)
        })) || [];
        
        console.log('Fetched job titles:', formattedData);
        setJobTitles(formattedData);
      } catch (err) {
        console.error('Error fetching job titles:', err);
      } finally {
        setLoadingJobTitles(false);
      }
    }

    fetchJobTitles();
  }, []);

  // Add useEffect to load employment history in edit mode
  useEffect(() => {
    async function loadEmploymentHistory() {
      if (!employeeId) return;
      try {
        const { data, error } = await supabase
          .from('employment_details')
          .select(`
            *,
            employment_status:employment_status_id (
              code,
              name
            ),
            job_title:job_title_id (
              role_id,
              role_name
            )
          `)
          .eq('employee_id', employeeId)
          .order('effective_date', { ascending: false });

        if (error) throw error;
        if (data) {
          const history = data.map(entry => ({
            id: entry.id,
            date: entry.effective_date,
            employmentStatus: entry.employment_status?.code || '',
            jobTitle: entry.job_title?.role_name || '',
            jobTitleId: entry.job_title?.role_id || null,
            manager: entry.manager || '',
            location: entry.location || '',
            workSchedule: entry.work_schedule || '',
            details: entry.details || ''
          }));
          setEmploymentHistory(history);
        }
      } catch (err) {
        console.error('Error loading employment history:', err);
        setError('Failed to load employment history');
      }
    }

    loadEmploymentHistory();
  }, [employeeId]);

  // Add useEffect to fetch employment statuses
  useEffect(() => {
    async function fetchEmploymentStatuses() {
      try {
        setLoadingStatuses(true);
        const { data, error } = await supabase
          .from('employment_status')
          .select('*')
          .eq('is_active', true)
          .order('name');

        if (error) {
          console.error('Error fetching employment statuses:', error);
          return;
        }

        setEmploymentStatuses(data || []);
      } catch (err) {
        console.error('Error fetching employment statuses:', err);
      } finally {
        setLoadingStatuses(false);
      }
    }

    fetchEmploymentStatuses();
  }, []);

  // Update selectStyles
  const selectStyles = {
    control: (base: any, state: any) => ({
      ...base,
      backgroundColor: '#F5F5F0',
      borderColor: state.isFocused ? '#4DB6AC' : '#D1D5DB',
      '&:hover': {
        borderColor: '#4DB6AC'
      },
      '&:focus-within': {
        borderColor: '#4DB6AC',
        boxShadow: 'none'
      }
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: '#F5F5F0',
      borderColor: '#4DB6AC'
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isFocused || state.isSelected ? '#4DB6AC' : '#F5F5F0',
      color: state.isFocused || state.isSelected ? 'white' : 'inherit',
      '&:hover': {
        backgroundColor: '#4DB6AC',
        color: 'white'
      }
    })
  };

  // Add handler for saving compensation (new implementation with history management)
  async function handleSaveCompensation() {
    if (!employeeId) {
      setCompensationError('Employee must be saved first before adding compensation details.');
      return;
    }

    try {
      // Validate required fields
      if (!compensation.effective_date) {
        setCompensationError('Effective date is required.');
        return;
      }
      if (!compensation.compensation_rate) {
        setCompensationError(`${compensation.compensation_type === 'salary' ? 'Annual salary' : 'Hourly rate'} is required.`);
        return;
      }
      if (!compensation.grade_id) {
        setCompensationError('Pay grade is required.');
        return;
      }
      if (!compensation.frequency_id) {
        setCompensationError('Pay frequency is required.');
        return;
      }

      setCompensationError(null);

      // Calculate annual salary if hourly rate is provided
      let compensationValue = compensation.compensation_rate;
      if (compensation.compensation_type === 'hourly') { // Changed from '2' to 'hourly'
        // Assuming 2080 hours per year (40 hours * 52 weeks)
        compensationValue = (parseFloat(compensation.compensation_rate) * 2080).toString();
      }

      // Get pay grade and frequency names for display
      const selectedGrade = payGrades.find(g => g.grade_id === compensation.grade_id);
      const selectedFrequency = payFrequencies.find(f => f.frequency_id === compensation.frequency_id);

      // Save to database
      const { data, error } = await supabase
        .from('employee_compensation')
        .insert([{
          employee_id: employeeId,
          effective_date: compensation.effective_date,
          compensation_type: compensation.compensation_type,
          compensation_rate: compensationValue,
          bonus: compensation.bonus || null,
          grade_id: compensation.grade_id,
          frequency_id: compensation.frequency_id,
          overtime_eligible: compensation.overtime_eligible
        }])
        .select()
        .single();

      if (error) {
        console.error('Error saving compensation:', error);
        setCompensationError('Failed to save compensation: ' + error.message);
        return;
      }

      // Add to history
      const newEntry = {
        id: data.compensation_id,
        date: compensation.effective_date,
        compensation_type: compensation.compensation_type, // No need to convert since we're using strings
        compensation_value: compensation.compensation_rate,
        bonus: compensation.bonus || '',
        pay_grade: selectedGrade?.grade_code || '',
        pay_frequency: selectedFrequency?.frequency_name || '',
        overtime_eligible: compensation.overtime_eligible
      };

      setCompensationHistory(prev => [newEntry, ...prev]);

      // Clear the form
      setCompensation({
        bonus: '',
        effective_date: '',
        overtime_eligible: false,
        grade_id: '',
        frequency_id: '',
        compensation_type: 'salary', // Changed from '1' to 'salary'
        compensation_rate: '',
      });

    } catch (err) {
      console.error('Error in handleSaveCompensation:', err);
      setCompensationError('An unexpected error occurred while saving compensation.');
    }
  }

  // Add handler for clearing compensation form
  function handleClearCompensation() {
    setCompensation({
      bonus: '',
      effective_date: '',
      overtime_eligible: false,
      grade_id: '',
      frequency_id: '',
      compensation_type: 'salary', // Changed from '1' to 'salary'
      compensation_rate: '',
    });
    setCompensationError(null);
  }

  // Add useEffect to load compensation history in edit mode
  useEffect(() => {
    async function loadCompensationHistory() {
      if (!employeeId) return;
      try {
        const { data, error } = await supabase
          .from('employee_compensation')
          .select(`
            *,
            pay_grade:grade_id (
              grade_code,
              description
            ),
            pay_frequency:frequency_id (
              frequency_name
            )
          `)
          .eq('employee_id', employeeId)
          .order('effective_date', { ascending: false });

        if (error) throw error;
        if (data) {
          const history = data.map(entry => ({
            id: entry.compensation_id,
            date: entry.effective_date,
            compensation_type: entry.compensation_type,
            compensation_value: entry.compensation_rate,
            bonus: entry.bonus || '',
            pay_grade: entry.pay_grade?.grade_code || '',
            pay_frequency: entry.pay_frequency?.frequency_name || '',
            overtime_eligible: entry.overtime_eligible
          }));
          setCompensationHistory(history);
        }
      } catch (err) {
        console.error('Error loading compensation history:', err);
        setError('Failed to load compensation history');
      }
    }

    loadCompensationHistory();
  }, [employeeId]);

  // Add function to delete compensation entry
  async function handleDeleteCompensation(index: number) {
    try {
      const entryToDelete = compensationHistory[index];
      const { error } = await supabase
        .from('employee_compensation')
        .delete()
        .eq('id', entryToDelete.id);

      if (error) {
        console.error('Error deleting compensation:', error);
        setCompensationError('Failed to delete compensation: ' + error.message);
          return;
        }

      setCompensationHistory(prev => prev.filter((_, i) => i !== index));
    } catch (err) {
      console.error('Error in handleDeleteCompensation:', err);
      setCompensationError('An unexpected error occurred while deleting the entry.');
    }
  }

  // Add handler for saving compliance document
  async function handleSaveCompliance() {
    if (!employeeId) {
      setComplianceError('Employee must be saved first before adding compliance documents.');
      return;
    }

    try {
      setComplianceError(null);
      
      // Debug logs
      console.log('Current compliance documents state:', complianceDocuments);
      console.log('Current compliance history:', complianceHistory);
      
      // Validate required fields
      if (!complianceDocuments.document_type) {
        setComplianceError('Document type is required');
        return;
      }

      const selectedDocType = documentTypes.find(dt => dt.code === complianceDocuments.document_type);
      if (!selectedDocType) {
        setComplianceError('Invalid document type');
        return;
      }

      // Validate dates based on document type requirements
      if (selectedDocType.requires_issue && !complianceDocuments.issue_date) {
        setComplianceError('Issue date is required for this document type');
        return;
      }

      if (selectedDocType.requires_expiration && !complianceDocuments.expiration_date) {
        setComplianceError('Expiration date is required for this document type');
        return;
      }

      // Prepare the document data with proper date handling
      const documentData = {
        employee_id: employeeId,
        document_type: complianceDocuments.document_type,
        document_number: complianceDocuments.document_number || null,
        file_url: complianceDocuments.file_url || null,
        // Only include dates if they are required or provided
        issue_date: selectedDocType.requires_issue ? complianceDocuments.issue_date : null,
        expiration_date: selectedDocType.requires_expiration ? complianceDocuments.expiration_date : null
      };

      console.log('Preparing to save document with data:', documentData);

      let result;
      if (complianceDocuments.editingIndex >= 0) {
        // Update existing document
        const documentToUpdate = complianceHistory[complianceDocuments.editingIndex];
        console.log('Document to update:', documentToUpdate);
        
        if (!documentToUpdate) {
          console.error('Document not found in history at index:', complianceDocuments.editingIndex);
          setComplianceError('Document not found in history');
          return;
        }
        
        if (!documentToUpdate.document_id) {
          console.error('Document ID is missing:', documentToUpdate);
          setComplianceError('Invalid document ID');
          return;
        }

        console.log('Updating document with ID:', documentToUpdate.document_id);
        const { data, error } = await supabase
          .from('employee_compliance_documents')
          .update(documentData)
          .eq('document_id', documentToUpdate.document_id)
          .select()
          .single();

        if (error) {
          console.error('Error updating compliance document:', error);
          setComplianceError('Failed to update compliance document: ' + error.message);
          return;
        }
        result = data;
      } else {
        // Insert new document
        const { data, error } = await supabase
          .from('employee_compliance_documents')
          .insert([documentData])
          .select()
          .single();

        if (error) {
          console.error('Error saving compliance document:', error);
          setComplianceError('Failed to save compliance document: ' + error.message);
          return;
        }
        result = data;
      }

      // Add to history
      const newEntry = {
        document_id: result.document_id,
        date: result.issue_date || result.created_at, // Fallback to created_at if no issue_date
        document_type: result.document_type,
        document_number: result.document_number || '',
        file_url: result.file_url || '',
        issue_date: result.issue_date || '',
        expiration_date: result.expiration_date || '',
        calculated_status: '' // This will be populated when we reload the history
      };

      setComplianceHistory(prev => {
        if (complianceDocuments.editingIndex >= 0) {
          // Update existing entry
          const updated = [...prev];
          updated[complianceDocuments.editingIndex] = newEntry;
          return updated;
        }
        // Add new entry
        return [newEntry, ...prev];
      });

      // Clear the form
      setComplianceDocuments({
        document_type: '',
        document_number: '',
        file_url: '',
        issue_date: '',
        expiration_date: '',
        editingIndex: -1
      });

      // Reload the history to get the calculated status
      await loadComplianceHistory();

    } catch (err) {
      console.error('Error in handleSaveCompliance:', err);
      setComplianceError('An unexpected error occurred while saving compliance document.');
    }
  }

  // Add handler for clearing compliance form
  function handleClearCompliance() {
    setComplianceDocuments({
      document_type: '',
      document_number: '',
      file_url: '',
      issue_date: '',
      expiration_date: '',
      editingIndex: -1
    });
    setComplianceError(null);
  }

  // Move loadComplianceHistory function declaration before it's used
  async function loadComplianceHistory() {
    if (!employeeId) return;
    try {
      const { data: complianceData, error: complianceError } = await supabase
        .from('employee_compliance_documents_with_status')
        .select('*')
        .eq('employee_id', employeeId)
        .order('issue_date', { ascending: false });

      if (complianceError) throw complianceError;
      if (complianceData) {
        const history = complianceData.map(entry => ({
          document_id: entry.document_id,  // Changed from id to document_id
          date: entry.issue_date,
          document_type: entry.document_type,
          document_number: entry.document_number,
          file_url: entry.file_url || '',
          issue_date: entry.issue_date,
          expiration_date: entry.expiration_date || '',
          calculated_status: entry.calculated_status
        }));
        console.log('Processed compliance history:', history);
        setComplianceHistory(history);
      }
    } catch (err) {
      console.error('Error loading compliance history:', err);
      setError('Failed to load compliance history');
    }
  }

  // Add to the useEffect that loads data
  useEffect(() => {
    async function loadAllData() {
      if (!employeeId) return;
      
      try {
        setLoading(true);
        setError(null);

        // Load employee data
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('*')
          .eq('employee_id', employeeId)
          .single();

        if (employeeError) throw employeeError;
        if (employeeData) {
          // Set the address input with the combined address from the database
          setAddressInput(employeeData.address || '');
          
          // Get signed URL for photo if exists
          if (employeeData.photo_url) {
            const { data: signedUrlData } = await supabase.storage
              .from('employee-photos')
              .createSignedUrl(employeeData.photo_url, 3600);
            if (signedUrlData) {
              setEmployee({ ...employeeData, photo_url: signedUrlData.signedUrl });
            } else {
              setEmployee(employeeData);
            }
          } else {
            setEmployee(employeeData);
          }
        }

        // Load employment history
        const { data: employmentData, error: employmentError } = await supabase
          .from('employment_details')
          .select(`
            *,
            employment_status:employment_status_id (
              code,
              name
            ),
            job_title:job_title_id (
              role_id,
              role_name
            )
          `)
          .eq('employee_id', employeeId)
          .order('effective_date', { ascending: false });

        if (employmentError) throw employmentError;
        if (employmentData) {
          const history = employmentData.map(entry => ({
            id: entry.id,
            date: entry.effective_date,
            employmentStatus: entry.employment_status?.code || '',
            jobTitle: entry.job_title?.role_name || '',
            jobTitleId: entry.job_title?.role_id || null,
            manager: entry.manager || '',
            location: entry.location || '',
            workSchedule: entry.work_schedule || '',
            details: entry.details || ''
          }));
          setEmploymentHistory(history);
        }

        // Load compensation history
        const { data: compensationData, error: compensationError } = await supabase
          .from('employee_compensation')
          .select(`
            *,
            pay_grade:grade_id (
              grade_code,
              description
            ),
            pay_frequency:frequency_id (
              frequency_name
            )
          `)
          .eq('employee_id', employeeId)
          .order('effective_date', { ascending: false });

        if (compensationError) throw compensationError;
        if (compensationData) {
          const history = compensationData.map(entry => ({
            id: entry.compensation_id,
            date: entry.effective_date,
            compensation_type: entry.compensation_type,
            compensation_value: entry.compensation_rate,
            bonus: entry.bonus || '',
            pay_grade: entry.pay_grade?.grade_code || '',
            pay_frequency: entry.pay_frequency?.frequency_name || '',
            overtime_eligible: entry.overtime_eligible
          }));
          setCompensationHistory(history);
        }

        // Load compliance history
        const { data: complianceData, error: complianceError } = await supabase
          .from('employee_compliance_documents_with_status')
          .select('*')
          .eq('employee_id', employeeId)
          .order('issue_date', { ascending: false });

        if (complianceError) throw complianceError;
        if (complianceData) {
          const history = complianceData.map(entry => ({
            document_id: entry.document_id,  // Changed from id to document_id
            date: entry.issue_date,
            document_type: entry.document_type,
            document_number: entry.document_number,
            file_url: entry.file_url || '',
            issue_date: entry.issue_date,
            expiration_date: entry.expiration_date || '',
            calculated_status: entry.calculated_status
          }));
          setComplianceHistory(history);
        }

        // Load reference data
        const [
          { data: jobTitlesData },
          { data: statusesData },
          { data: payGradesData },
          { data: documentTypesData }
        ] = await Promise.all([
          supabase.from('employee_job_title')
            .select('role_id, role_name, role_description')  // Changed from description to role_description
            .order('role_name'),
          supabase.from('employment_status')
            .select('id, code, name')
            .order('name'),
          supabase.from('pay_grade_reference')
            .select('grade_id, grade_code, description')
            .order('grade_code'),
          supabase.from('employee_document_types')
            .select('*')
            .eq('is_active', true)
            .order('name')
        ]);

        if (jobTitlesData) {
          // Handle the type conversion here in TypeScript
          setJobTitles((jobTitlesData as any[]).map(title => ({
            role_id: parseInt(title.role_id, 10),  // Explicitly convert to integer
            role_name: title.role_name,
            description: title.role_description  // Changed from description to role_description
          })));
        }
        if (statusesData) {
          const formattedStatuses = (statusesData as RawEmploymentStatus[]).map(status => ({
            id: status.id,
            code: status.code,
            name: status.name,
            description: null,
            is_active: true
          }));
          setEmploymentStatuses(formattedStatuses);
        }
        if (payGradesData) {
          const formattedPayGrades = (payGradesData as RawPayGrade[]).map(grade => ({
            grade_id: grade.grade_id,
            grade_code: grade.grade_code,
            grade_name: grade.grade_code, // Using grade_code as grade_name
            description: grade.description,
            is_active: true
          }));
          setPayGrades(formattedPayGrades);
        }
        if (documentTypesData) setDocumentTypes(documentTypesData as DocumentType[]);

      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load employee data');
      } finally {
        setLoading(false);
      }
    }

    loadAllData();
  }, [employeeId]);

  // Add this function to check if bucket exists
  async function checkBucketExists() {
    try {
      const { data, error } = await supabase
        .storage
        .getBucket('employee-docs');
      
      if (error) {
        if (error.message.includes('not found')) {
          throw new Error('Storage bucket "employee-docs" does not exist. Please create it in the Supabase dashboard.');
        }
        throw error;
      }
      return true;
    } catch (err) {
      console.error('Error checking bucket:', err);
      throw err;
    }
  }

  // Update the handleFileUpload function with better error handling
  async function handleFileUpload(file: File) {
    if (!employeeId) {
      setFileError('Employee must be saved first before uploading files');
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Only PDF, PNG, JPG, and WebP files are allowed');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setFileError('File size must be less than 10MB');
      return;
    }

    try {
      setUploadingFile(true);
      setFileError(null);

      // Generate a unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${employeeId}_${Date.now()}.${fileExtension}`;
      const filePath = `compliance-documents/${fileName}`;

      console.log('Starting file upload:', {
        fileName,
        filePath,
        fileType: file.type,
        fileSize: file.size,
        bucket: 'employee-docs'
      });

      // Upload to private bucket with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      let lastError = null;

      while (retryCount < maxRetries) {
        try {
          const { data, error } = await supabase.storage
            .from('employee-docs')
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) {
            console.error('Upload error:', {
              error,
              attempt: retryCount + 1,
              maxRetries
            });

            if (error.message.includes('permission denied')) {
              throw new Error('Permission denied. Please check your access rights.');
            } else if (error.message.includes('upstream server')) {
              throw new Error('Storage service is temporarily unavailable. Please try again later.');
            }
            throw error;
          }

          console.log('File uploaded successfully:', {
            path: data.path,
            id: data.id
          });

          // Get a signed URL to verify the upload
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('employee-docs')
            .createSignedUrl(filePath, 3600);

          if (signedUrlError) {
            console.error('Error getting signed URL:', signedUrlError);
            throw new Error('Failed to generate access URL for the uploaded file');
          }

          console.log('Generated signed URL:', {
            url: signedUrlData.signedUrl,
            expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
          });

          // Store just the file path in the form
          setComplianceDocuments(prev => ({ ...prev, file_url: filePath }));
          return; // Success, exit the function
        } catch (err) {
          lastError = err;
          retryCount++;
          console.error(`Upload attempt ${retryCount} failed:`, err);
          
          if (retryCount < maxRetries) {
            // Wait for 1 second before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // If we get here, all retries failed
      throw lastError;

    } catch (err) {
      console.error('Error uploading file:', err);
      let errorMessage = 'Failed to upload file. ';
      
      if (err instanceof Error) {
        if (err.message.includes('permission denied')) {
          errorMessage += 'Permission denied. Please check your access rights.';
        } else if (err.message.includes('upstream server')) {
          errorMessage += 'Storage service is temporarily unavailable. Please try again later.';
        } else {
          errorMessage += err.message;
        }
      }
      
      setFileError(errorMessage);
    } finally {
      setUploadingFile(false);
    }
  }

  // Add a function to get signed URL for viewing files
  async function getSignedUrl(filePath: string, documentId?: string) {
    try {
      console.log('Getting signed URL for file:', {
        filePath,
        bucket: 'employee-docs',
        fullPath: `employee-docs/${filePath}`
      });

      // First check if the file exists
      const { data: existsData, error: existsError } = await supabase.storage
        .from('employee-docs')
        .list(filePath.split('/').slice(0, -1).join('/'));

      if (existsError) {
        console.error('Error checking if file exists:', existsError);
        throw existsError;
      }

      console.log('Files in directory:', existsData);

      const fileName = filePath.split('/').pop();
      const fileExists = existsData?.some(file => file.name === fileName);
      
      if (!fileExists) {
        // If file doesn't exist, try to find a similar file (same employee ID but different timestamp)
        const employeeId = fileName?.split('_')[0];
        if (employeeId) {
          const similarFiles = existsData?.filter(file => 
            file.name.startsWith(employeeId) && 
            file.name.endsWith('.pdf')
          );

          if (similarFiles && similarFiles.length > 0) {
            // Sort by timestamp (newest first)
            const newestFile = similarFiles.sort((a, b) => {
              const timestampA = parseInt(a.name.split('_')[1]);
              const timestampB = parseInt(b.name.split('_')[1]);
              return timestampB - timestampA;
            })[0];

            const newFilePath = `${filePath.split('/')[0]}/${newestFile.name}`;
            console.log('Found newer version of file:', {
              oldPath: filePath,
              newPath: newFilePath
            });

            // If we have a document ID, update the database
            if (documentId) {
              await updateDocumentFilePath(documentId, newFilePath);
            }

            // Try to get signed URL for the new file path
            const { data, error } = await supabase.storage
              .from('employee-docs')
              .createSignedUrl(newFilePath, 3600);

            if (error) {
              console.error('Error creating signed URL for new file:', error);
              throw error;
            }

            return data.signedUrl;
          }
        }

        console.error('File not found in directory:', {
          fileName,
          directory: filePath.split('/').slice(0, -1).join('/'),
          availableFiles: existsData?.map(f => f.name)
        });
        throw new Error('File not found in storage');
      }

      const { data, error } = await supabase.storage
        .from('employee-docs')
        .createSignedUrl(filePath, 3600);

      if (error) {
        console.error('Error creating signed URL:', error);
        throw error;
      }

      console.log('Successfully generated signed URL:', {
        path: filePath,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString()
      });

      return data.signedUrl;
    } catch (err) {
      console.error('Error getting signed URL:', err);
      return null;
    }
  }

  // Add a function to update the file path in the database
  async function updateDocumentFilePath(documentId: string, newFilePath: string) {
    try {
      const { error } = await supabase
        .from('employee_compliance_documents')
        .update({ file_url: newFilePath })
        .eq('document_id', documentId);

      if (error) {
        console.error('Error updating file path in database:', error);
        throw error;
      }

      // Update the local state
      setComplianceHistory(prev => prev.map(doc => 
        doc.document_id === documentId 
          ? { ...doc, file_url: newFilePath }
          : doc
      ));

      console.log('Successfully updated file path in database:', {
        documentId,
        newFilePath
      });
    } catch (err) {
      console.error('Error in updateDocumentFilePath:', err);
      throw err;
    }
  }

  // Add this useEffect after the other useEffects
  useEffect(() => {
    async function loadPhotoSignedUrl() {
      if (!employee.photo_url || employee.photo_url.startsWith('http')) {
        setPhotoLoading(false);
        setPhotoSignedUrl(employee.photo_url);
        return;
      }

      try {
        const { data: signedUrlData, error } = await supabase.storage
          .from('employee-photos')
          .createSignedUrl(employee.photo_url, 3600);

        if (error) {
          console.error('Error getting signed URL:', error);
          setPhotoSignedUrl(null);
        } else if (signedUrlData) {
          setPhotoSignedUrl(signedUrlData.signedUrl);
        }
      } catch (err) {
        console.error('Error loading photo signed URL:', err);
        setPhotoSignedUrl(null);
      } finally {
        setPhotoLoading(false);
      }
    }

    loadPhotoSignedUrl();
  }, [employee.photo_url]);

  return (
    <div className="flex flex-col min-h-screen p-6 gap-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/employees')}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            <h1 className="text-3xl font-bold">{isEditMode ? 'Edit Employee' : 'New Employee'}</h1>
          </div>
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
            {/* Display employee_id, created_at, updated_at if present and not in edit mode */}
            {employee.employee_id && !isEditMode && (
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
            {/* Show only employee_id in edit mode */}
            {employee.employee_id && isEditMode && (
              <div className="space-y-1">
                <Label>Employee ID</Label>
                <Input value={employee.employee_id} readOnly disabled />
              </div>
            )}

            {/* Main form fields */}
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
              <div className="flex flex-col">
                <div className="h-6 mt-2 mb-1.5">
                  <Label htmlFor="address" className="block">Address</Label>
                </div>
                <div className="flex flex-col">
                  <Input
                    id="address"
                    value={addressInput}
                    onChange={e => handleAddressChange(e.target.value)}
                    placeholder="Paste full address from Google Maps"
                  />
                  <div className="mt-1 min-h-[1.5rem]">
                    {parsedAddress && (
                      <div className="text-xs text-green-700">
                        Verified: {parsedAddress.address_line1}
                        {parsedAddress.address_line2 ? `, ${parsedAddress.address_line2}` : ''}, {parsedAddress.city}, {parsedAddress.state} {parsedAddress.zip}
                      </div>
                    )}
                    {addressError && (
                      <div className="text-xs text-red-600">{addressError}</div>
                    )}
                    {addressInput && !parsedAddress && !addressError && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 text-xs">
                        <p className="font-medium">Address Verification Warning</p>
                        <p>The address could not be verified. You may proceed, but please verify the address manually.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Email Address */}
              <div className="flex flex-col">
                <div className="h-6 mt-2 mb-1.5">
                  <Label htmlFor="email" className="block">Email</Label>
                </div>
                <Input
                  id="email"
                  type="email"
                  value={employee.email}
                  onChange={e => setEmployee(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email address"
                />
              </div>
              {/* Phone Number */}
              <div className="flex flex-col">
                <div className="h-6 mt-2 mb-1.5">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="phone_number" className="block">Phone Number</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex-none">
                          <HelpCircle className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px]">
                          <p>Enter a valid phone number in any of these formats:</p>
                          <ul className="list-disc list-inside mt-1 text-sm">
                            <li>US: (555) 123-4567</li>
                            <li>International: +1 (555) 123-4567</li>
                            <li>With extension: (555) 123-4567 x123</li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <Input
                  id="phone_number"
                  value={employee.phone_number}
                  onChange={e => handlePhoneChange(e.target.value, 'phone_number')}
                  onBlur={e => handlePhoneChange(e.target.value, 'phone_number')}
                  placeholder="(555) 123-4567"
                />
                {phoneError && (
                  <div className="text-xs text-red-600 mt-1">{phoneError}</div>
                )}
              </div>
            </div>

            {/* Emergency Contact Name, Emergency Contact Phone */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              {/* Emergency Contact Name */}
              <div className="flex flex-col">
                <div className="h-6 mt-2 mb-1.5">
                  <Label htmlFor="emergency_contact_name" className="block">Emergency Contact Name</Label>
                </div>
                <Input
                  id="emergency_contact_name"
                  value={employee.emergency_contact_name}
                  onChange={e => setEmployee(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                  placeholder="Emergency contact name"
                />
              </div>
              {/* Emergency Contact Phone */}
              <div className="flex flex-col">
                <div className="h-6 mt-2 mb-1.5">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="emergency_contact_phone" className="block">Emergency Contact Phone</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger className="flex-none">
                          <HelpCircle className="w-4 h-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[300px]">
                          <p>Enter a valid phone number in any of these formats:</p>
                          <ul className="list-disc list-inside mt-1 text-sm">
                            <li>US: (555) 123-4567</li>
                            <li>International: +1 (555) 123-4567</li>
                            <li>With extension: (555) 123-4567 x123</li>
                          </ul>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <Input
                  id="emergency_contact_phone"
                  value={employee.emergency_contact_phone}
                  onChange={e => handlePhoneChange(e.target.value, 'emergency_contact_phone')}
                  onBlur={e => handlePhoneChange(e.target.value, 'emergency_contact_phone')}
                  placeholder="(555) 123-4567"
                />
                {mobileError && (
                  <div className="text-xs text-red-600 mt-1">{mobileError}</div>
                )}
              </div>
            </div>

            {/* Bottom section with photo and marital status/gender */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              {/* Photo Upload Drop Zone - Now in bottom left */}
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
                    handlePhotoDrop(e.dataTransfer.files);
                  }}
                  style={{ minHeight: 120 }}
                >
                  {pendingPhotoFile ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={URL.createObjectURL(pendingPhotoFile)}
                        alt="Preview"
                        className="h-24 w-24 object-cover rounded-full mb-2"
                      />
                      <span className="text-sm text-muted-foreground">{pendingPhotoFile.name}</span>
                    </div>
                  ) : photoLoading ? (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <div className="h-24 w-24 rounded-full bg-muted animate-pulse mb-2" />
                      <span className="text-sm">Loading photo...</span>
                    </div>
                  ) : photoSignedUrl ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={photoSignedUrl}
                        alt={`${employee.first_name} ${employee.last_name}`}
                        className="h-24 w-24 object-cover rounded-full mb-2"
                        onError={(e) => {
                          console.error('Error loading employee photo:', e);
                          setPhotoSignedUrl(null);
                        }}
                      />
                      <span className="text-sm text-muted-foreground">Current photo</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <span className="mb-2">No photo available</span>
                      <span className="text-sm">Drag & drop or click to select photo</span>
                    </div>
                  )}
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
              </div>

              {/* Marital Status and Gender */}
              <div className="col-span-2 space-y-4">
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
                {/* Gender (radio buttons) */}
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
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 mt-6">
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
                {loading ? 'Saving...' : isEditMode ? 'Update Employee' : 'Save Employee'}
              </Button>
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
            {/* Summary Text Boxes */}
            <div className="space-y-4">
              <Label>Employment History Summary</Label>
              {employmentHistory.map((entry) => (
                <div key={entry.id} className="relative">
                  <Textarea
                    value={`On ${entry.date}: ${entry.employmentStatus} | Title: ${entry.jobTitle} | Manager: ${entry.manager} | Location: ${entry.location} | Schedule: ${entry.workSchedule}`}
                    readOnly
                    className="min-h-[60px] font-mono text-sm pr-10"
                    placeholder="Employment history will appear here..."
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setHistoryForm({
                        id: entry.id,
                        date: entry.date,
                        employmentStatus: entry.employmentStatus,
                        jobTitle: entry.jobTitle,
                        jobTitleId: entry.jobTitleId,
                        manager: entry.manager,
                        location: entry.location,
                        workSchedule: entry.workSchedule,
                        details: entry.details,
                        editingIndex: employmentHistory.findIndex(e => e.id === entry.id)
                      });
                    }}
                    className="absolute right-2 top-2 h-8 w-8 hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  </div>
              ))}
              {employmentHistory.length === 0 && (
                <div className="relative">
                  <Textarea
                    value=""
                    readOnly
                    className="min-h-[60px] font-mono text-sm pr-10"
                    placeholder="Employment history will appear here..."
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewEntry}
                    className="absolute right-2 top-2 h-8 w-8 hover:bg-muted"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
              </div>
            )}
                    </div>

            {/* Input Form - Always visible */}
            <div className="border rounded p-4 bg-muted/10 space-y-4">
              <h3 className="font-medium">
                {historyForm.editingIndex >= 0 ? 'Edit Employment Detail' : 'Add Employment Detail'}
              </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                  <Label htmlFor="date" className={formValidation.date ? "text-red-500" : ""}>
                    Effective Date
                  </Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={historyForm.date} 
                    onChange={e => {
                      setHistoryForm(f => ({ ...f, date: e.target.value }));
                      setFormValidation(v => ({ ...v, date: false }));
                    }}
                    className={formValidation.date ? "border-red-500 bg-red-50/50" : ""}
                  />
                      </div>
                      <div className="space-y-1">
                  <Label htmlFor="employmentStatus" className={formValidation.employmentStatus ? "text-red-500" : ""}>
                    Status
                  </Label>
                  <Select
                    id="employmentStatus"
                    value={employmentStatuses.find(s => s.code === historyForm.employmentStatus) || null}
                    onChange={(option: any) => {
                      setHistoryForm(f => ({ ...f, employmentStatus: option?.code || '' }));
                      setFormValidation(v => ({ ...v, employmentStatus: false }));
                    }}
                    options={employmentStatuses}
                    getOptionLabel={(option: any) => option.name}
                    getOptionValue={(option: any) => option.code}
                    placeholder="Select Status"
                    isDisabled={loadingStatuses}
                    styles={selectStyles}
                    className={formValidation.employmentStatus ? "border-red-500" : ""}
                  />
                      </div>
                      <div className="space-y-1">
                  <Label htmlFor="jobTitle" className={formValidation.jobTitle ? "text-red-500" : ""}>
                    Job Title
                  </Label>
                  <Select
                          id="jobTitle"
                    value={jobTitles.find(t => t.role_id === historyForm.jobTitleId) || null}
                    onChange={(option: any) => {
                            setHistoryForm(f => ({ 
                              ...f, 
                        jobTitleId: option?.role_id || null,
                        jobTitle: option?.role_name || ''
                      }));
                      setFormValidation(v => ({ ...v, jobTitle: false }));
                    }}
                    options={jobTitles}
                    getOptionLabel={(option: any) => option.role_name}
                    getOptionValue={(option: any) => option.role_id.toString()}
                    placeholder="Select Job Title"
                    isDisabled={loadingJobTitles}
                    styles={selectStyles}
                    className={formValidation.jobTitle ? "border-red-500" : ""}
                  />
                      </div>
                      <div className="space-y-1">
                  <Label htmlFor="manager" className={formValidation.manager ? "text-red-500" : ""}>
                    Manager
                  </Label>
                  <Select
                          id="manager"
                    value={managerOptions.find(m => m === historyForm.manager) ? 
                      { value: historyForm.manager, label: historyForm.manager } : null}
                    onChange={(option: any) => {
                      setHistoryForm(f => ({ ...f, manager: option?.value || '' }));
                      setFormValidation(v => ({ ...v, manager: false }));
                    }}
                    options={managerOptions.map(opt => ({ value: opt, label: opt }))}
                    placeholder="Select Manager"
                    styles={selectStyles}
                    className={formValidation.manager ? "border-red-500" : ""}
                  />
                      </div>
                      <div className="space-y-1">
                  <Label htmlFor="location" className={formValidation.location ? "text-red-500" : ""}>
                    Location
                  </Label>
                  <Select
                          id="location"
                    value={locationOptions.find(l => l === historyForm.location) ? 
                      { value: historyForm.location, label: historyForm.location } : null}
                    onChange={(option: any) => {
                      setHistoryForm(f => ({ ...f, location: option?.value || '' }));
                      setFormValidation(v => ({ ...v, location: false }));
                    }}
                    options={locationOptions.map(opt => ({ value: opt, label: opt }))}
                    placeholder="Select Location"
                    styles={selectStyles}
                    className={formValidation.location ? "border-red-500" : ""}
                  />
                      </div>
                      <div className="space-y-1">
                  <Label htmlFor="workSchedule" className={formValidation.workSchedule ? "text-red-500" : ""}>
                    Work Schedule
                  </Label>
                  <Select
                          id="workSchedule"
                    value={workScheduleOptions.find(w => w === historyForm.workSchedule) ? 
                      { value: historyForm.workSchedule, label: historyForm.workSchedule } : null}
                    onChange={(option: any) => {
                      setHistoryForm(f => ({ ...f, workSchedule: option?.value || '' }));
                      setFormValidation(v => ({ ...v, workSchedule: false }));
                    }}
                    options={workScheduleOptions.map(opt => ({ value: opt, label: opt }))}
                    placeholder="Select Work Schedule"
                    styles={selectStyles}
                    className={formValidation.workSchedule ? "border-red-500" : ""}
                  />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                <Button 
                  size="sm" 
                  onClick={handleAddOrEditHistory}
                >
                  {historyForm.editingIndex >= 0 ? 'Update' : 'Save'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => { 
                    setHistoryForm({ 
                      id: '',
                      date: '', 
                      employmentStatus: '', 
                      jobTitle: '', 
                      jobTitleId: null as number | null,
                      manager: '', 
                      location: '', 
                      workSchedule: '', 
                      details: '', 
                      editingIndex: -1 
                    }); 
                    setHistoryFormError(null);
                    setFormValidation({
                      date: false,
                      employmentStatus: false,
                      jobTitle: false,
                      manager: false,
                      location: false,
                      workSchedule: false
                    });
                  }}
                >
                  {historyForm.editingIndex >= 0 ? 'Cancel' : 'Clear'}
                </Button>
                      </div>
              {historyFormError && <div className="text-xs text-red-600 mt-1">{historyFormError}</div>}
                      </div>
          </div>
        </CardContent>
      </Card>

      {/* Compensation */}
      <Card>
        <CardHeader>
          <CardTitle>Compensation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Summary Text Boxes */}
          <div className="space-y-4">
              <Label>Compensation History</Label>
              {compensationHistory.map((entry, index) => (
                <div key={entry.id} className="relative">
                  <Textarea
                    value={`On ${entry.date}: ${entry.compensation_type === 'salary' ? 'Annual Salary' : 'Hourly Rate'} ${entry.compensation_value}${entry.compensation_type === 'salary' ? '/year' : '/hour'} | Bonus: ${entry.bonus || 'None'} | Grade: ${entry.pay_grade} | Frequency: ${entry.pay_frequency} | Overtime Eligible: ${entry.overtime_eligible ? 'Yes' : 'No'}`}
                    readOnly
                    className="min-h-[60px] font-mono text-sm pr-10"
                    placeholder="Compensation history will appear here..."
                  />
                  <div className="absolute right-2 top-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setCompensation({
                          effective_date: entry.date,
                          compensation_type: entry.compensation_type,
                          compensation_rate: entry.compensation_value,
                          bonus: entry.bonus,
                          grade_id: payGrades.find(g => g.grade_code === entry.pay_grade)?.grade_id || '',
                          frequency_id: payFrequencies.find(f => f.frequency_name === entry.pay_frequency)?.frequency_id || '',
                          overtime_eligible: entry.overtime_eligible
                        });
                      }}
                      className="h-8 w-8 hover:bg-muted"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {compensationHistory.length === 0 && (
                <div className="relative">
                  <Textarea
                    value=""
                    readOnly
                    className="min-h-[60px] font-mono text-sm pr-10"
                    placeholder="Compensation history will appear here..."
                  />
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="border rounded p-4 bg-muted/10 space-y-4">
              <h3 className="font-medium">Add Compensation Detail</h3>
              <div className="grid grid-cols-3 gap-4">
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
                  <Label htmlFor="compensation_type">Compensation Type</Label>
                  <select
                    id="compensation_type"
                    value={compensation.compensation_type}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCompensation(prev => ({ 
                      ...prev, 
                      compensation_type: e.target.value,
                      compensation_rate: '' // Clear the value when switching types
                    }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="salary">Annual Salary</option>
                    <option value="hourly">Hourly Rate</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compensation_rate">
                    {compensation.compensation_type === 'salary' ? 'Annual Salary' : 'Hourly Rate'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="compensation_rate"
                  type="number"
                      value={compensation.compensation_rate}
                      onChange={e => setCompensation(prev => ({ ...prev, compensation_rate: e.target.value }))}
                      placeholder={compensation.compensation_type === 'salary' ? 'Annual salary' : 'Hourly rate'}
                      className="pr-12"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                      {compensation.compensation_type === 'salary' ? '/year' : '/hour'}
                    </div>
                  </div>
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
                  <Select
                  id="pay_grade"
                    value={payGrades.find(g => g.grade_id === compensation.grade_id) || null}
                    onChange={(option: any) => {
                      setCompensation(prev => ({ 
                        ...prev, 
                        grade_id: option?.grade_id || ''
                      }));
                    }}
                    options={payGrades}
                    getOptionLabel={(option: any) => `${option.grade_code} - ${option.description || option.grade_name}`}
                    getOptionValue={(option: any) => option.grade_id}
                    placeholder="Select Pay Grade"
                    isDisabled={loadingPayGrades}
                    styles={selectStyles}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pay_frequency">Pay Frequency</Label>
                  <Select
                  id="pay_frequency"
                    value={payFrequencies.find(f => f.frequency_id === compensation.frequency_id) || null}
                    onChange={(option: any) => {
                      setCompensation(prev => ({ 
                        ...prev, 
                        frequency_id: option?.frequency_id || ''
                      }));
                    }}
                    options={payFrequencies}
                    getOptionLabel={(option: any) => option.frequency_name}
                    getOptionValue={(option: any) => option.frequency_id}
                    placeholder="Select Pay Frequency"
                    isDisabled={loadingPayFrequencies}
                    styles={selectStyles}
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
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  size="sm" 
                  onClick={handleSaveCompensation}
                >
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleClearCompensation}
                >
                  Clear
                </Button>
              </div>
              {compensationError && (
                <div className="text-xs text-red-600 mt-1">{compensationError}</div>
              )}
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
          <div className="space-y-6">
            {/* Summary Text Boxes */}
          <div className="space-y-4">
              <Label>Compliance Document History</Label>
              {complianceHistory.map((entry) => (
                <div key={entry.document_id} className="relative">
                  <Textarea
                    value={`Document: ${entry.document_type} | Number: ${entry.document_number} | Status: ${entry.calculated_status} | Issue Date: ${entry.issue_date}${entry.expiration_date ? ` | Expiration: ${entry.expiration_date}` : ''}`}
                    readOnly
                    className={`min-h-[60px] font-mono text-sm pr-20 ${
                      entry.calculated_status === 'Active' ? 'bg-green-50' :
                      entry.calculated_status === 'Expired' ? 'bg-red-50' :
                      entry.calculated_status === 'Pending' ? 'bg-yellow-50' :
                      'bg-gray-50'
                    }`}
                    placeholder="Compliance document history will appear here..."
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-2">
                    {entry.file_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={async () => {
                          try {
                            const signedUrl = await getSignedUrl(entry.file_url, entry.document_id);
                            if (signedUrl) {
                              // Open in native viewer
                              window.open(signedUrl, '_blank', 'noopener,noreferrer');
                            } else {
                              setFileError('Unable to access file. Please try again.');
                            }
                          } catch (err) {
                            console.error('Error opening file:', err);
                            setFileError('Failed to open file');
                          }
                        }}
                        className="h-8 w-8 hover:bg-muted"
                        title="View Document"
                      >
                        {getFileIcon(entry.file_url)}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setComplianceDocuments({
                          document_type: entry.document_type,
                          document_number: entry.document_number,
                          file_url: entry.file_url || '',
                          issue_date: entry.issue_date,
                          expiration_date: entry.expiration_date || '',
                          editingIndex: complianceHistory.findIndex(e => e.document_id === entry.document_id)
                        });
                      }}
                      className="h-8 w-8 hover:bg-muted"
                      title="Edit Document"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
              </div>
                </div>
              ))}
              {complianceHistory.length === 0 && (
                <div className="relative">
                  <Textarea
                    value=""
                    readOnly
                    className="min-h-[60px] font-mono text-sm pr-10"
                    placeholder="Compliance document history will appear here..."
                />
              </div>
              )}
            </div>

            {/* Input Form */}
            <div className="border rounded p-4 bg-muted/10 space-y-4">
              <h3 className="font-medium">Add Compliance Document</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
              <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="document_type">Document Type</Label>
                    </div>
                    <Select
                      id="document_type"
                      value={documentTypes.find(dt => dt.code === complianceDocuments.document_type) || null}
                      onChange={(option: any) => {
                        const selectedType = option as DocumentType;
                        setComplianceDocuments(prev => ({ 
                          ...prev, 
                          document_type: selectedType?.code || '',
                          // Reset dates if document type changes and doesn't require them
                          expiration_date: selectedType?.requires_expiration ? prev.expiration_date : '',
                          issue_date: selectedType?.requires_issue ? prev.issue_date : '',
                          // Keep the editingIndex
                          editingIndex: prev.editingIndex
                        }));
                      }}
                      options={documentTypes}
                      getOptionLabel={(option: DocumentType) => `${option.name}${option.description ? ` - ${option.description}` : ''}`}
                      getOptionValue={(option: DocumentType) => option.code}
                      placeholder="Select Document Type"
                      isDisabled={loadingDocumentTypes}
                      styles={selectStyles}
                />
              </div>
              <div className="space-y-2">
                    <div className="flex items-center gap-2">
                <Label htmlFor="issue_date">Issue Date</Label>
                      {documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_issue && (
                        <span className="text-xs text-red-500">(Required)</span>
                      )}
                    </div>
                <Input
                  id="issue_date"
                  type="date"
                  value={complianceDocuments.issue_date}
                      onChange={e => setComplianceDocuments(prev => ({ 
                        ...prev, 
                        issue_date: e.target.value,
                        // Keep the editingIndex
                        editingIndex: prev.editingIndex
                      }))}
                      className={documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_issue ? 
                        "border-2 border-red-200 focus:border-red-500" : 
                        "opacity-60"}
                      required={documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_issue}
                />
              </div>
                </div>
                <div className="space-y-4">
              <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="document_number">Document Number</Label>
                      {documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_number && (
                        <span className="text-xs text-red-500">(Required)</span>
                      )}
                    </div>
                    <Input
                      id="document_number"
                      value={complianceDocuments.document_number}
                      onChange={e => setComplianceDocuments(prev => ({ 
                        ...prev, 
                        document_number: e.target.value,
                        // Keep the editingIndex
                        editingIndex: prev.editingIndex
                      }))}
                      placeholder="Document number"
                      className={documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_number ? 
                        "border-2 border-red-200 focus:border-red-500" : 
                        "opacity-60"}
                      required={documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_number}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                <Label htmlFor="expiration_date">Expiration Date</Label>
                      {documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_expiration && (
                        <span className="text-xs text-red-500">(Required)</span>
                      )}
                    </div>
                <Input
                  id="expiration_date"
                  type="date"
                  value={complianceDocuments.expiration_date}
                      onChange={e => setComplianceDocuments(prev => ({ 
                        ...prev, 
                        expiration_date: e.target.value,
                        // Keep the editingIndex
                        editingIndex: prev.editingIndex
                      }))}
                      className={documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_expiration ? 
                        "border-2 border-red-200 focus:border-red-500" : 
                        "opacity-60"}
                      required={documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_expiration}
                    />
                  </div>
              </div>
              <div className="space-y-2">
                  <Label htmlFor="file_url">Document File</Label>
                  <div
                    className={`border-2 border-dashed rounded-md p-4 ${
                      uploadingFile ? 'opacity-50' : 'hover:border-primary'
                    } ${
                      fileError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files[0];
                      if (file) handleFileUpload(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center justify-center text-center">
                      {complianceDocuments.file_url ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="text-sm text-muted-foreground">
                            {complianceDocuments.file_url.split('/').pop()}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const signedUrl = await getSignedUrl(complianceDocuments.file_url);
                              if (signedUrl) {
                                window.open(signedUrl, '_blank');
                              } else {
                                setFileError('Unable to access file. Please try again.');
                              }
                            }}
                          >
                            View File
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm text-muted-foreground mb-2">
                            {uploadingFile ? (
                              'Uploading...'
                            ) : (
                              <>
                                Drag & drop a file here, or click to select
                                <br />
                                <span className="text-xs">
                                  (PDF, PNG, JPG, WebP up to 10MB)
                                </span>
                              </>
                            )}
                          </div>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file);
                            }}
                            disabled={uploadingFile}
                          />
                        </>
                      )}
              </div>
                  </div>
                  {fileError && (
                    <div className="text-xs text-red-600 mt-1">{fileError}</div>
                  )}
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Document Type Requirements:</h4>
                {complianceDocuments.document_type ? (
                  <ul className="text-sm text-blue-700 space-y-1">
                    {documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_number && (
                      <li>• Document number is required</li>
                    )}
                    {documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_issue && (
                      <li>• Issue date is required</li>
                    )}
                    {documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_expiration && (
                      <li>• Expiration date is required</li>
                    )}
                    {documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_verification && (
                      <li>• Document verification is required</li>
                    )}
                    {!documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_number &&
                     !documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_issue &&
                     !documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_expiration &&
                     !documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_verification && (
                      <li>• No special requirements for this document type</li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-blue-700">Select a document type to see its requirements</p>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button 
                  size="sm" 
                  onClick={handleSaveCompliance}
                  disabled={!complianceDocuments.document_type || 
                    (documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_expiration && !complianceDocuments.expiration_date) ||
                    (documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_issue && !complianceDocuments.issue_date) ||
                    (documentTypes.find(dt => dt.code === complianceDocuments.document_type)?.requires_number && !complianceDocuments.document_number)}
                >
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleClearCompliance}
                >
                  Clear
                </Button>
              </div>
              {complianceError && (
                <div className="text-xs text-red-600 mt-1">{complianceError}</div>
              )}
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