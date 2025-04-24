"use client";

import { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend'; 
import { use } from 'react';

interface DocumentItem {
  id: string;
  discipline: 'Mechanical' | 'Electrical' | 'Plumbing' | 'Structural';
  issue?: string;
  instruction?: string;
  question?: string;
  response?: string;
}

interface DocumentItemProps {
  item: DocumentItem;
  index: number;
  documentType: string;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  updateItem: (index: number, updates: Partial<DocumentItem>) => void;
  removeItem: (index: number) => void;
}

const DocumentItem = ({ item, index, documentType, moveItem, updateItem, removeItem }: DocumentItemProps) => {
  const [{ isDragging }, drag, preview] = useDrag({
    type: 'DOCUMENT_ITEM',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'DOCUMENT_ITEM',
    hover(item: { index: number }) {
      if (item.index !== index) {
        moveItem(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => preview(drop(node))}
      className={`p-4 bg-card border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-lg mb-4 ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          ref={drag}
          className="cursor-move hover:bg-muted/10 p-1 rounded"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <select
          value={item.discipline}
          onChange={(e) => updateItem(index, { discipline: e.target.value as DocumentItem['discipline'] })}
          className="flex-1 px-3 py-2 bg-background border border-[#4DB6AC] dark:border-[#4DB6AC] rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="Mechanical">Mechanical</option>
          <option value="Electrical">Electrical</option>
          <option value="Plumbing">Plumbing</option>
          <option value="Structural">Structural</option>
        </select>
        <button
          onClick={() => removeItem(index)}
          className="p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        {(documentType === 'CityComments' || documentType === 'RFI') ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">
                {documentType === 'CityComments' ? 'Comment' : 'Question'}
              </label>
              <RichTextEditor
                value={item.question}
                onChange={(e) => updateItem(index, { question: e.target.value })}
                className="border-[#4DB6AC] dark:border-[#4DB6AC]"
                placeholder={`Enter ${documentType === 'CityComments' ? 'comment' : 'question'}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Response
              </label>
              <RichTextEditor
                value={item.response}
                onChange={(e) => updateItem(index, { response: e.target.value })}
                className="border-[#4DB6AC] dark:border-[#4DB6AC]"
                placeholder="Enter response"
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">
                Issue
              </label>
              <RichTextEditor
                value={item.issue}
                onChange={(e) => updateItem(index, { issue: e.target.value })}
                className="border-[#4DB6AC] dark:border-[#4DB6AC]"
                placeholder="Enter issue details"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Instruction
              </label>
              <RichTextEditor
                value={item.instruction}
                onChange={(e) => updateItem(index, { instruction: e.target.value })}
                className="border-[#4DB6AC] dark:border-[#4DB6AC]"
                placeholder="Enter instruction details"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default function DocumentEditor({ params }: { params: { id: string; documentId: string } }) {
  const router = useRouter();
  const [items, setItems] = useState<DocumentItem[]>([]);
  const unwrappedParams = use(params);
  const documentType = unwrappedParams.documentId.split('-')[0]; // e.g., "CityComments", "RFI", etc.

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        discipline: 'Mechanical',
        ...(documentType === 'CityComments' || documentType === 'RFI' 
          ? { question: '', response: '' } 
          : { issue: '', instruction: '' })
      }
    ]);
  };

  const updateItem = (index: number, updates: Partial<DocumentItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const moveItem = (dragIndex: number, hoverIndex: number) => {
    const dragItem = items[dragIndex];
    setItems(items => {
      const newItems = [...items];
      newItems.splice(dragIndex, 1);
      newItems.splice(hoverIndex, 0, dragItem);
      return newItems;
    });
  };

  const handleSave = () => {
    // Save the document items
    router.push(`/projects/${unwrappedParams.id}`);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/projects/${unwrappedParams.id}`}
              className="p-2 hover:bg-muted/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-semibold">
              {documentType === 'CityComments' && 'City Comments'}
              {documentType === 'RFI' && 'Request for Information'}
              {documentType === 'Addenda' && 'Addenda'}
              {documentType === 'FieldReview' && 'Field Review'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={addItem}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Item</span>
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Document</span>
            </button>
          </div>
        </div>

        <div className="max-w-4xl">
          {items.map((item, index) => (
            <DocumentItem
              key={item.id}
              item={item}
              index={index}
              documentType={documentType}
              moveItem={moveItem}
              updateItem={updateItem}
              removeItem={removeItem}
            />
          ))}

          {items.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No items yet. Click "Add Item" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
}