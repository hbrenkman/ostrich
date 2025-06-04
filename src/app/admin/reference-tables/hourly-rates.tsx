'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Search, Plus, Edit2, Trash2, Link2, Unlink, UserPlus, Check, Minus, Building2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Discipline {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface HourlyRate {
  id: number;
  discipline_id: number;
  role_id: string;
  role_designation: string | null;
  rate: number;
  description?: string;
}

interface NewRole {
  name: string;
  description: string | null;
  is_active: boolean;
}

interface NewDiscipline {
  name: string;
  description: string | null;
}

interface HourlyRatesTableProps {
  showContainer?: boolean;
}

// Update predefined role designations with descriptions
const ROLE_DESIGNATIONS = [
  { value: 'none', label: 'None', description: 'No specific designation' },
  { value: 'Junior', label: 'Junior', description: 'Entry-level position with basic responsibilities' },
  { value: 'Mid-Level', label: 'Mid-Level', description: 'Intermediate position with moderate experience' },
  { value: 'Senior', label: 'Senior', description: 'Advanced position with extensive experience' },
  { value: 'Principal', label: 'Principal', description: 'Senior leadership position with strategic responsibilities' },
  { value: 'Chief', label: 'Chief', description: 'Executive leadership position with department oversight' },
  { value: 'Level 1', label: 'Level 1', description: 'Entry-level position' },
  { value: 'Level 2', label: 'Level 2', description: 'Early career position' },
  { value: 'Level 3', label: 'Level 3', description: 'Mid-career position' },
  { value: 'Level 4', label: 'Level 4', description: 'Advanced career position' },
  { value: 'Level 5', label: 'Level 5', description: 'Senior career position' },
  { value: 'Associate', label: 'Associate', description: 'Supporting role with growing responsibilities' },
  { value: 'Lead', label: 'Lead', description: 'Team leadership position' },
  { value: 'Manager', label: 'Manager', description: 'Department or team management position' },
  { value: 'Director', label: 'Director', description: 'Senior management position with strategic oversight' },
  { value: 'Custom', label: 'Custom...', description: 'Enter a custom designation' }
] as const;

