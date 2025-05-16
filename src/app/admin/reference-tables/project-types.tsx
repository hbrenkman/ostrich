import React, { useState } from 'react';
import { ClipboardList, Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { useProjectTypes, ProjectType } from './hooks/useProjectTypes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ProjectTypesTableProps {
  showContainer?: boolean;
}

export function ProjectTypesTable({ showContainer = true }: ProjectTypesTableProps) {
  const { projectTypes, loading, error, addProjectType, updateProjectType, deleteProjectType } = useProjectTypes();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType | null>(null);
  const [newProjectType, setNewProjectType] = useState<Partial<ProjectType>>({
    name: '',
    description: '',
    display_order: 0,
    is_active: true
  });

  const filteredProjectTypes = projectTypes.filter(type =>
    type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (type.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleAddProjectType = async () => {
    if (newProjectType.name) {
      try {
        await addProjectType({
          name: newProjectType.name,
          description: newProjectType.description || null,
          display_order: newProjectType.display_order || 0,
          is_active: newProjectType.is_active ?? true
        });
        setNewProjectType({ name: '', description: '', display_order: 0, is_active: true });
        setIsNewDialogOpen(false);
      } catch (err) {
        console.error('Failed to add project type:', err);
      }
    }
  };

  const handleUpdateProjectType = async () => {
    if (selectedProjectType) {
      try {
        await updateProjectType(selectedProjectType);
        setIsEditDialogOpen(false);
        setSelectedProjectType(null);
      } catch (err) {
        console.error('Failed to update project type:', err);
      }
    }
  };

  const handleDeleteProjectType = async (id: string) => {
    if (confirm('Are you sure you want to delete this project type?')) {
      try {
        await deleteProjectType(id);
      } catch (err) {
        console.error('Failed to delete project type:', err);
      }
    }
  };

  const controls = (
    <div className="flex items-center gap-4">
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <input
          type="text"
          placeholder="Search project types..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-foreground"
        />
      </div>
      <button
        onClick={() => setIsNewDialogOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>New Type</span>
      </button>
    </div>
  );

  const content = (
    <>
      {showContainer ? (
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold">Project Types</h2>
              <p className="text-sm text-muted-foreground">Manage different types of projects in the system</p>
            </div>
          </div>
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
          <p className="mt-2 text-muted-foreground">Loading project types...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">
          <p>Error loading project types: {error.message}</p>
        </div>
      ) : filteredProjectTypes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No project types found matching your search criteria.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProjectTypes.map((type) => (
            <div key={type.id} className="border border-[#4DB6AC]/20 rounded-md overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-muted/5 hover:bg-muted/10">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-primary" />
                    <span className="font-medium">{type.name}</span>
                    {!type.is_active && (
                      <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">Inactive</span>
                    )}
                  </div>
                  {type.description && (
                    <p className="text-sm text-muted-foreground mt-1 pl-6">{type.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedProjectType(type);
                      setIsEditDialogOpen(true);
                    }}
                    className="p-2 hover:bg-muted/10 rounded-full transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDeleteProjectType(type.id)}
                    className="p-2 hover:bg-muted/10 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Project Type Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Project Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={newProjectType.name}
                onChange={(e) => setNewProjectType((prev: Partial<ProjectType>) => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter project type name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={newProjectType.description || ''}
                onChange={(e) => setNewProjectType((prev: Partial<ProjectType>) => ({ ...prev, description: e.target.value || null }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter project type description"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input
                type="number"
                value={newProjectType.display_order}
                onChange={(e) => setNewProjectType((prev: Partial<ProjectType>) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Enter display order"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={newProjectType.is_active}
                onChange={(e) => setNewProjectType((prev: Partial<ProjectType>) => ({ ...prev, is_active: e.target.checked }))}
                className="rounded border-gray-300"
              />
              <label htmlFor="is_active" className="text-sm font-medium">Active</label>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsNewDialogOpen(false)}
              className="px-4 py-2 border rounded-md hover:bg-muted/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddProjectType}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Add Project Type
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Project Type Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project Type</DialogTitle>
          </DialogHeader>
          {selectedProjectType && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={selectedProjectType.name}
                  onChange={(e) => setSelectedProjectType((prev: ProjectType | null) => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter project type name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={selectedProjectType.description || ''}
                  onChange={(e) => setSelectedProjectType((prev: ProjectType | null) => prev ? { ...prev, description: e.target.value || null } : null)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter project type description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Display Order</label>
                <input
                  type="number"
                  value={selectedProjectType.display_order}
                  onChange={(e) => setSelectedProjectType((prev: ProjectType | null) => prev ? { ...prev, display_order: parseInt(e.target.value) || 0 } : null)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter display order"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={selectedProjectType.is_active}
                  onChange={(e) => setSelectedProjectType((prev: ProjectType | null) => prev ? { ...prev, is_active: e.target.checked } : null)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="edit_is_active" className="text-sm font-medium">Active</label>
              </div>
            </div>
          )}
          <DialogFooter>
            <button
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedProjectType(null);
              }}
              className="px-4 py-2 border rounded-md hover:bg-muted/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateProjectType}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return showContainer ? (
    <div className="space-y-4">
      {content}
    </div>
  ) : content;
} 