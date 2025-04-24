"use client";

import { useState, useEffect } from 'react';
import { FileText, Search, Plus, Calendar, DollarSign, MapPin, Tag, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from '@/modules/auth/frontend/hooks/useAuth';
import { Pagination } from '@/components/ui/pagination'; 
import { usePagination } from '@/hooks/usePagination'; 
import { useAssets, Asset } from './hooks/useAssets';

export default function Assets() {
  const { user } = useAuth();
  const { assets: fetchedAssets, loading, error, addAsset, updateAsset, deleteAsset } = useAssets();
  const [isNewAssetDialogOpen, setIsNewAssetDialogOpen] = useState(false);
  const [isEditAssetDialogOpen, setIsEditAssetDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({
    status: 'Active'
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Filter assets based on search term
  const filteredAssets = fetchedAssets.filter(asset => 
    asset.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    currentItems: paginatedAssets,
    totalPages,
    totalItems
  } = usePagination({
    items: filteredAssets,
    itemsPerPage: 10
  });

  const handleAddAsset = async () => {
    if (newAsset.number && newAsset.description && newAsset.designation && newAsset.status) {
      try {
        await addAsset({
          number: newAsset.number,
          description: newAsset.description,
          designation: newAsset.designation,
          location: newAsset.location || '',
          purchase_value: newAsset.purchase_value || 0,
          purchase_date: newAsset.purchase_date || '',
          status: newAsset.status
        });
        
        setNewAsset({ status: 'Active' });
        setIsNewAssetDialogOpen(false);
      } catch (error) {
        console.error('Failed to add asset:', error);
        alert('Failed to add asset. Please try again.');
      }
    } else {
      alert('Please fill in all required fields.');
    }
  };

  const handleEditAsset = async () => {
    if (editingAsset?.number && editingAsset?.description && editingAsset?.designation) {
      try {
        await updateAsset(editingAsset);
        setIsEditAssetDialogOpen(false);
        setEditingAsset(null);
      } catch (error) {
        console.error('Failed to update asset:', error);
        alert('Failed to update asset. Please try again.');
      }
    } else {
      alert('Please fill in all required fields.');
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      try {
        await deleteAsset(id);
      } catch (error) {
        console.error('Failed to delete asset:', error);
        alert('Failed to delete asset. Please try again.');
      }
    }
  };

  // Generate a new asset number
  const generateAssetNumber = () => {
    const highestNumber = fetchedAssets.reduce((max, asset) => {
      const num = parseInt(asset.number.replace('AST-', ''));
      return num > max ? num : max;
    }, 0);
    
    return `AST-${String(highestNumber + 1).padStart(3, '0')}`;
  };

  // Set a new asset number when opening the dialog
  const handleOpenNewAssetDialog = () => {
    setNewAsset({
      status: 'Active',
      number: generateAssetNumber()
    });
      setIsNewAssetDialogOpen(false);
  };

  const getStatusColor = (status: Asset['status']) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      case 'Maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'Retired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold">Asset Inventory</h1>
        </div>
        <button
          onClick={() => setIsNewAssetDialogOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Asset</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted w-5 h-5" />
          <input
            type="text"
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          <p>Error loading assets: {error.message}</p>
        </div>
      ) : (
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Asset Number</th>
                  <th className="text-left py-3 px-4">Description</th>
                  <th className="text-left py-3 px-4">Designation</th>
                  <th className="text-left py-3 px-4">Location</th>
                  <th className="text-right py-3 px-4">Purchase Value</th>
                  <th className="text-left py-3 px-4">Purchase Date</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedAssets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-muted/5 cursor-pointer"
                    onClick={() => {}}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{asset.number}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{asset.description}</td>
                    <td className="py-3 px-4">{asset.designation}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span>{asset.location}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <span>{formatCurrency(asset.purchase_value)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAsset(asset);
                          setIsEditAssetDialogOpen(true);
                        }}
                        className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAsset(asset.id);
                        }}
                        className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              totalItems={totalItems}
            />
          </div>
        </CardContent>
      </Card>
      )}

      {/* New Asset Dialog */}
      <Dialog open={isNewAssetDialogOpen} onOpenChange={setIsNewAssetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Asset Number</label>
                <input
                  type="text"
                  value={newAsset.number || generateAssetNumber()}
                  onChange={(e) => setNewAsset({ ...newAsset, number: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="AST-XXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={newAsset.status}
                  onChange={(e) => setNewAsset({ ...newAsset, status: e.target.value as Asset['status'] })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                value={newAsset.description || ''}
                onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter asset description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Designation</label>
              <input
                type="text"
                value={newAsset.designation || ''}
                onChange={(e) => setNewAsset({ ...newAsset, designation: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter asset designation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                value={newAsset.location || ''}
                onChange={(e) => setNewAsset({ ...newAsset, location: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter asset location"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Value</label>
                <input
                  type="number"
                  value={newAsset.purchase_value || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, purchase_value: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={newAsset.purchase_date || ''}
                  onChange={(e) => setNewAsset({ ...newAsset, purchase_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsNewAssetDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddAsset}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-2"
            >
              Add Asset
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      <Dialog open={isEditAssetDialogOpen} onOpenChange={setIsEditAssetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Asset Number</label>
                <input
                  type="text"
                  value={editingAsset?.number || ''}
                  onChange={(e) => setEditingAsset(editingAsset ? { ...editingAsset, number: e.target.value } : null)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="AST-XXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editingAsset?.status || 'Active'}
                  onChange={(e) => setEditingAsset(editingAsset ? { ...editingAsset, status: e.target.value as Asset['status'] } : null)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                value={editingAsset?.description || ''}
                onChange={(e) => setEditingAsset(editingAsset ? { ...editingAsset, description: e.target.value } : null)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter asset description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Designation</label>
              <input
                type="text"
                value={editingAsset?.designation || ''}
                onChange={(e) => setEditingAsset(editingAsset ? { ...editingAsset, designation: e.target.value } : null)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter asset designation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                value={editingAsset?.location || ''}
                onChange={(e) => setEditingAsset(editingAsset ? { ...editingAsset, location: e.target.value } : null)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Enter asset location"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Value</label>
                <input
                  type="number"
                  value={editingAsset?.purchase_value || ''}
                  onChange={(e) => setEditingAsset(editingAsset ? { ...editingAsset, purchase_value: Number(e.target.value) } : null)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Date</label>
                <input
                  type="date"
                  value={editingAsset?.purchase_date || ''}
                  onChange={(e) => setEditingAsset(editingAsset ? { ...editingAsset, purchase_date: e.target.value } : null)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button
              onClick={() => setIsEditAssetDialogOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEditAsset}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors ml-2"
            >
              Save Changes
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}