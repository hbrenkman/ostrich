import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, DollarSign, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useStateCostIndex } from './hooks/useStateCostIndex';

interface StateCostIndexTableProps {
  showContainer?: boolean;
}

export function StateCostIndexTable({ showContainer = true }: StateCostIndexTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const { stateData, loading, error } = useStateCostIndex();

  useEffect(() => {
    console.log('Component: Current state data:', stateData);
    console.log('Component: Loading state:', loading);
    console.log('Component: Error state:', error);
  }, [stateData, loading, error]);

  const toggleState = (state: string) => {
    const newExpandedStates = new Set(expandedStates);
    if (expandedStates.has(state)) {
      newExpandedStates.delete(state);
    } else {
      newExpandedStates.add(state);
    }
    setExpandedStates(newExpandedStates);
  };

  const filteredStates = stateData.filter(item => 
    item.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.metros.some(metro => metro.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  console.log('Component: Filtered states:', filteredStates);

  const content = (
    <>
      {showContainer && (
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">US States Cost Index</h2>
              <p className="text-sm text-muted-foreground">Construction cost index by location (National Average = 100)</p>
            </div>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search states or metros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-muted-foreground">Loading state cost index data...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          <p>Error loading state cost index data: {error.message}</p>
        </div>
      ) : filteredStates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No states found matching your search criteria.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredStates.map((stateData) => (
            <div key={stateData.state} className="border border-[#4DB6AC]/20 rounded-md overflow-hidden">
              <div
                className="flex items-center justify-between p-3 bg-muted/5 cursor-pointer hover:bg-muted/10"
                onClick={() => toggleState(stateData.state)}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-medium">{stateData.state}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-muted-foreground">
                    {stateData.metros.length} metro area{stateData.metros.length !== 1 ? 's' : ''}
                  </div>
                  {expandedStates.has(stateData.state) ? (
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>
              </div>
              {expandedStates.has(stateData.state) && (
                <div className="bg-background border-t border-[#4DB6AC]/20">
                  {stateData.metros.map((metro) => (
                    <div 
                      key={`${stateData.state}-${metro.name}`}
                      className="flex items-center justify-between p-3 border-b border-[#4DB6AC]/10 last:border-b-0"
                    >
                      <div className="flex items-center gap-2 pl-6">
                        <span className={metro.name === 'Other' ? 'font-medium' : ''}>{metro.name}</span>
                      </div>
                      <div className="bg-primary/10 px-3 py-1 rounded">
                        <span className="font-mono font-medium">{metro.index.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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