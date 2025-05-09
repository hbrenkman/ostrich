'use client';

import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
  }[];
  emptyMessage?: string;
  expandedContent?: (item: T) => React.ReactNode;
  expandedRows?: Set<number>;
  onRowClick?: (item: T) => void;
  onExpandRow?: (index: number, e: React.MouseEvent) => void;
}

export function DataTable<T extends { id?: string | number }>({ 
  data, 
  columns, 
  emptyMessage = 'No data found.',
  expandedContent,
  expandedRows = new Set(),
  onRowClick,
  onExpandRow
}: DataTableProps<T>) {
  return (
    <div className="w-full">
      {data.length === 0 ? (
        <div className="p-4 text-muted-foreground">{emptyMessage}</div>
      ) : (
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50 dark:bg-muted/50">
            <tr>
              {expandedContent && <th className="w-10 px-4 py-2"></th>}
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card dark:bg-card divide-y divide-border">
            {data.map((item, rowIndex) => (
              <React.Fragment key={item.id || rowIndex}>
                <tr 
                  className={`hover:bg-muted/50 dark:hover:bg-muted/50 transition-colors duration-150 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(item)}
                >
                  {expandedContent && (
                    <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => onExpandRow?.(rowIndex, e)}
                        className="p-1 hover:bg-muted rounded-full"
                      >
                        {expandedRows.has(rowIndex) ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    </td>
                  )}
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-6 py-4 whitespace-nowrap text-sm text-foreground ${column.className || ''}`}
                    >
                      {typeof column.accessor === 'function'
                        ? column.accessor(item)
                        : item[column.accessor]}
                    </td>
                  ))}
                </tr>
                {expandedContent && expandedRows.has(rowIndex) && (
                  <tr onClick={(e) => e.stopPropagation()}>
                    <td colSpan={columns.length + 1} className="bg-muted/30 dark:bg-muted/30 px-4 py-2">
                      {expandedContent(item)}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 