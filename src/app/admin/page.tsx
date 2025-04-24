"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCog, Search, Plus, Mail, Key, Shield, Check, X, Clock, BarChart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'Active' | 'Inactive';
  permissions: {
    admin: boolean;
    projectManagement: boolean;
    production: boolean;
  };
}

export default function Admin() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      role: 'Project Manager',
      department: 'Engineering',
      status: 'Active',
      permissions: {
        admin: false,
        projectManagement: true,
        production: true,
      }
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      role: 'Senior Developer',
      department: 'Engineering',
      status: 'Active',
      permissions: {
        admin: false,
        projectManagement: false,
        production: true,
      }
    }
  ]);

  const [isNewEmployeeDialogOpen, setIsNewEmployeeDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'project_management' | 'production'>('production');
  const [newEmployee, setNewEmployee] = useState<Partial<Employee>>({
    status: 'Active',
    permissions: {
      admin: false,
      projectManagement: false,
      production: true
    }
  });

  const handleAddEmployee = () => {
    if (newEmployee.name && newEmployee.email && newEmployee.role && newEmployee.department) {
      const employee: Employee = {
        id: Date.now().toString(),
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        department: newEmployee.department,
        status: newEmployee.status as 'Active' | 'Inactive',
        permissions: newEmployee.permissions as Employee['permissions'],
      };
      setEmployees([...employees, employee]);
      setNewEmployee({
        status: 'Active',
        permissions: {
          admin: false,
          projectManagement: false,
          production: true
        }
      });
      setIsNewEmployeeDialogOpen(false);
    }
  };

  const handleUpdatePermissions = () => {
    if (selectedEmployee) {
      setEmployees(employees.map(emp => 
        emp.id === selectedEmployee.id ? selectedEmployee : emp
      ));
      setIsPermissionsDialogOpen(false);
      setSelectedEmployee(null);
    }
  };

  const handlePasswordReset = (email: string) => {
    // In a real application, this would trigger a password reset email
    alert(`Password reset email sent to ${email}`);
  };

  const handleStatusToggle = (employeeId: string) => {
    setEmployees(employees.map(emp => 
      emp.id === employeeId
        ? { ...emp, status: emp.status === 'Active' ? 'Inactive' : 'Active' }
        : emp
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCog className="w-6 h-6" />
          <h1 className="text-h1">Employee Management</h1>
        </div>
      </div>

      <Card className="bg-card text-card-foreground">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            Employees
          </CardTitle>
          <button
            onClick={() => setIsNewEmployeeDialogOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
              <input
                type="text"
                placeholder="Search employees..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-card-muted"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted text-muted-foreground border-b border-border">
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Department</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-muted/5 transition-colors duration-150">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-medium text-foreground">{employee.name}</div>
                        <div className="text-sm text-muted">{employee.email}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-foreground">{employee.role}</td>
                    <td className="py-3 px-4 text-foreground">{employee.department}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={employee.status === 'Active'}
                          onCheckedChange={() => handleStatusToggle(employee.id)}
                        />
                        <span className={`text-sm ${
                          employee.status === 'Active' ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {employee.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <svg className="w-4 h-4 text-gray-500" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 3C8.55228 3 9 2.55228 9 2C9 1.44772 8.55228 1 8 1C7.44772 1 7 1.44772 7 2C7 2.55228 7.44772 3 8 3Z" fill="currentColor"/>
                              <path d="M8 9C8.55228 9 9 8.55228 9 8C9 7.44772 8.55228 7 8 7C7.44772 7 7 7.44772 7 8C7 8.55228 7.44772 9 8 9Z" fill="currentColor"/>
                              <path d="M8 15C8.55228 15 9 14.5523 9 14C9 13.4477 8.55228 13 8 13C7.44772 13 7 13.4477 7 14C7 14.5523 7.44772 15 8 15Z" fill="currentColor"/>
                            </svg>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setIsPermissionsDialogOpen(true);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Shield className="w-4 h-4" />
                            <span>Permissions</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handlePasswordReset(employee.email)}
                            className="flex items-center gap-2"
                          >
                            <Key className="w-4 h-4" />
                            <span>Reset Password</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                          >
                            <Mail className="w-4 h-4" />
                            <span>Send Email</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* New Employee Dialog */}
      <Dialog open={isNewEmployeeDialogOpen} onOpenChange={setIsNewEmployeeDialogOpen}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Name
              </label>
              <input
                type="text"
                value={newEmployee.name || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-card-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <input
                type="email"
                value={newEmployee.email || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-card-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Role
              </label>
              <input
                type="text"
                value={newEmployee.role || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-card-muted"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Department
              </label>
              <input
                type="text"
                value={newEmployee.department || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-card-muted"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsNewEmployeeDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium bg-muted/10 hover:bg-muted/20 rounded-md transition-colors text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEmployee}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-2"
            >
              Add Employee
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Permissions</DialogTitle>
          </DialogHeader>
          {selectedEmployee && (
            <div className="py-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Role</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="role"
                        value="admin"
                        checked={selectedRole === 'admin'}
                        onChange={(e) => {
                          setSelectedRole('admin');
                          setSelectedEmployee({
                            ...selectedEmployee,
                            permissions: {
                              admin: true,
                              projectManagement: false,
                              production: false
                            }
                          });
                        }}
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <div>
                        <div className="font-medium">Admin Access</div>
                        <div className="text-sm text-gray-500">Full access to all features and settings</div>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="role"
                        value="project_management"
                        checked={selectedRole === 'project_management'}
                        onChange={(e) => {
                          setSelectedRole('project_management');
                          setSelectedEmployee({
                            ...selectedEmployee,
                            permissions: {
                              admin: false,
                              projectManagement: true,
                              production: false
                            }
                          });
                        }}
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <div>
                        <div className="font-medium">Project Management</div>
                        <div className="text-sm text-gray-500">Can manage projects and view financial information</div>
                      </div>
                    </label>
                    
                    <label className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="role"
                        value="production"
                        checked={selectedRole === 'production'}
                        onChange={(e) => {
                          setSelectedRole('production');
                          setSelectedEmployee({
                            ...selectedEmployee,
                            permissions: {
                              admin: false,
                              projectManagement: false,
                              production: true
                            }
                          });
                        }}
                        className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                      />
                      <div>
                        <div className="font-medium">Production</div>
                        <div className="text-sm text-gray-500">Basic access to view projects and track time</div>
                      </div>
                    </label>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-3">Permission Summary</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm">
                    {selectedRole === 'admin' && (
                      <ul className="space-y-1 text-gray-600">
                        <li>• Full access to all system features</li>
                        <li>• Can manage users and permissions</li>
                        <li>• Access to all financial information</li>
                        <li>• Can configure system settings</li>
                      </ul>
                    )}
                    {selectedRole === 'project_management' && (
                      <ul className="space-y-1 text-gray-600">
                        <li>• Can manage projects and clients</li>
                        <li>• View-only access to financials</li>
                        <li>• Cannot access system settings</li>
                        <li>• Cannot delete projects or clients</li>
                      </ul>
                    )}
                    {selectedRole === 'production' && (
                      <ul className="space-y-1 text-gray-600">
                        <li>• View-only access to projects</li>
                        <li>• Can track time on projects</li>
                        <li>• No access to financials</li>
                        <li>• Cannot modify project settings</li>
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setIsPermissionsDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdatePermissions}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-2"
            >
              Save Permissions
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}