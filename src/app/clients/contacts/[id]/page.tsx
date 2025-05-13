'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { EditContactDialog } from '@/components/ui/EditContactDialog';
import { toast } from 'react-hot-toast';

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

export default function ContactPage() {
  const params = useParams();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(true);
  const [companies, setCompanies] = useState<any[]>([]);
  const [professions, setProfessions] = useState<any[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    async function fetchRoles() {
      console.log('=== Fetch Roles Debug Info (Contact Page) ===');
      try {
        const { data, error } = await supabase
          .from('roles')
          .select('id, name')
          .order('name');

        if (error) {
          console.error('Error fetching roles:', error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
        } else {
          console.log('Roles fetch response:', {
            data,
            count: data?.length || 0
          });
          setRoles(data || []);
        }
      } catch (err: any) {
        console.error('Exception while fetching roles:', err);
        console.error('Exception details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
      }
      console.log('=== End Fetch Roles Debug Info ===');
    }

    fetchRoles();
  }, []);

  useEffect(() => {
    async function fetchContact() {
      if (!params?.id) {
        router.push('/clients/contacts');
        return;
      }

      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          role:roles (
            id,
            name
          ),
          location:locations (
            id,
            name,
            address_line1,
            address_line2,
            city,
            state,
            zip,
            company_id,
            company:companies (
              id,
              name
            )
          )
        `)
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error fetching contact:', error);
        router.push('/clients/contacts');
        return;
      }

      setContact(data);
    }

    fetchContact();
  }, [params?.id, router]);

  const handleSave = async (updatedContact: Contact) => {
    console.log('ContactPage - handleSave called with:', updatedContact);
    console.log('ContactPage - current contact:', contact);
    
    if (!contact?.id) {
      console.error('ContactPage - No contact ID found');
      return;
    }

    try {
      // First verify we can read the current data
      const { data: verifyData, error: verifyError } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contact.id)
        .single();

      if (verifyError) {
        console.error('ContactPage - Error verifying contact access:', verifyError);
        toast.error('Error accessing contact data');
        return;
      }

      console.log('ContactPage - Current database state:', verifyData);

      // Log the exact data we're trying to update
      const updateData = {
        first_name: updatedContact.first_name,
        last_name: updatedContact.last_name,
        email: updatedContact.email,
        mobile: updatedContact.mobile,
        direct_phone: updatedContact.direct_phone,
        role_id: updatedContact.role_id,
        location_id: updatedContact.location_id,
        updated_at: new Date().toISOString()
      };
      console.log('ContactPage - Update data:', updateData);

      // Try using the stored procedure first
      const { data: procResult, error: procError } = await supabase
        .rpc('update_contact', {
          p_id: contact.id,
          p_first_name: updateData.first_name,
          p_last_name: updateData.last_name,
          p_email: updateData.email,
          p_mobile: updateData.mobile,
          p_direct_phone: updateData.direct_phone,
          p_role_id: updateData.role_id,
          p_location_id: updateData.location_id,
          p_updated_at: updateData.updated_at
        });

      if (procError) {
        console.error('ContactPage - Error using stored procedure:', procError);
        console.log('ContactPage - Falling back to direct update...');

        // Fall back to direct update
        const { data: updateResult, error: updateError } = await supabase
          .from('contacts')
          .update(updateData)
          .match({ id: contact.id })
          .select()
          .single();

        if (updateError) {
          console.error('ContactPage - Error updating contact:', updateError);
          console.error('Error details:', {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint
          });
          toast.error('Failed to update contact');
          return;
        }

        console.log('ContactPage - Update result:', updateResult);
      } else {
        console.log('ContactPage - Stored procedure result:', procResult);
      }

      console.log('ContactPage - Successfully updated contact, fetching updated data...');
      // Fetch the updated contact with role information
      const { data: updatedData, error: fetchError } = await supabase
        .from('contacts')
        .select(`
          *,
          role:roles (
            id,
            name
          ),
          location:locations (
            id,
            name,
            address_line1,
            address_line2,
            city,
            state,
            zip,
            company_id,
            company:companies (
              id,
              name
            )
          )
        `)
        .eq('id', contact.id)
        .single();

      if (fetchError) {
        console.error('ContactPage - Error fetching updated contact:', fetchError);
        console.error('Error details:', {
          code: fetchError.code,
          message: fetchError.message,
          details: fetchError.details,
          hint: fetchError.hint
        });
        toast.error('Failed to fetch updated contact');
        return;
      }

      console.log('ContactPage - Successfully fetched updated contact:', updatedData);
      
      // Verify the location_id was actually updated
      if (updatedData.location_id !== updateData.location_id) {
        console.error('ContactPage - Location ID mismatch:', {
          expected: updateData.location_id,
          actual: updatedData.location_id
        });
        toast.error('Failed to update location');
        return;
      }

      setContact(updatedData);
      toast.success('Contact updated successfully');
      setIsEditDialogOpen(false);
      router.push('/clients/contacts');
    } catch (error) {
      console.error('ContactPage - Unexpected error during save:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      toast.error('An unexpected error occurred');
    }
  };

  if (!contact) {
    return null; // or a loading spinner
  }

  return (
    <EditContactDialog
      open={isEditDialogOpen}
      onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) router.push('/clients/contacts');
      }}
      initialContact={contact}
      roles={roles}
      onSave={handleSave}
    />
  );
}