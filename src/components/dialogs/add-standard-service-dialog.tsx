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

interface AddStandardServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (service: {
    discipline: string;
    service_name: string;
    description: string;
    estimated_fee?: 'included' | 'additional_service';
    default_setting?: boolean;
    phase?: 'design' | 'construction';
  }) => Promise<void>;
  onEdit?: (serviceId: string, service: {
    discipline: string;
    service_name: string;
    description: string;
    estimated_fee?: 'included' | 'additional_service';
    default_setting?: boolean;
    phase?: 'design' | 'construction';
  }) => Promise<void>;
  editMode?: boolean;
  serviceData?: {
    id: string;
    discipline: string;
    service_name: string;
    description: string;
    estimated_fee: string | null;
    default_setting: boolean;
    phase: 'design' | 'construction' | null;
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
    estimated_fee: 'included' as 'included' | 'additional_service',
    default_setting: true,
    phase: 'design' as 'design' | 'construction'
  });

  // Reset form when dialog opens/closes or serviceData changes
  useEffect(() => {
    if (open && editMode && serviceData) {
      setFormData({
        discipline: serviceData.discipline,
        service_name: serviceData.service_name,
        description: serviceData.description,
        estimated_fee: serviceData.estimated_fee as 'included' | 'additional_service' || 'included',
        default_setting: serviceData.default_setting,
        phase: serviceData.phase || 'design'
      });
      // Initialize selectedDisciplines with the service's discipline
      setSelectedDisciplines([serviceData.discipline]);
    } else if (!open) {
      setFormData({
        discipline: '',
        service_name: '',
        description: '',
        estimated_fee: 'included',
        default_setting: true,
        phase: 'design'
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
      estimated_fee: value,
      default_setting: value === 'included'
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
          discipline: serviceData.discipline,
          service_name: formData.service_name,
          description: formData.description,
          estimated_fee: formData.estimated_fee,
          default_setting: formData.default_setting,
          phase: formData.phase
        });
      } else {
        // In add mode, create a service for each selected discipline
        for (const discipline of selectedDisciplines) {
          await onAdd({
            discipline,
            service_name: formData.service_name,
            description: formData.description,
            estimated_fee: formData.estimated_fee,
            default_setting: formData.default_setting,
            phase: formData.phase
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
              value={formData.estimated_fee}
              onValueChange={handleEstimatedFeeChange}
              defaultValue="included"
            >
              <SelectTrigger>
                <SelectValue placeholder="Select fee type" />
              </SelectTrigger>
              <SelectContent>
                {ESTIMATED_FEE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="default_setting"
              checked={formData.default_setting}
              disabled
              className="opacity-50"
            />
            <Label htmlFor="default_setting" className="text-muted-foreground">
              {formData.estimated_fee === 'included' 
                ? 'Included in project scope'
                : 'See additional service'}
            </Label>
          </div>

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