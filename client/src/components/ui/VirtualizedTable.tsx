/**
 * PHASE 7.1: Virtualized Table Component
 * بهینه‌سازی عملکرد برای جداول بزرگ
 */

import { useMemo, useState, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface VirtualizedTableProps {
  data: any[];
  columns: {
    key: string;
    label: string;
    render?: (value: any, item: any) => React.ReactNode;
    width?: number;
  }[];
  height?: number;
  rowHeight?: number;
  loading?: boolean;
  onRowClick?: (item: any) => void;
}

export function VirtualizedTable({
  data,
  columns,
  height = 400,
  rowHeight = 60,
  loading = false,
  onRowClick,
}: VirtualizedTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Memoized sorted data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  // Row renderer for virtualization
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = sortedData[index];
    if (!item) return null;

    return (
      <div style={style}>
        <TableRow 
          className={`hover:bg-muted/50 cursor-pointer ${
            onRowClick ? 'cursor-pointer' : ''
          }`}
          onClick={() => onRowClick?.(item)}
        >
          {columns.map((column) => (
            <TableCell 
              key={column.key} 
              className="p-4"
              style={{ width: column.width || 'auto' }}
            >
              {column.render 
                ? column.render(item[column.key], item)
                : item[column.key]
              }
            </TableCell>
          ))}
        </TableRow>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className="text-right">
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Header */}
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead 
                key={column.key}
                className={`text-right cursor-pointer hover:bg-muted/50 ${
                  sortConfig?.key === column.key ? 'bg-muted' : ''
                }`}
                onClick={() => handleSort(column.key)}
                style={{ width: column.width || 'auto' }}
              >
                <div className="flex items-center justify-between">
                  <span>{column.label}</span>
                  {sortConfig?.key === column.key && (
                    <span className="ml-2">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      </Table>

      {/* Virtualized Body */}
      {sortedData.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          هیچ داده‌ای یافت نشد
        </div>
      ) : (
        <List
          height={height}
          itemCount={sortedData.length}
          itemSize={rowHeight}
          width="100%"
        >
          {Row}
        </List>
      )}
      
      {/* Footer Info */}
      <div className="border-t px-4 py-2 text-sm text-muted-foreground">
        نمایش {sortedData.length.toLocaleString()} رکورد
        {sortConfig && (
          <span className="mr-4">
            مرتب شده بر اساس: {columns.find(c => c.key === sortConfig.key)?.label}
            ({sortConfig.direction === 'asc' ? 'صعودی' : 'نزولی'})
          </span>
        )}
      </div>
    </div>
  );
}