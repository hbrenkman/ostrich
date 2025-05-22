"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';

interface Employee {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  work_email?: string;
  employment_details?: Array<{
    work_email?: string;
    job_title?: {
      role_name?: string;
    };
    employment_status?: {
      code: string;
      name: string;
    };
  }>;
}

interface EmployeesTableProps {
  onEmployeeSelect: (employeeId: string) => void;
}

export default function EmployeesTable({ onEmployeeSelect }: EmployeesTableProps) {
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.role || 'employee';
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const handleAddEmployee = () => {
    router.push('/admin/employees/new');
  };

  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true);
        let query = supabase
          .from('employees')
          .select(`
            *,
            employment_details (
              *,
              employment_status:employment_status_id (
                code,
                name
              ),
              job_title:job_title_id (
                role_id,
                role_name
              )
            )
          `);
        
        if (role === 'employee' && user) {
          query = query.eq('employee_id', user.id);
        }
        
        if (search) {
          query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
        }
        
        const { data, error } = await query;
        if (error) {
          console.error('Error fetching employees:', error);
          throw error;
        }

        console.log('Raw employee data:', data);

        // Process the data to get the most recent employment details
        const processedEmployees = (data || []).map((employee: any) => {
          // Sort employment details by effective_date in descending order to get the most recent
          const sortedDetails = employee.employment_details?.sort((a: any, b: any) => 
            new Date(b.effective_date).getTime() - new Date(a.effective_date).getTime()
          );
          const mostRecentDetails = sortedDetails?.[0];

          console.log('Processing employee:', {
            id: employee.employee_id,
            name: `${employee.first_name} ${employee.last_name}`,
            hasEmploymentDetails: !!employee.employment_details,
            employmentDetailsCount: employee.employment_details?.length,
            mostRecentDetails
          });

          return {
            ...employee,
            role: mostRecentDetails?.job_title?.role_name || 'unassigned',
            work_email: mostRecentDetails?.work_email || employee.email
          };
        });

        console.log('Processed employees:', processedEmployees);

        setEmployees(processedEmployees);
      } catch (err) {
        console.error('Error fetching employees:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchEmployees();
  }, [search, role, user]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        {(role === 'admin' || role === 'management') && (
          <Button 
            className="flex items-center gap-2"
            onClick={handleAddEmployee}
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
              {(role === 'admin' || role === 'management') && (
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={4} className="h-24 text-center text-muted-foreground">
                  No employees found
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr 
                  key={employee.employee_id}
                  className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                  onClick={() => onEmployeeSelect(employee.employee_id)}
                >
                  <td className="p-4 align-middle">
                    {employee.first_name} {employee.last_name}
                  </td>
                  <td className="p-4 align-middle">{employee.work_email || employee.email}</td>
                  <td className="p-4 align-middle">{employee.role}</td>
                  {(role === 'admin' || role === 'management') && (
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEmployeeSelect(employee.employee_id);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 