export function HourlyRatesTable({ showContainer = true }: HourlyRatesTableProps) {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [hourlyRates, setHourlyRates] = useState<HourlyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState<HourlyRate | null>(null);
  const [editingRate, setEditingRate] = useState<Partial<HourlyRate>>({});
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newRate, setNewRate] = useState<Partial<HourlyRate>>({
    discipline_id: 0,
    role_id: '',
    role_designation: '',
    rate: 0,
    description: ''
  });
  const [draggedRole, setDraggedRole] = useState<Role | null>(null);
  const [customDesignation, setCustomDesignation] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isNewRoleDialogOpen, setIsNewRoleDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState<NewRole>({
    name: '',
    description: '',
    is_active: true
  });
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editingRole, setEditingRole] = useState<Partial<Role>>({});
  const [isNewDisciplineDialogOpen, setIsNewDisciplineDialogOpen] = useState(false);
  const [newDiscipline, setNewDiscipline] = useState<NewDiscipline>({
    name: '',
    description: ''
  });
  const [isEditDisciplineDialogOpen, setIsEditDisciplineDialogOpen] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState<Discipline | null>(null);
  const [editingDiscipline, setEditingDiscipline] = useState<Partial<Discipline>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [disciplinesRes, rolesRes, ratesRes] = await Promise.all([
        fetch('/api/disciplines'),
        fetch('/api/roles'),
        fetch('/api/hourly-rates')
      ]);

      if (!disciplinesRes.ok || !rolesRes.ok || !ratesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [disciplinesData, rolesData, ratesData] = await Promise.all([
        disciplinesRes.json(),
        rolesRes.json(),
        ratesRes.json()
      ]);

      console.log('Fetched Data:', {
        disciplines: disciplinesData,
        roles: rolesData,
        rates: ratesData
      });

      setDisciplines(disciplinesData);
      setRoles(rolesData);
      setHourlyRates(ratesData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (role: Role) => {
    setDraggedRole(role);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (discipline: Discipline) => {
    if (!draggedRole) return;

    // Open new rate dialog with pre-filled values
    setNewRate({
      discipline_id: discipline.id,
      role_id: draggedRole.id,
      role_designation: '',
      rate: 0,
      description: ''
    });
    setIsNewDialogOpen(true);
    setDraggedRole(null);
  };

  const handleCreate = async () => {
    if (!newRate.discipline_id || !newRate.role_id || !newRate.rate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate custom designation
    if (showCustomInput && (!customDesignation || !customDesignation.trim())) {
      toast.error('Please enter a custom designation');
      return;
    }

    // Prepare the designation value
    let designationValue = null;
    if (showCustomInput) {
      designationValue = customDesignation.trim();
    } else if (newRate.role_designation && newRate.role_designation !== 'none') {
      designationValue = newRate.role_designation;
    }

    // Check if rate already exists with the same discipline, role, AND designation
    const existingRate = hourlyRates.find(
      rate => 
        rate.discipline_id === newRate.discipline_id && 
        rate.role_id === newRate.role_id &&
        rate.role_designation === designationValue
    );

    if (existingRate) {
      toast.error('A rate already exists for this discipline, role, and designation combination');
      return;
    }

    try {
      const requestBody = {
        discipline_id: newRate.discipline_id,
        role_id: newRate.role_id,
        role_designation: designationValue,
        rate: Number(newRate.rate),
        description: newRate.description || null
      };

      console.log('Creating new rate with data:', requestBody);

      const response = await fetch('/api/hourly-rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      console.log('API Response:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create hourly rate');
      }

      setHourlyRates(prev => [...prev, responseData]);
      setIsNewDialogOpen(false);
      setNewRate({
        discipline_id: 0,
        role_id: '',
        role_designation: '',
        rate: 0,
        description: ''
      });
      setShowCustomInput(false);
      setCustomDesignation('');
      toast.success('Hourly rate created successfully');
    } catch (err) {
      console.error('Error creating hourly rate:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create hourly rate');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/hourly-rates?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete hourly rate');
      }

      // Update the local state by removing the deleted rate
      setHourlyRates(prevRates => prevRates.filter(rate => rate.id !== id));
      toast.success('Rate unlinked');
    } catch (err) {
      console.error('Error deleting hourly rate:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to unlink rate');
    }
  };

  const getDisciplineRates = (disciplineId: number) => {
    return hourlyRates.filter(rate => rate.discipline_id === disciplineId);
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find(role => role.id === roleId);
    console.log('Found role:', role); // Debug log
    return role?.name || 'Unknown Role';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Update handler for designation change
  const handleDesignationChange = (value: string) => {
    if (value === 'Custom') {
      setShowCustomInput(true);
      // Don't set the designation yet, wait for custom input
      setNewRate(prev => ({ ...prev, role_designation: null }));
    } else {
      setShowCustomInput(false);
      setCustomDesignation('');
      setNewRate(prev => ({ ...prev, role_designation: value === 'none' ? null : value }));
    }
  };

  // Add handler for custom designation change
  const handleCustomDesignationChange = (value: string) => {
    setCustomDesignation(value);
    // Only set the designation if we have a value
    if (value.trim()) {
      setNewRate(prev => ({ ...prev, role_designation: value.trim() }));
    } else {
      setNewRate(prev => ({ ...prev, role_designation: null }));
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name) {
      toast.error('Please enter a role name');
      return;
    }

    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRole),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create role');
      }

      const createdRole = await response.json();
      
      // Update the local state with the new role
      setRoles(prevRoles => [...prevRoles, createdRole]);
      
      // Close the dialog and reset the form
      setIsNewRoleDialogOpen(false);
      setNewRole({
        name: '',
        description: '',
        is_active: true
      });
      
      toast.success('Role created successfully');
    } catch (err) {
      console.error('Error creating role:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create role');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    // Check if the role is used in any hourly rates
    const roleInUse = hourlyRates.some(rate => rate.role_id === roleId);
    if (roleInUse) {
      toast.error('Cannot delete role that is assigned to hourly rates. Please unlink all rates first.');
      return;
    }

    try {
      const response = await fetch(`/api/roles?id=${roleId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete role');
      }

      // Update the local state by removing the deleted role
      setRoles(prevRoles => prevRoles.filter(role => role.id !== roleId));
      toast.success('Role deleted successfully');
    } catch (err) {
      console.error('Error deleting role:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete role');
    }
  };

  const handleEditRole = async () => {
    if (!selectedRole || !editingRole.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`/api/roles?id=${selectedRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedRole.id,
          name: editingRole.name,
          description: editingRole.description || null,
          is_active: editingRole.is_active
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update role');
      }

      const updatedRole = await response.json();
      
      // Update the local state
      setRoles(prevRoles => 
        prevRoles.map(role => 
          role.id === updatedRole.id ? updatedRole : role
        )
      );
      
      setIsEditRoleDialogOpen(false);
      setSelectedRole(null);
      setEditingRole({});
      toast.success('Role updated successfully');
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update role');
    }
  };

  // Add filtered roles computation
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
    (role.description?.toLowerCase().includes(roleSearchQuery.toLowerCase()) ?? false)
  );

  const handleCreateDiscipline = async () => {
    if (!newDiscipline.name) {
      toast.error('Please enter a discipline name');
      return;
    }

    try {
      const response = await fetch('/api/disciplines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDiscipline),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create discipline');
      }

      const createdDiscipline = await response.json();
      
      // Update the local state with the new discipline
      setDisciplines(prevDisciplines => [...prevDisciplines, createdDiscipline]);
      
      // Close the dialog and reset the form
      setIsNewDisciplineDialogOpen(false);
      setNewDiscipline({
        name: '',
        description: ''
      });
      
      toast.success('Discipline created successfully');
    } catch (err) {
      console.error('Error creating discipline:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create discipline');
    }
  };

  const handleDeleteDiscipline = async (disciplineId: number) => {
    // First, unlink all roles from this discipline
    const disciplineRates = hourlyRates.filter(rate => rate.discipline_id === disciplineId);
    
    try {
      // Delete all rates for this discipline
      await Promise.all(
        disciplineRates.map(rate => 
          fetch(`/api/hourly-rates?id=${rate.id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            }
          })
        )
      );

      // Now delete the discipline
      const response = await fetch('/api/disciplines', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: disciplineId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete discipline');
      }

      // Update the local state
      setDisciplines(prevDisciplines => prevDisciplines.filter(d => d.id !== disciplineId));
      setHourlyRates(prevRates => prevRates.filter(rate => rate.discipline_id !== disciplineId));
      
      toast.success('Discipline deleted successfully');
    } catch (err) {
      console.error('Error deleting discipline:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete discipline');
    }
  };

  const handleEditDiscipline = async () => {
    if (!selectedDiscipline || !editingDiscipline.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/disciplines', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedDiscipline.id,
          name: editingDiscipline.name,
          description: editingDiscipline.description || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update discipline');
      }

      const updatedDiscipline = await response.json();
      
      // Update the local state
      setDisciplines(prevDisciplines => 
        prevDisciplines.map(discipline => 
          discipline.id === updatedDiscipline.id ? updatedDiscipline : discipline
        )
      );
      
      setIsEditDisciplineDialogOpen(false);
      setSelectedDiscipline(null);
      setEditingDiscipline({});
      toast.success('Discipline updated successfully');
    } catch (err) {
      console.error('Error updating discipline:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to update discipline');
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 text-center text-destructive">
          <p>Error loading data: {error.message}</p>
          <Button 
            variant="outline" 
            className="mt-2"
            onClick={() => fetchData()}
          >
            Try Again
          </Button>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-2 gap-6">
          {/* Disciplines Panel */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Disciplines</CardTitle>
              <div
                onClick={() => setIsNewDisciplineDialogOpen(true)}
                className="cursor-pointer text-muted-foreground hover:text-primary transition-colors"
              >
                <Building2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {disciplines.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  No disciplines found
                </div>
              ) : (
                <div className="space-y-4">
                  {disciplines.map((discipline) => (
                    <div
                      key={discipline.id}
                      className="border rounded-lg p-4 bg-card"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDrop(discipline);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold mb-2">{discipline.name}</div>
                          {discipline.description && (
                            <div className="text-sm text-muted-foreground mb-3">
                              {discipline.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedDiscipline(discipline);
                              setEditingDiscipline(discipline);
                              setIsEditDisciplineDialogOpen(true);
                            }}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDiscipline(discipline.id)}
                            className="text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {getDisciplineRates(discipline.id).map((rate) => (
                          <div
                            key={rate.id}
                            className="flex items-center justify-between p-2 bg-muted/5 rounded"
                          >
                            <div>
                              <div className="font-medium">
                                {getRoleName(rate.role_id)}
                                {rate.role_designation && (
                                  <span className="text-sm text-muted-foreground ml-2">
                                    ({rate.role_designation})
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatCurrency(rate.rate)}/hr
                              </div>
                              {rate.description && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {rate.description}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedRate(rate);
                                  setEditingRate(rate);
                                  // Initialize custom designation state
                                  if (rate.role_designation && !ROLE_DESIGNATIONS.some(d => d.value === rate.role_designation)) {
                                    setShowCustomInput(true);
                                    setCustomDesignation(rate.role_designation);
                                  } else {
                                    setShowCustomInput(false);
                                    setCustomDesignation('');
                                  }
                                  setIsEditDialogOpen(true);
                                }}
                                className="text-muted-foreground hover:text-primary"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(rate.id)}
                                className="text-destructive hover:text-destructive/90"
                              >
                                <Unlink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Roles Panel */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Roles</CardTitle>
              <div
                onClick={() => setIsNewRoleDialogOpen(true)}
                className="cursor-pointer text-muted-foreground hover:text-primary transition-colors"
              >
                <UserPlus className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search roles..."
                    value={roleSearchQuery}
                    onChange={(e) => setRoleSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              {filteredRoles.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  {roleSearchQuery ? 'No roles found matching your search' : 'No roles found'}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredRoles.map((role) => (
                    <div
                      key={role.id}
                      className="border rounded-lg p-4 bg-card cursor-move relative"
                      draggable
                      onDragStart={() => handleDragStart(role)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-semibold mb-2 flex items-center gap-2">
                            {role.name}
                            <div
                              className={`inline-flex items-center justify-center p-1 rounded-md ${
                                role.is_active
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-gray-400'
                              }`}
                              title={role.is_active ? 'Active role' : 'Inactive role'}
                            >
                              {role.is_active ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <Minus className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </div>
                          {role.description && (
                            <div className="text-sm text-muted-foreground">
                              {role.description}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRole(role);
                              setEditingRole(role);
                              setIsEditRoleDialogOpen(true);
                            }}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRole(role.id);
                            }}
                            className="text-destructive hover:text-destructive/90"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* New Role Dialog */}
        <Dialog open={isNewRoleDialogOpen} onOpenChange={setIsNewRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Role</DialogTitle>
              <DialogDescription>
                Create a new role that can be assigned to disciplines.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Role Name</label>
                <Input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full"
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <Textarea
                  value={newRole.description || ''}
                  onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value || null }))}
                  className="w-full min-h-[100px]"
                  placeholder="Add a description for this role"
                />
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setNewRole(prev => ({ ...prev, is_active: !prev.is_active }))}
                  className={`p-1.5 rounded-md transition-colors ${
                    newRole.is_active 
                      ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                  title={newRole.is_active ? 'Disable role' : 'Enable role'}
                >
                  {newRole.is_active ? <Check className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                </button>
                <label className="text-sm font-medium">
                  Active
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsNewRoleDialogOpen(false);
                  setNewRole({
                    name: '',
                    description: '',
                    is_active: true
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateRole}
                disabled={!newRole.name}
              >
                Create Role
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Rate Dialog */}
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Hourly Rate</DialogTitle>
              <DialogDescription>
                Set the hourly rate for the selected role in this discipline.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Discipline</label>
                <Input
                  type="text"
                  value={disciplines.find(d => d.id === newRate.discipline_id)?.name || ''}
                  disabled
                  className="w-full bg-muted"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <Input
                  type="text"
                  value={roles.find(r => r.id === newRate.role_id)?.name || ''}
                  disabled
                  className="w-full bg-muted"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role Designation</label>
                <Select
                  value={newRate.role_designation || 'none'}
                  onValueChange={handleDesignationChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a designation">
                      {newRate.role_designation && !ROLE_DESIGNATIONS.some(d => d.value === newRate.role_designation)
                        ? 'Custom'
                        : (newRate.role_designation || 'None')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {ROLE_DESIGNATIONS.map((designation) => (
                      <SelectItem 
                        key={designation.value} 
                        value={designation.value}
                        className="flex flex-col items-start py-2"
                      >
                        <div className="font-medium">{designation.label}</div>
                        <div className="text-xs text-muted-foreground">{designation.description}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showCustomInput && (
                  <Input
                    type="text"
                    value={customDesignation}
                    onChange={(e) => handleCustomDesignationChange(e.target.value)}
                    className="w-full mt-2"
                    placeholder="Enter custom designation"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Hourly Rate ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={newRate.rate}
                  onChange={(e) => setNewRate(prev => ({ ...prev, rate: Number(e.target.value) }))}
                  className="w-full"
                  placeholder="Enter hourly rate"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <Input
                  type="text"
                  value={newRate.description}
                  onChange={(e) => setNewRate(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full"
                  placeholder="Add any additional details"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsNewDialogOpen(false);
                  setNewRate({
                    discipline_id: 0,
                    role_id: '',
                    role_designation: '',
                    rate: 0,
                    description: ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={!newRate.discipline_id || !newRate.role_id || !newRate.rate}
              >
                Create Rate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Rate Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Hourly Rate</DialogTitle>
              <DialogDescription>
                Update the hourly rate for this role in this discipline.
              </DialogDescription>
            </DialogHeader>
            {selectedRate && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discipline</label>
                  <Input
                    type="text"
                    value={disciplines.find(d => d.id === selectedRate.discipline_id)?.name || ''}
                    disabled
                    className="w-full bg-muted"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <Input
                    type="text"
                    value={roles.find(r => r.id === selectedRate.role_id)?.name || ''}
                    disabled
                    className="w-full bg-muted"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role Designation</label>
                  <Select
                    value={editingRate.role_designation && !ROLE_DESIGNATIONS.some(d => d.value === editingRate.role_designation) ? 'Custom' : (editingRate.role_designation || 'none')}
                    onValueChange={(value) => {
                      if (value === 'Custom') {
                        setShowCustomInput(true);
                        setEditingRate(prev => ({ ...prev, role_designation: customDesignation || '' }));
                      } else {
                        setShowCustomInput(false);
                        setCustomDesignation('');
                        setEditingRate(prev => ({ ...prev, role_designation: value === 'none' ? null : value }));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a designation">
                        {editingRate.role_designation && !ROLE_DESIGNATIONS.some(d => d.value === editingRate.role_designation)
                          ? 'Custom'
                          : (editingRate.role_designation || 'None')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {ROLE_DESIGNATIONS.map((designation) => (
                        <SelectItem 
                          key={designation.value} 
                          value={designation.value}
                          className="flex flex-col items-start py-2"
                        >
                          <div className="font-medium">{designation.label}</div>
                          <div className="text-xs text-muted-foreground">{designation.description}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showCustomInput && (
                    <Input
                      type="text"
                      value={customDesignation}
                      onChange={(e) => {
                        setCustomDesignation(e.target.value);
                        setEditingRate(prev => ({ ...prev, role_designation: e.target.value === 'none' ? null : e.target.value }));
                      }}
                      className="w-full mt-2"
                      placeholder="Enter custom designation"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hourly Rate ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingRate.rate}
                    onChange={(e) => setEditingRate(prev => ({ ...prev, rate: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                  <Input
                    type="text"
                    value={editingRate.description || ''}
                    onChange={(e) => setEditingRate(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full"
                    placeholder="Add any additional details"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setSelectedRate(null);
                  setEditingRate({});
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!selectedRate || !editingRate.rate) {
                    toast.error('Please fill in all required fields');
                    return;
                  }

                  try {
                    const response = await fetch(`/api/hourly-rates?id=${selectedRate.id}`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        discipline_id: selectedRate.discipline_id,
                        role_id: selectedRate.role_id,
                        role_designation: editingRate.role_designation === 'none' ? null : editingRate.role_designation,
                        rate: Number(editingRate.rate),
                        description: editingRate.description || null
                      }),
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.error || 'Failed to update hourly rate');
                    }

                    const updatedRate = await response.json();
                    
                    // Update the local state
                    setHourlyRates(prevRates => 
                      prevRates.map(rate => 
                        rate.id === updatedRate.id ? updatedRate : rate
                      )
                    );
                    
                    setIsEditDialogOpen(false);
                    setSelectedRate(null);
                    setEditingRate({});
                    toast.success('Hourly rate updated successfully');
                  } catch (err) {
                    console.error('Error updating hourly rate:', err);
                    toast.error(err instanceof Error ? err.message : 'Failed to update hourly rate');
                  }
                }}
                disabled={!selectedRate || !editingRate.rate}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Update the role details.
              </DialogDescription>
            </DialogHeader>
            {selectedRole && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Role Name</label>
                  <Input
                    type="text"
                    value={editingRole.name || ''}
                    onChange={(e) => setEditingRole(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full"
                    placeholder="Enter role name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                  <Textarea
                    value={editingRole.description || ''}
                    onChange={(e) => setEditingRole(prev => ({ ...prev, description: e.target.value || null }))}
                    className="w-full min-h-[100px]"
                    placeholder="Add a description for this role"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingRole(prev => ({ ...prev, is_active: !prev.is_active }))}
                    className={`p-1.5 rounded-md transition-colors ${
                      editingRole.is_active 
                        ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={editingRole.is_active ? 'Disable role' : 'Enable role'}
                  >
                    {editingRole.is_active ? <Check className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  </button>
                  <label className="text-sm font-medium">
                    Active
                  </label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditRoleDialogOpen(false);
                  setSelectedRole(null);
                  setEditingRole({});
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditRole}
                disabled={!selectedRole || !editingRole.name}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Discipline Dialog */}
        <Dialog open={isNewDisciplineDialogOpen} onOpenChange={setIsNewDisciplineDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Discipline</DialogTitle>
              <DialogDescription>
                Create a new discipline that can be assigned roles and rates.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Discipline Name</label>
                <Input
                  type="text"
                  value={newDiscipline.name}
                  onChange={(e) => setNewDiscipline(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full"
                  placeholder="Enter discipline name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <Textarea
                  value={newDiscipline.description || ''}
                  onChange={(e) => setNewDiscipline(prev => ({ ...prev, description: e.target.value || null }))}
                  className="w-full min-h-[100px]"
                  placeholder="Add a description for this discipline"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsNewDisciplineDialogOpen(false);
                  setNewDiscipline({
                    name: '',
                    description: ''
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateDiscipline}
                disabled={!newDiscipline.name}
              >
                Create Discipline
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Discipline Dialog */}
        <Dialog open={isEditDisciplineDialogOpen} onOpenChange={setIsEditDisciplineDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Discipline</DialogTitle>
              <DialogDescription>
                Update the discipline details.
              </DialogDescription>
            </DialogHeader>
            {selectedDiscipline && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discipline Name</label>
                  <Input
                    type="text"
                    value={editingDiscipline.name || ''}
                    onChange={(e) => setEditingDiscipline(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full"
                    placeholder="Enter discipline name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                  <Textarea
                    value={editingDiscipline.description || ''}
                    onChange={(e) => setEditingDiscipline(prev => ({ ...prev, description: e.target.value || null }))}
                    className="w-full min-h-[100px]"
                    placeholder="Add a description for this discipline"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDisciplineDialogOpen(false);
                  setSelectedDiscipline(null);
                  setEditingDiscipline({});
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditDiscipline}
                disabled={!selectedDiscipline || !editingDiscipline.name}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  };

  if (showContainer) {
    return (
      <Card>
        <CardContent className="pt-6">
          {renderContent()}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Clock className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Hourly Rates</h2>
          <p className="text-sm text-muted-foreground">
            Drag roles to disciplines to create hourly rates.
          </p>
        </div>
      </div>
      {renderContent()}
    </>
  );
} 