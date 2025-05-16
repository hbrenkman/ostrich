"use client";

import React from 'react';
import { useState, useCallback } from 'react';
import { LayoutDashboard, FolderKanban, DollarSign, ChevronRight, Clock, Target, Plus } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Project {
  id: string;
  number: string;
  name: string;
  client: string;
  status: 'Pending' | 'Design' | 'Construction';
  fees: {
    design: {
      total: number;
      invoiced: number;
    };
    construction: {
      total: number;
      invoiced: number;
    };
  };
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      number: 'PRJ-001', 
      name: 'Website Redesign',
      client: 'Acme Corporation',
      status: 'Pending',
      fees: {
        design: {
          total: 25000,
          invoiced: 0
        },
        construction: {
          total: 15000,
          invoiced: 0
        }
      }
    },
    {
      id: '2',
      number: 'PRJ-002',
      name: 'Mobile App Development',
      client: 'Stellar Solutions',
      status: 'Design',
      fees: {
        design: {
          total: 35000,
          invoiced: 15000
        },
        construction: {
          total: 20000,
          invoiced: 0
        }
      }
    },
    {
      id: '3',
      number: 'PRJ-003',
      name: 'Database Migration',
      client: 'Global Dynamics',
      status: 'Construction',
      fees: {
        design: {
          total: 45000,
          invoiced: 45000
        },
        construction: {
          total: 30000,
          invoiced: 15000
        }
      }
    },
    {
      id: '4',
      number: 'PRJ-004',
      name: 'Cloud Infrastructure Migration',
      client: 'TechCorp',
      status: 'Pending',
      fees: {
        design: { total: 55000, invoiced: 0 },
        construction: { total: 45000, invoiced: 0 }
      }
    },
    {
      id: '5',
      number: 'PRJ-005',
      name: 'Security System Upgrade',
      client: 'SecureNet',
      status: 'Pending',
      fees: {
        design: { total: 30000, invoiced: 0 },
        construction: { total: 25000, invoiced: 0 }
      }
    },
    {
      id: '6',
      number: 'PRJ-006',
      name: 'Data Center Expansion',
      client: 'DataFlow Inc',
      status: 'Design',
      fees: {
        design: { total: 75000, invoiced: 35000 },
        construction: { total: 120000, invoiced: 0 }
      }
    },
    {
      id: '7',
      number: 'PRJ-007',
      name: 'Network Infrastructure',
      client: 'ConnectCo',
      status: 'Design',
      fees: {
        design: { total: 45000, invoiced: 20000 },
        construction: { total: 65000, invoiced: 0 }
      }
    },
    {
      id: '8',
      number: 'PRJ-008',
      name: 'AI Integration Platform',
      client: 'SmartSys',
      status: 'Construction',
      fees: {
        design: { total: 85000, invoiced: 85000 },
        construction: { total: 150000, invoiced: 75000 }
      }
    },
    {
      id: '9',
      number: 'PRJ-009',
      name: 'IoT Sensor Network',
      client: 'SensorTech',
      status: 'Pending',
      fees: {
        design: { total: 40000, invoiced: 0 },
        construction: { total: 60000, invoiced: 0 }
      }
    },
    {
      id: '10',
      number: 'PRJ-010',
      name: 'Blockchain Platform',
      client: 'ChainWorks',
      status: 'Design',
      fees: {
        design: { total: 95000, invoiced: 45000 },
        construction: { total: 130000, invoiced: 0 }
      }
    },
    {
      id: '11',
      number: 'PRJ-011',
      name: 'Edge Computing Setup',
      client: 'EdgeTech',
      status: 'Construction',
      fees: {
        design: { total: 65000, invoiced: 65000 },
        construction: { total: 85000, invoiced: 40000 }
      }
    },
    {
      id: '12',
      number: 'PRJ-012',
      name: 'DevOps Pipeline',
      client: 'DevCorp',
      status: 'Pending',
      fees: {
        design: { total: 35000, invoiced: 0 },
        construction: { total: 45000, invoiced: 0 }
      }
    },
    {
      id: '13',
      number: 'PRJ-013',
      name: 'Machine Learning System',
      client: 'MLSolutions',
      status: 'Design',
      fees: {
        design: { total: 110000, invoiced: 55000 },
        construction: { total: 180000, invoiced: 0 }
      }
    },
    {
      id: '14',
      number: 'PRJ-014',
      name: 'Quantum Computing Lab',
      client: 'QuantumTech',
      status: 'Construction',
      fees: {
        design: { total: 150000, invoiced: 150000 },
        construction: { total: 250000, invoiced: 125000 }
      }
    }
  ]);

  const pendingProjects = projects.filter(p => p.status === 'Pending');
  const designProjects = projects.filter(p => p.status === 'Design');
  const constructionProjects = projects.filter(p => p.status === 'Construction');

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, project: Project) => {
    e.dataTransfer.setData('application/json', JSON.stringify(project));
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-primary/5');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('bg-primary/5');
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, newStatus: Project['status']) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-primary/5');

    const projectData = e.dataTransfer.getData('application/json');
    const draggedProject = JSON.parse(projectData) as Project;

    if (draggedProject.status !== newStatus) {
      setProjects(prev => prev.map(p => 
        p.id === draggedProject.id 
          ? { ...p, status: newStatus }
          : p
      ));
    }
  }, []);

  const calculateStats = (projects: Project[]) => {
    return projects.reduce((acc, project) => ({
      totalProjects: acc.totalProjects + 1,
      totalDesignFees: acc.totalDesignFees + project.fees.design.total,
      designFeesInvoiced: acc.designFeesInvoiced + project.fees.design.invoiced,
      totalConstructionFees: acc.totalConstructionFees + project.fees.construction.total,
      constructionFeesInvoiced: acc.constructionFeesInvoiced + project.fees.construction.invoiced,
      uninvoicedAmount: acc.uninvoicedAmount + 
        (project.fees.design.total - project.fees.design.invoiced) +
        (project.fees.construction.total - project.fees.construction.invoiced)
    }), {
      totalProjects: 0,
      totalDesignFees: 0,
      designFeesInvoiced: 0,
      totalConstructionFees: 0,
      constructionFeesInvoiced: 0,
      uninvoicedAmount: 0
    });
  };

  const pendingStats = calculateStats(pendingProjects);
  const designStats = calculateStats(designProjects);
  const constructionStats = calculateStats(constructionProjects);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const StatusIndicator = ({ active }: { active: boolean }) => (
    <div className={`w-3 h-3 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`} />
  );

  const ProjectList = ({ title, projects, status }: { title: string; projects: Project[]; status: Project['status'] }) => (
    <Card
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, status)}
    >
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Number</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Client</th>
                <th className="text-center py-3 px-4">Retainer</th>
                <th className="text-center py-3 px-4">Signed</th>
                <th className="text-right py-3 px-4">Design Fee</th>
                <th className="text-right py-3 px-4">Construction Fee</th>
                <th className="text-right py-3 px-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-move"
                  draggable
                  onDragStart={(e) => handleDragStart(e, project)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => {
                    // Only navigate if not dragging
                    if (!e.currentTarget.classList.contains('opacity-50')) {
                      window.location.href = `/projects/${project.number}`;
                    }
                  }}
                >
                  <td className="py-3 px-4 font-medium">{project.number}</td>
                  <td className="py-3 px-4">{project.name}</td>
                  <td className="py-3 px-4">{project.client}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center">
                      <StatusIndicator active={false} />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center">
                      <StatusIndicator active={false} />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {formatCurrency(project.fees.design.total)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {formatCurrency(project.fees.construction.total)}
                  </td>
                  <td className="py-3 px-4 text-right text-gray-500">
                    -
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {projects.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No projects in this category
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-6 h-6" />
          <h1 className="text-2xl font-semibold">Dashboard</h1>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Projects Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Projects ({pendingStats.totalProjects})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500">Design Fees</div>
                <div className="text-lg font-bold text-primary">{formatCurrency(pendingStats.totalDesignFees)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Construction Fees</div>
                <div className="text-lg font-bold text-secondary">{formatCurrency(pendingStats.totalConstructionFees)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Design Projects Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Design Phase ({designStats.totalProjects})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500">Design Fees</div>
                <div className="text-lg font-bold text-primary">{formatCurrency(designStats.totalDesignFees)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Not Invoiced</div>
                <div className="text-lg font-bold" style={{ color: '#3B82F6' }}>
                  {formatCurrency(designStats.totalDesignFees - designStats.designFeesInvoiced)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Construction Projects Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Construction Phase ({constructionStats.totalProjects})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500">Construction Fees</div>
                <div className="text-lg font-bold" style={{ color: '#2C7A7B' }}>{formatCurrency(constructionStats.totalConstructionFees)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Not Invoiced</div>
                <div className="text-lg font-bold" style={{ color: '#3B82F6' }}>
                  {formatCurrency(constructionStats.totalConstructionFees - constructionStats.constructionFeesInvoiced)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <ProjectList 
          key="pending"
          title="Pending Projects" 
          projects={pendingProjects} 
          status="Pending" 
        />
        <ProjectList 
          key="design"
          title="Design Projects" 
          projects={designProjects} 
          status="Design" 
        />
        <ProjectList 
          key="construction"
          title="Construction Projects" 
          projects={constructionProjects} 
          status="Construction" 
        />
      </div>
    </div>
  );
}