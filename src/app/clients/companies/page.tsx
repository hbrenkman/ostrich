'use client';

import { Building2, Search, Plus, ChevronRight, ChevronDown, MapPin, Phone, Pencil } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';
import { useRouter } from 'next/navigation';

type Industry = Database['public']['Tables']['industries']['Row'];
type Company = Database['public']['Tables']['companies']['Row'];

interface Location {
  id: string;
  name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  status: string;
  is_headquarters: boolean;
  location_type_id: string;
}

interface CompanyWithRelations extends Company {
  locations?: Location[];
  industry?: Industry;
}

export default function Companies() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [companies, setCompanies] = useState<CompanyWithRelations[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;
  const [isNewCompanyDialogOpen, setIsNewCompanyDialogOpen] = useState(false);
  const [newCompany, setNewCompany] = useState<Partial<Company>>({
    name: '',
    industry_id: '',
    status: 'Active'
  });
  const [expandedCompanies, setExpandedCompanies] = useState<Set<number>>(new Set());
  const router = useRouter();

  // Single auth check on mount
  useEffect(() => {
    if (authLoading) return; // Wait for auth to initialize

    if (!user) {
      console.log('No user found, redirecting to login');
      router.push('/auth/login');
      return;
    }
    
    if (!isAdmin()) {
      console.log('User is not admin, redirecting to dashboard');
      router.push('/dashboard');
      return;
    }
  }, [user, router, isAdmin, authLoading]);

  // Show loading state while checking permissions
  if (authLoading || !user || !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const canCreateCompany = true; // Since we already check isAdmin above

  const columns = [
    {
      header: 'Name',
      accessor: (company: CompanyWithRelations) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span>{company.name}</span>
        </div>
      )
    },
    {
      header: 'Industry',
      accessor: (company: CompanyWithRelations) => company.industry?.name || 'N/A'
    },
    {
      header: 'Status',
      accessor: (company: CompanyWithRelations) => (
        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(company.status)}`}>
          {company.status}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (company: CompanyWithRelations) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCompanyClick(company);
          }}
          className="p-1 hover:bg-muted/20 rounded-full"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )
    }
  ];

  // Only fetch data when we have a user and they are an admin
  useEffect(() => {
    let mounted = true;

    const fetchDataIfNeeded = async () => {
      if (!user || !isAdmin()) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if we have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw new Error(`Session error: ${sessionError.message}`);
        }
        
        if (!session) {
          console.error('No valid session found');
          throw new Error('No valid session found. Please log in again.');
        }

        // Fetch industries from the industries table
        const { data: industriesData, error: industriesError } = await supabase
          .from('industries')
          .select('*')
          .order('name');

        if (industriesError) {
          console.error('Error fetching industries:', industriesError);
          throw new Error(`Failed to fetch industries: ${industriesError.message}`);
        }

        if (mounted) {
          setIndustries(industriesData || []);
        }

        // Fetch companies with their industries and locations
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select(`
            *,
            industry:industries(*),
            locations(
              id,
              name,
              address_line1,
              address_line2,
              city,
              state,
              zip,
              phone,
              status,
              location_type_id,
              is_headquarters
            )
          `)
          .order('name', { ascending: true });

        if (companiesError) {
          console.error('Error fetching companies:', companiesError);
          throw new Error(`Failed to fetch companies: ${companiesError.message}`);
        }

        if (mounted) {
          setCompanies(companiesData || []);
        }
      } catch (err: any) {
        console.error('Error in fetchData:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load data');
          if (err.message.includes('session')) {
            router.push('/auth/login');
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchDataIfNeeded();

    // Add a focus event listener to refresh data when returning to the page
    const handleFocus = () => {
      fetchDataIfNeeded();
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      mounted = false;
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, isAdmin, router]);

  const filteredCompanies = companies.filter(company => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase().trim();
    
    return (
      (company?.name?.toLowerCase()?.includes(search) ?? false) ||
      (company?.industry?.name?.toLowerCase()?.includes(search) ?? false) ||
      (company?.status?.toLowerCase()?.includes(search) ?? false)
    );
  });

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-primary text-primary-foreground';
      case 'Pending':
        return 'bg-secondary text-secondary-foreground';
      case 'Inactive':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const handleAddCompany = async () => {
    if (!newCompany.name || !newCompany.industry_id) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .insert([{
          name: newCompany.name,
          industry_id: newCompany.industry_id,
          status: newCompany.status
        }])
        .select()
        .single();

      if (error) throw error;

      // Fetch the industry data for the new company
      const { data: industryData } = await supabase
        .from('industries')
        .select('*')
        .eq('id', newCompany.industry_id)
        .single();

      const newCompanyWithIndustry = {
        ...data,
        industry: industryData
      };

      setCompanies([...companies, newCompanyWithIndustry]);
      setIsNewCompanyDialogOpen(false);
      setNewCompany({
        name: '',
        industry_id: '',
        status: 'Active'
      });
    } catch (err) {
      console.error('Error adding company:', err);
      setError('Failed to add company');
    }
  };

  const handleCompanyClick = (company: CompanyWithRelations) => {
    router.push(`/clients/companies/${company.id}/edit`);
  };

  const toggleRow = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpandedRows = new Set(expandedCompanies);
    if (expandedCompanies.has(index)) {
      newExpandedRows.delete(index);
    } else {
      newExpandedRows.add(index);
    }
    setExpandedCompanies(newExpandedRows);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Companies</h1>
        {canCreateCompany && (
          <button
            onClick={() => setIsNewCompanyDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-xs"
          >
            <Plus className="h-4 w-4" />
            Add Company
          </button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-2 py-1 border rounded-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={paginatedCompanies}
            expandedContent={(company: CompanyWithRelations) => (
              <div className="p-4 space-y-4">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  {company.locations?.length || 0} Location{company.locations?.length !== 1 ? 's' : ''}
                </div>
                {company.locations?.map((location) => (
                  <div key={location.id} className="flex items-start gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {location.name || 'Unnamed Location'}
                          {location.is_headquarters && (
                            <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">
                              HQ
                            </span>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${location.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {location.status}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1.5">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <div>{location.address_line1}</div>
                            {location.address_line2 && <div>{location.address_line2}</div>}
                            <div>{location.city}, {location.state} {location.zip}</div>
                          </div>
                        </div>
                        {location.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{location.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {(!company.locations || company.locations.length === 0) && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No locations found for this company
                  </div>
                )}
              </div>
            )}
            expandedRows={expandedCompanies}
            onExpandRow={toggleRow}
          />
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredCompanies.length}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isNewCompanyDialogOpen} onOpenChange={setIsNewCompanyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Company</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name">Company Name</label>
              <input
                id="name"
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                className="px-3 py-2 border rounded-md"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="industry">Industry</label>
              <select
                id="industry"
                value={newCompany.industry_id || ''}
                onChange={(e) => setNewCompany({ ...newCompany, industry_id: e.target.value })}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">Select Industry</option>
                {industries.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={newCompany.status}
                onChange={(e) => setNewCompany({ ...newCompany, status: e.target.value })}
                className="px-3 py-2 border rounded-md"
              >
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsNewCompanyDialogOpen(false)}
              className="px-4 py-2 border rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCompany}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Add Company
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}