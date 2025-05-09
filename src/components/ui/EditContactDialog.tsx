import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

interface EditContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (contact: Contact) => void;
  initialContact: Contact;
  companies: string[];
  professions: string[];
  roles: string[];
}

export const EditContactDialog: React.FC<EditContactDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  initialContact,
  companies,
  professions,
  roles,
}) => {
  const [contact, setContact] = useState<Contact>(initialContact);
  const [error, setError] = useState<string>('');

  const handleSave = () => {
    if (!contact.first_name || !contact.last_name || !contact.email) {
      setError('First name, last name, and email are required');
      return;
    }
    onSave(contact);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
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
            <Label htmlFor="profession">Profession</Label>
            <select
              id="profession"
              value={contact.profession}
              onChange={(e) => setContact({ ...contact, profession: e.target.value })}
              className="w-full px-3 py-2 mt-1 border rounded-md"
              data-testid="edit-profession-select"
            >
              <option value="">Select profession...</option>
              {professions.map((profession) => (
                <option key={profession} value={profession}>{profession}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={contact.role}
              onChange={(e) => setContact({ ...contact, role: e.target.value })}
              className="w-full px-3 py-2 mt-1 border rounded-md"
              data-testid="edit-role-select"
            >
              <option value="">Select role...</option>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line1">Address</Label>
            <Input
              id="address_line1"
              value={contact.address_line1}
              onChange={(e) => setContact({ ...contact, address_line1: e.target.value })}
              placeholder="Address Line 1"
              data-testid="edit-address-line1-input"
            />
            <Input
              id="address_line2"
              value={contact.address_line2}
              onChange={(e) => setContact({ ...contact, address_line2: e.target.value })}
              placeholder="Address Line 2"
              data-testid="edit-address-line2-input"
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                id="city"
                value={contact.city}
                onChange={(e) => setContact({ ...contact, city: e.target.value })}
                placeholder="City"
                data-testid="edit-city-input"
              />
              <Input
                id="state"
                value={contact.state}
                onChange={(e) => setContact({ ...contact, state: e.target.value })}
                placeholder="State"
                data-testid="edit-state-input"
              />
              <Input
                id="zip"
                value={contact.zip}
                onChange={(e) => setContact({ ...contact, zip: e.target.value })}
                placeholder="ZIP"
                data-testid="edit-zip-input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="office_number">Office Number</Label>
              <Input
                id="office_number"
                type="tel"
                value={contact.office_number}
                onChange={(e) => setContact({ ...contact, office_number: e.target.value })}
                className="mt-1"
                data-testid="edit-office-number-input"
              />
            </div>
            <div>
              <Label htmlFor="mobile_number">Mobile Number</Label>
              <Input
                id="mobile_number"
                type="tel"
                value={contact.mobile_number}
                onChange={(e) => setContact({ ...contact, mobile_number: e.target.value })}
                className="mt-1"
                data-testid="edit-mobile-number-input"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center" data-testid="edit-error">
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
};
