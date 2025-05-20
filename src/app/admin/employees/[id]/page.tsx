"use client";

import { useParams, useRouter } from 'next/navigation';
import NewEmployeePage from '../new/page';

export default function EmployeeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params?.id;

  // If no employee ID is provided or it's not a valid UUID, redirect to the employee list
  if (!employeeId || typeof employeeId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeId)) {
    router.push('/admin/employees');
    return null;
  }

  return <NewEmployeePage params={{ id: employeeId }} />;
} 