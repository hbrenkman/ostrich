"use client";

import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Briefcase, DollarSign, Heart, GraduationCap, FileCheck, Shield, Star, Calendar, Clock } from 'lucide-react';

const sections = [
  { key: 'directory', label: 'Employee Directory', icon: <Users className="w-4 h-4 mr-2" /> },
  { key: 'employment', label: 'Employment Details', icon: <Briefcase className="w-4 h-4 mr-2" /> },
  { key: 'compensation', label: 'Compensation', icon: <DollarSign className="w-4 h-4 mr-2" /> },
  { key: 'benefits', label: 'Benefits', icon: <Heart className="w-4 h-4 mr-2" /> },
  { key: 'qualifications', label: 'Qualifications', icon: <GraduationCap className="w-4 h-4 mr-2" /> },
  { key: 'compliance', label: 'Compliance Documents', icon: <FileCheck className="w-4 h-4 mr-2" /> },
  { key: 'access', label: 'Access Control', icon: <Shield className="w-4 h-4 mr-2" /> },
  { key: 'reviews', label: 'Performance Reviews', icon: <Star className="w-4 h-4 mr-2" /> },
  { key: 'leave', label: 'Leave Balances', icon: <Calendar className="w-4 h-4 mr-2" /> },
  { key: 'attendance', label: 'Time & Attendance', icon: <Clock className="w-4 h-4 mr-2" /> },
];

export default function EmployeeSideNav({ active }: { active: string }) {
  return (
    <div className="w-64 shrink-0">
      <div className="sticky top-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-6 h-6" />
          <h1 className="text-h1">Employee Management</h1>
        </div>
        <nav className="space-y-1">
          <Tabs value={active} orientation="vertical" className="w-full">
            <TabsList className="flex flex-col h-auto space-y-1 bg-transparent p-0 border-none">
              {sections.map(section => (
                <Link key={section.key} href={`/admin/employees?section=${section.key}`} passHref>
                  <TabsTrigger
                    value={section.key}
                    className="w-full justify-start px-4 py-3 text-base font-medium text-muted-foreground transition-all hover:bg-muted/10 hover:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:text-foreground rounded-md"
                  >
                    {section.icon}
                    {section.label}
                  </TabsTrigger>
                </Link>
              ))}
            </TabsList>
          </Tabs>
        </nav>
      </div>
    </div>
  );
} 