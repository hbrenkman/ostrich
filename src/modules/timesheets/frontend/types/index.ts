export interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  project: string;
  task: string;
  notes: string;
}

export interface Timesheet {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected';
  entries: TimeEntry[];
  totalHours: number;
}