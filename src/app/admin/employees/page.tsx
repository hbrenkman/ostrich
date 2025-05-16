"use client";

import { useRouter } from 'next/navigation';
import EmployeesTable from '../../../components/employee/EmployeesTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

export default function EmployeeManagementPage() {
  const router = useRouter();

  const handleEmployeeSelect = (employeeId: string) => {
    router.push(`/admin/employees/${employeeId}`);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Employee Directory</h1>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <EmployeesTable onEmployeeSelect={handleEmployeeSelect} />
        </CardContent>
      </Card>
    </div>
  );
} 