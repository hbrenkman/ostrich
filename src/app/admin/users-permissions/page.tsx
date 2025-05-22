'use client';

import { useState, useEffect } from 'react';
import { Shield, Users, UserCog, Lock, UserPlus, UserX, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: 'active' | 'inactive';
  type: 'employee' | 'contractor';
  avatar_url?: string;
  last_sign_in_at?: string;
  created_at?: string;
  employee_id?: string;
  work_email?: string;
  job_title?: string;
  raw_app_meta_data: Record<string, any>;
  raw_user_meta_data: Record<string, any>;
}

// Add type for Supabase auth user
interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    app_metadata?: Record<string, any>;
  };
  app_metadata?: {
    role?: string;
    claims?: Record<string, any>;
  };
  banned_at?: string;
  last_sign_in_at?: string;
  created_at?: string;
}

interface RoleBin {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  users: User[];
}

// Add interface for employee data
interface Employee {
  employee_id: string;
  email: string;
  first_name: string;
  last_name: string;
  photo_url?: string;
  created_at: string;
  employment_details?: Array<{
    work_email?: string;
    job_title?: {
      role_name?: string;
    };
  }>;
}

export default function UsersAndPermissionsPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Define role bins
  const roleBins: RoleBin[] = [
    {
      id: 'unassigned',
      name: 'Unassigned',
      icon: <UserX className="w-5 h-5" />,
      color: 'bg-gray-100 dark:bg-gray-800',
      users: []
    },
    {
      id: 'admin',
      name: 'Admin',
      icon: <Shield className="w-5 h-5" />,
      color: 'bg-red-100 dark:bg-red-900/20',
      users: []
    },
    {
      id: 'manager',
      name: 'Manager',
      icon: <UserCog className="w-5 h-5" />,
      color: 'bg-blue-100 dark:bg-blue-900/20',
      users: []
    },
    {
      id: 'project_manager',
      name: 'Project Manager',
      icon: <UserCheck className="w-5 h-5" />,
      color: 'bg-purple-100 dark:bg-purple-900/20',
      users: []
    },
    {
      id: 'production',
      name: 'Production',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-green-100 dark:bg-green-900/20',
      users: []
    },
    {
      id: 'contractor',
      name: 'Contractor',
      icon: <UserPlus className="w-5 h-5" />,
      color: 'bg-yellow-100 dark:bg-yellow-900/20',
      users: []
    }
  ];

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);

        // Get current session once and reuse it
        const { data: { session } } = await supabase.auth.getSession();
        
        // Only log session state in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Frontend: Session state:', {
            hasSession: !!session,
            userId: session?.user?.id,
            role: session?.user?.app_metadata?.role
          });
        }

        // Fetch both auth users and employees
        const [usersResponse, employeesResponse] = await Promise.all([
          // Fetch users from our new API endpoint
          fetch('/api/admin/users', {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          }).then(async (res) => {
            if (!res.ok) {
              const errorData = await res.json();
              throw new Error(errorData.error || 'Failed to fetch users');
            }
            return res.json();
          }),

          // Fetch employees with their current employment details
          supabase
            .from('employees')
            .select(`
              *,
              employment_details!inner (
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
            `)
            .order('first_name')
        ]);

        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.log('Frontend: Successfully fetched users:', { 
            count: usersResponse.users?.length 
          });
        }

        if (usersResponse.error) {
          console.error('Error fetching auth users:', usersResponse.error);
          throw usersResponse.error;
        }

        if (employeesResponse.error) {
          console.error('Error fetching employees:', employeesResponse.error);
          throw employeesResponse.error;
        }

        // Process auth users
        const processedUsers = usersResponse.users.map((user: AuthUser): User => {
          // Get the role from app_metadata, defaulting to 'admin' if not set
          const role = user.app_metadata?.role || 'admin';
          
          return {
            id: user.id,
            email: user.email || '', // Provide default empty string
            full_name: user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : ''),
            role: role,
            status: user.banned_at ? 'inactive' : 'active',
            type: 'employee', // Default to employee, will be updated if found in employees list
            avatar_url: user.user_metadata?.avatar_url,
            last_sign_in_at: user.last_sign_in_at,
            created_at: user.created_at,
            raw_app_meta_data: user.app_metadata || {},
            raw_user_meta_data: user.user_metadata || {}
          };
        });

        console.log('Processed auth users:', processedUsers);

        // Process employees and merge with auth users
        const processedEmployees: User[] = (employeesResponse.data as Employee[]).map(employee => {
          // Get the most recent employment detail
          const currentEmployment = employee.employment_details?.[0];
          
          // Find matching auth user if exists by comparing both email and work_email
          const matchingAuthUser = processedUsers.find((u: User) => 
            u.email === employee.email || 
            (currentEmployment?.work_email && u.email === currentEmployment.work_email)
          );
          
          return {
            id: matchingAuthUser?.id || `emp_${employee.employee_id}`,
            email: employee.email,
            full_name: `${employee.first_name} ${employee.last_name}`,
            role: matchingAuthUser?.role || 'unassigned',
            status: matchingAuthUser?.status || 'active',
            type: 'employee',
            avatar_url: employee.photo_url || matchingAuthUser?.avatar_url,
            last_sign_in_at: matchingAuthUser?.last_sign_in_at,
            created_at: matchingAuthUser?.created_at || employee.created_at,
            employee_id: employee.employee_id,
            work_email: currentEmployment?.work_email,
            job_title: currentEmployment?.job_title?.role_name,
            raw_app_meta_data: matchingAuthUser?.raw_app_meta_data || {},
            raw_user_meta_data: matchingAuthUser?.raw_user_meta_data || {}
          };
        });

        // Combine and deduplicate users
        const allUsers = [...processedUsers];
        
        // Add employees that don't have matching auth users
        processedEmployees.forEach((employee: User) => {
          const hasMatchingAuthUser = processedUsers.some((u: User) => 
            u.email === employee.email || 
            (employee.work_email && u.email === employee.work_email)
          );
          
          if (!hasMatchingAuthUser) {
            allUsers.push(employee);
          }
        });

        console.log('Final combined users list:', allUsers);
        setUsers(allUsers);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Categorize users into bins
  const categorizedBins = roleBins.map(bin => ({
    ...bin,
    users: filteredUsers.filter(user => user.role === bin.id)
  }));

  // Add function to check if user exists in Supabase
  async function checkUserExists(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('check_user_exists', {
          user_id: userId
        });

      if (error) {
        console.error('Error checking user existence:', error);
        throw error;
      }

      return Boolean(data);
    } catch (err) {
      console.error('Error checking user existence:', err);
      throw err;
    }
  }

  // Add function to create user in Supabase
  async function createUserInSupabase(user: User, role: string): Promise<string> {
    try {
      // Generate a more secure random password
      const generateSecurePassword = () => {
        const length = 12;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * charset.length);
          password += charset[randomIndex];
        }
        return password;
      };

      const tempPassword = generateSecurePassword();
      
      console.log('Creating user with:', {
        email: user.work_email || user.email,
        role,
        metadata: {
          full_name: user.full_name,
          employee_id: user.employee_id,
          type: user.type
        }
      });

      const { data, error } = await supabase
        .rpc('create_user', {
          email: user.work_email || user.email,
          password: tempPassword,
          role: role,
          metadata: {
            full_name: user.full_name,
            employee_id: user.employee_id,
            type: user.type
          }
        });

      if (error) {
        console.error('Error creating user:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      if (typeof data !== 'string') {
        throw new Error('Invalid user ID returned from create_user');
      }

      // Show a toast notification with the temporary password
      toast({
        title: "User Created Successfully",
        description: (
          <div className="mt-2">
            <p>A temporary password has been generated for {user.full_name}:</p>
            <div className="mt-2 relative">
              <input
                type="text"
                value={tempPassword}
                readOnly
                className="w-full p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-sm pr-20 select-all"
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tempPassword);
                  toast({
                    title: "Copied!",
                    description: "Password copied to clipboard",
                    duration: 2000,
                  });
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded transition-colors"
              >
                Copy
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Please share this password with the user securely. They should change it upon first login.
            </p>
          </div>
        ),
        duration: 10000, // Show for 10 seconds
      });

      return data;
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  }

  // Update the updateUserRole function to handle both creation and updates
  async function updateUserRole(userId: string, newRole: string): Promise<void> {
    try {
      setError(null);
      
      // Check if this is an employee ID (starts with 'emp_')
      const isEmployeeId = userId.startsWith('emp_');
      
      // If it's an employee ID, we need to create the user in Supabase
      if (isEmployeeId) {
        // Find the user in our local state
        const user = users.find((u: User) => u.id === userId);
        if (!user) {
          throw new Error('User not found in local state');
        }

        // Create the user in Supabase
        const newUserId = await createUserInSupabase(user, newRole);

        // Update local state with the new Supabase user ID
        setUsers((prevUsers: User[]) => 
          prevUsers.map((u: User) => 
            u.id === userId 
              ? { ...u, id: newUserId, role: newRole }
              : u
          )
        );
        return;
      }

      // For existing Supabase users, check if they exist
      const userExists = await checkUserExists(userId);
      
      if (!userExists) {
        // If user doesn't exist, find them in our local state and create them
        const user = users.find((u: User) => u.id === userId);
        if (!user) {
          throw new Error('User not found in local state');
        }

        // Create the user in Supabase
        const newUserId = await createUserInSupabase(user, newRole);

        // Update local state with the new Supabase user ID
        setUsers((prevUsers: User[]) => 
          prevUsers.map((u: User) => 
            u.id === userId 
              ? { ...u, id: newUserId, role: newRole }
              : u
          )
        );
        return;
      }

      // User exists, update their role
      const { error } = await supabase
        .rpc('update_user_role', {
          user_id: userId,
          new_role: newRole
        });

      if (error) {
        console.error('Error updating user role:', error);
        throw error;
      }

      // Update local state
      setUsers((prevUsers: User[]) => 
        prevUsers.map((user: User) => 
          user.id === userId 
            ? { ...user, role: newRole }
            : user
        )
      );
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role');
    }
  }

  // Add function to handle role change
  async function handleRoleChange(userId: string, newRole: string) {
    if (!confirm('Are you sure you want to change this user\'s role?')) {
      return;
    }
    await updateUserRole(userId, newRole);
  }

  // Add drag event handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, user: User) => {
    e.dataTransfer.setData('application/json', JSON.stringify(user));
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const target = e.currentTarget;
    target.classList.add('bg-white');
    target.classList.add('dark:bg-black');
    target.classList.add('bg-opacity-80');
    target.classList.add('dark:bg-opacity-40');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.classList.remove('bg-white');
    target.classList.remove('dark:bg-black');
    target.classList.remove('bg-opacity-80');
    target.classList.remove('dark:bg-opacity-40');
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetRole: string) => {
    e.preventDefault();
    const target = e.currentTarget;
    target.classList.remove('bg-white');
    target.classList.remove('dark:bg-black');
    target.classList.remove('bg-opacity-80');
    target.classList.remove('dark:bg-opacity-40');

    try {
      const userData = e.dataTransfer.getData('application/json');
      const draggedUser = JSON.parse(userData) as User;

      if (draggedUser.role !== targetRole) {
        await updateUserRole(draggedUser.id, targetRole);
      }
    } catch (err) {
      console.error('Error handling drop:', err);
      setError('Failed to update user role');
    }
  };

  if (!isAdmin()) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 pt-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6" />
          <h1 className="text-h2 font-bold">Users & Permissions</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Input
              type="search"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            <Users className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-destructive/10 text-destructive rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorizedBins.map(bin => (
          <Card 
            key={bin.id} 
            className={`${bin.color} border-0`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, bin.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {bin.icon}
                  <CardTitle className="text-lg">{bin.name}</CardTitle>
                </div>
                <Badge variant="secondary">{bin.users.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {bin.users.map(user => (
                    <div
                      key={user.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, user)}
                      onDragEnd={handleDragEnd}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors cursor-move"
                    >
                      <Avatar>
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>
                          {user.full_name?.split(' ').map(n => n[0]).join('') || user.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{user.full_name}</p>
                          <Badge variant="secondary">
                            {user.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {user.work_email || user.email}
                        </p>
                      </div>
                    </div>
                  ))}
                  {bin.users.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No users in this category
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 