import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AddStandardServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (service: {
    discipline: string;
    service_name: string;
    description: string;
    included_in_fee: boolean;
    default_included: boolean;
    phase: 'design' | 'construction';
    min_fee: number | null;
    rate: number | null;
    fee_increment: number | null;
    construction_admin: boolean;
  }) => Promise<void>;
  onEdit?: (serviceId: string, service: {
    discipline: string;
    service_name: string;
    description: string;
    included_in_fee: boolean;
    default_included: boolean;
    phase: 'design' | 'construction';
    min_fee: number | null;
    rate: number | null;
    fee_increment: number | null;
    construction_admin: boolean;
  }) => Promise<void>;
  editMode?: boolean;
  serviceData?: {
    id: string;
    discipline: string;
    service_name: string;
    description: string;
    included_in_fee: boolean;
    default_included: boolean;
    phase: 'design' | 'construction' | null;
    min_fee: number | null;
    rate: number | null;
    fee_increment: number | null;
    construction_admin: boolean;
  };
}

const ESTIMATED_FEE_OPTIONS = [
  { value: 'included', label: 'Included in project scope' },
  { value: 'additional_service', label: 'See additional engineering service item' }
] as const;

const DISCIPLINES = [
  'Architectural',
  'Civil',
  'Electrical',
  'Mechanical',
  'Plumbing',
  'Structural',
  'Other'
];

const PHASES = [
  { value: 'design', label: 'Design' },
  { value: 'construction', label: 'Construction' }
];

const formatPercentage = (value: number | null): string => {
  if (value === null) return '';
  return `${value.toFixed(2)}%`;
};

const parsePercentage = (value: string): number | null => {
  if (!value) return null;
  // Remove any % symbol and convert to number
  const num = parseFloat(value.replace('%', ''));
  return isNaN(num) ? null : num;
};

