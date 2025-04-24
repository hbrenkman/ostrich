'use client';

import { FileText, Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReportTemplate } from '@/modules/reports/frontend/hooks/useReportTemplate';

export default function ReportTemplates() {
  const { template } = useReportTemplate();
  
  const templates = template ? [template] : [];

  return (
    <div className="p-6 bg-background text-foreground">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/settings"
            className="p-2 hover:bg-muted/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold">Report Templates</h1>
          </div>
        </div>
        <Link
          href="/reports/templates/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Link key={template.id} href={`/reports/templates/${template.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>{template.name}</span>
                  {template.isDefault && <span className="text-sm text-muted-foreground">(Default)</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Last modified: {new Date().toLocaleDateString()}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
        {templates.length === 0 && (
          <div className="col-span-3 text-center py-12 text-muted-foreground">
            <p>No templates yet. Click "New Template" to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
}