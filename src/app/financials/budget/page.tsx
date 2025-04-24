'use client';

import { useState } from 'react';
import { DollarSign, Plus, Calendar, ArrowLeft, ArrowRight, Edit2, Trash2, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface BudgetItem {
  id: string;
  category: 'regular' | 'irregular' | 'project';
  name: string;
  amount: number;
  frequency?: 'monthly' | 'quarterly' | 'annual';
  dueDate?: string;
  projectId?: string;
  notes?: string;
}

interface MonthlyBudget {
  month: string;
  year: number;
  income: number;
  expenses: number;
  items: BudgetItem[];
}

export default function Budget() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showPreviousMonth, setShowPreviousMonth] = useState(false);
  const [showNextMonth, setShowNextMonth] = useState(false);
  const [isNewItemDialogOpen, setIsNewItemDialogOpen] = useState(false);
  const [isEditItemDialogOpen, setIsEditItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<BudgetItem>>({
    category: 'regular',
    frequency: 'monthly'
  });

  // Generate example data for current month
  const generateMonthlyBudget = () => {
    const month = selectedMonth.toLocaleString('default', { month: 'long' });
    const year = selectedMonth.getFullYear();
    
    return {
      month,
      year,
      income: 75000,
      expenses: 55000,
      bankBalance: 120000,
      items: [
        {
          id: 'reg-1',
          category: 'regular',
          name: 'Office Rent',
          amount: 5000,
          budgeted: 5000,
          frequency: 'monthly'
        },
        {
          id: 'reg-2',
          category: 'regular',
          name: 'Utilities',
          amount: 1200,
          budgeted: 1500,
          frequency: 'monthly'
        },
        {
          id: 'reg-3',
          category: 'regular',
          name: 'Salaries',
          amount: 35000,
          budgeted: 35000,
          frequency: 'monthly'
        },
        {
          id: 'irr-1',
          category: 'irregular',
          name: 'Software Licenses',
          amount: 8000,
          budgeted: 8000,
          dueDate: new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 15).toISOString()
        },
        {
          id: 'proj-1',
          category: 'project',
          name: 'Website Redesign',
          amount: 25000,
          budgeted: 25000,
          projectId: 'PRJ-001'
        }
      ] as BudgetItem[]
    };
  };

  // Generate previous month data
  const generatePreviousMonthBudget = () => {
    const prevDate = new Date(selectedMonth);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const month = prevDate.toLocaleString('default', { month: 'long' });
    const year = prevDate.getFullYear();
    
    return {
      month,
      year,
      income: 72000,
      expenses: 53000,
      bankBalance: 110000,
      items: [
        {
          id: 'prev-reg-1',
          category: 'regular',
          name: 'Office Rent',
          amount: 5000,
          budgeted: 5000,
          frequency: 'monthly'
        },
        {
          id: 'prev-reg-2',
          category: 'regular',
          name: 'Utilities',
          amount: 1300,
          budgeted: 1500,
          frequency: 'monthly'
        },
        {
          id: 'prev-reg-3',
          category: 'regular',
          name: 'Salaries',
          amount: 35000,
          budgeted: 35000,
          frequency: 'monthly'
        },
        {
          id: 'prev-irr-1',
          category: 'irregular',
          name: 'Office Supplies',
          amount: 1200,
          budgeted: 1000,
          dueDate: new Date(prevDate.getFullYear(), prevDate.getMonth(), 10).toISOString()
        },
        {
          id: 'prev-proj-1',
          category: 'project',
          name: 'Mobile App Development',
          amount: 15000,
          budgeted: 15000,
          projectId: 'PRJ-002'
        }
      ] as BudgetItem[]
    };
  };

  // Generate next month data
  const generateNextMonthBudget = () => {
    const nextDate = new Date(selectedMonth);
    nextDate.setMonth(nextDate.getMonth() + 1);
    const month = nextDate.toLocaleString('default', { month: 'long' });
    const year = nextDate.getFullYear();
    
    return {
      month,
      year,
      income: 78000,
      expenses: 56000,
      bankBalance: 130000,
      items: [
        {
          id: 'next-reg-1',
          category: 'regular',
          name: 'Office Rent',
          amount: 0,
          budgeted: 5000,
          frequency: 'monthly'
        },
        {
          id: 'next-reg-2',
          category: 'regular',
          name: 'Utilities',
          amount: 0,
          budgeted: 1500,
          frequency: 'monthly'
        },
        {
          id: 'next-reg-3',
          category: 'regular',
          name: 'Salaries',
          amount: 0,
          budgeted: 35000,
          frequency: 'monthly'
        },
        {
          id: 'next-irr-1',
          category: 'irregular',
          name: 'Annual Insurance',
          amount: 0,
          budgeted: 12000,
          dueDate: new Date(nextDate.getFullYear(), nextDate.getMonth(), 20).toISOString()
        },
        {
          id: 'next-proj-1',
          category: 'project',
          name: 'Database Migration',
          amount: 0,
          budgeted: 18000,
          projectId: 'PRJ-003'
        }
      ] as BudgetItem[]
    };
  };

  const currentMonthBudget = generateMonthlyBudget();
  const previousMonthBudget = generatePreviousMonthBudget();
  const nextMonthBudget = generateNextMonthBudget();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['regular', 'irregular', 'project']));

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (expandedCategories.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedMonth(newDate);
    setShowPreviousMonth(false);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedMonth(newDate);
    setShowNextMonth(false);
  };

  const handleAddItem = () => {
    if (newItem.name && newItem.amount) {
      const item: BudgetItem = {
        id: Date.now().toString(),
        category: newItem.category as 'regular' | 'irregular' | 'project',
        name: newItem.name,
        amount: newItem.amount,
        budgeted: newItem.amount,
        frequency: newItem.frequency as 'monthly' | 'quarterly' | 'annual',
        dueDate: newItem.dueDate,
        projectId: newItem.projectId,
        notes: newItem.notes
      };

      // In a real app, this would be an API call
      setIsNewItemDialogOpen(false);
      setNewItem({
        category: 'regular',
        frequency: 'monthly'
      });
    }
  };

  const handleEditItem = () => {
    if (editingItem?.name && editingItem?.amount) {
      // In a real app, this would be an API call
      setIsEditItemDialogOpen(false);
      setEditingItem(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          <h1 className="text-h1">Budget Management</h1>
        </div>
        <button
          onClick={() => setIsNewItemDialogOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Budget Item</span>
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePreviousMonth}
          className="p-2 hover:bg-muted/10 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted" />
          <span className="text-lg font-medium">
            {selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-muted/10 rounded-full transition-colors"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <span>Monthly Budget: {currentMonthBudget.month} {currentMonthBudget.year}</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowPreviousMonth(!showPreviousMonth)}
                className="text-sm text-primary hover:underline"
              >
                {showPreviousMonth ? 'Hide' : 'Show'} Previous Month
              </button>
              <button 
                onClick={() => setShowNextMonth(!showNextMonth)}
                className="text-sm text-primary hover:underline"
              >
                {showNextMonth ? 'Hide' : 'Show'} Next Month
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 w-1/3">Item</th>
                  {showPreviousMonth && (
                    <>
                      <th className="text-right py-3 px-4">Previous Budgeted</th>
                      <th className="text-right py-3 px-4">Previous Actual</th>
                    </>
                  )}
                  <th className="text-right py-3 px-4">Budgeted</th>
                  <th className="text-right py-3 px-4">Actual</th>
                  {showNextMonth && (
                    <>
                      <th className="text-right py-3 px-4">Next Budgeted</th>
                      <th className="text-right py-3 px-4">Next Actual</th>
                    </>
                  )}
                  <th className="text-right py-3 px-4 w-10">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Bank Balance Row */}
                <tr className="border-b bg-muted/5">
                  <td className="py-3 px-4 font-medium">Bank Balance</td>
                  {showPreviousMonth && (
                    <>
                      <td className="text-right py-3 px-4">-</td>
                      <td className="text-right py-3 px-4 font-medium">{formatCurrency(previousMonthBudget.bankBalance)}</td>
                    </>
                  )}
                  <td className="text-right py-3 px-4">-</td>
                  <td className="text-right py-3 px-4 font-medium">{formatCurrency(currentMonthBudget.bankBalance)}</td>
                  {showNextMonth && (
                    <>
                      <td className="text-right py-3 px-4">-</td>
                      <td className="text-right py-3 px-4 font-medium text-muted">{formatCurrency(nextMonthBudget.bankBalance)}</td>
                    </>
                  )}
                  <td className="text-right py-3 px-4"></td>
                </tr>
                
                {/* Income Row */}
                <tr className="border-b bg-muted/5">
                  <td className="py-3 px-4 font-medium">Total Income</td>
                  {showPreviousMonth && (
                    <>
                      <td className="text-right py-3 px-4">-</td>
                      <td className="text-right py-3 px-4 font-medium text-green-600">{formatCurrency(previousMonthBudget.income)}</td>
                    </>
                  )}
                  <td className="text-right py-3 px-4">-</td>
                  <td className="text-right py-3 px-4 font-medium text-green-600">{formatCurrency(currentMonthBudget.income)}</td>
                  {showNextMonth && (
                    <>
                      <td className="text-right py-3 px-4">-</td>
                      <td className="text-right py-3 px-4 font-medium text-green-600 text-muted">{formatCurrency(nextMonthBudget.income)}</td>
                    </>
                  )}
                  <td className="text-right py-3 px-4"></td>
                </tr>
                
                {/* Regular Expenses Category */}
                <tr className="border-b bg-gray-100 dark:bg-gray-800">
                  <td 
                    colSpan={showPreviousMonth && showNextMonth ? 7 : showPreviousMonth || showNextMonth ? 5 : 3} 
                    className="py-3 px-4 font-medium cursor-pointer"
                    onClick={() => toggleCategory('regular')}
                  >
                    Regular Expenses
                  </td>
                  <td className="text-right py-3 px-4">
                    <button
                      onClick={() => toggleCategory('regular')}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                    >
                      {expandedCategories.has('regular') ? (
                        <ArrowLeft className="w-4 h-4 transform rotate-90" />
                      ) : (
                        <ArrowLeft className="w-4 h-4 transform -rotate-90" />
                      )}
                    </button>
                  </td>
                </tr>
                
                {expandedCategories.has('regular') && currentMonthBudget.items
                  .filter(item => item.category === 'regular')
                  .map(item => {
                    const prevItem = previousMonthBudget.items.find(i => i.name === item.name && i.category === 'regular');
                    const nextItem = nextMonthBudget.items.find(i => i.name === item.name && i.category === 'regular');
                    
                    return (
                      <tr key={item.id} className="border-b hover:bg-muted/5">
                        <td className="py-3 px-4">{item.name}</td>
                        {showPreviousMonth && (
                          <>
                            <td className="text-right py-3 px-4">{prevItem ? formatCurrency(prevItem.budgeted) : '-'}</td>
                            <td className="text-right py-3 px-4">{prevItem ? formatCurrency(prevItem.amount) : '-'}</td>
                          </>
                        )}
                        <td className="text-right py-3 px-4">{formatCurrency(item.budgeted)}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(item.amount)}</td>
                        {showNextMonth && (
                          <>
                            <td className="text-right py-3 px-4">{nextItem ? formatCurrency(nextItem.budgeted) : '-'}</td>
                            <td className="text-right py-3 px-4 text-muted">{nextItem ? formatCurrency(nextItem.amount) : '-'}</td>
                          </>
                        )}
                        <td className="text-right py-3 px-4">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setIsEditItemDialogOpen(true);
                            }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                          >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                }
                
                {/* Irregular Expenses Category */}
                <tr className="border-b bg-gray-100 dark:bg-gray-800">
                  <td 
                    colSpan={showPreviousMonth && showNextMonth ? 7 : showPreviousMonth || showNextMonth ? 5 : 3} 
                    className="py-3 px-4 font-medium cursor-pointer"
                    onClick={() => toggleCategory('irregular')}
                  >
                    Irregular Expenses
                  </td>
                  <td className="text-right py-3 px-4">
                    <button
                      onClick={() => toggleCategory('irregular')}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                    >
                      {expandedCategories.has('irregular') ? (
                        <ArrowLeft className="w-4 h-4 transform rotate-90" />
                      ) : (
                        <ArrowLeft className="w-4 h-4 transform -rotate-90" />
                      )}
                    </button>
                  </td>
                </tr>
                
                {expandedCategories.has('irregular') && currentMonthBudget.items
                  .filter(item => item.category === 'irregular')
                  .map(item => {
                    const prevItem = previousMonthBudget.items.find(i => i.name === item.name && i.category === 'irregular');
                    const nextItem = nextMonthBudget.items.find(i => i.name === item.name && i.category === 'irregular');
                    
                    return (
                      <tr key={item.id} className="border-b hover:bg-muted/5">
                        <td className="py-3 px-4">{item.name}</td>
                        {showPreviousMonth && (
                          <>
                            <td className="text-right py-3 px-4">{prevItem ? formatCurrency(prevItem.budgeted) : '-'}</td>
                            <td className="text-right py-3 px-4">{prevItem ? formatCurrency(prevItem.amount) : '-'}</td>
                          </>
                        )}
                        <td className="text-right py-3 px-4">{formatCurrency(item.budgeted)}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(item.amount)}</td>
                        {showNextMonth && (
                          <>
                            <td className="text-right py-3 px-4">{nextItem ? formatCurrency(nextItem.budgeted) : '-'}</td>
                            <td className="text-right py-3 px-4 text-muted">{nextItem ? formatCurrency(nextItem.amount) : '-'}</td>
                          </>
                        )}
                        <td className="text-right py-3 px-4">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setIsEditItemDialogOpen(true);
                            }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                          >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                }
                
                {/* Project Income Category */}
                <tr className="border-b bg-gray-100 dark:bg-gray-800">
                  <td 
                    colSpan={showPreviousMonth && showNextMonth ? 7 : showPreviousMonth || showNextMonth ? 5 : 3} 
                    className="py-3 px-4 font-medium cursor-pointer"
                    onClick={() => toggleCategory('project')}
                  >
                    Project Income
                  </td>
                  <td className="text-right py-3 px-4">
                    <button
                      onClick={() => toggleCategory('project')}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                    >
                      {expandedCategories.has('project') ? (
                        <ArrowLeft className="w-4 h-4 transform rotate-90" />
                      ) : (
                        <ArrowLeft className="w-4 h-4 transform -rotate-90" />
                      )}
                    </button>
                  </td>
                </tr>
                
                {expandedCategories.has('project') && currentMonthBudget.items
                  .filter(item => item.category === 'project')
                  .map(item => {
                    const prevItem = previousMonthBudget.items.find(i => i.name === item.name && i.category === 'project');
                    const nextItem = nextMonthBudget.items.find(i => i.name === item.name && i.category === 'project');
                    
                    return (
                      <tr key={item.id} className="border-b hover:bg-muted/5">
                        <td className="py-3 px-4">{item.name}</td>
                        {showPreviousMonth && (
                          <>
                            <td className="text-right py-3 px-4">{prevItem ? formatCurrency(prevItem.budgeted) : '-'}</td>
                            <td className="text-right py-3 px-4">{prevItem ? formatCurrency(prevItem.amount) : '-'}</td>
                          </>
                        )}
                        <td className="text-right py-3 px-4">{formatCurrency(item.budgeted)}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(item.amount)}</td>
                        {showNextMonth && (
                          <>
                            <td className="text-right py-3 px-4">{nextItem ? formatCurrency(nextItem.budgeted) : '-'}</td>
                            <td className="text-right py-3 px-4 text-muted">{nextItem ? formatCurrency(nextItem.amount) : '-'}</td>
                          </>
                        )}
                        <td className="text-right py-3 px-4">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setIsEditItemDialogOpen(true);
                            }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                          >
                            <Edit2 className="w-4 h-4 text-gray-500" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                }
                
                {/* Total Expenses Row */}
                <tr className="border-b bg-muted/5">
                  <td className="py-3 px-4 font-medium">Total Expenses</td>
                  {showPreviousMonth && (
                    <>
                      <td className="text-right py-3 px-4 font-medium">-</td>
                      <td className="text-right py-3 px-4 font-medium text-red-600">{formatCurrency(previousMonthBudget.expenses)}</td>
                    </>
                  )}
                  <td className="text-right py-3 px-4 font-medium">-</td>
                  <td className="text-right py-3 px-4 font-medium text-red-600">{formatCurrency(currentMonthBudget.expenses)}</td>
                  {showNextMonth && (
                    <>
                      <td className="text-right py-3 px-4 font-medium">-</td>
                      <td className="text-right py-3 px-4 font-medium text-red-600 text-muted">{formatCurrency(nextMonthBudget.expenses)}</td>
                    </>
                  )}
                  <td className="text-right py-3 px-4"></td>
                </tr>
                
                {/* Net Profit Row */}
                <tr className="border-b bg-muted/5 font-bold">
                  <td className="py-3 px-4">Net Profit</td>
                  {showPreviousMonth && (
                    <>
                      <td className="text-right py-3 px-4">-</td>
                      <td className="text-right py-3 px-4 text-green-600">
                        {formatCurrency(previousMonthBudget.income - previousMonthBudget.expenses)}
                      </td>
                    </>
                  )}
                  <td className="text-right py-3 px-4">-</td>
                  <td className="text-right py-3 px-4 text-green-600">
                    {formatCurrency(currentMonthBudget.income - currentMonthBudget.expenses)}
                  </td>
                  {showNextMonth && (
                    <>
                      <td className="text-right py-3 px-4">-</td>
                      <td className="text-right py-3 px-4 text-green-600 text-muted">
                        {formatCurrency(nextMonthBudget.income - nextMonthBudget.expenses)}
                      </td>
                    </>
                  )}
                  <td className="text-right py-3 px-4"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* New Budget Item Dialog */}
      <Dialog open={isNewItemDialogOpen} onOpenChange={setIsNewItemDialogOpen}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Add Budget Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Category
              </label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value as 'regular' | 'irregular' | 'project' })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
              >
                <option value="regular">Regular Expense</option>
                <option value="irregular">Irregular Expense</option>
                <option value="project">Project Income</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Name
              </label>
              <input
                type="text"
                value={newItem.name || ''}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                placeholder="Enter item name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">$</span>
                <input
                  type="number"
                  value={newItem.budgeted || ''}
                  onChange={(e) => setNewItem({ ...newItem, budgeted: Number(e.target.value) })}
                  className="w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {newItem.category === 'regular' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Frequency
                </label>
                <select
                  value={newItem.frequency}
                  onChange={(e) => setNewItem({ ...newItem, frequency: e.target.value as 'monthly' | 'quarterly' | 'annual' })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            )}

            {newItem.category === 'irregular' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newItem.dueDate || ''}
                  onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                />
              </div>
            )}

            {newItem.category === 'project' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Project ID
                </label>
                <input
                  type="text"
                  value={newItem.projectId || ''}
                  onChange={(e) => setNewItem({ ...newItem, projectId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                  placeholder="Enter project ID"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Notes
              </label>
              <textarea
                value={newItem.notes || ''}
                onChange={(e) => setNewItem({ ...newItem, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                rows={3}
                placeholder="Enter any additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsNewItemDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium bg-muted/10 hover:bg-muted/20 rounded-md transition-colors text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleAddItem}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-2"
            >
              Add Item
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Budget Item Dialog */}
      <Dialog open={isEditItemDialogOpen} onOpenChange={setIsEditItemDialogOpen}>
        <DialogContent className="bg-card text-card-foreground">
          <DialogHeader>
            <DialogTitle>Edit Budget Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Category
              </label>
              <select
                value={editingItem?.category}
                onChange={(e) => setEditingItem(editingItem ? { ...editingItem, category: e.target.value as 'regular' | 'irregular' | 'project' } : null)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
              >
                <option value="regular">Regular Expense</option>
                <option value="irregular">Irregular Expense</option>
                <option value="project">Project Income</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Name
              </label>
              <input
                type="text"
                value={editingItem?.name || ''}
                onChange={(e) => setEditingItem(editingItem ? { ...editingItem, name: e.target.value } : null)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                placeholder="Enter item name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted">$</span>
                <input
                  type="number"
                  value={editingItem?.budgeted || ''}
                  onChange={(e) => setEditingItem(editingItem ? { ...editingItem, budgeted: Number(e.target.value) } : null)}
                  className="w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {editingItem?.category === 'regular' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Frequency
                </label>
                <select
                  value={editingItem.frequency}
                  onChange={(e) => setEditingItem({ ...editingItem, frequency: e.target.value as 'monthly' | 'quarterly' | 'annual' })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                >
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            )}

            {editingItem?.category === 'irregular' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editingItem.dueDate || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                />
              </div>
            )}

            {editingItem?.category === 'project' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Project ID
                </label>
                <input
                  type="text"
                  value={editingItem.projectId || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, projectId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                  placeholder="Enter project ID"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Notes
              </label>
              <textarea
                value={editingItem?.notes || ''}
                onChange={(e) => setEditingItem(editingItem ? { ...editingItem, notes: e.target.value } : null)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                rows={3}
                placeholder="Enter any additional notes"
              />
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsEditItemDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium bg-muted/10 hover:bg-muted/20 rounded-md transition-colors text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleEditItem}
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