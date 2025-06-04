'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Search, Plus, Edit2, Trash2, Settings2, LineChart, ChevronUp, ChevronDown, Save } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  ChartType,
  TooltipItem,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { toast } from 'sonner';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DesignFeeScale {
  id: number;
  construction_cost: number;
  prime_consultant_rate: number;
  fraction_of_prime_rate_mechanical: number;
  fraction_of_prime_rate_plumbing: number;
  fraction_of_prime_rate_electrical: number;
  fraction_of_prime_rate_structural: number;
}

interface DesignFeeScaleTableProps {
  showContainer?: boolean;
}

type DisciplineType = 'mechanical' | 'plumbing' | 'electrical' | 'structural';

interface BulkEditState {
  discipline: DisciplineType;
  rate: number;
}

// Add type for tooltip formatter
type TooltipFormatter = (value: number, name: string) => [string, string];
type LabelFormatter = (value: number) => string;

interface PointControl {
  x: number;
  y: number;
  index: number;
  scale: DesignFeeScale;
}

interface ModifiedPoint {
  id: number;
  originalRate: number;
  newRate: number;
}

interface ChartDataPoint {
  x: number;
  y: number;
  index: number;
  scale: DesignFeeScale;
}

export function DesignFeeScaleTable({ showContainer = true }: DesignFeeScaleTableProps) {
  const [feeScales, setFeeScales] = useState<DesignFeeScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedScale, setSelectedScale] = useState<DesignFeeScale | null>(null);
  const [editingScale, setEditingScale] = useState<Partial<DesignFeeScale>>({});
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [isGraphDialogOpen, setIsGraphDialogOpen] = useState(false);
  const [bulkEditState, setBulkEditState] = useState<BulkEditState>({
    discipline: 'mechanical',
    rate: 0
  });
  const [selectedPoint, setSelectedPoint] = useState<PointControl | null>(null);
  const chartRef = useRef<ChartJS<'line'>>(null);
  const controlPanelRef = useRef<HTMLDivElement>(null);
  const [modifiedPoints, setModifiedPoints] = useState<ModifiedPoint[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchFeeScales();
  }, []);

  const fetchFeeScales = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/design-fee-scale', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        next: { revalidate: 0 }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch design fee scales');
      }

      const data = await response.json();
      console.log('Fetched design fee scales:', data);
      setFeeScales(data);
      // Update chart data if it exists
      if (chartRef.current) {
        updateChartData(data);
      }
    } catch (err) {
      console.error('Error fetching design fee scales:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getFilteredFeeScales = () => {
    return feeScales.filter(scale => 
      scale.construction_cost.toString().includes(searchQuery) ||
      scale.prime_consultant_rate.toString().includes(searchQuery)
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const handleEdit = (scale: DesignFeeScale) => {
    setSelectedScale(scale);
    setEditingScale(scale);
    setIsEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedScale || !editingScale) return;

    try {
      // TODO: Implement save functionality when API endpoint is available
      console.log('Saving edited scale:', editingScale);
      setIsEditDialogOpen(false);
      setSelectedScale(null);
      setEditingScale({});
      await fetchFeeScales(); // Refresh data after save
    } catch (err) {
      console.error('Error saving design fee scale:', err);
      setError(err instanceof Error ? err : new Error('Failed to save changes'));
    }
  };

  const handleBulkEdit = async () => {
    if (!bulkEditState.rate) return;

    try {
      const updatedScales = feeScales.map(scale => {
        const update: Partial<DesignFeeScale> = {};
        switch (bulkEditState.discipline) {
          case 'mechanical':
            update.fraction_of_prime_rate_mechanical = bulkEditState.rate;
            break;
          case 'plumbing':
            update.fraction_of_prime_rate_plumbing = bulkEditState.rate;
            break;
          case 'electrical':
            update.fraction_of_prime_rate_electrical = bulkEditState.rate;
            break;
          case 'structural':
            update.fraction_of_prime_rate_structural = bulkEditState.rate;
            break;
        }
        return { ...scale, ...update };
      });

      // TODO: Implement API endpoint for bulk update
      console.log('Bulk updating scales:', updatedScales);
      
      // For now, just update the local state
      setFeeScales(updatedScales);
      setIsBulkEditDialogOpen(false);
      setBulkEditState({ discipline: 'mechanical', rate: 0 });
    } catch (err) {
      console.error('Error performing bulk edit:', err);
      setError(err instanceof Error ? err : new Error('Failed to perform bulk edit'));
    }
  };

  const handlePointClick = (event: any, elements: any[]) => {
    if (elements.length > 0) {
      const element = elements[0];
      const index = element.index;
      const scale = feeScales[index];
      const chart = chartRef.current;
      
      if (chart) {
        const meta = chart.getDatasetMeta(0);
        const point = meta.data[element.index];
        
        setSelectedPoint({
          x: point.x,
          y: point.y,
          index,
          scale
        });
      }
    } else {
      setSelectedPoint(null);
    }
  };

  const updateChartData = (scales: DesignFeeScale[]) => {
    if (chartRef.current) {
      const chart = chartRef.current;
      chart.data.datasets[0].data = scales.map(scale => ({
        x: scale.construction_cost,
        y: scale.prime_consultant_rate
      }));
      chart.update();
    }
  };

  const handlePointAdjust = async (direction: 'up' | 'down') => {
    if (!selectedPoint) return;

    const step = 0.01; // Changed from 0.1 to 0.01 for finer control
    const newRate = direction === 'up' 
      ? selectedPoint.scale.prime_consultant_rate + step
      : selectedPoint.scale.prime_consultant_rate - step;

    // Update the local state first
    const updatedScales = [...feeScales];
    updatedScales[selectedPoint.index] = {
      ...selectedPoint.scale,
      prime_consultant_rate: Number(newRate.toFixed(2)) // Changed to 2 decimal places
    };
    setFeeScales(updatedScales);

    // Update chart data
    updateChartData(updatedScales);

    // Track the modification
    setModifiedPoints(prev => {
      const existingMod = prev.find(p => p.id === selectedPoint.scale.id);
      if (existingMod) {
        return prev.map(p => 
          p.id === selectedPoint.scale.id 
            ? { ...p, newRate: Number(newRate.toFixed(2)) }
            : p
        );
      } else {
        return [...prev, {
          id: selectedPoint.scale.id,
          originalRate: selectedPoint.scale.prime_consultant_rate,
          newRate: Number(newRate.toFixed(2))
        }];
      }
    });
    
    // Update the selected point's y value
    setSelectedPoint(prev => prev ? {
      ...prev,
      y: newRate,
      scale: updatedScales[selectedPoint.index]
    } : null);
  };

  const handleManualRateChange = (newRate: string) => {
    if (!selectedPoint) return;

    const parsedRate = parseFloat(newRate);
    if (isNaN(parsedRate)) return;

    // Update the local state first
    const updatedScales = [...feeScales];
    updatedScales[selectedPoint.index] = {
      ...selectedPoint.scale,
      prime_consultant_rate: Number(parsedRate.toFixed(2))
    };
    setFeeScales(updatedScales);

    // Update chart data
    updateChartData(updatedScales);

    // Track the modification
    setModifiedPoints(prev => {
      const existingMod = prev.find(p => p.id === selectedPoint.scale.id);
      if (existingMod) {
        return prev.map(p => 
          p.id === selectedPoint.scale.id 
            ? { ...p, newRate: Number(parsedRate.toFixed(2)) }
            : p
        );
      } else {
        return [...prev, {
          id: selectedPoint.scale.id,
          originalRate: selectedPoint.scale.prime_consultant_rate,
          newRate: Number(parsedRate.toFixed(2))
        }];
      }
    });
    
    // Update the selected point's y value
    setSelectedPoint(prev => prev ? {
      ...prev,
      y: parsedRate,
      scale: updatedScales[selectedPoint.index]
    } : null);
  };

  const handleSaveChanges = async () => {
    if (modifiedPoints.length === 0) return;

    setIsSaving(true);
    const errors: string[] = [];

    try {
      // Save each modified point
      await Promise.all(
        modifiedPoints.map(async (point) => {
          try {
            const response = await fetch('/api/design-fee-scale', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              },
              body: JSON.stringify({
                id: point.id,
                prime_consultant_rate: point.newRate
              })
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.message || 'Failed to update point');
            }
          } catch (err) {
            errors.push(`Failed to update point ${point.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        })
      );

      if (errors.length > 0) {
        throw new Error(errors.join('\n'));
      }

      // Clear modified points
      setModifiedPoints([]);
      
      // Fetch fresh data with cache-busting
      const response = await fetch('/api/design-fee-scale', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        next: { revalidate: 0 }
      });
      
      if (!response.ok) {
        throw new Error('Failed to refresh data after save');
      }
      
      const updatedData = await response.json();
      console.log('Refreshed data after save:', updatedData);
      setFeeScales(updatedData);
      updateChartData(updatedData);
      
      toast.success('Successfully saved all changes');
    } catch (err) {
      console.error('Error saving changes:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (controlPanelRef.current && !controlPanelRef.current.contains(event.target as Node)) {
      setSelectedPoint(null);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Add a refresh effect when the component mounts or when the dialog opens
  useEffect(() => {
    if (isGraphDialogOpen) {
      fetchFeeScales();
    }
  }, [isGraphDialogOpen]);

  const chartData = {
    datasets: [
      {
        label: 'Prime Consultant Rate',
        data: feeScales.map(scale => ({
          x: scale.construction_cost,
          y: scale.prime_consultant_rate
        })),
        borderColor: '#4DB6AC',
        backgroundColor: '#4DB6AC20',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            return `Rate: ${context.parsed.y.toFixed(1)}%`;
          },
          title: (context: TooltipItem<'line'>[]) => {
            const value = context[0].parsed.x;
            return `Construction Cost: ${formatCurrency(value)}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'Construction Cost ($)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        ticks: {
          callback: (value) => formatCurrency(value as number),
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: 'Prime Consultant Rate (%)',
          font: {
            size: 14,
            weight: 'bold'
          }
        },
        ticks: {
          callback: (value) => `${value}%`
        }
      }
    },
    onClick: handlePointClick,
    onHover: (_, elements) => {
      document.body.style.cursor = elements.length ? 'pointer' : 'default';
    },
    interaction: {
      mode: 'nearest',
      intersect: true
    }
  };

  const controls = (
    <div className="flex items-center gap-4">
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder="Search by construction cost..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
        />
      </div>
      <Button
        variant="outline"
        onClick={() => setIsBulkEditDialogOpen(true)}
        className="flex items-center gap-2"
      >
        <Settings2 className="w-4 h-4" />
        Bulk Edit
      </Button>
      <Button
        variant="outline"
        onClick={() => setIsGraphDialogOpen(true)}
        className="flex items-center gap-2"
      >
        <LineChart className="w-4 h-4" />
        View Graph
      </Button>
    </div>
  );

  const content = (
    <>
      {showContainer ? (
        <div className="pb-4 border-b">
          {controls}
        </div>
      ) : (
        <div className="pb-4 border-b">
          {controls}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading design fee scales...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          <p>Error loading design fee scales: {error.message}</p>
        </div>
      ) : getFilteredFeeScales().length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No fee scales found matching your search criteria.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {getFilteredFeeScales().map((scale) => (
            <div key={scale.id} className="border border-[#4DB6AC]/20 rounded-md overflow-hidden">
              <div className="flex items-start justify-between p-4 bg-muted/5 hover:bg-muted/10">
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Construction Cost Bracket</div>
                      <div className="text-lg font-semibold">{formatCurrency(scale.construction_cost)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Prime Consultant Rate</div>
                      <div className="text-lg font-semibold">{formatPercentage(scale.prime_consultant_rate)}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm font-medium mb-1">Mechanical</div>
                      <div className="text-sm">{formatPercentage(scale.fraction_of_prime_rate_mechanical)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Plumbing</div>
                      <div className="text-sm">{formatPercentage(scale.fraction_of_prime_rate_plumbing)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Electrical</div>
                      <div className="text-sm">{formatPercentage(scale.fraction_of_prime_rate_electrical)}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Structural</div>
                      <div className="text-sm">{formatPercentage(scale.fraction_of_prime_rate_structural)}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(scale)}
                    className="hover:bg-muted/20"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Fee Scale</DialogTitle>
          </DialogHeader>
          {selectedScale && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Construction Cost</label>
                <Input
                  type="number"
                  value={editingScale.construction_cost ?? selectedScale.construction_cost}
                  onChange={(e) => setEditingScale(prev => ({ ...prev, construction_cost: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Prime Consultant Rate (%)</label>
                <Input
                  type="number"
                  value={editingScale.prime_consultant_rate ?? selectedScale.prime_consultant_rate}
                  onChange={(e) => setEditingScale(prev => ({ ...prev, prime_consultant_rate: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mechanical Rate (%)</label>
                  <Input
                    type="number"
                    value={editingScale.fraction_of_prime_rate_mechanical ?? selectedScale.fraction_of_prime_rate_mechanical}
                    onChange={(e) => setEditingScale(prev => ({ ...prev, fraction_of_prime_rate_mechanical: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Plumbing Rate (%)</label>
                  <Input
                    type="number"
                    value={editingScale.fraction_of_prime_rate_plumbing ?? selectedScale.fraction_of_prime_rate_plumbing}
                    onChange={(e) => setEditingScale(prev => ({ ...prev, fraction_of_prime_rate_plumbing: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Electrical Rate (%)</label>
                  <Input
                    type="number"
                    value={editingScale.fraction_of_prime_rate_electrical ?? selectedScale.fraction_of_prime_rate_electrical}
                    onChange={(e) => setEditingScale(prev => ({ ...prev, fraction_of_prime_rate_electrical: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Structural Rate (%)</label>
                  <Input
                    type="number"
                    value={editingScale.fraction_of_prime_rate_structural ?? selectedScale.fraction_of_prime_rate_structural}
                    onChange={(e) => setEditingScale(prev => ({ ...prev, fraction_of_prime_rate_structural: Number(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedScale(null);
                setEditingScale({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={isBulkEditDialogOpen} onOpenChange={setIsBulkEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Edit Discipline Rates</DialogTitle>
            <DialogDescription>
              Set a single rate for all entries for a specific discipline. This will update all construction cost brackets.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-1">Discipline</label>
              <Select
                value={bulkEditState.discipline}
                onValueChange={(value) => setBulkEditState(prev => ({ ...prev, discipline: value as DisciplineType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select discipline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mechanical">Mechanical</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="structural">Structural</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rate (%)</label>
              <Input
                type="number"
                step="0.1"
                value={bulkEditState.rate}
                onChange={(e) => setBulkEditState(prev => ({ ...prev, rate: Number(e.target.value) }))}
                className="w-full"
                placeholder="Enter rate percentage"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkEditDialogOpen(false);
                setBulkEditState({ discipline: 'mechanical', rate: 0 });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleBulkEdit}>
              Apply to All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Graph Dialog */}
      <Dialog open={isGraphDialogOpen} onOpenChange={(open) => {
        if (!open && modifiedPoints.length > 0) {
          if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
            setModifiedPoints([]);
            setIsGraphDialogOpen(false);
          }
        } else {
          setIsGraphDialogOpen(open);
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Design Fee Scale Visualization</DialogTitle>
            <DialogDescription>
              Click on a point to adjust its rate. Use the input field's arrows or type a value directly.
              {modifiedPoints.length > 0 && (
                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                  You have {modifiedPoints.length} unsaved change{modifiedPoints.length === 1 ? '' : 's'}.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="relative h-[500px] w-full mt-4">
            <Line ref={chartRef} data={chartData} options={chartOptions} />
            {selectedPoint && (
              <div
                ref={controlPanelRef}
                className="absolute bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                style={{
                  left: `${selectedPoint.x}px`,
                  top: `${selectedPoint.y - 80}px`,
                  transform: 'translateX(-50%)'
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="text-sm font-medium mb-1">
                    Construction Cost: {formatCurrency(selectedPoint.scale.construction_cost)}
                  </div>
                  <Input
                    type="number"
                    value={selectedPoint.scale.prime_consultant_rate.toFixed(2)}
                    onChange={(e) => handleManualRateChange(e.target.value)}
                    className="w-24 h-8 text-center"
                    step="0.01"
                    min="0"
                  />
                  <div className="text-xs text-muted-foreground">
                    Use arrows or type directly
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            {modifiedPoints.length > 0 && (
              <Button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                if (modifiedPoints.length > 0) {
                  if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
                    setModifiedPoints([]);
                    setIsGraphDialogOpen(false);
                  }
                } else {
                  setIsGraphDialogOpen(false);
                }
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return showContainer ? (
    <Card>
      <CardContent>
        {content}
      </CardContent>
    </Card>
  ) : (
    <>
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-5 h-5 text-primary" />
        <div>
          <h2 className="text-lg font-semibold">Design Fee Scale</h2>
          <p className="text-sm text-muted-foreground">View and manage design fee rates based on construction cost brackets.</p>
        </div>
      </div>
      {content}
    </>
  );
} 