export function AddStandardServiceDialog({
  open,
  onOpenChange,
  onAdd,
  onEdit,
  editMode = false,
  serviceData
}: AddStandardServiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    discipline: '',
    service_name: '',
    description: '',
    included_in_fee: true,
    default_included: false,
    phase: 'design' as 'design' | 'construction',
    min_fee: null as number | null,
    rate: null as number | null,
    fee_increment: null as number | null,
    construction_admin: false
  });

  // Reset form when dialog opens/closes or serviceData changes
  useEffect(() => {
    if (open && editMode && serviceData) {
      setFormData({
        discipline: serviceData.discipline,
        service_name: serviceData.service_name,
        description: serviceData.description,
        included_in_fee: serviceData.included_in_fee,
        default_included: serviceData.default_included,
        phase: serviceData.phase || 'design',
        min_fee: serviceData.min_fee,
        rate: serviceData.rate,
        fee_increment: serviceData.fee_increment,
        construction_admin: serviceData.construction_admin
      });
      // Initialize selectedDisciplines with the service's discipline
      setSelectedDisciplines([serviceData.discipline]);
    } else if (!open) {
      setFormData({
        discipline: '',
        service_name: '',
        description: '',
        included_in_fee: true,
        default_included: false,
        phase: 'design',
        min_fee: null,
        rate: null,
        fee_increment: null,
        construction_admin: false
      });
      setSelectedDisciplines([]);
      setError(null);
    }
  }, [open, editMode, serviceData]);

  const handleDisciplineToggle = (discipline: string) => {
    if (editMode) {
      // In edit mode, we only allow one discipline
      setSelectedDisciplines([discipline]);
      setFormData(prev => ({ ...prev, discipline }));
    } else {
      // In add mode, we allow multiple disciplines
      setSelectedDisciplines(prev => 
        prev.includes(discipline)
          ? prev.filter(d => d !== discipline)
          : [...prev, discipline]
      );
    }
  };

  const handleEstimatedFeeChange = (value: 'included' | 'additional_service') => {
    setFormData(prev => ({
      ...prev,
      included_in_fee: value === 'included'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.service_name.trim() || !formData.description.trim()) {
      setError('Service name and description are required');
      return;
    }

    if (selectedDisciplines.length === 0) {
      setError('Please select at least one discipline');
      return;
    }

    setLoading(true);
    try {
      if (editMode && serviceData && onEdit) {
        // In edit mode, we only update the single service
        await onEdit(serviceData.id, {
          discipline: formData.discipline,
          service_name: formData.service_name,
          description: formData.description,
          included_in_fee: formData.included_in_fee,
          default_included: formData.default_included,
          phase: formData.phase,
          min_fee: formData.min_fee,
          rate: formData.rate,
          fee_increment: formData.fee_increment,
          construction_admin: formData.construction_admin
        });
      } else {
        // In add mode, create a service for each selected discipline
        for (const discipline of selectedDisciplines) {
          await onAdd({
            discipline,
            service_name: formData.service_name,
            description: formData.description,
            included_in_fee: formData.included_in_fee,
            default_included: formData.default_included,
            phase: formData.phase,
            min_fee: formData.min_fee,
            rate: formData.rate,
            fee_increment: formData.fee_increment,
            construction_admin: formData.construction_admin
          });
        }
      }
      onOpenChange(false);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editMode ? 'Edit Standard Service' : 'Add Standard Service'}</DialogTitle>
          <DialogDescription>
            {editMode 
              ? 'Edit the details of this standard engineering service.'
              : 'Add a new standard engineering service that can be included in proposals.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="service_name">Service Name *</Label>
            <Input
              id="service_name"
              value={formData.service_name}
              onChange={(e) => setFormData(prev => ({ ...prev, service_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Disciplines *</Label>
            <ScrollArea className="h-[120px] border rounded-md p-2">
              <div className="space-y-2">
                {DISCIPLINES.map(discipline => (
                  <div key={discipline} className="flex items-center space-x-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type={editMode ? "radio" : "checkbox"}
                        id={`discipline-${discipline}`}
                        checked={selectedDisciplines.includes(discipline)}
                        onChange={() => handleDisciplineToggle(discipline)}
                        className="peer sr-only"
                      />
                      <div className="p-1.5 rounded-md transition-colors bg-primary/10 text-primary hover:bg-primary/20 peer-checked:bg-primary/20">
                        {editMode ? (
                          <div className="w-4 h-4 rounded-full border-2 border-primary peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center">
                            {selectedDisciplines.includes(discipline) && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                        ) : (
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            width="16" 
                            height="16" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className={`w-4 h-4 transition-opacity ${selectedDisciplines.includes(discipline) ? 'opacity-100' : 'opacity-0'}`}
                          >
                            <path d="M20 6 9 17l-5-5"></path>
                          </svg>
                        )}
                      </div>
                    </label>
                    <Label
                      htmlFor={`discipline-${discipline}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {discipline}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phase">Phase</Label>
            <Select
              value={formData.phase}
              onValueChange={(value: 'design' | 'construction') => setFormData(prev => ({ ...prev, phase: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select phase" />
              </SelectTrigger>
              <SelectContent>
                {PHASES.map(phase => (
                  <SelectItem key={phase.value} value={phase.value}>
                    {phase.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_fee">Estimated Fee</Label>
            <Select
              value={formData.included_in_fee ? 'included' : 'additional_service'}
              onValueChange={handleEstimatedFeeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fee type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="included">Included in Project Scope</SelectItem>
                <SelectItem value="additional_service">Additional Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="default_included"
              checked={formData.default_included}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, default_included: checked }))}
            />
            <Label htmlFor="default_included" className="text-muted-foreground">
              Default Included (Service will be included by default in new proposals)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="construction_admin"
              checked={formData.construction_admin}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, construction_admin: checked }))}
              className="data-[state=checked]:bg-yellow-500"
            />
            <Label htmlFor="construction_admin" className="text-muted-foreground">
              Construction Administration Fee Calculation
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="ml-2 text-muted-foreground cursor-help">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                      <path d="M12 17h.01"></path>
                    </svg>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[300px]">
                  <p className="font-medium">Construction Administration Fee</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    When enabled, this service will affect the construction administration fee calculation in the fixed fee table.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {!formData.included_in_fee && (
            <>
              <div className="space-y-2">
                <Label htmlFor="min_fee">Minimum Fee ($)</Label>
                <Input
                  id="min_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_fee || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    min_fee: e.target.value ? parseFloat(e.target.value) : null
                  }))}
                  placeholder="Enter minimum fee"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">Rate (%)</Label>
                <div className="relative">
                  <Input
                    id="rate"
                    type="text"
                    inputMode="decimal"
                    value={formData.rate !== null ? (document.activeElement === document.getElementById('rate') 
                      ? formData.rate.toString() 
                      : formatPercentage(formData.rate)) : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty input or numbers
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        const numValue = value === '' ? null : parseFloat(value);
                        setFormData(prev => ({
                          ...prev,
                          rate: numValue
                        }));
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        setFormData(prev => ({
                          ...prev,
                          rate: value
                        }));
                      }
                    }}
                    placeholder="Enter percentage rate"
                    className="pr-8"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    %
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fee_increment">Fee Increment ($)</Label>
                <Input
                  id="fee_increment"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.fee_increment || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    fee_increment: e.target.value ? parseFloat(e.target.value) : null
                  }))}
                  placeholder="Enter fee increment amount"
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                setError(null);
                onOpenChange(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (editMode ? 'Saving...' : 'Adding...') : (editMode ? 'Save Changes' : 'Add Service')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 