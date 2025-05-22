'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Mail, Phone, MapPin, UserCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../modules/auth/frontend/hooks/useAuth';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from '@/components/ui/pagination';
import { useRouter } from 'next/navigation';
import { EditContactDialog } from '@/components/ui/EditContactDialog';
import { EditCompanyDialog } from '@/components/ui/EditCompanyDialog';
import React from 'react';

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

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { user } = useAuth();
  const router = useRouter();
  const [isEditContactDialogOpen, setIsEditContactDialogOpen] = useState(false);
  const [isNewContactDialogOpen, setIsNewContactDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditCompanyDialogOpen, setIsEditCompanyDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchContacts = async () => {
    try {
      console.log('Fetching contacts...');
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
        .order('first_name', { ascending: true })
        .order('last_name', { ascending: true });

      if (error) {
        setError(error.message);
        console.error('Error fetching contacts:', error);
      } else {
        console.log('Contacts fetched successfully:', data?.length || 0, 'contacts');
        setContacts(data || []);
      }
    } catch (err: any) {
      console.error('Exception while fetching contacts:', err);
      setError(err.message || 'An error occurred while fetching contacts');
    }
  };

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user, refreshTrigger]);

  useEffect(() => {
    async function fetchRoles() {
      console.log('=== Fetch Roles Debug Info (Main Contacts Page) ===');
      console.log('User state:', {
        id: user?.id,
        email: user?.email,
        role: user?.role,
        isAuthenticated: !!user
      });
      console.log('Starting roles fetch...');
      try {
        const { data, error, status, statusText } = await supabase
          .from('roles')
          .select('id, name')
          .order('name');

        console.log('Roles fetch response:', {
          status,
          statusText,
          hasData: !!data,
          dataLength: data?.length || 0,
          data: data,
          error: error ? {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          } : null
        });

        if (error) {
          console.error('Error fetching roles:', error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
        } else {
          console.log('Setting roles in state:', data);
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

    if (user) {
      console.log('User is authenticated, fetching roles...');
      fetchRoles();
    } else {
      console.log('User is not authenticated, skipping roles fetch');
    }
  }, [user]);

  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return true; // Show all contacts when search is empty

    // Create normalized versions of first and last name
    const firstName = (contact.first_name || '').toLowerCase().trim();
    const lastName = (contact.last_name || '').toLowerCase().trim();
    const fullName = `${firstName} ${lastName}`;
    
    // Split search query into words for more flexible matching
    const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);

    // First check if the search matches the full name
    if (fullName.includes(searchLower)) return true;

    // Then check if each word matches either first name or last name
    return searchWords.every(word => 
      firstName.includes(word) || 
      lastName.includes(word) ||
      // Also check other fields
      (contact.email || '').toLowerCase().includes(word) ||
      (contact.role?.name || '').toLowerCase().includes(word) ||
      (contact.location?.company?.name || '').toLowerCase().includes(word) ||
      (contact.location?.name || '').toLowerCase().includes(word)
    );
  });

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      header: 'Name',
      accessor: (contact: Contact) => (
        <div>
          <div className="font-medium">{`${contact.first_name} ${contact.last_name}`}</div>
          {contact.role?.name && (
            <div className="text-sm text-muted-foreground">{contact.role.name}</div>
          )}
        </div>
      )
    },
    {
      header: 'Contact',
      accessor: (contact: Contact) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span>{contact.email}</span>
          </div>
          {contact.direct_phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>Direct: {contact.direct_phone}</span>
            </div>
          )}
          {contact.mobile && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>Mobile: {contact.mobile}</span>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Company',
      accessor: (contact: Contact) => (
        <div className="font-medium">
          {contact.location?.company?.name || '-'}
        </div>
      )
    },
    {
      header: 'Location',
      accessor: (contact: Contact) => (
        <div className="space-y-1">
          <div className="font-medium">{contact.location?.name || '-'}</div>
          {contact.location && (
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <div>
                  {contact.location.address_line1 && <div>{contact.location.address_line1}</div>}
                  {contact.location.address_line2 && <div>{contact.location.address_line2}</div>}
                  <div>
                    {[contact.location.city, contact.location.state, contact.location.zip].filter(Boolean).join(', ')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )
    }
  ];

  const handleContactClick = (contact: Contact) => {
    router.push(`/clients/contacts/${contact.id}`); // Adjust the route as needed
  };

  const handleEditContact = (contact: Contact) => {
    console.log('=== Edit Contact Debug Info ===');
    console.log('Contact being edited:', {
      id: contact.id,
      name: `${contact.first_name} ${contact.last_name}`,
      role_id: contact.role_id,
      role: contact.role
    });
    console.log('Available roles:', roles.map(r => ({ id: r.id, name: r.name })));
    console.log('User:', user);
    console.log('===========================');
    setSelectedContact(contact);
    setIsEditContactDialogOpen(true);
  };

  const handleAddContact = () => {
    // Create an empty contact object with required fields
    const newContact: Contact = {
      id: '', // This will be set by the database
      first_name: '',
      last_name: '',
      email: '',
      mobile: '',
      direct_phone: '',
      role_id: '',
      location_id: '',
    };
    setSelectedContact(newContact);
    setIsNewContactDialogOpen(true);
  };

  const handleSaveContact = async (contact: Contact) => {
    try {
      console.log('=== Save Contact Debug Info ===');
      console.log('Original contact data:', {
        id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        mobile: contact.mobile,
        direct_phone: contact.direct_phone,
        role_id: contact.role_id,
        location_id: contact.location_id,
        role: contact.role,
        location: contact.location
      });

      // Prepare the contact data with only the necessary fields
      const contactData = {
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email || null,
        mobile: contact.mobile || null,
        direct_phone: contact.direct_phone || null,
        role_id: contact.role_id,
        location_id: contact.location_id || null,
        status: 'Active'
      };

      console.log('Prepared contact data for database:', contactData);

      if (!contact.id) {
        console.log('Creating new contact...');
        // This is a new contact
        const { data: insertedContact, error: insertError } = await supabase
          .from('contacts')
          .insert([contactData])
          .select('id')
          .single();

        console.log('Insert response:', {
          success: !insertError,
          data: insertedContact,
          error: insertError ? {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          } : null
        });

        if (insertError) {
          console.error('Error creating contact:', insertError);
          return;
        }

        console.log('Fetching complete contact data for new contact...');
        // Now fetch the complete contact data with relationships
        const { data: completeContact, error: fetchError } = await supabase
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
          .eq('id', insertedContact.id)
          .single();

        console.log('Fetch response for new contact:', {
          success: !fetchError,
          data: completeContact,
          error: fetchError ? {
            code: fetchError.code,
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint
          } : null
        });

        if (fetchError) {
          console.error('Error fetching new contact:', fetchError);
          return;
        }

        // Add the new contact to the list
        setContacts(prevContacts => [...prevContacts, completeContact]);
      } else {
        console.log('Updating existing contact...');
        // This is an existing contact being updated
        const { error: updateError } = await supabase
          .from('contacts')
          .update(contactData)
          .eq('id', contact.id);

        console.log('Update response:', {
          success: !updateError,
          error: updateError ? {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint
          } : null
        });

        if (updateError) {
          console.error('Error updating contact:', updateError);
          return;
        }

        console.log('Fetching complete contact data for updated contact...');
        // Fetch the updated contact with its relationships
        const { data: updatedContact, error: fetchError } = await supabase
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

        console.log('Fetch response for updated contact:', {
          success: !fetchError,
          data: updatedContact,
          error: fetchError ? {
            code: fetchError.code,
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint
          } : null
        });

        if (fetchError) {
          console.error('Error fetching updated contact:', fetchError);
          return;
        }

        // Update the contacts list with the fetched data
        setContacts(prevContacts => 
          prevContacts.map(c => c.id === contact.id ? updatedContact : c)
        );
      }

      console.log('=== End Save Contact Debug Info ===');

      // Close the appropriate dialog
      setIsEditContactDialogOpen(false);
      setIsNewContactDialogOpen(false);
      setSelectedContact(null);
    } catch (error: unknown) {
      console.error('Exception while saving contact:', error);
      if (error instanceof Error) {
        console.error('Exception details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
    }
  };

  const handleSaveCompany = (company: any) => {
    // Implement the logic to save the updated company
    console.log('Company updated:', company);
    setIsEditCompanyDialogOpen(false);
  };

  const handleReturnFromEdit = () => {
    console.log('Returning from edit, refreshing contacts...');
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const handleRouteChange = () => {
      if (window.location.pathname === '/clients/contacts') {
        console.log('Route changed to contacts page, refreshing...');
        handleReturnFromEdit();
      }
    };

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);

    // Check if we're returning from edit
    if (window.location.pathname === '/clients/contacts') {
      handleReturnFromEdit();
    }

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  return (
    <div className="container mx-auto py-6 pt-24 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCircle className="w-6 h-6" />
          <h1 className="text-h2">Contacts</h1>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={handleAddContact}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Contact
          </button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-2 py-1 border rounded-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={paginatedContacts}
            columns={columns}
            emptyMessage="No contacts found."
            onRowClick={handleContactClick}
          />
          
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredContacts.length}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedContact && (
        <React.Fragment>
          {(() => {
            console.log('Rendering EditContactDialog with props:', {
              open: isEditContactDialogOpen || isNewContactDialogOpen,
              hasOnSave: !!handleSaveContact,
              initialContact: selectedContact,
              rolesLength: roles.length
            });
            return null;
          })()}
          <EditContactDialog
            open={isEditContactDialogOpen || isNewContactDialogOpen}
            onOpenChange={(open) => {
              console.log('EditContactDialog onOpenChange called with:', open);
              setIsEditContactDialogOpen(open);
              setIsNewContactDialogOpen(open);
              if (!open) {
                handleReturnFromEdit();
              }
            }}
            initialContact={selectedContact}
            roles={roles}
            onSave={(contact) => {
              console.log('EditContactDialog onSave callback called with contact:', contact);
              handleSaveContact(contact);
            }}
          />
        </React.Fragment>
      )}

      {selectedCompany && (
        <EditCompanyDialog
          open={isEditCompanyDialogOpen}
          onOpenChange={setIsEditCompanyDialogOpen}
          company={selectedCompany}
          onSave={handleSaveCompany}
        />
      )}
    </div>
  );
}