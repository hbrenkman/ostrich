'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../modules/auth/frontend/hooks/useAuth';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pagination } from '@/components/ui/pagination';
import { useRouter } from 'next/navigation';
import { EditContactDialog } from '@/components/ui/EditContactDialog';
import { EditCompanyDialog } from '@/components/ui/EditCompanyDialog';

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

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { user } = useAuth();
  const router = useRouter();
  const [isEditContactDialogOpen, setIsEditContactDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isEditCompanyDialogOpen, setIsEditCompanyDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    async function fetchContacts() {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*');

        if (error) {
          setError(error.message);
          console.error('Error fetching contacts:', error);
        } else {
          setContacts(data || []);
        }
      } catch (err) {
        console.error('Exception while fetching contacts:', err);
        setError(err.message);
      }
    }

    if (user) {
      fetchContacts();
    }
  }, [user]);

  const filteredContacts = contacts.filter(contact => {
    const searchLower = searchTerm.toLowerCase();
    return (
      contact.first_name?.toLowerCase().includes(searchLower) ||
      contact.last_name?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower) ||
      contact.role?.toLowerCase().includes(searchLower)
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
          {contact.profession && (
            <div className="text-sm text-muted-foreground">{contact.profession}</div>
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
          {contact.office_number && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>Office: {contact.office_number}</span>
            </div>
          )}
          {contact.mobile_number && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>Mobile: {contact.mobile_number}</span>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Address',
      accessor: (contact: Contact) => (
        <div className="space-y-1">
          {(contact.address_line1 || contact.city || contact.state) && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <div>
                {contact.address_line1 && <div>{contact.address_line1}</div>}
                {contact.address_line2 && <div>{contact.address_line2}</div>}
                <div>
                  {[contact.city, contact.state, contact.zip].filter(Boolean).join(', ')}
                </div>
              </div>
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Role',
      accessor: 'role'
    }
  ];

  const handleContactClick = (contact: Contact) => {
    router.push(`/clients/contacts/${contact.id}`); // Adjust the route as needed
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setIsEditContactDialogOpen(true);
  };

  const handleSaveContact = (contact: Contact) => {
    // Implement the logic to save the updated contact
    console.log('Contact updated:', contact);
    setIsEditContactDialogOpen(false);
  };

  const handleSaveCompany = (company: any) => {
    // Implement the logic to save the updated company
    console.log('Company updated:', company);
    setIsEditCompanyDialogOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          {user?.role === 'admin' && (
            <button
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Contact
            </button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact List</CardTitle>
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
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {selectedContact && (
        <EditContactDialog
          open={isEditContactDialogOpen}
          onOpenChange={setIsEditContactDialogOpen}
          initialContact={selectedContact}
          companies={companies}
          professions={professions}
          roles={roles}
          onSave={handleSaveContact}
        />
      )}

      {selectedCompany && (
        <EditCompanyDialog
          open={isEditCompanyDialogOpen}
          onOpenChange={setIsEditCompanyDialogOpen}
          initialCompany={selectedCompany}
          onSave={handleSaveCompany}
        />
      )}
    </div>
  );
}