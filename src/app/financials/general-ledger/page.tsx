"use client";

import { useState, useEffect } from 'react';
import { FileText, Search, Plus, Filter, Download, Calendar, ArrowUpDown, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LedgerEntry {
  id: string;
  date: string;
  reference: string;
  description: string;
  account: string;
  debit: number;
  credit: number;
  balance: number;
  category: string;
}

interface Account {
  id: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  number: string;
}

export default function GeneralLedger() {
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [isNewEntryDialogOpen, setIsNewEntryDialogOpen] = useState(false);
  const [isEditEntryDialogOpen, setIsEditEntryDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);
  const [newEntry, setNewEntry] = useState<Partial<LedgerEntry>>({});
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof LedgerEntry>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Generate sample accounts
  const accounts: Account[] = [
    { id: '1', name: 'Cash', type: 'asset', number: '1000' },
    { id: '2', name: 'Accounts Receivable', type: 'asset', number: '1100' },
    { id: '3', name: 'Office Equipment', type: 'asset', number: '1500' },
    { id: '4', name: 'Accounts Payable', type: 'liability', number: '2000' },
    { id: '5', name: 'Loans Payable', type: 'liability', number: '2100' },
    { id: '6', name: 'Common Stock', type: 'equity', number: '3000' },
    { id: '7', name: 'Retained Earnings', type: 'equity', number: '3900' },
    { id: '8', name: 'Service Revenue', type: 'revenue', number: '4000' },
    { id: '9', name: 'Interest Revenue', type: 'revenue', number: '4100' },
    { id: '10', name: 'Rent Expense', type: 'expense', number: '5000' },
    { id: '11', name: 'Utilities Expense', type: 'expense', number: '5100' },
    { id: '12', name: 'Salaries Expense', type: 'expense', number: '5200' },
    { id: '13', name: 'Advertising Expense', type: 'expense', number: '5300' },
  ];

  // Generate sample ledger entries
  const generateLedgerEntries = () => {
    const entries: LedgerEntry[] = [];
    const startDate = new Date(2024, 0, 1); // January 1, 2024
    const endDate = new Date(); // Current date
    
    let runningBalance = 50000; // Starting balance
    
    // Generate entries for each month
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + Math.floor(Math.random() * 5) + 1)) {
      const randomAccount = accounts[Math.floor(Math.random() * accounts.length)];
      const isDebit = Math.random() > 0.5;
      const amount = Math.floor(Math.random() * 10000) + 100; // Random amount between 100 and 10100
      
      if (isDebit) {
        runningBalance -= amount;
      } else {
        runningBalance += amount;
      }
      
      entries.push({
        id: `entry-${entries.length + 1}`,
        date: d.toISOString().split('T')[0],
        reference: `REF-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        description: getRandomDescription(randomAccount),
        account: randomAccount.name,
        debit: isDebit ? amount : 0,
        credit: isDebit ? 0 : amount,
        balance: runningBalance,
        category: randomAccount.type
      });
    }
    
    return entries;
  };
  
  const getRandomDescription = (account: Account) => {
    const descriptions = {
      'Cash': ['Cash deposit', 'ATM withdrawal', 'Bank transfer', 'Cash payment'],
      'Accounts Receivable': ['Client payment', 'Invoice issued', 'Payment received', 'Outstanding balance'],
      'Office Equipment': ['New computer purchase', 'Office furniture', 'Equipment maintenance', 'Printer purchase'],
      'Accounts Payable': ['Vendor payment', 'Bill payment', 'Outstanding invoice', 'Supplier payment'],
      'Loans Payable': ['Loan payment', 'Interest payment', 'Principal reduction', 'New loan'],
      'Common Stock': ['Stock issuance', 'Dividend payment', 'Stock repurchase', 'Equity adjustment'],
      'Retained Earnings': ['Profit allocation', 'Dividend declaration', 'Year-end adjustment', 'Earnings transfer'],
      'Service Revenue': ['Client project', 'Consulting fees', 'Service contract', 'Professional services'],
      'Interest Revenue': ['Bank interest', 'Investment return', 'Interest income', 'Savings interest'],
      'Rent Expense': ['Office rent', 'Storage space', 'Facility rental', 'Monthly rent payment'],
      'Utilities Expense': ['Electricity bill', 'Water bill', 'Internet service', 'Phone service'],
      'Salaries Expense': ['Employee payroll', 'Bonus payment', 'Commission payment', 'Contractor payment'],
      'Advertising Expense': ['Online marketing', 'Print advertisement', 'Social media campaign', 'Promotional materials']
    };
    
    const options = descriptions[account.name as keyof typeof descriptions] || ['Transaction'];
    return options[Math.floor(Math.random() * options.length)];
  };

  const ledgerEntries = generateLedgerEntries();

  // Filter entries based on selected period
  const filterEntriesByPeriod = (entries: LedgerEntry[]) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    switch (selectedPeriod) {
      case 'current-month':
        return entries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth;
        });
      case 'last-month':
        return entries.filter(entry => {
          const entryDate = new Date(entry.date);
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return entryDate.getFullYear() === lastMonthYear && entryDate.getMonth() === lastMonth;
        });
      case 'current-quarter':
        return entries.filter(entry => {
          const entryDate = new Date(entry.date);
          const currentQuarter = Math.floor(currentMonth / 3);
          const entryQuarter = Math.floor(entryDate.getMonth() / 3);
          return entryDate.getFullYear() === currentYear && entryQuarter === currentQuarter;
        });
      case 'current-year':
        return entries.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate.getFullYear() === currentYear;
        });
      case 'all-time':
      default:
        return entries;
    }
  };

  // Filter entries by account
  const filterEntriesByAccount = (entries: LedgerEntry[]) => {
    if (filterAccount === 'all') return entries;
    return entries.filter(entry => entry.account === filterAccount);
  };

  // Filter entries by search term
  const filterEntriesBySearch = (entries: LedgerEntry[]) => {
    if (!searchTerm) return entries;
    const term = searchTerm.toLowerCase();
    return entries.filter(entry => 
      entry.description.toLowerCase().includes(term) ||
      entry.reference.toLowerCase().includes(term) ||
      entry.account.toLowerCase().includes(term)
    );
  };

  // Sort entries
  const sortEntries = (entries: LedgerEntry[]) => {
    return [...entries].sort((a, b) => {
      if (sortField === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      if (sortField === 'debit' || sortField === 'credit' || sortField === 'balance') {
        return sortDirection === 'asc' 
          ? a[sortField] - b[sortField]
          : b[sortField] - a[sortField];
      }
      
      // For string fields
      const valueA = a[sortField].toString().toLowerCase();
      const valueB = b[sortField].toString().toLowerCase();
      return sortDirection === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });
  };

  // Apply all filters and sorting
  const filteredEntries = sortEntries(
    filterEntriesBySearch(
      filterEntriesByAccount(
        filterEntriesByPeriod(ledgerEntries)
      )
    )
  );

  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    currentItems: paginatedEntries,
    totalPages,
    totalItems
  } = usePagination({
    items: filteredEntries,
    itemsPerPage: 20
  });

  const handleSort = (field: keyof LedgerEntry) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleAddEntry = () => {
    if (newEntry.description && newEntry.account && (newEntry.debit || newEntry.credit)) {
      // In a real app, this would be an API call
      setIsNewEntryDialogOpen(false);
      setNewEntry({});
    }
  };

  const handleEditEntry = () => {
    if (editingEntry?.description && editingEntry?.account && (editingEntry?.debit || editingEntry?.credit)) {
      // In a real app, this would be an API call
      setIsEditEntryDialogOpen(false);
      setEditingEntry(null);
    }
  };

  // Calculate totals
  const totals = paginatedEntries.reduce((acc, entry) => {
    return {
      debit: acc.debit + entry.debit,
      credit: acc.credit + entry.credit
    };
  }, { debit: 0, credit: 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6" />
          <h1 className="text-h1">General Ledger</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewEntryDialogOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                Export as Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Debits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{formatCurrency(totals.debit)}</div>
            <p className="text-sm text-gray-500 mt-1">Current period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(totals.credit)}</div>
            <p className="text-sm text-gray-500 mt-1">Current period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Net Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totals.credit - totals.debit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totals.credit - totals.debit)}
            </div>
            <p className="text-sm text-gray-500 mt-1">Current period</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg">Ledger Entries</CardTitle>
            <div className="flex flex-col md:flex-row gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="current-month">Current Month</option>
                <option value="last-month">Last Month</option>
                <option value="current-quarter">Current Quarter</option>
                <option value="current-year">Current Year</option>
                <option value="all-time">All Time</option>
              </select>
              
              <select
                value={filterAccount}
                onChange={(e) => setFilterAccount(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Accounts</option>
                <optgroup label="Assets">
                  {accounts.filter(a => a.type === 'asset').map(account => (
                    <option key={account.id} value={account.name}>
                      {account.number} - {account.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Liabilities">
                  {accounts.filter(a => a.type === 'liability').map(account => (
                    <option key={account.id} value={account.name}>
                      {account.number} - {account.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Equity">
                  {accounts.filter(a => a.type === 'equity').map(account => (
                    <option key={account.id} value={account.name}>
                      {account.number} - {account.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Revenue">
                  {accounts.filter(a => a.type === 'revenue').map(account => (
                    <option key={account.id} value={account.name}>
                      {account.number} - {account.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Expenses">
                  {accounts.filter(a => a.type === 'expense').map(account => (
                    <option key={account.id} value={account.name}>
                      {account.number} - {account.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
              <input
                type="text"
                placeholder="Search ledger entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th 
                    className="text-left py-3 px-4 cursor-pointer hover:bg-muted/5"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      {sortField === 'date' && (
                        <ArrowUpDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 cursor-pointer hover:bg-muted/5"
                    onClick={() => handleSort('reference')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Reference</span>
                      {sortField === 'reference' && (
                        <ArrowUpDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 cursor-pointer hover:bg-muted/5"
                    onClick={() => handleSort('description')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Description</span>
                      {sortField === 'description' && (
                        <ArrowUpDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-left py-3 px-4 cursor-pointer hover:bg-muted/5"
                    onClick={() => handleSort('account')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Account</span>
                      {sortField === 'account' && (
                        <ArrowUpDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-right py-3 px-4 cursor-pointer hover:bg-muted/5"
                    onClick={() => handleSort('debit')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Debit</span>
                      {sortField === 'debit' && (
                        <ArrowUpDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-right py-3 px-4 cursor-pointer hover:bg-muted/5"
                    onClick={() => handleSort('credit')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Credit</span>
                      {sortField === 'credit' && (
                        <ArrowUpDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-right py-3 px-4 cursor-pointer hover:bg-muted/5"
                    onClick={() => handleSort('balance')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Balance</span>
                      {sortField === 'balance' && (
                        <ArrowUpDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{formatDate(entry.date)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono">{entry.reference}</span>
                    </td>
                    <td className="py-3 px-4">
                      {entry.description}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">{entry.account}</span>
                      <span className="text-xs text-muted-foreground ml-2">({entry.category})</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {entry.debit > 0 ? (
                        <span className="font-mono text-red-600">{formatCurrency(entry.debit)}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {entry.credit > 0 ? (
                        <span className="font-mono text-green-600">{formatCurrency(entry.credit)}</span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono ${entry.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(entry.balance)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingEntry(entry);
                            setIsEditEntryDialogOpen(true);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => {
                            // Delete entry logic
                            if (confirm('Are you sure you want to delete this entry?')) {
                              // Delete logic here
                            }
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                        >
                          <Trash2 className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted/5 font-medium">
                  <td colSpan={4} className="py-3 px-4 text-right">Totals:</td>
                  <td className="py-3 px-4 text-right text-red-600 font-mono">{formatCurrency(totals.debit)}</td>
                  <td className="py-3 px-4 text-right text-green-600 font-mono">{formatCurrency(totals.credit)}</td>
                  <td className="py-3 px-4 text-right font-mono">
                    <span className={totals.credit - totals.debit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(totals.credit - totals.debit)}
                    </span>
                  </td>
                  <td className="py-3 px-4"></td>
                </tr>
              </tfoot>
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

      {/* New Entry Dialog */}
      <Dialog open={isNewEntryDialogOpen} onOpenChange={setIsNewEntryDialogOpen}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Add New Ledger Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={newEntry.date || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Reference
                </label>
                <input
                  type="text"
                  value={newEntry.reference || ''}
                  onChange={(e) => setNewEntry({ ...newEntry, reference: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                  placeholder="REF-0000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Description
              </label>
              <input
                type="text"
                value={newEntry.description || ''}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                placeholder="Enter transaction description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Account
              </label>
              <select
                value={newEntry.account || ''}
                onChange={(e) => setNewEntry({ ...newEntry, account: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
              >
                <option value="">Select an account</option>
                <optgroup label="Assets">
                  {accounts.filter(a => a.type === 'asset').map(account => (
                    <option key={account.id} value={account.name}>
                      {account.number} - {account.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Liabilities">
                  {accounts.filter(a => a.type === 'liability').map(account => (
                    <option key={account.id} value={account.name}>
                      {account.number} - {account.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Equity">
                  {accounts.filter(a => a.type === 'equity').map(account => (
                    <option key={account.id} value={account.name}>
                      {account.number} - {account.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Revenue">
                  {accounts.filter(a => a.type === 'revenue').map(account => (
                    <option key={account.id} value={account.name}>
                      {account.number} - {account.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Expenses">
                  {accounts.filter(a => a.type === 'expense').map(account => (
                    <option key={account.id} value={account.name}>
                      {account.number} - {account.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Debit Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">$</span>
                  <input
                    type="number"
                    value={newEntry.debit || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value > 0) {
                        setNewEntry({ ...newEntry, debit: value, credit: 0 });
                      } else {
                        setNewEntry({ ...newEntry, debit: 0 });
                      }
                    }}
                    className="w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Credit Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">$</span>
                  <input
                    type="number"
                    value={newEntry.credit || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (value > 0) {
                        setNewEntry({ ...newEntry, credit: value, debit: 0 });
                      } else {
                        setNewEntry({ ...newEntry, credit: 0 });
                      }
                    }}
                    className="w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    disabled={newEntry.debit && newEntry.debit > 0}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsNewEntryDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium bg-muted/10 hover:bg-muted/20 rounded-md transition-colors text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleAddEntry}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-2"
            >
              Add Entry
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={isEditEntryDialogOpen} onOpenChange={setIsEditEntryDialogOpen}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Edit Ledger Entry</DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editingEntry.date}
                    onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Reference
                  </label>
                  <input
                    type="text"
                    value={editingEntry.reference}
                    onChange={(e) => setEditingEntry({ ...editingEntry, reference: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editingEntry.description}
                  onChange={(e) => setEditingEntry({ ...editingEntry, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Account
                </label>
                <select
                  value={editingEntry.account}
                  onChange={(e) => setEditingEntry({ ...editingEntry, account: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                >
                  <optgroup label="Assets">
                    {accounts.filter(a => a.type === 'asset').map(account => (
                      <option key={account.id} value={account.name}>
                        {account.number} - {account.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Liabilities">
                    {accounts.filter(a => a.type === 'liability').map(account => (
                      <option key={account.id} value={account.name}>
                        {account.number} - {account.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Equity">
                    {accounts.filter(a => a.type === 'equity').map(account => (
                      <option key={account.id} value={account.name}>
                        {account.number} - {account.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Revenue">
                    {accounts.filter(a => a.type === 'revenue').map(account => (
                      <option key={account.id} value={account.name}>
                        {account.number} - {account.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Expenses">
                    {accounts.filter(a => a.type === 'expense').map(account => (
                      <option key={account.id} value={account.name}>
                        {account.number} - {account.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Debit Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">$</span>
                    <input
                      type="number"
                      value={editingEntry.debit}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value > 0) {
                          setEditingEntry({ ...editingEntry, debit: value, credit: 0 });
                        } else {
                          setEditingEntry({ ...editingEntry, debit: 0 });
                        }
                      }}
                      className="w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Credit Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">$</span>
                    <input
                      type="number"
                      value={editingEntry.credit}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value > 0) {
                          setEditingEntry({ ...editingEntry, credit: value, debit: 0 });
                        } else {
                          setEditingEntry({ ...editingEntry, credit: 0 });
                        }
                      }}
                      className="w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      disabled={editingEntry.debit > 0}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setIsEditEntryDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium bg-muted/10 hover:bg-muted/20 rounded-md transition-colors text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleEditEntry}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-2"
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}