import { useState, useEffect } from 'react';
import { InvoiceTemplate } from '../types';

export function useInvoiceTemplate(templateId?: string) {
  const [template, setTemplate] = useState<InvoiceTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {    
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/invoices/templates/${templateId || 'default'}`);
      if (!response.ok) throw new Error('Failed to fetch template');
      const data = await response.json();
      setTemplate(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (templateData: Partial<InvoiceTemplate>) => {
    try {
      setLoading(true);
      const response = await fetch('/api/invoices/templates', {
        method: templateId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });
      
      if (!response.ok) throw new Error('Failed to save template');
      const data = await response.json();
      setLoading(false);
      setTemplate(data);
      return data;
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  };

  return {
    template,
    setTemplate,
    loading,
    error,
    saveTemplate,
  };
}