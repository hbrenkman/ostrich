"use client";

import { useState } from 'react';
import { DollarSign, Search, Plus, FileText, Calendar, Clock, Building2, MoreVertical, Download, Send } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';

interface Invoice {
  id: string;
  number: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  description: string;
  project: string;
  company: string;
  contact: string;
}

export default function Invoicing() {
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const generateInvoices = () => {
    const baseInvoices = [
      {
        id: '1',
        number: 'INV-001',
        date: '2024-03-01',
        dueDate: '2024-03-31',
        amount: 25000,
        status: 'Paid',
        description: 'Website Design Phase',
        project: 'Website Redesign',
        company: 'Acme Corporation',
        contact: 'John Smith'
      },
      {
        id: '2',
        number: 'INV-002',
        date: '2024-03-15',
        dueDate: '2024-04-14',
        amount: 15000,
        status: 'Sent',
        description: 'Development Sprint 1',
        project: 'Mobile App Development',
        company: 'Stellar Solutions',
        contact: 'Sarah Johnson'
      }
    ];

    return Array.from({ length: 250 }, (_, index) => {
      const baseInvoice = baseInvoices[index % baseInvoices.length];
      return {
        ...baseInvoice,
        id: `${index + 1}`,
        number: `INV-${String(index + 1).padStart(3, '0')}`,
        date: new Date(2024, 0, index + 1).toISOString().split('T')[0],
        dueDate: new Date(2024, 0, index + 31).toISOString().split('T')[0],
      };
    });
  };

  const invoices = generateInvoices();

  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    currentItems: paginatedInvoices,
    totalPages,
    totalItems
  } = usePagination({
    items: invoices,
    itemsPerPage: 100
  });

  const getStatusColor = (status: Invoice['status']) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Sent':
        return 'bg-blue-100 text-blue-800';
      case 'Draft':
        return 'bg-gray-100 text-gray-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          <h1 className="text-2xl font-semibold">Invoicing</h1>
        </div>
        <Link
          href="/financials/invoicing/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Invoice</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(40000)}</div>
            <p className="text-sm text-gray-500 mt-1">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Paid This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(25000)}</div>
            <p className="text-sm text-gray-500 mt-1">March 2024</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Due This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{formatCurrency(15000)}</div>
            <p className="text-sm text-gray-500 mt-1">March 2024</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{formatCurrency(0)}</div>
            <p className="text-sm text-gray-500 mt-1">0 invoices</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">All Invoices</CardTitle>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
              <input
                type="text"
                placeholder="Search invoices..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Invoice</th>
                  <th className="text-left py-3 px-4">Project</th>
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Due Date</th>
                  <th className="text-left py-3 px-4">Amount</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{invoice.number}</span>
                        </div>
                        <div className="text-sm text-gray-500">{invoice.company}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">{invoice.project}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{formatDate(invoice.date)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{formatDate(invoice.dueDate)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span>{formatCurrency(invoice.amount)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/financials/invoicing/${invoice.id}`}
                              className="flex items-center gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              <span>View Invoice</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Download className="w-4 h-4" />
                            <span>Download PDF</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2">
                            <Send className="w-4 h-4" />
                            <span>Send to Client</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={totalItems}
          />
        </CardContent>
      </Card>
    </div>
  );
}