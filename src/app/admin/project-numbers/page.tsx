"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

export default function ProjectNumbersPage() {
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [nextNumber, setNextNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNumber, setNewNumber] = useState('');

  useEffect(() => {
    fetchCurrentNumber();
  }, []);

  const fetchCurrentNumber = async () => {
    try {
      const response = await fetch('/api/project-number');
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setCurrentNumber(data.current_number);
      setNextNumber(data.next_number);
    } catch (error) {
      console.error('Error fetching project number:', error);
      toast.error('Failed to fetch project number');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNumber = async (e: React.FormEvent) => {
    e.preventDefault();
    const number = parseInt(newNumber);
    
    if (isNaN(number) || number < 0) {
      toast.error('Please enter a valid number');
      return;
    }

    try {
      const { data: sequenceData, error: sequenceError } = await supabase
        .from('project_number_sequence')
        .select('id')
        .single();

      if (sequenceError || !sequenceData?.id) {
        throw new Error('Failed to get sequence ID');
      }

      const { error } = await supabase
        .from('project_number_sequence')
        .update({ current_number: number })
        .eq('id', sequenceData.id);

      if (error) throw error;

      toast.success('Project number updated successfully');
      setNewNumber('');
      fetchCurrentNumber();
    } catch (error) {
      console.error('Error updating project number:', error);
      toast.error('Failed to update project number');
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Project Number Sequence</h1>
      
      <div className="bg-card rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-1">Current Number</h2>
            <p className="text-2xl font-semibold">{currentNumber}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium text-gray-500 mb-1">Next Number</h2>
            <p className="text-2xl font-semibold">{nextNumber}</p>
          </div>
        </div>

        <form onSubmit={handleUpdateNumber} className="space-y-4">
          <div>
            <label htmlFor="newNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Update Current Number
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                id="newNumber"
                value={newNumber}
                onChange={(e) => setNewNumber(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2"
                placeholder="Enter new number"
                min="0"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Update
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 