'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useStateCostIndex } from '@/hooks/useStateCostIndex';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface MetroArea {
  name: string;
  index: number;
}

interface StateData {
  state: string;
  metros: MetroArea[];
}

export function StateCostIndex() {
  const { data: states, loading, error } = useStateCostIndex();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter states based on search term
  const filteredStates = states.filter((state: StateData) => 
    state.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    state.metros.some((metro: MetroArea) => 
      metro.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Search states or metro areas..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      <Accordion type="single" collapsible className="w-full">
        {filteredStates.map((state: StateData) => (
          <AccordionItem key={state.state} value={state.state}>
            <AccordionTrigger className="text-lg font-semibold">
              {state.state}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid gap-4 p-4">
                {state.metros.map((metro: MetroArea) => (
                  <Card key={metro.name}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{metro.name}</span>
                        <span className="text-lg font-semibold">{metro.index}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
} 