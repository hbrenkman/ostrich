"use client";

import { notFound } from 'next/navigation';
import { Bird, Printer, Download } from 'lucide-react';

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

export default function PrintInvoice({ params }: { params: { id: string } }) {
  const invoice = generateInvoice(params.id);

  if (!invoice) {
    notFound();
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
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
    <>
      {/* Action buttons - hidden when printing */}
      <div className="fixed top-4 right-4 flex gap-2 print:hidden">
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Printer className="w-4 h-4" />
          <span>Print</span>
        </button>
        <button
          onClick={handleDownloadPDF}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </button>
      </div>

      {/* Invoice content */}
      <div className="min-h-[11in] w-[8.5in] mx-auto bg-white p-[1in] print:p-[1in] print:shadow-none">
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Bird className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold text-primary">Ostrich</span>
            </div>
            <div className="text-gray-600">
              <p>123 Business Street</p>
              <p>Suite 100</p>
              <p>San Francisco, CA 94105</p>
              <p>United States</p>
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">INVOICE</h1>
            <p className="text-gray-600">{invoice.number}</p>
          </div>
        </div>

        {/* Bill To / Ship To */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Bill To:</h2>
            <div className="text-gray-600">
              <p className="font-medium">{invoice.company}</p>
              <p>Attn: {invoice.contact}</p>
              <p>456 Client Avenue</p>
              <p>New York, NY 10001</p>
              <p>United States</p>
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-3">Invoice Details:</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Invoice Date:</span>
                <span className="font-medium">{formatDate(invoice.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">{formatDate(invoice.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Project:</span>
                <span className="font-medium">{invoice.project}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium">{invoice.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="mb-12">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 text-gray-700">Description</th>
                <th className="text-right py-3 text-gray-700 w-32">Hours</th>
                <th className="text-right py-3 text-gray-700 w-32">Rate</th>
                <th className="text-right py-3 text-gray-700 w-32">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-4">
                  <div className="font-medium">{invoice.description}</div>
                  <div className="text-gray-600 text-sm mt-1">
                    Professional services as outlined in the project scope
                  </div>
                </td>
                <td className="py-4 text-right">125</td>
                <td className="py-4 text-right">{formatCurrency(200)}</td>
                <td className="py-4 text-right">{formatCurrency(25000)}</td>
              </tr>
              <tr>
                <td className="py-4">
                  <div className="font-medium">Additional Services</div>
                  <div className="text-gray-600 text-sm mt-1">
                    Consulting and technical support
                  </div>
                </td>
                <td className="py-4 text-right">40</td>
                <td className="py-4 text-right">{formatCurrency(150)}</td>
                <td className="py-4 text-right">{formatCurrency(6000)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan={3} className="py-4 text-right font-semibold">Subtotal:</td>
                <td className="py-4 text-right font-bold">{formatCurrency(31000)}</td>
              </tr>
              <tr>
                <td colSpan={3} className="py-2 text-right font-semibold">Tax (8.5%):</td>
                <td className="py-2 text-right font-bold">{formatCurrency(2635)}</td>
              </tr>
              <tr className="text-lg">
                <td colSpan={3} className="py-4 text-right font-semibold">Total:</td>
                <td className="py-4 text-right font-bold">{formatCurrency(33635)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Notes */}
        <div className="border-t border-gray-200 pt-8 text-gray-600">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Payment Terms & Instructions</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium mb-2">Payment Terms:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Payment is due within 30 days of the invoice date</li>
                <li>Please include invoice number with your payment</li>
                <li>Late payments may be subject to a 1.5% monthly fee</li>
              </ul>
            </div>
            
            <div>
              <p className="font-medium mb-2">Bank Transfer Details:</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>Bank: Pacific Bank</p>
                  <p>Account Name: Ostrich Inc</p>
                  <p>Account Number: XXXX-XXXX-XXXX-1234</p>
                  <p>Routing Number: XXX-XXX-XXX</p>
                </div>
                <div>
                  <p>Swift Code: PCFCUS12</p>
                  <p>Bank Address: 789 Bank Street</p>
                  <p>San Francisco, CA 94105</p>
                  <p>United States</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="fixed bottom-[1in] left-[1in] right-[1in] text-center text-gray-500 text-sm border-t border-gray-200 pt-8">
          <p className="font-medium mb-1">Thank you for your business!</p>
          <p>If you have any questions about this invoice, please contact:</p>
          <p>billing@ostrich.com | +1 (555) 123-4567</p>
        </div>
      </div>
    </>
  );
}