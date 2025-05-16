"use client";

import EmployeeSideNav from '../../components/EmployeeSideNav';
import EmployeesTable from '../../components/employee/EmployeesTable';
import { useSearchParams } from 'next/navigation';

export default function EmployeeManagementPage() {
  const searchParams = useSearchParams();
  const section = searchParams ? searchParams.get('section') || 'directory' : 'directory';

  return (
    <div className="flex h-screen">
      <EmployeeSideNav active={section} />
      <main className="flex-1 p-6 overflow-auto">
        {section === 'directory' && <EmployeesTable />}
        {/* Add other sections here as you implement them */}
      </main>
    </div>
  );
}