"use client";

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import EmployeeSideNav from '../../../../components/EmployeeSideNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  // Add other employee fields as needed
}

export default function EmployeeDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const section = searchParams?.get('section') || 'directory';
  const employeeId = params?.id as string;

  if (!employeeId) {
    return (
      <div className="flex items-center justify-center h-screen text-destructive">
        Invalid employee ID
      </div>
    );
  }

  useEffect(() => {
    async function fetchEmployee() {
      try {
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', employeeId)
          .single();

        if (error) throw error;
        setEmployee(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load employee');
      } finally {
        setLoading(false);
      }
    }

    fetchEmployee();
  }, [employeeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="flex items-center justify-center h-screen text-destructive">
        {error || 'Employee not found'}
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <EmployeeSideNav active={section} />
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6" />
            <h1 className="text-3xl font-bold">
              {employee.first_name} {employee.last_name}
            </h1>
          </div>
          <div className="text-muted-foreground">
            {employee.email} • {employee.role}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {section === 'directory' && 'Employee Information'}
              {section === 'employment' && 'Employment Details'}
              {section === 'compensation' && 'Compensation'}
              {section === 'benefits' && 'Benefits'}
              {section === 'qualifications' && 'Qualifications'}
              {section === 'compliance' && 'Compliance Documents'}
              {section === 'access' && 'Access Control'}
              {section === 'reviews' && 'Performance Reviews'}
              {section === 'leave' && 'Leave Balances'}
              {section === 'attendance' && 'Time & Attendance'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Add the appropriate component based on the section */}
            {section === 'directory' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Full Name</h3>
                    <p>{employee.first_name} {employee.last_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    <p>{employee.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
                    <p>{employee.role}</p>
                  </div>
                </div>
              </div>
            )}
            {/* Add other section components as they are implemented */}
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 