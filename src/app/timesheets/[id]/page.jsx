"use client";

import { useState } from 'react';
import { Clock, Calendar, ArrowLeft, BarChart, Edit2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';

interface TimeEntry {
  id: string;
  date: string;
  hours: number;
  project: string;
  task: string;
  notes: string;
}

interface EmployeeTimesheet {
  id: string;
  name: string;
  role: string;
  department: string;
  weeklyAverage: number;
  biweeklyTotal: number;
  utilization: number;
  timeEntries: TimeEntry[];
}

export default function TimesheetDetail({ params }: { params: { id: string } }) {
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  
  // Example data - in a real app, this would be fetched based on the ID
  const timesheet: EmployeeTimesheet = {
    id: '1',
    name: 'John Smith',
    role: 'Project Manager',
    department: 'Engineering',
    weeklyAverage: 42.5,
    biweeklyTotal: 85,
    utilization: 88,
    timeEntries: [
      {
        id: '1',
        date: '2024-03-18',
        hours: 8,
        project: 'Website Redesign',
        task: 'Project Planning',
        notes: 'Team meeting and sprint planning'
      },
      {
        id: '2',
        date: '2024-03-19',
        hours: 7.5,
        project: 'Mobile App Development',
        task: 'Client Meeting',
        notes: 'Requirements gathering'
      }
    ]
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 85) return 'text-green-600';
    if (utilization >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/timesheets"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{timesheet.name}&apos;s Timesheet</h1>
            <p className="text-gray-500">{timesheet.role} • {timesheet.department}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weekly Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{timesheet.weeklyAverage}h</div>
            <p className="text-sm text-gray-500 mt-1">Hours per week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Biweekly Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{timesheet.biweeklyTotal}h</div>
            <p className="text-sm text-gray-500 mt-1">Current period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getUtilizationColor(timesheet.utilization)}`}>
              {timesheet.utilization}%
            </div>
            <p className="text-sm text-gray-500 mt-1">Target: 85%</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {timesheet.timeEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{entry.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{entry.hours}h</span>
                    <button
                      onClick={() => setEditingEntry(entry.id)}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500">Project:</span>
                    <span className="ml-2">{entry.project}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Task:</span>
                    <span className="ml-2">{entry.task}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Notes:</span>
                    <span className="ml-2">{entry.notes}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}