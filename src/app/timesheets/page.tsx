"use client";

import { useState } from 'react';
import { Clock, ChevronDown, ChevronRight, Search, Calendar, ArrowRight, BarChart } from 'lucide-react';
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

export default function Timesheets() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  
  // Example data - in a real app, this would come from an API
  const employees: EmployeeTimesheet[] = [
    {
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
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      role: 'Senior Developer',
      department: 'Engineering',
      weeklyAverage: 39.5,
      biweeklyTotal: 79,
      utilization: 82,
      timeEntries: [
        {
          id: '3',
          date: '2024-03-18',
          hours: 8,
          project: 'Website Redesign',
          task: 'Frontend Development',
          notes: 'Implementing new dashboard components'
        },
        {
          id: '4',
          date: '2024-03-19',
          hours: 7.5,
          project: 'Website Redesign',
          task: 'Code Review',
          notes: 'Reviewing pull requests'
        }
      ]
    }
  ];

  const toggleRow = (employeeId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (expandedRows.has(employeeId)) {
      newExpandedRows.delete(employeeId);
    } else {
      newExpandedRows.add(employeeId);
    }
    setExpandedRows(newExpandedRows);
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 85) return 'text-green-600';
    if (utilization >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const periods = [
    { value: 'current', label: 'Current Period (Mar 15 - Mar 28)' },
    { value: 'previous', label: 'Previous Period (Mar 1 - Mar 14)' },
    { value: 'next', label: 'Next Period (Mar 29 - Apr 11)' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-6 h-6" />
          <h1 className="text-2xl font-semibold">Timesheets</h1>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {periods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">164</div>
            <p className="text-sm text-gray-500 mt-1">Across all employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">85%</div>
            <p className="text-sm text-gray-500 mt-1">Team average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">3</div>
            <p className="text-sm text-gray-500 mt-1">Requiring review</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Employee Timesheets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
              <input
                type="text"
                placeholder="Search employees..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="w-10 px-4 py-3"></th>
                  <th className="text-left px-4 py-3">Employee</th>
                  <th className="text-left px-4 py-3">Weekly Average</th>
                  <th className="text-left px-4 py-3">Biweekly Total</th>
                  <th className="text-left px-4 py-3">Utilization</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {employees.map((employee) => (
                  <>
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleRow(employee.id)}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          {expandedRows.has(employee.id) ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.role}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span>{employee.weeklyAverage}h</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>{employee.biweeklyTotal}h</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <BarChart className="w-4 h-4 text-gray-500" />
                          <span className={getUtilizationColor(employee.utilization)}>
                            {employee.utilization}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/timesheets/${employee.id}`}
                          className="inline-flex items-center gap-1 text-primary hover:text-primary/90"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                    {expandedRows.has(employee.id) && (
                      <tr className="bg-gray-50">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="ml-8">
                            <h4 className="font-medium mb-2">Recent Time Entries</h4>
                            <div className="space-y-3">
                              {employee.timeEntries.map((entry) => (
                                <div
                                  key={entry.id}
                                  className="bg-white p-3 rounded-lg border border-gray-200"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-gray-500" />
                                      <span className="font-medium">{entry.date}</span>
                                    </div>
                                    <span className="text-sm font-medium">{entry.hours}h</span>
                                  </div>
                                  <div className="space-y-1 text-sm">
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
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}