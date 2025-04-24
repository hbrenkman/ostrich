import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface TimeEntry {
  id: string;
  project: string;
  task: string;
  startTime: string;
  endTime: string;
  date: string;
}

interface EditTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: TimeEntry) => void;
  entry: TimeEntry;
}

export const EditTimeEntryDialog: React.FC<EditTimeEntryDialogProps> = ({
  open,
  onOpenChange,
  onSave,
  entry: initialEntry,
}) => {
  const [entry, setEntry] = useState<TimeEntry>(initialEntry);
  const [error, setError] = useState<string>('');

  const handleChange = (field: keyof TimeEntry, value: string) => {
    setEntry(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateEntry = (): boolean => {
    if (!entry.project || !entry.task || !entry.startTime || !entry.endTime || !entry.date) {
      setError('All fields are required.');
      return false;
    }
    const start = new Date(`2000-01-01T${entry.startTime}:00`);
    const end = new Date(`2000-01-01T${entry.endTime}:00`);
    if (end <= start) {
      setError('End time must be after start time.');
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validateEntry()) return;
    onSave(entry);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background">
        <DialogHeader>
          <DialogTitle>Edit Time Entry</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project" className="text-right">
              Project
            </Label>
            <Input
              id="project"
              value={entry.project}
              onChange={e => handleChange('project', e.target.value)}
              className="col-span-3"
              data-testid="edit-project-input"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="task" className="text-right">
              Task
            </Label>
            <Input
              id="task"
              value={entry.task}
              onChange={e => handleChange('task', e.target.value)}
              className="col-span-3"
              data-testid="edit-task-input"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">
              Date
            </Label>
            <Input
              id="date"
              type="date"
              value={entry.date}
              onChange={e => handleChange('date', e.target.value)}
              className="col-span-3"
              data-testid="edit-date-input"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startTime" className="text-right">
              Start Time
            </Label>
            <Input
              id="startTime"
              type="time"
              value={entry.startTime}
              onChange={e => handleChange('startTime', e.target.value)}
              className="col-span-3"
              step="60"
              data-testid="edit-start-time-input"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="endTime" className="text-right">
              End Time
            </Label>
            <Input
              id="endTime"
              type="time"
              value={entry.endTime}
              onChange={e => handleChange('endTime', e.target.value)}
              className="col-span-3"
              step="60"
              data-testid="edit-end-time-input"
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm col-span-4 text-center" data-testid="edit-error">
              {error}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="edit-cancel-button">
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="edit-save-button">
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};