'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Calculator, DollarSign, Plus, Search } from 'lucide-react';

interface BuildingCategory {
  id: string;
  name: string;
  description: string;
}

interface BuildingType {
  id: string;
  category_id: string;
  name: string;
  height: string;
  description: string;
  is_active: boolean;
}

interface CostType {
  id: string;
  name: string;
  description: string;
}

interface ConstructionCost {
  id: string;
  building_type_id: string;
  year: number;
  cost_type: string;
  percentage: number | null;
  cost_per_sqft: number | null;
  core_and_shell_cost_per_sqft: number | null;
}

interface CostBreakdown {
  category: string;
  type: string;
  year: number;
  total: {
    cost: number;
    shell: number;
  };
  mechanical: {
    cost: number;
    shell: number;
  };
  plumbing: {
    cost: number;
    shell: number;
  };
  electrical: {
    cost: number;
    shell: number;
  };
}

interface ConstructionCostsTableProps {
  showContainer?: boolean;
}

export function ConstructionCostsTable({ showContainer = true }: ConstructionCostsTableProps) {
  const [categories, setCategories] = useState<BuildingCategory[]>([]);
  const [buildingTypes, setBuildingTypes] = useState<BuildingType[]>([]);
  const [costTypes, setCostTypes] = useState<CostType[]>([]);
  const [costs, setCosts] = useState<ConstructionCost[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, typesRes, costTypesRes, costsRes] = await Promise.all([
        fetch('/api/construction-costs/categories'),
        fetch('/api/construction-costs/building-types'),
        fetch('/api/construction-costs/cost-types'),
        fetch('/api/construction-costs')
      ]);

      if (!categoriesRes.ok || !typesRes.ok || !costTypesRes.ok || !costsRes.ok) {
        throw new Error('Failed to fetch construction costs data');
      }

      const [categoriesData, typesData, costTypesData, costsData] = await Promise.all([
        categoriesRes.json(),
        typesRes.json(),
        costTypesRes.json(),
        costsRes.json()
      ]);

      console.log('Fetched Data:', {
        categories: categoriesData,
        buildingTypes: typesData,
        costTypes: costTypesData,
        costs: costsData
      });

      setCategories(categoriesData);
      setBuildingTypes(typesData);
      setCostTypes(costTypesData);
      setCosts(costsData);

      if (categoriesData.length > 0) {
        setSelectedCategory(categoriesData[0].name);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBuildingTypes = () => {
    // Find the selected category's ID
    const selectedCategoryId = categories.find(c => c.name === selectedCategory)?.id;
    
    const filtered = buildingTypes.filter(type => 
      (!selectedCategoryId || type.category_id === selectedCategoryId)
    );
    
    console.log('Filtered Building Types:', {
      selectedCategory,
      selectedCategoryId,
      allBuildingTypes: buildingTypes,
      filteredTypes: filtered,
      categoryIds: categories.map(c => ({ id: c.id, name: c.name }))
    });
    
    return filtered;
  };

  const getCostBreakdowns = (): CostBreakdown[] => {
    const filteredTypes = getFilteredBuildingTypes();
    
    return filteredTypes.map(type => {
      const typeCosts = costs.filter(cost => cost.building_type_id === type.id && cost.year === selectedYear);
      
      // Log the raw costs for this building type
      console.log(`Raw costs for ${type.name}:`, typeCosts.map(cost => ({
        type: cost.cost_type,
        cost: cost.cost_per_sqft,
        shell: cost.core_and_shell_cost_per_sqft
      })));
      
      // Get all costs
      const total = typeCosts.find(cost => cost.cost_type.toLowerCase() === 'total');
      const mechanical = typeCosts.find(cost => cost.cost_type.toLowerCase() === 'mechanical');
      const plumbing = typeCosts.find(cost => cost.cost_type.toLowerCase() === 'plumbing');
      const electrical = typeCosts.find(cost => cost.cost_type.toLowerCase() === 'electrical');

      // Log the found costs
      console.log(`Processed costs for ${type.name}:`, {
        total: {
          cost: total?.cost_per_sqft,
          shell: total?.core_and_shell_cost_per_sqft
        },
        mechanical: {
          cost: mechanical?.cost_per_sqft,
          shell: mechanical?.core_and_shell_cost_per_sqft
        },
        plumbing: {
          cost: plumbing?.cost_per_sqft,
          shell: plumbing?.core_and_shell_cost_per_sqft
        },
        electrical: {
          cost: electrical?.cost_per_sqft,
          shell: electrical?.core_and_shell_cost_per_sqft
        }
      });

      return {
        category: categories.find(c => c.id === type.category_id)?.name ?? '',
        type: type.name,
        year: selectedYear,
        total: {
          cost: total?.cost_per_sqft ?? 0,
          shell: total?.core_and_shell_cost_per_sqft ?? 0
        },
        mechanical: {
          cost: mechanical?.cost_per_sqft ?? 0,
          shell: mechanical?.core_and_shell_cost_per_sqft ?? 0
        },
        plumbing: {
          cost: plumbing?.cost_per_sqft ?? 0,
          shell: plumbing?.core_and_shell_cost_per_sqft ?? 0
        },
        electrical: {
          cost: electrical?.cost_per_sqft ?? 0,
          shell: electrical?.core_and_shell_cost_per_sqft ?? 0
        }
      };
    }).filter(breakdown => 
      breakdown.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      breakdown.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Add effect to log state changes
  useEffect(() => {
    console.log('State Updated:', {
      selectedCategory,
      buildingTypes,
      categories,
      costBreakdowns: getCostBreakdowns()
    });
  }, [selectedCategory, buildingTypes, categories]);

  const costBreakdowns = getCostBreakdowns();

  const controls = (
    <div className="flex items-center gap-4">
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
        className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="">All Categories</option>
        {categories.map(category => (
          <option key={category.id} value={category.name}>
            {category.name}
          </option>
        ))}
      </select>
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(Number(e.target.value))}
        className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value={2025}>2025</option>
        {/* Add more years as needed */}
      </select>
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <input
          type="text"
          placeholder="Search building types..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
        />
      </div>
    </div>
  );

  const content = (
    <>
      {showContainer ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Construction Costs</h2>
              <p className="text-sm text-muted-foreground">Construction costs by building type and year</p>
            </div>
          </div>
          <div className="flex items-center gap-4 pb-4 border-b">
            {controls}
          </div>
        </div>
      ) : (
        <div className="pb-4 border-b">
          {controls}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading construction costs...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          <p>Error loading construction costs: {error.message}</p>
        </div>
      ) : costBreakdowns.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No construction costs found matching your search criteria.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {costBreakdowns.map((breakdown) => (
            <div key={`${breakdown.category}-${breakdown.type}`} className="border border-[#4DB6AC]/20 rounded-md overflow-hidden">
              <div className="flex items-start justify-between p-3 bg-muted/5 hover:bg-muted/10">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <div>
                    <div className="font-medium">{breakdown.type}</div>
                    <div className="text-sm text-muted-foreground">{breakdown.category}</div>
                  </div>
                </div>
                <div className="flex flex-col">
                  {/* Column Headers */}
                  <div className="grid grid-cols-3 gap-4 mb-2">
                    <div className="text-sm font-medium text-center">Cost Category</div>
                    <div className="text-sm font-medium text-center">Total</div>
                    <div className="text-sm font-medium text-center">Shell</div>
                  </div>
                  {/* Cost Rows */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid grid-rows-4 gap-2">
                      <div className="text-sm font-medium text-right">Total:</div>
                      <div className="text-sm font-medium text-right">Mechanical:</div>
                      <div className="text-sm font-medium text-right">Plumbing:</div>
                      <div className="text-sm font-medium text-right">Electrical:</div>
                    </div>
                    <div className="grid grid-rows-4 gap-2">
                      <div className="text-sm text-right">${breakdown.total.cost.toFixed(2)}</div>
                      <div className="text-sm text-right">${breakdown.mechanical.cost.toFixed(2)}</div>
                      <div className="text-sm text-right">${breakdown.plumbing.cost.toFixed(2)}</div>
                      <div className="text-sm text-right">${breakdown.electrical.cost.toFixed(2)}</div>
                    </div>
                    <div className="grid grid-rows-4 gap-2">
                      <div className="text-sm text-right">${breakdown.total.shell.toFixed(2)}</div>
                      <div className="text-sm text-right">${breakdown.mechanical.shell.toFixed(2)}</div>
                      <div className="text-sm text-right">${breakdown.plumbing.shell.toFixed(2)}</div>
                      <div className="text-sm text-right">${breakdown.electrical.shell.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return showContainer ? (
    <div className="space-y-4">
      {content}
    </div>
  ) : content;
} 