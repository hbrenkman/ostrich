"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Search, BarChart, PieChart, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';

interface RevenueMetric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  description: string;
}

interface RevenueByProject {
  project: string;
  revenue: number;
  previousRevenue: number;
  change: number;
}

interface RevenueByType {
  type: string;
  amount: number;
  percentage: number;
}

export default function Revenue() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const router = useRouter();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  const metrics: RevenueMetric[] = [
    {
      title: "Total Revenue",
      value: "$845,000",
      change: "+15.3%",
      trend: "up",
      description: "vs. last month"
    },
    {
      title: "Average Project Value",
      value: "$42,250",
      change: "+8.7%",
      trend: "up",
      description: "vs. last quarter"
    },
    {
      title: "Revenue per Employee",
      value: "$35,208",
      change: "-2.4%",
      trend: "down",
      description: "vs. target ($36,000)"
    },
    {
      title: "Projected Annual",
      value: "$10.14M",
      change: "+12.5%",
      trend: "up",
      description: "vs. last year"
    }
  ];

  const revenueByProject: RevenueByProject[] = [
    {
      project: "Website Redesign",
      revenue: 250000,
      previousRevenue: 200000,
      change: 25
    },
    {
      project: "Mobile App Development",
      revenue: 180000,
      previousRevenue: 150000,
      change: 20
    },
    {
      project: "Database Migration",
      revenue: 120000,
      previousRevenue: 140000,
      change: -14.3
    }
  ];

  const revenueByType: RevenueByType[] = [
    {
      type: "Development",
      amount: 450000,
      percentage: 53.3
    },
    {
      type: "Infrastructure",
      amount: 250000,
      percentage: 29.6
    },
    {
      type: "Consulting",
      amount: 145000,
      percentage: 17.1
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          <h1 className="text-2xl font-semibold">Revenue</h1>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Revenue by Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {revenueByProject.map((project) => (
                <div key={project.project} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{project.project}</span>
                    <div className={`flex items-center text-sm ${
                      project.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {project.change >= 0 ? (
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 mr-1" />
                      )}
                      {Math.abs(project.change)}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Revenue: {formatCurrency(project.revenue)}</span>
                    <span>Previous: {formatCurrency(project.previousRevenue)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        project.change >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(project.revenue / 250000) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Revenue by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {revenueByType.map((type) => (
                <div key={type.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{type.type}</span>
                    <span className="text-sm font-medium">{formatCurrency(type.amount)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${type.percentage}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    {type.percentage}% of total revenue
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Revenue Trends</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full" />
                <span className="text-sm">This Period</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-300 rounded-full" />
                <span className="text-sm">Previous Period</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-end justify-between gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end gap-1">
                  <div 
                    className="flex-1 bg-primary rounded-t"
                    style={{ height: `${Math.random() * 200 + 50}px` }}
                  />
                  <div 
                    className="flex-1 bg-gray-300 rounded-t"
                    style={{ height: `${Math.random() * 200 + 50}px` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(2024, i).toLocaleString('default', { month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}