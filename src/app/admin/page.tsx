"use client";

import EmployeeSideNav from '../../components/EmployeeSideNav';
import EmployeesTable from '../../components/employee/EmployeesTable';
import { useSearchParams, useRouter } from 'next/navigation';

export default function EmployeeManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const section = searchParams ? searchParams.get('section') || 'directory' : 'directory';

  const handleEmployeeSelect = (employeeId: string) => {
    router.push(`/admin/employees/${employeeId}`);
  };

  return (
    <div className="flex h-screen">
      <EmployeeSideNav active={section} />
      <main className="flex-1 p-6 overflow-auto">
        {section === 'directory' && <EmployeesTable onEmployeeSelect={handleEmployeeSelect} />}
        {/* Add other sections here as you implement them */}
      </main>
    </div>
  );
}