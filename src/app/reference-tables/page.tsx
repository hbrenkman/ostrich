'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StateCostIndexTable } from "@/app/admin/reference-tables/state-cost-index";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calculator, Building2, DollarSign, MapPin } from 'lucide-react';
import { ConstructionCostsTable } from "@/app/admin/reference-tables/construction-costs";
import { ProjectTypesTable } from "@/app/admin/reference-tables/project-types";

export type ReferenceTableType = 'state-cost-index' | 'construction-costs' | 'project-types';

interface TableConfig {
  id: ReferenceTableType;
  name: string;
  description: string;
  component: React.ComponentType<{ showContainer?: boolean }>;
  showContainer: boolean;
  icon: React.ReactNode;
}

const availableTables = [
  {
    id: "state-cost-index",
    name: "State Cost Index",
    description: "View and manage state cost indices and metro areas",
    component: StateCostIndexTable,
    showContainer: true,
    icon: <MapPin className="w-5 h-5 text-primary" />
  },
  {
    id: "construction-costs",
    name: "Construction Costs",
    description: "View and manage construction costs by building type",
    component: ConstructionCostsTable,
    showContainer: true,
    icon: <Building2 className="w-5 h-5 text-primary" />
  },
  {
    id: "project-types",
    name: "Project Types",
    description: "View and manage different types of projects in the system",
    component: ProjectTypesTable,
    showContainer: true,
    icon: <FileText className="w-5 h-5 text-primary" />
  }
] as const;

type TableId = typeof availableTables[number]['id'];

export default function ReferenceTablesPage() {
  const [selectedTable, setSelectedTable] = useState<ReferenceTableType>('state-cost-index');

  const currentTable = availableTables.find(table => table.id === selectedTable);

  return (
    <div className="container mx-auto py-6 space-y-6 bg-green-100">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            <h1 className="text-3xl font-bold">Reference Tables</h1>
          </div>
        </div>
        <Tabs defaultValue="view" className="w-full">
          <div className="border-b border-border">
            <TabsList className="h-12 space-x-8 bg-transparent p-0">
              <TabsTrigger
                value="view"
                className="relative h-12 px-4 text-base font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span>View</span>
              </TabsTrigger>
              <TabsTrigger
                value="edit"
                className="relative h-12 px-4 text-base font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-foreground"
              >
                <Calculator className="w-4 h-4 mr-2" />
                <span>Edit</span>
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="mt-6">
            <TabsContent value="view" className="bg-green-100">
              {currentTable && (
                <currentTable.component showContainer={true} />
              )}
            </TabsContent>
            <TabsContent value="edit">
              {/* Add edit functionality here when needed */}
              <p className="text-muted-foreground">Edit functionality coming soon.</p>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
} 