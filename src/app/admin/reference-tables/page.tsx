"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Search, Calculator, Building2, DollarSign, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { useReferenceTables } from './hooks/useReferenceTables';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { StateCostIndexTable } from './state-cost-index';

interface ReferenceTable {
  id: string;
  name: string;
  category: 'Fee Calculation' | 'Project Types' | 'Service Types' | 'Rate Categories';
  description: string;
  entries: {
    id: string;
    key: string;
    value: string | number;
    description?: string;
  }[];
}

// Building types for construction and real estate
const buildingTypes = [
  { key: 'Apartment', value: 'APT', description: 'Multi-family residential buildings', rate: 225, sqft: true },
  { key: 'Office', value: 'OFF', description: 'Commercial office spaces', rate: 195, sqft: true },
  { key: 'Medical Office', value: 'MED', description: 'Healthcare professional offices', rate: 275, sqft: true },
  { key: 'Dental Office', value: 'DEN', description: 'Dental clinics and practices', rate: 265, sqft: true },
  { key: 'Hospital', value: 'HOS', description: 'Medical treatment facilities', rate: 425, sqft: true },
  { key: 'Retail', value: 'RET', description: 'Shops and commercial retail spaces', rate: 185, sqft: true },
  { key: 'Factory', value: 'FAC', description: 'Manufacturing and industrial facilities', rate: 155, sqft: true },
  { key: 'Warehouse', value: 'WAR', description: 'Storage and distribution facilities', rate: 125, sqft: true },
  { key: 'Hotel', value: 'HOT', description: 'Lodging and hospitality buildings', rate: 245, sqft: true },
  { key: 'Recreational', value: 'REC', description: 'Sports and entertainment venues', rate: 215, sqft: true },
  { key: 'Church', value: 'CHU', description: 'Religious and worship facilities', rate: 235, sqft: true },
  { key: 'School', value: 'SCH', description: 'Educational institutions', rate: 255, sqft: true },
  { key: 'Laboratory', value: 'LAB', description: 'Research and testing facilities', rate: 315, sqft: true },
  { key: 'Data Center', value: 'DAT', description: 'IT infrastructure facilities', rate: 385, sqft: true },
  { key: 'Restaurant', value: 'RES', description: 'Food service establishments', rate: 225, sqft: true },
  { key: 'Residential', value: 'RSD', description: 'Single-family homes and dwellings', rate: 205, sqft: true }
];

