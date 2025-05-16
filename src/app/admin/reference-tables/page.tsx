"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Calculator, Building2, DollarSign, Edit2, Trash2, MapPin, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { useReferenceTables, type ReferenceTable, type ReferenceTableEntry } from './hooks/useReferenceTables';
import { StateCostIndexTable } from './state-cost-index';
import { ConstructionCostsTable } from './construction-costs';
import { ProjectTypesTable } from './project-types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Define table categories
export type TableCategory = ReferenceTable['category'];

// Table configuration type
type TableConfig = {
  id: string;
  name: string;
  category: TableCategory;
  component: React.ComponentType;
  description: string;
  icon: React.ReactNode;
};

// Available tables configuration
const AVAILABLE_TABLES: TableConfig[] = [
  {
    id: 'state-cost-index',
    name: 'State Cost Index',
    category: 'Cost Indices',
    component: StateCostIndexTable,
    description: 'View and manage state cost indices for different metro areas.',
    icon: <MapPin className="w-5 h-5 text-primary" />
  },
  {
    id: 'construction-costs',
    name: 'Construction Costs',
    category: 'Construction Costs',
    component: ConstructionCostsTable,
    description: 'View and manage construction costs for different building types and categories.',
    icon: <Building2 className="w-5 h-5 text-secondary" />
  },
  {
    id: 'project-types',
    name: 'Project Types',
    category: 'Project Types',
    component: ProjectTypesTable,
    description: 'View and manage different types of projects in the system.',
    icon: <ClipboardList className="w-5 h-5 text-primary" />
  }
];

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
  const [selectedCategory, setSelectedCategory] = useState<TableCategory>('Cost Indices');
  const [isNewTableDialogOpen, setIsNewTableDialogOpen] = useState(false);
  const [isEditTableDialogOpen, setIsEditTableDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<ReferenceTable | null>(null);
  const [editingTable, setEditingTable] = useState<Partial<ReferenceTable>>({});
  const [newTable, setNewTable] = useState<Partial<ReferenceTable>>({
    category: 'Fee Calculation',
    entries: []
  });
  const [newEntry, setNewEntry] = useState<{ key: string; value: string; description: string }>({
    key: '',
    value: '',
    description: ''
  });

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/dashboard');
    }
  }, [isAdmin, router]);

  // Get tables for the selected category
  const categoryTables = AVAILABLE_TABLES.filter(table => table.category === selectedCategory);
  const customTables = tables.filter(table => table.category === selectedCategory);

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
      setNewTable(prev => ({
        ...prev,
        entries: [...(prev.entries || []), {
          id: crypto.randomUUID(),
          key: newEntry.key,
          value: newEntry.value,
          description: newEntry.description
        }]
      }));
      setNewEntry({ key: '', value: '', description: '' });
    }
  };

  const handleEditTable = () => {
    if (selectedTable && editingTable.name && editingTable.category) {
      const updatedTable: ReferenceTable = {
        id: selectedTable.id,
        name: editingTable.name,
        category: editingTable.category,
        description: editingTable.description || '',
        entries: editingTable.entries || selectedTable.entries
      };
      updateTable(updatedTable);
      setIsEditTableDialogOpen(false);
      setSelectedTable(null);
      setEditingTable({});
    }
  };

  const handleDeleteTable = (tableId: string) => {
    if (confirm('Are you sure you want to delete this table? This action cannot be undone.')) {
      deleteTable(tableId);
    }
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar Navigation */}
      <div className="w-64 shrink-0">
        <div className="sticky top-6">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-6 h-6" />
            <h1 className="text-h1">Reference Tables</h1>
          </div>
          <nav className="space-y-1">
            <Tabs defaultValue={selectedCategory} onValueChange={(value) => setSelectedCategory(value as TableCategory)} orientation="vertical" className="w-full">
              <TabsList className="flex flex-col h-auto space-y-1 bg-transparent p-0 border-none">
                <TabsTrigger 
                  value="Cost Indices"
                  className="w-full justify-start px-4 py-3 text-base font-medium text-muted-foreground transition-all hover:bg-muted/10 hover:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:text-foreground rounded-md"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Cost Indices
                </TabsTrigger>
                <TabsTrigger 
                  value="Fee Calculation"
                  className="w-full justify-start px-4 py-3 text-base font-medium text-muted-foreground transition-all hover:bg-muted/10 hover:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:text-foreground rounded-md"
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Fee Calculation
                </TabsTrigger>
                <TabsTrigger 
                  value="Project Types"
                  className="w-full justify-start px-4 py-3 text-base font-medium text-muted-foreground transition-all hover:bg-muted/10 hover:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:text-foreground rounded-md"
                >
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Project Types
                </TabsTrigger>
                <TabsTrigger 
                  value="Service Types"
                  className="w-full justify-start px-4 py-3 text-base font-medium text-muted-foreground transition-all hover:bg-muted/10 hover:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:text-foreground rounded-md"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Service Types
                </TabsTrigger>
                <TabsTrigger 
                  value="Rate Categories"
                  className="w-full justify-start px-4 py-3 text-base font-medium text-muted-foreground transition-all hover:bg-muted/10 hover:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:text-foreground rounded-md"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Rate Categories
                </TabsTrigger>
                <TabsTrigger 
                  value="Construction Costs"
                  className="w-full justify-start px-4 py-3 text-base font-medium text-muted-foreground transition-all hover:bg-muted/10 hover:text-foreground data-[state=active]:bg-muted/20 data-[state=active]:text-foreground rounded-md"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Construction Costs
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setIsNewTableDialogOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Table</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Loading reference tables...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            <p>Error loading reference tables: {error.message}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Built-in tables */}
            {categoryTables.map((table) => (
              ['state-cost-index', 'construction-costs', 'project-types'].includes(table.id) ? (
                <div key={table.id} className="bg-card text-card-foreground rounded-lg border p-6">
                  <table.component />
                </div>
              ) : (
                <Card key={table.id} className="bg-card text-card-foreground">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {table.icon}
                      <div>
                        <CardTitle className="text-lg font-semibold">{table.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{table.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <table.component />
                  </CardContent>
                </Card>
              )
            ))}

            {/* Custom tables */}
            {customTables.map((table) => (
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
                    {table.entries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/5 rounded-md border border-[#4DB6AC]/20">
                        <div className="flex-1 mr-2">
                          <div className="font-medium">{entry.key}</div>
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
          </div>
        )}
      </div>

      {/* New Table Dialog */}
      <Dialog open={isNewTableDialogOpen} onOpenChange={setIsNewTableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Reference Table</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={newTable.name || ''}
                onChange={(e) => setNewTable(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter table name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={newTable.category || 'Fee Calculation'}
                onChange={(e) => setNewTable(prev => ({ ...prev, category: e.target.value as TableCategory }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Fee Calculation">Fee Calculation</option>
                <option value="Project Types">Project Types</option>
                <option value="Service Types">Service Types</option>
                <option value="Rate Categories">Rate Categories</option>
                <option value="Cost Indices">Cost Indices</option>
                <option value="Construction Costs">Construction Costs</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={newTable.description || ''}
                onChange={(e) => setNewTable(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter table description"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Entries</label>
              <div className="space-y-2">
                {(newTable.entries || []).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-2 p-2 bg-muted/5 rounded-md">
                    <div className="flex-1">
                      <div className="font-medium">{entry.key}</div>
                      <div className="text-sm text-muted-foreground">{entry.description}</div>
                    </div>
                    <div className="font-mono text-sm bg-primary/10 px-2 py-1 rounded">
                      {entry.value}
                    </div>
                    <button
                      onClick={() => {
                        setNewTable(prev => ({
                          ...prev,
                          entries: (prev.entries || []).filter(e => e.id !== entry.id)
                        }));
                      }}
                      className="p-1 hover:bg-muted/10 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newEntry.key}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, key: e.target.value }))}
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Key"
                  />
                  <input
                    type="text"
                    value={newEntry.value}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, value: e.target.value }))}
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Value"
                  />
                  <button
                    onClick={handleAddEntry}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <input
                  type="text"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Description (optional)"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsNewTableDialogOpen(false)}
              className="px-4 py-2 border rounded-md hover:bg-muted/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddTable}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Create Table
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog 
        open={isEditTableDialogOpen} 
        onOpenChange={(open: boolean) => {
          setIsEditTableDialogOpen(open);
          if (!open) {
            setSelectedTable(null);
            setEditingTable({});
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reference Table</DialogTitle>
          </DialogHeader>
          {selectedTable && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={editingTable.name ?? selectedTable.name}
                  onChange={(e) => setEditingTable(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter table name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={editingTable.category ?? selectedTable.category}
                  onChange={(e) => setEditingTable(prev => ({ ...prev, category: e.target.value as TableCategory }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Fee Calculation">Fee Calculation</option>
                  <option value="Project Types">Project Types</option>
                  <option value="Service Types">Service Types</option>
                  <option value="Rate Categories">Rate Categories</option>
                  <option value="Cost Indices">Cost Indices</option>
                  <option value="Construction Costs">Construction Costs</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editingTable.description ?? selectedTable.description}
                  onChange={(e) => setEditingTable(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter table description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Entries</label>
                <div className="space-y-2">
                  {(editingTable.entries ?? selectedTable.entries).map((entry: ReferenceTableEntry) => (
                    <div key={entry.id} className="flex items-center gap-2 p-2 bg-muted/5 rounded-md">
                      <div className="flex-1">
                        <div className="font-medium">{entry.key}</div>
                        <div className="text-sm text-muted-foreground">{entry.description}</div>
                      </div>
                      <div className="font-mono text-sm bg-primary/10 px-2 py-1 rounded">
                        {entry.value}
                      </div>
                      <button
                        onClick={() => {
                          setEditingTable(prev => ({
                            ...prev,
                            entries: (prev.entries ?? selectedTable.entries).filter(e => e.id !== entry.id)
                          }));
                        }}
                        className="p-1 hover:bg-muted/10 rounded-full transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newEntry.key}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, key: e.target.value }))}
                      className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Key"
                    />
                    <input
                      type="text"
                      value={newEntry.value}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, value: e.target.value }))}
                      className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Value"
                    />
                    <button
                      onClick={() => {
                        if (newEntry.key && newEntry.value && selectedTable) {
                          setEditingTable(prev => ({
                            ...prev,
                            entries: [...(prev.entries ?? selectedTable.entries), {
                              id: crypto.randomUUID(),
                              key: newEntry.key,
                              value: newEntry.value,
                              description: newEntry.description
                            }]
                          }));
                          setNewEntry({ key: '', value: '', description: '' });
                        }
                      }}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Description (optional)"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => {
                setIsEditTableDialogOpen(false);
                setSelectedTable(null);
                setEditingTable({});
              }}
              className="px-4 py-2 border rounded-md hover:bg-muted/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEditTable}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function getCategoryIcon(category: TableCategory) {
  switch (category) {
    case 'Fee Calculation':
      return <Calculator className="w-5 h-5 text-primary" />;
    case 'Project Types':
      return <ClipboardList className="w-5 h-5 text-secondary" />;
    case 'Service Types':
      return <FileText className="w-5 h-5 text-accent" />;
    case 'Rate Categories':
      return <DollarSign className="w-5 h-5 text-green-500" />;
    case 'Cost Indices':
      return <MapPin className="w-5 h-5 text-primary" />;
    case 'Construction Costs':
      return <Building2 className="w-5 h-5 text-secondary" />;
    default:
      return <FileText className="w-5 h-5" />;
  }
}