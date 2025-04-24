"use client";

import { notFound } from 'next/navigation';
import { DollarSign, Building2, Calendar, Clock, Download, Send, ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const generateInvoice = (id: string): Invoice | null => {
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

  const numericId = parseInt(id);
  if (isNaN(numericId) || numericId < 1 || numericId > 250) {
    return null;
  }

  const baseInvoice = baseInvoices[(numericId - 1) % baseInvoices.length];
  return {
    ...baseInvoice,
    id,
    number: `INV-${String(numericId).padStart(3, '0')}`,
    date: new Date(2024, 0, numericId).toISOString().split('T')[0],
    dueDate: new Date(2024, 0, numericId + 30).toISOString().split('T')[0],
  };
};

export default function InvoiceDetail({ params }: { params: { id: string } }) {
  const invoice = generateInvoice(params.id);

  if (!invoice) {
    notFound();
  }

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

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}/pdf`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(`Failed to download PDF: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/financials/invoicing"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Invoices</span>
          </Link>
          <h1 className="text-2xl font-semibold">Invoice {invoice.number}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/financials/invoicing/${params.id}/print`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-md hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </Link>
          <button 
            onClick={handleDownloadPDF}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-md hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            <Send className="w-4 h-4" />
            <span>Send to Client</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Status</div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
            </div>
            <div>
              <div className="text-sm text-gray-500">Amount</div>
              <div className="flex items-center gap-2 mt-1">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="font-semibold">{formatCurrency(invoice.amount)}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Invoice Date</div>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{formatDate(invoice.date)}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Due Date</div>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>{formatDate(invoice.dueDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Company</div>
              <div className="flex items-center gap-2 mt-1">
                <Building2 className="w-4 h-4 text-gray-500" />
                <span>{invoice.company}</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Contact Person</div>
              <span className="block mt-1">{invoice.contact}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-500">Project Name</div>
              <span className="block mt-1">{invoice.project}</span>
            </div>
            <div>
              <div className="text-sm text-gray-500">Description</div>
              <span className="block mt-1">{invoice.description}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}