'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { EditContactDialog } from '@/components/ui/EditContactDialog';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  office_number: string;
  mobile_number: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip: string;
  profession: string;
  role: string;
}

export default function ContactPage() {
  const params = useParams();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    async function fetchContact() {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
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
  }, [params.id, router]);

  const handleSave = async (updatedContact: Contact) => {
    const { error } = await supabase
      .from('contacts')
      .update(updatedContact)
      .eq('id', contact?.id);

    if (error) {
      console.error('Error updating contact:', error);
      return;
    }

    setContact(updatedContact);
    setIsEditDialogOpen(false);
    router.push('/clients/contacts');
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
      companies={companies}
      professions={professions}
      roles={roles}
      onSave={handleSave}
    />
  );
}