import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddAdditionalServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (service: {
    name: string;
    description: string | null;
    discipline: string | null;
    phase: 'design' | 'construction' | null;
    default_min_value: number;
    rate: number;
    is_active: boolean;
  }) => Promise<void>;
  onEdit?: (serviceId: string, service: {
    name: string;
    description: string | null;
    discipline: string | null;
    phase: 'design' | 'construction' | null;
    default_min_value: number;
    rate: number;
    is_active: boolean;
  }) => Promise<void>;
  editMode?: boolean;
  serviceData?: {
    id: string;
    name: string;
    description: string;
    discipline: string | null;
    phase: 'design' | 'construction' | null;
    default_min_value: number;
    rate: number;
    is_active: boolean;
  };
}

const DISCIPLINES = [
  'Multi',
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

export function AddAdditionalServiceDialog({
  open,
  onOpenChange,
  onAdd,
  onEdit,
  editMode = false,
  serviceData
}: AddAdditionalServiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    discipline: null as string | null,
    phase: 'design' as 'design' | 'construction',
    default_min_value: 0,
    rate: 0,
    is_active: true
  });

  useEffect(() => {
    if (open && editMode && serviceData) {
      setFormData({
        name: serviceData.name,
        description: serviceData.description,
        discipline: serviceData.discipline,
        phase: serviceData.phase || 'design',
        default_min_value: serviceData.default_min_value,
        rate: serviceData.rate,
        is_active: serviceData.is_active
      });
    } else if (!open) {
      setFormData({
        name: '',
        description: '',
        discipline: null,
        phase: 'design',
        default_min_value: 0,
        rate: 0,
        is_active: true
      });
      setError(null);
    }
  }, [open, editMode, serviceData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Service name is required');
      return;
    }

    if (formData.default_min_value < 0) {
      setError('Default minimum value cannot be negative');
      return;
    }

    if (formData.rate < 0) {
      setError('Rate cannot be negative');
      return;
    }

    setLoading(true);
    try {
      const serviceDataToSubmit = {
        name: formData.name,
        description: formData.description.trim() || null,
        discipline: formData.discipline === 'Multi' ? null : formData.discipline,
        phase: formData.phase,
        default_min_value: Number(formData.default_min_value),
        rate: Number(formData.rate),
        is_active: formData.is_active
      };

      if (editMode && serviceData && onEdit) {
        await onEdit(serviceData.id, serviceDataToSubmit);
      } else {
        await onAdd(serviceDataToSubmit);
      }

      onOpenChange(false);
      setFormData({
        name: '',
        description: '',
        discipline: null,
        phase: 'design',
        default_min_value: 0,
        rate: 0,
        is_active: true
      });
    } catch (err) {
      console.error('Failed to add additional service:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while adding the service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editMode ? 'Edit Additional Service' : 'Add Additional Service'}</DialogTitle>
          <DialogDescription>
            {editMode 
              ? 'Edit the details of this additional engineering service.'
              : 'Add a new additional service that can be linked to standard engineering services.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Discipline</Label>
            <div className="border rounded-md bg-pure-white">
              <div className="h-[120px] overflow-y-auto">
                <div className="p-2 space-y-2">
                  {DISCIPLINES.map(discipline => (
                    <div key={discipline} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id={`discipline-${discipline}`}
                        name="discipline"
                        checked={formData.discipline === discipline}
                        onChange={() => setFormData(prev => ({ ...prev, discipline }))}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={`discipline-${discipline}`}
                        className="flex items-center space-x-2 cursor-pointer flex-1 select-none"
                      >
                        <div className="p-1.5 rounded-md transition-colors bg-primary/10 text-primary hover:bg-primary/20 peer-checked:bg-primary/20">
                          <div className="w-4 h-4 rounded-full border-2 border-primary peer-checked:border-primary peer-checked:bg-primary flex items-center justify-center">
                            {formData.discipline === discipline && (
                              <div className="w-2 h-2 rounded-full bg-primary" />
                            )}
                          </div>
                        </div>
                        <span>{discipline}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {formData.discipline === 'Multi' 
                ? "Service will be available for all disciplines."
                : formData.discipline 
                  ? `Service will be available for ${formData.discipline} discipline.`
                  : "No discipline selected. Please select a discipline."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phase">Phase</Label>
            <Select
              value={formData.phase}
              onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value as 'design' | 'construction' }))}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default_min_value">Default Minimum Value *</Label>
              <Input
                id="default_min_value"
                type="number"
                min="0"
                step="0.01"
                value={formData.default_min_value}
                onChange={(e) => setFormData(prev => ({ ...prev, default_min_value: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rate">Rate *</Label>
              <Input
                id="rate"
                type="number"
                min="0"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active" className="text-muted-foreground">
              Active (Service will be available for selection)
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? (editMode ? 'Saving...' : 'Adding...') : (editMode ? 'Save Changes' : 'Add Service')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 