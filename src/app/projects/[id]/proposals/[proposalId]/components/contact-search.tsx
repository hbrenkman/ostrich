"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Search, Edit2, Trash2, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import debounce from 'lodash/debounce';
import { EditContactDialog } from '@/components/ui/EditContactDialog';

interface Role {
  id: string;
  name: string;
}

export interface CompanyContact {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  mobile: string | null;
  direct_phone: string | null;
  role_id: string | null;
  location_id: string | null;
  status: string;
  company_id: string | null;
  role?: {
    id: string;
    name: string;
  };
  location?: {
    id: string;
    name: string;
    address_line1: string;
    address_line2: string | null;
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

interface ContactSearchProps {
  selectedCompany?: string;
  onContactSelect: (contact: CompanyContact) => void;
  selectedContacts: CompanyContact[];
  onContactRemove: (contactId: string) => void;
  className?: string;
}

export function ContactSearch({ 
  selectedCompany, 
  onContactSelect, 
  selectedContacts,
  onContactRemove,
  className = ''
}: ContactSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CompanyContact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isEditContactDialogOpen, setIsEditContactDialogOpen] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [contactToEdit, setContactToEdit] = useState<CompanyContact | null>(null);

  // Fetch roles on mount
  useEffect(() => {
    async function fetchRoles() {
      try {
        const { data, error } = await supabase
          .from('roles')
          .select('*')
          .order('name');

        if (error) throw error;
        setRoles(data || []);
      } catch (error) {
        console.error('Error fetching roles:', error);
        toast.error('Failed to load roles');
      }
    }

    fetchRoles();
  }, []);

  // Search contacts function
  const searchContacts = useCallback(
    debounce(async (searchTerm: string) => {
      console.log('Debounced search function called with:', searchTerm);
      
      if (!searchTerm.trim()) {
        console.log('Search cancelled - empty query');
        setSearchResults([]);
        return;
      }

      console.log('Starting database search for:', searchTerm);
      setIsSearching(true);
      
      try {
        const searchPattern = `%${searchTerm}%`;
        console.log('Using search pattern:', searchPattern);

        let dbQuery = supabase
          .from('contacts')
          .select(`
            *,
            role:roles(id, name),
            location:locations(
              id,
              name,
              address_line1,
              address_line2,
              city,
              state,
              zip,
              company_id,
              company:companies(id, name)
            )
          `)
          .or(`first_name.ilike.${searchPattern},last_name.ilike.${searchPattern}`);

        // Only filter by company if one is provided
        if (selectedCompany) {
          console.log('Filtering by company:', selectedCompany);
          dbQuery = dbQuery.eq('location.company.name', selectedCompany);
        }

        console.log('Executing search query...');
        const { data, error } = await dbQuery.order('last_name');

        if (error) {
          console.error('Search error:', error);
          throw error;
        }

        if (!data) {
          console.log('No data returned from search');
          setSearchResults([]);
          return;
        }

        console.log(`Found ${data.length} contacts matching "${searchTerm}"`);
        console.log('First result (if any):', data[0]);
        setSearchResults(data);
      } catch (error) {
        console.error('Error searching contacts:', error);
        toast.error('Failed to search contacts');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [selectedCompany]
  );

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Search input changed:', e.target.value);
    const query = e.target.value.trim();
    setSearchQuery(e.target.value);
    setShowSearchResults(true);
    
    if (query) {
      console.log('Triggering search for:', query);
      searchContacts(query);
    } else {
      console.log('Clearing search results');
      setSearchResults([]);
    }
  };

  const handleEditClick = (e: React.MouseEvent<HTMLButtonElement>, contact: CompanyContact) => {
    e.preventDefault();
    setContactToEdit(contact);
    setIsEditContactDialogOpen(true);
  };

  const handleContactSelect = (contact: CompanyContact) => {
    // Check if contact is already selected
    if (selectedContacts.some(c => c.id === contact.id)) {
      toast.error('Contact already selected');
      return;
    }
    setSearchQuery('');
    setShowSearchResults(false);
    onContactSelect(contact);
  };

  const handleSaveContact = async (contact: CompanyContact) => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update({
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email,
          mobile: contact.mobile,
          direct_phone: contact.direct_phone,
          role_id: contact.role_id,
          status: contact.status,
          company_id: contact.company_id
        })
        .eq('id', contact.id)
        .select(`
          *,
          role:roles(*),
          location:locations(
            *,
            company:companies(*)
          )
        `)
        .single();

      if (error) throw error;

      if (data) {
        toast.success('Contact updated successfully');
        // Refresh search results if the search is active
        if (searchQuery) {
          searchContacts(searchQuery);
        }
      }
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Failed to update contact');
    } finally {
      setIsEditContactDialogOpen(false);
      setContactToEdit(null);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700 dark:text-[#E5E7EB]">Contacts</label>
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setShowSearchResults(true)}
            placeholder="Search contacts..."
            className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        {/* Show search results only when showSearchResults is true */}
        {showSearchResults && searchQuery && (
          <div className="absolute z-10 w-full mt-1 bg-background border border-[#D1D5DB] dark:border-[#4DB6AC] rounded-md shadow-lg">
            <div className="max-h-60 overflow-auto">
              {isSearching ? (
                <div className="p-2 text-sm text-gray-500">Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">
                  No contacts found.
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setContactToEdit({
                        id: '',
                        first_name: '',
                        last_name: '',
                        email: null,
                        mobile: null,
                        direct_phone: null,
                        role_id: null,
                        location_id: null,
                        status: 'Active',
                        company_id: null
                      });
                      setIsEditContactDialogOpen(true);
                    }}
                    className="ml-1 text-primary hover:underline"
                  >
                    Add new contact
                  </button>
                </div>
              ) : (
                <div className="py-1">
                  {searchResults.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => handleContactSelect(contact)}
                      disabled={selectedContacts.some(c => c.id === contact.id)}
                      className={`w-full px-3 py-2 text-left hover:bg-muted/5 focus:outline-none focus:bg-muted/5 ${
                        contact.location_id 
                          ? 'bg-green-50 dark:bg-green-900/20' 
                          : 'bg-red-50 dark:bg-red-900/20'
                      } ${selectedContacts.some(c => c.id === contact.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="font-medium">{contact.first_name} {contact.last_name}</div>
                      <div className="text-sm text-gray-500">
                        {contact.email || 'No email'}
                      </div>
                      {contact.location && (
                        <div className="mt-1 text-sm">
                          <div className="text-gray-600 dark:text-gray-300">
                            <span className="font-medium">Location:</span> {contact.location.name}
                            {contact.location.company && (
                              <span className="ml-2">
                                <span className="font-medium">Company:</span> {contact.location.company.name}
                              </span>
                            )}
                          </div>
                          <div className="text-gray-500 text-xs mt-0.5">
                            {contact.location.address_line1}
                            {contact.location.address_line2 && `, ${contact.location.address_line2}`}
                            {contact.location.city && `, ${contact.location.city}`}
                            {contact.location.state && `, ${contact.location.state}`}
                            {contact.location.zip && ` ${contact.location.zip}`}
                          </div>
                        </div>
                      )}
                      {!contact.location_id && (
                        <div className="mt-1 text-sm text-red-600 dark:text-red-400">
                          ⚠ Needs location assignment
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Show selected contacts */}
        {selectedContacts.length > 0 && (
          <div className="mt-2 space-y-2">
            {selectedContacts.map((contact) => (
              <div key={contact.id} className="p-3 bg-muted/5 rounded-md border border-[#D1D5DB] dark:border-[#4DB6AC]">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-[#E5E7EB]">
                        {contact.first_name} {contact.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {contact.email || 'No email'}
                        {contact.mobile && (
                          <span className="ml-2">• {contact.mobile}</span>
                        )}
                        {contact.direct_phone && (
                          <span className="ml-2">• {contact.direct_phone}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleEditClick(e, contact)}
                        className="p-1 text-gray-500 hover:text-primary"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onContactRemove(contact.id)}
                        className="p-1 text-gray-500 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {contact.location && (
                    <div className="text-sm">
                      <div className="text-gray-600 dark:text-gray-300">
                        <span className="font-medium">Location:</span> {contact.location.name}
                        {contact.location.company && (
                          <span className="ml-2">
                            <span className="font-medium">Company:</span> {contact.location.company.name}
                          </span>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs mt-0.5">
                        {contact.location.address_line1}
                        {contact.location.address_line2 && `, ${contact.location.address_line2}`}
                        {contact.location.city && `, ${contact.location.city}`}
                        {contact.location.state && `, ${contact.location.state}`}
                        {contact.location.zip && ` ${contact.location.zip}`}
                      </div>
                    </div>
                  )}
                  {contact.role && (
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Role:</span> {contact.role.name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Contact Dialog */}
      {isEditContactDialogOpen && contactToEdit && (
        <EditContactDialog
          open={isEditContactDialogOpen}
          onOpenChange={(open) => {
            setIsEditContactDialogOpen(open);
            if (!open) {
              setContactToEdit(null);
            }
          }}
          initialContact={{
            id: contactToEdit.id,
            first_name: contactToEdit.first_name,
            last_name: contactToEdit.last_name,
            email: contactToEdit.email || '',
            mobile: contactToEdit.mobile || '',
            direct_phone: contactToEdit.direct_phone || '',
            role_id: contactToEdit.role_id || '',
            location_id: contactToEdit.location_id || '',
            role: contactToEdit.role,
            location: contactToEdit.location ? {
              ...contactToEdit.location,
              address_line2: contactToEdit.location.address_line2 || ''
            } : undefined
          }}
          roles={roles}
          onSave={async (contact) => {
            await handleSaveContact({
              ...contact,
              status: contactToEdit.status,
              company_id: contactToEdit.company_id
            });
          }}
        />
      )}
    </div>
  );
} 