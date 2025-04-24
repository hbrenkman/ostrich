"use client";

import { useState } from 'react';
import { FileEdit, MessageSquare, FileText, Eye, ClipboardList, Plus } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';

interface Project {
  id: string;
  number: string;
  name: string;
  client: string;
  dueDate: string | null;
}

interface DocumentType {
  type: 'CityComments' | 'RFI' | 'Addenda' | 'FieldReview' | 'PunchList';
  icon: typeof FileEdit;
  label: string;
}

export default function MyDashboard() {
  const { user } = useAuth();
  const [isNewDocumentDialogOpen, setIsNewDocumentDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Example assigned projects - in a real app, this would be filtered by the logged-in user
  const assignedProjects: Project[] = [
    {
      id: '1',
      number: 'PRJ-001', 
      name: 'Website Redesign',
      client: 'Acme Corporation',
      dueDate: '2024-04-15',
    },
    {
      id: '2',
      number: 'PRJ-002',
      name: 'Mobile App Development',
      client: 'Stellar Solutions',
      dueDate: '2024-05-30',
    },
    {
      id: '3',
      number: 'PRJ-003',
      name: 'Database Migration',
      client: 'Global Dynamics',
      dueDate: '2024-03-31',
    }
  ];

  const documentTypes: DocumentType[] = [
    {
      type: 'CityComments',
      icon: FileEdit,
      label: 'City Comments'
    },
    {
      type: 'RFI',
      icon: MessageSquare,
      label: 'RFI'
    },
    {
      type: 'Addenda',
      icon: FileText,
      label: 'Addenda'
    },
    {
      type: 'FieldReview',
      icon: Eye,
      label: 'Field Review'
    },
    {
      type: 'PunchList',
      icon: ClipboardList,
      label: 'Punch List'
    }
  ];

  const handleAddDocument = (project: Project) => {
    setSelectedProject(project);
    setIsNewDocumentDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold">My Projects</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assigned Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Number</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Client</th>
                  <th className="text-left py-3 px-4">Due Date</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {assignedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">{project.number}</td>
                    <td className="py-3 px-4">{project.name}</td>
                    <td className="py-3 px-4">{project.client}</td>
                    <td className="py-3 px-4">
                      {project.dueDate ? new Date(project.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleAddDocument(project)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Document</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isNewDocumentDialogOpen} onOpenChange={setIsNewDocumentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Document</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <h3 className="text-sm font-medium mb-3">Select Document Type</h3>
            <div className="grid grid-cols-1 gap-2">
              {documentTypes.map((docType) => {
                const Icon = docType.icon;
                return (
                  <button
                    key={docType.type}
                    onClick={() => {
                      // Handle document creation here
                      setIsNewDocumentDialogOpen(false);
                    }}
                    className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded-lg transition-colors text-left"
                  >
                    <Icon className="w-5 h-5 text-primary" />
                    <span>{docType.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsNewDocumentDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}