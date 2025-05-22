"use client";

import { useRouter } from 'next/navigation';
import EmployeesTable from '../../components/employee/EmployeesTable';
import { Users } from 'lucide-react';

export default function EmployeeManagementPage() {
  const router = useRouter();

  const handleEmployeeSelect = (employeeId: string) => {
    router.push(`/admin/employees/${employeeId}`);
  };

  return (
    <div className="container mx-auto py-6 pt-24 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-6 h-6" />
        <h1 className="text-h2">Employee Management</h1>
      </div>
      <EmployeesTable onEmployeeSelect={handleEmployeeSelect} />
    </div>
  );
}