export default function ReferenceTablesPage() {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { tables, loading, error, addTable, updateTable, deleteTable } = useReferenceTables();

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  // Use the tables from the hook instead of local state

  const [isNewTableDialogOpen, setIsNewTableDialogOpen] = useState(false);
  const [isEditTableDialogOpen, setIsEditTableDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<ReferenceTable | null>(null);
  const [newTable, setNewTable] = useState<Partial<ReferenceTable>>({
    category: 'Fee Calculation',
    entries: []
  });
  const [newEntry, setNewEntry] = useState({ key: '', value: '', description: '' });

  const handleAddTable = () => {
    if (newTable.name && newTable.category) {
      addTable({
        name: newTable.name,
        category: newTable.category as ReferenceTable['category'],
        description: newTable.description || '',
        entries: newTable.entries || []
      });
      setNewTable({
        category: 'Fee Calculation',
        entries: []
      });
      setIsNewTableDialogOpen(false);
    }
  };

  const handleAddEntry = () => {
    if (newEntry.key && newEntry.value) {
      const entry = {
        id: Date.now().toString(),
        ...newEntry
      };
      setNewTable({
        ...newTable,
        entries: [...(newTable.entries || []), entry]
      });
      setNewEntry({ key: '', value: '', description: '' });
    }
  };

  const handleUpdateTable = () => {
    if (selectedTable) {
      updateTable(selectedTable);
      setIsEditTableDialogOpen(false);
      setSelectedTable(null);
    }
  };

  const handleDeleteTable = (tableId: string) => {
    if (confirm('Are you sure you want to delete this table? This action cannot be undone.')) {
      deleteTable(tableId);
    }
  };

  const getCategoryIcon = (category: ReferenceTable['category']) => {
    switch (category) {
      case 'Fee Calculation':
        return <Calculator className="w-5 h-5 text-primary" />;
      case 'Project Types':
        return <Building2 className="w-5 h-5 text-secondary" />;
      case 'Service Types':
        return <FileText className="w-5 h-5 text-accent" />;
      case 'Rate Categories':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6" />
          <h1 className="text-h1">Rate Tables</h1>
        </div>
        <button
          onClick={() => setIsNewTableDialogOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Table</span>
        </button>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
          <input
            type="text"
            placeholder="Search tables..."
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-card-muted"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Loading reference tables...</p>
          </div>
        ) : error ? (
          <div className="col-span-2 text-center py-8 text-destructive">
            <p>Error loading reference tables: {error.message}</p>
          </div>
        ) : (
          <>
        <StateCostIndexTable />
        
        {tables.map((table) => (
          <Card key={table.id} className="bg-card text-card-foreground">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                {getCategoryIcon(table.category)}
                <div>
                  <CardTitle className="text-lg font-semibold">{table.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{table.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedTable(table);
                    setIsEditTableDialogOpen(true);
                  }}
                  className="p-2 hover:bg-muted/10 rounded-full transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDeleteTable(table.id)}
                  className="p-2 hover:bg-muted/10 rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{table.description}</p>
              <div className="space-y-2">
                {table.entries.map((entry, index) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/5 rounded-md border border-[#4DB6AC]/20">
                    <div className="flex-1 mr-2">
                      <div className="font-medium">
                        {entry.key}
                        {table.id === '1' && (
                          <span className="ml-2 text-sm text-primary font-mono">
                            ${buildingTypes.find(type => type.key === entry.key)?.rate}/sq.ft
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">{entry.description}</div>
                    </div>
                    <div className="font-mono text-sm bg-primary/10 px-3 py-1 rounded whitespace-nowrap">
                      {entry.value}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
          </>
        )}
      </div>

      {/* New Table Dialog */}
      <Dialog open={isNewTableDialogOpen} onOpenChange={setIsNewTableDialogOpen} >
        <DialogContent className="bg-card text-card-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Rate Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Table Name
              </label>
              <input
                type="text"
                value={newTable.name || ''}
                onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-card-muted"
                placeholder="Enter table name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Category
              </label>
              <select
                value={newTable.category}
                onChange={(e) => setNewTable({ ...newTable, category: e.target.value as ReferenceTable['category'] })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
              >
                <option value="Fee Calculation">Fee Calculation</option>
                <option value="Project Types">Project Types</option>
                <option value="Service Types">Service Types</option>
                <option value="Rate Categories">Construction Rates</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Description
              </label>
              <textarea
                value={newTable.description || ''}
                onChange={(e) => setNewTable({ ...newTable, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-card-muted"
                rows={3}
                placeholder="Enter table description"
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium mb-3">Table Entries</h3>
              <div className="space-y-4">
                {newTable.entries?.map((entry, index) => (
                  <div key={entry.id} className="flex items-center gap-2 p-2 bg-muted/5 rounded-md">
                    <div className="flex-1 font-medium">{entry.key}</div>
                    <div className="font-mono text-sm">{entry.value}</div>
                    <button
                      onClick={() => {
                        setNewTable({
                          ...newTable,
                          entries: newTable.entries?.filter((_, i) => i !== index)
                        });
                      }}
                      className="p-1 hover:bg-muted/10 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ))}

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={newEntry.key}
                          onChange={(e) => setNewEntry({ ...newEntry, key: e.target.value })}
                          placeholder="Name"
                          className="w-full px-3 py-2 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                        />
                      </div>
                      <input
                        type="text"
                        value={newEntry.value}
                        onChange={(e) => setNewEntry({ ...newEntry, value: e.target.value })}
                        placeholder="Code"
                        className="px-3 py-2 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                      />
                    </div>
                    <input
                      type="text"
                      value={newEntry.description || ''}
                      onChange={(e) => {
                        // Extract rate if description contains rate information
                        const desc = e.target.value;
                        let rate = '';
                        const rateMatch = desc.match(/\$(\d+(\.\d+)?)/);
                        if (rateMatch) {
                          rate = rateMatch[1];
                        }
                        
                        setNewEntry({ 
                          ...newEntry, 
                          description: desc,
                          rate: rate ? parseFloat(rate) : undefined
                        });
                      }}
                      placeholder="Description (optional)"
                      className="w-full mt-2 px-3 py-2 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                    />
                  </div>
                  <button
                    onClick={handleAddEntry}
                    className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Add Entry
                  </button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsNewTableDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium bg-muted/10 hover:bg-muted/20 rounded-md transition-colors text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTable}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-2"
            >
              Create Table
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog open={isEditTableDialogOpen} onOpenChange={setIsEditTableDialogOpen}>
        <DialogContent className="bg-card text-card-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Reference Table</DialogTitle>
          </DialogHeader>
          {selectedTable && (
            <div className="space-y-4 py-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Table Name
                </label>
                <input
                  type="text"
                  value={selectedTable.name}
                  onChange={(e) => setSelectedTable({ ...selectedTable, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Category
                </label>
                <select
                  value={selectedTable.category}
                  onChange={(e) => setSelectedTable({ ...selectedTable, category: e.target.value as ReferenceTable['category'] })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                >
                  <option value="Fee Calculation">Fee Calculation</option>
                  <option value="Project Types">Project Types</option>
                  <option value="Service Types">Service Types</option>
                  <option value="Rate Categories">Construction Rates</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={selectedTable.description}
                  onChange={(e) => setSelectedTable({ ...selectedTable, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
                  rows={3}
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-2">Table Entries</h3>
                <div className="space-y-2">
                  {selectedTable.entries.map((entry, index) => (
                    <div key={entry.id} className="flex items-center gap-2">
                      <div className="flex-1 mr-2">
                        <input
                          type="text"
                          value={entry.key || ''}
                          onChange={(e) => {
                            const newEntries = [...selectedTable.entries];
                            newEntries[index] = { ...entry, key: e.target.value };
                            setSelectedTable({ ...selectedTable, entries: newEntries });
                          }}
                          className="w-full px-3 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted-foreground"
                        />
                      </div>
                      <input
                        type="text"
                        value={entry.value || ''}
                        onChange={(e) => {
                          const newEntries = [...selectedTable.entries];
                          newEntries[index] = { ...entry, value: e.target.value };
                          setSelectedTable({ ...selectedTable, entries: newEntries });
                        }}
                        className="w-32 px-3 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted-foreground"
                      />
                      <button
                        onClick={() => {
                          const newEntries = selectedTable.entries.filter((_, i) => i !== index);
                          setSelectedTable({ ...selectedTable, entries: newEntries });
                        }}
                        className="p-2 hover:bg-muted/10 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                  <div className="w-full">
                    <div className="mt-2">
                      <input
                        type="text"
                        value={entry.description || ''}
                        onChange={(e) => {
                          const newEntries = [...selectedTable.entries];
                          newEntries[index] = { ...entry, description: e.target.value };
                          setSelectedTable({ ...selectedTable, entries: newEntries });
                        }}
                        className="w-full px-3 py-2 border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground placeholder:text-muted-foreground"
                        placeholder="Description (optional)"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newEntry = {
                        id: Date.now().toString(),
                        key: 'New Item',
                        value: 'CODE', 
                        description: ''
                      };
                      setSelectedTable(prev => ({
                        ...selectedTable,
                        entries: [...selectedTable.entries, newEntry]
                      }));
                    }}
                    className="w-full px-3 py-2 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Entry
                  </button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => setIsEditTableDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium bg-muted/10 hover:bg-muted/20 rounded-md transition-colors text-foreground dark:text-[#E5E7EB]"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateTable}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-2 dark:text-black"
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}