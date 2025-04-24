import { useState, useEffect } from 'react';
import { ReportTemplate } from '../types';

export function useReportTemplate(templateId?: string) {
  const [template, setTemplate] = useState<ReportTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {    
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/reports/templates/${templateId || 'default'}`);
      if (!response.ok) throw new Error('Failed to fetch template');
      let data = await response.json();
      
      // Ensure background is always white for letter page
      if (data.content) {
        const content = JSON.parse(data.content);
        content.styling = {
          ...content.styling,
          background: '#FFFFFF',  // Force white background
          text: '#4A5A6B'  // Force light mode text color
        };
        data.content = JSON.stringify(content);
      }
      
      setTemplate(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const saveTemplate = async (templateData: Partial<ReportTemplate>) => {
    try {
      // Ensure white background before saving
      if (templateData.content) {
        const content = JSON.parse(templateData.content);
        content.styling = {
          ...content.styling,
          background: '#FFFFFF',  // Force white background
          text: '#4A5A6B'  // Force light mode text color
        };
        templateData.content = JSON.stringify(content);
      }
      
      setLoading(true);
      const response = await fetch('/api/reports/templates', {
        method: templateId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });
      
      if (!response.ok) throw new Error('Failed to save template');
      let data = await response.json();
      
      // Ensure background is always white for letter page
      if (data.content) {
        const content = JSON.parse(data.content);
        content.styling = {
          ...content.styling,
          background: '#FFFFFF',  // Force white background
          text: '#4A5A6B'  // Force light mode text color
        };
        data.content = JSON.stringify(content);
      }
      
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