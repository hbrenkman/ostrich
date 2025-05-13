'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { Database } from '@/types/supabase'

type Industry = Database['public']['Tables']['industries']['Row']
type Company = Database['public']['Tables']['companies']['Row']

interface Contact {
  id: string;
  name: string;
  title: string;
  mobile: string;
  direct_phone: string;
  email: string;
}

interface CompanyWithContacts extends Company {
  contacts?: Contact[];
}

interface EditCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: CompanyWithContacts | null;
  onSave: (company: CompanyWithContacts) => void;
}

export function EditCompanyDialog({ open, onOpenChange, company, onSave }: EditCompanyDialogProps) {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editedCompany, setEditedCompany] = useState<CompanyWithContacts | null>(null);

  useEffect(() => {
    if (company) {
      setEditedCompany(company);
    }
  }, [company]);

  useEffect(() => {
    async function fetchIndustries() {
      try {
        console.log('Starting to fetch industries...');
        const { data, error } = await supabase
          .from('industries')
          .select('*')
          .order('name');

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        console.log('Raw data from Supabase:', data);
        setIndustries(data || []);
      } catch (err) {
        console.error('Error fetching industries:', err);
        setError('Failed to load industries');
      }
    }

    if (open) {
      console.log('Dialog opened, fetching industries...');
      fetchIndustries();
    }
  }, [open]);

  useEffect(() => {
    console.log('Company data updated:', editedCompany);
  }, [editedCompany]);

  useEffect(() => {
    console.log('Industries state updated:', industries);
  }, [industries]);

  const handleSave = () => {
    if (!editedCompany?.name) {
      setError('Company name is required');
      return;
    }
    onSave(editedCompany);
    onOpenChange(false);
  };

  const handleAddContact = () => {
    if (!editedCompany) {
      setError('Company data is required');
      return;
    }

    const newContact: Contact = {
      id: `contact_${Date.now()}`,
      name: '',
      title: '',
      mobile: '',
      direct_phone: '',
      email: '',
    };

    setEditedCompany({
      ...editedCompany,
      contacts: [...(editedCompany.contacts || []), newContact],
    });
    setError('');
  };

  const handleDeleteContact = (contactId: string) => {
    if (!editedCompany) return;
    
    setEditedCompany({
      ...editedCompany,
      contacts: (editedCompany.contacts || []).filter(c => c.id !== contactId),
    });
  };

  const handleCompanyChange = (updates: Partial<CompanyWithContacts>) => {
    if (!editedCompany) return;
    setEditedCompany({ ...editedCompany, ...updates });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>Edit Company</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={editedCompany?.name || ''}
                onChange={(e) => handleCompanyChange({ name: e.target.value })}
                className="mt-1"
                data-testid="edit-company-name-input"
              />
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <select
                id="industry"
                value={editedCompany?.industry_id || ''}
                onChange={(e) => handleCompanyChange({ industry_id: e.target.value })}
                className="w-full px-3 py-2 mt-1 border rounded-md"
                data-testid="edit-company-industry-select"
              >
                <option value="">Select Industry</option>
                {industries.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </select>
              {/* Debug info */}
              <div className="text-xs text-muted-foreground mt-1">
                Available industries: {industries.length}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={editedCompany?.status || ''}
              onChange={(e) => handleCompanyChange({ status: e.target.value })}
              className="w-full px-3 py-2 mt-1 border rounded-md"
              data-testid="edit-company-status-select"
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Contacts Section */}
          <div className="mt-6 border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Contacts</h3>
              <Button
                onClick={handleAddContact}
                className="flex items-center gap-2"
                variant="outline"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Add Contact
              </Button>
            </div>

            {/* Contacts List */}
            {editedCompany?.contacts && (
              <div className="space-y-3">
                {editedCompany.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3 border rounded-lg bg-muted/10"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {contact.email}
                          </div>
                          {contact.mobile && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Mobile: {contact.mobile}
                            </div>
                          )}
                          {contact.direct_phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              Direct Phone: {contact.direct_phone}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="text-destructive text-sm text-center" data-testid="edit-error">
              {error}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="edit-cancel-button">
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="edit-save-button">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}