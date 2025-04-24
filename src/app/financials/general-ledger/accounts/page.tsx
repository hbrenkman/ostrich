"use client";

import { useState } from 'react';
import { FileText, Search, Plus, ArrowLeft, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pagination } from '@/components/ui/pagination';
import { usePagination } from '@/hooks/usePagination';

interface Account {
  id: string;
  number: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  description: string;
  balance: number;
  isActive: boolean;
}

export default function AccountsPage() {
  const [isNewAccountDialogOpen, setIsNewAccountDialogOpen] = useState(false);
  const [isEditAccountDialogOpen, setIsEditAccountDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [newAccount, setNewAccount] = useState<Partial<Account>>({
    type: 'asset',
    isActive: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Generate sample accounts
  const generateAccounts = () => {
    const baseAccounts = [
      { id: '1', number: '1000', name: 'Cash', type: 'asset', description: 'Cash on hand and in bank accounts', balance: 125000, isActive: true },
      { id: '2', number: '1100', name: 'Accounts Receivable', type: 'asset', description: 'Amounts owed by customers', balance: 75000, isActive: true },
      { id: '3', number: '1500', name: 'Office Equipment', type: 'asset', description: 'Computers, furniture, and other office equipment', balance: 45000, isActive: true },
      { id: '4', number: '2000', name: 'Accounts Payable', type: 'liability', description: 'Amounts owed to vendors', balance: 35000, isActive: true },
      { id: '5', number: '2100', name: 'Loans Payable', type: 'liability', description: 'Outstanding loans', balance: 150000, isActive: true },
      { id: '6', number: '3000', name: 'Common Stock', type: 'equity', description: 'Shareholder investments', balance: 100000, isActive: true },
      { id: '7', number: '3900', name: 'Retained Earnings', type: 'equity', description: 'Accumulated earnings', balance: 85000, isActive: true },
      { id: '8', number: '4000', name: 'Service Revenue', type: 'revenue', description: 'Revenue from services', balance: 250000, isActive: true },
      { id: '9', number: '4100', name: 'Interest Revenue', type: 'revenue', description: 'Revenue from interest', balance: 5000, isActive: true },
      { id: '10', number: '5000', name: 'Rent Expense', type: 'expense', description: 'Office rent', balance: 36000, isActive: true },
      { id: '11', number: '5100', name: 'Utilities Expense', type: 'expense', description: 'Electricity, water, internet', balance: 12000, isActive: true },
      { id: '12', number: '5200', name: 'Salaries Expense', type: 'expense', description: 'Employee salaries', balance: 180000, isActive: true },
      { id: '13', number: '5300', name: 'Advertising Expense', type: 'expense', description: 'Marketing and advertising costs', balance: 25000, isActive: true },
      { id: '14', number: '5400', name: 'Depreciation Expense', type: 'expense', description: 'Depreciation of assets', balance: 15000, isActive: true },
      { id: '15', number: '5500', name: 'Insurance Expense', type: 'expense', description: 'Business insurance costs', balance: 8000, isActive: true },
      { id: '16', number: '1200', name: 'Inventory', type: 'asset', description: 'Goods held for sale', balance: 65000, isActive: true },
      { id: '17', number: '1300', name: 'Prepaid Expenses', type: 'asset', description: 'Expenses paid in advance', balance: 12000, isActive: true },
      { id: '18', number: '2200', name: 'Unearned Revenue', type: 'liability', description: 'Payments received for services not yet provided', balance: 18000, isActive: true },
      { id: '19', number: '2300', name: 'Payroll Liabilities', type: 'liability', description: 'Taxes and benefits withheld', balance: 22000, isActive: true },
      { id: '20', number: '4200', name: 'Product Sales', type: 'revenue', description: 'Revenue from product sales', balance: 175000, isActive: true },
    ];
    
    return baseAccounts;
  };

  const accounts = generateAccounts();

  // Filter accounts by search term and type
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = searchTerm === '' || 
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.number.includes(searchTerm) ||
      account.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || account.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    currentItems: paginatedAccounts,
    totalPages,
    totalItems
  } = usePagination({
    items: filteredAccounts,
    itemsPerPage: 10
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleAddAccount = () => {
    if (newAccount.name && newAccount.number && newAccount.type) {
      // In a real app, this would be an API call
      setIsNewAccountDialogOpen(false);
      setNewAccount({
        type: 'asset',
        isActive: true
      });
    }
  };

  const handleEditAccount = () => {
    if (editingAccount?.name && editingAccount?.number && editingAccount?.type) {
      // In a real app, this would be an API call
      setIsEditAccountDialogOpen(false);
      setEditingAccount(null);
    }
  };

  // Calculate totals by account type
  const totals = accounts.reduce((acc, account) => {
    acc[account.type] = (acc[account.type] || 0) + account.balance;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/financials/general-ledger"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            <h1 className="text-h1">Chart of Accounts</h1>
          </div>
        </div>
        <button
          onClick={() => setIsNewAccountDialogOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Account</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totals.asset || 0)}</div>
            <p className="text-sm text-gray-500 mt-1">Total assets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Liabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totals.liability || 0)}</div>
            <p className="text-sm text-gray-500 mt-1">Total liabilities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Equity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(totals.equity || 0)}</div>
            <p className="text-sm text-gray-500 mt-1">Total equity</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg">Accounts</CardTitle>
            <div className="flex flex-col md:flex-row gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Account Types</option>
                <option value="asset">Assets</option>
                <option value="liability">Liabilities</option>
                <option value="equity">Equity</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expenses</option>
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
                placeholder="Search accounts..."
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
                  <th className="text-left py-3 px-4">Account Number</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-right py-3 px-4">Balance</th>
                  <th className="text-center py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4">
                      <span className="font-mono">{account.number}</span>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {account.name}
                    </td>
                    <td className="py-3 px-4 capitalize">
                      {account.type}
                    </td>
                    <td className="py-3 px-4">
                      {account.description}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono">
                        {formatCurrency(account.balance)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        account.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingAccount(account);
                            setIsEditAccountDialogOpen(true);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                        >
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => {
                            // Delete account logic
                            if (confirm('Are you sure you want to delete this account?')) {
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

      {/* New Account Dialog */}
      <Dialog open={isNewAccountDialogOpen} onOpenChange={setIsNewAccountDialogOpen}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Add New Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={newAccount.number || ''}
                  onChange={(e) => setNewAccount({ ...newAccount, number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                  placeholder="e.g., 1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Account Type
                </label>
                <select
                  value={newAccount.type || 'asset'}
                  onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value as Account['type'] })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                >
                  <option value="asset">Asset</option>
                  <option value="liability">Liability</option>
                  <option value="equity">Equity</option>
                  <option value="revenue">Revenue</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Account Name
              </label>
              <input
                type="text"
                value={newAccount.name || ''}
                onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                placeholder="Enter account name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Description
              </label>
              <textarea
                value={newAccount.description || ''}
                onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                rows={3}
                placeholder="Enter account description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Initial Balance
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">$</span>
                <input
                  type="number"
                  value={newAccount.balance || ''}
                  onChange={(e) => setNewAccount({ ...newAccount, balance: parseFloat(e.target.value) })}
                  className="w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={newAccount.isActive}
                onChange={(e) => setNewAccount({ ...newAccount, isActive: e.target.checked })}
                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-foreground">
                Active Account
              </label>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsNewAccountDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium bg-muted/10 hover:bg-muted/20 rounded-md transition-colors text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleAddAccount}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-2"
            >
              Add Account
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={isEditAccountDialogOpen} onOpenChange={setIsEditAccountDialogOpen}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Edit Account</DialogTitle>
          </DialogHeader>
          {editingAccount && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={editingAccount.number}
                    onChange={(e) => setEditingAccount({ ...editingAccount, number: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Account Type
                  </label>
                  <select
                    value={editingAccount.type}
                    onChange={(e) => setEditingAccount({ ...editingAccount, type: e.target.value as Account['type'] })}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                  >
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="equity">Equity</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={editingAccount.description}
                  onChange={(e) => setEditingAccount({ ...editingAccount, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                  rows={3}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editingAccount.isActive}
                  onChange={(e) => setEditingAccount({ ...editingAccount, isActive: e.target.checked })}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="editIsActive" className="ml-2 block text-sm text-foreground">
                  Active Account
                </label>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setIsEditAccountDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium bg-muted/10 hover:bg-muted/20 rounded-md transition-colors text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleEditAccount}
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