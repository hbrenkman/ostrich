'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, ArrowUpRight, ArrowDownRight, DollarSign, Clock, Target } from 'lucide-react'; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';

export default function ProjectPerformance() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'production') {
      router.push('/dashboard');
    }
  }, [user, router]);
  const metrics = [
    {
      title: "Project Revenue",
      value: "$845,000",
      change: "+15.3%",
      trend: "up",
      description: "vs. last quarter"
    },
    {
      title: "Active Projects",
      value: "12",
      change: "+2",
      trend: "up",
      description: "vs. last month"
    },
    {
      title: "Average Project Duration",
      value: "4.2 mo",
      change: "-0.8 mo",
      trend: "down",
      description: "vs. target (5 mo)"
    },
    {
      title: "Project Success Rate",
      value: "92%",
      change: "+4%",
      trend: "up",
      description: "vs. last quarter"
    }
  ];

  const projectMetrics = [
    {
      name: "Website Redesign",
      budget: 150000,
      spent: 98000,
      progress: 65,
      status: "On Track"
    },
    {
      name: "Mobile App Development",
      budget: 280000,
      spent: 112000,
      progress: 40,
      status: "At Risk"
    },
    {
      name: "Database Migration",
      budget: 95000,
      spent: 85500,
      progress: 90,
      status: "On Track"
    }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-6 h-6" />
        <h1 className="text-2xl font-semibold">Project Performance</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className={`flex items-center text-sm ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 mr-1" />
                  )}
                  {metric.change}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Budget Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {projectMetrics.map((project) => {
                const percentageSpent = (project.spent / project.budget) * 100;
                return (
                  <div key={project.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{project.name}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === 'On Track' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Budget: {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(project.budget)}</span>
                      <span>Spent: {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(project.spent)}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          percentageSpent > 90 ? 'bg-red-500' : 
                          percentageSpent > 75 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${percentageSpent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Project Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {projectMetrics.map((project) => (
                <div key={project.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{project.name}</span>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <Target className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{project.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Project Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium">Planning</div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium">Design</div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '80%' }} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium">Development</div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium">Testing</div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '30%' }} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium">Deployment</div>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '10%' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}