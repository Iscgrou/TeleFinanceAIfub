import React, { useState, useEffect } from 'react';
import { Search, Filter, RotateCcw, DollarSign, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Using simple state management instead of collapsible for compatibility
import { DateRangePicker } from './DateRangePicker';

interface InvoiceFiltersProps {
  filters: {
    page: number;
    limit: number;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: number;
    maxAmount?: number;
    representative?: string;
    status?: 'paid' | 'unpaid' | 'all';
    search?: string;
  };
  onFiltersChange: (filters: any) => void;
  searchQuery: string;
  onSearchChange: (search: string) => void;
}

export const InvoiceFilters: React.FC<InvoiceFiltersProps> = ({
  filters,
  onFiltersChange,
  searchQuery,
  onSearchChange
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [localMinAmount, setLocalMinAmount] = useState(filters.minAmount?.toString() || '');
  const [localMaxAmount, setLocalMaxAmount] = useState(filters.maxAmount?.toString() || '');
  const [localRepresentative, setLocalRepresentative] = useState(filters.representative || '');

  // Apply amount filters when user stops typing
  const applyAmountFilters = () => {
    const newFilters = {
      ...filters,
      minAmount: localMinAmount ? parseFloat(localMinAmount) : undefined,
      maxAmount: localMaxAmount ? parseFloat(localMaxAmount) : undefined,
      page: 1 // Reset to first page when filtering
    };
    onFiltersChange(newFilters);
  };

  // Apply representative filter
  const applyRepresentativeFilter = () => {
    const newFilters = {
      ...filters,
      representative: localRepresentative || undefined,
      page: 1
    };
    onFiltersChange(newFilters);
  };

  const handleStatusChange = (status: string) => {
    const newFilters = {
      ...filters,
      status: status as 'paid' | 'unpaid' | 'all',
      page: 1
    };
    onFiltersChange(newFilters);
  };

  const handleDateRangeChange = (dateFrom?: string, dateTo?: string) => {
    const newFilters = {
      ...filters,
      dateFrom,
      dateTo,
      page: 1
    };
    onFiltersChange(newFilters);
  };

  const resetAllFilters = () => {
    setLocalMinAmount('');
    setLocalMaxAmount('');
    setLocalRepresentative('');
    onSearchChange('');
    onFiltersChange({
      page: 1,
      limit: filters.limit,
      status: 'all'
    });
    setIsAdvancedOpen(false);
  };

  const hasActiveFilters = !!(
    filters.dateFrom || 
    filters.dateTo || 
    filters.minAmount !== undefined || 
    filters.maxAmount !== undefined || 
    filters.representative || 
    (filters.status && filters.status !== 'all') ||
    searchQuery
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Basic Search Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="جستجو با شماره فاکتور..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-4 pr-10"
            dir="rtl"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status || 'all'}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="paid">پرداخت شده</SelectItem>
            <SelectItem value="unpaid">معلق</SelectItem>
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Button 
          variant="outline" 
          size="sm" 
          className="whitespace-nowrap"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
        >
          <Filter className="w-4 h-4 ml-2" />
          فیلترهای پیشرفته
          {hasActiveFilters && (
            <div className="w-2 h-2 bg-blue-500 rounded-full ml-1" />
          )}
        </Button>
      </div>

      {/* Advanced Filters */}
      {isAdvancedOpen && (
        <div className="space-y-4">
          <div className="border-t pt-4 space-y-4">
            {/* Date Range Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">بازه تاریخی:</Label>
              <DateRangePicker
                dateFrom={filters.dateFrom}
                dateTo={filters.dateTo}
                onDateChange={handleDateRangeChange}
                className="w-full sm:w-auto"
              />
            </div>

            {/* Amount Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">محدوده مبلغ (تومان):</Label>
              <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                  <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="حداقل مبلغ"
                    value={localMinAmount}
                    onChange={(e) => setLocalMinAmount(e.target.value)}
                    onBlur={applyAmountFilters}
                    onKeyPress={(e) => e.key === 'Enter' && applyAmountFilters()}
                    className="pl-4 pr-10"
                    type="number"
                    min="0"
                    dir="rtl"
                  />
                </div>
                <span className="text-gray-400">تا</span>
                <div className="relative flex-1">
                  <DollarSign className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="حداکثر مبلغ"
                    value={localMaxAmount}
                    onChange={(e) => setLocalMaxAmount(e.target.value)}
                    onBlur={applyAmountFilters}
                    onKeyPress={(e) => e.key === 'Enter' && applyAmountFilters()}
                    className="pl-4 pr-10"
                    type="number"
                    min="0"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>

            {/* Representative Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">نماینده:</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="نام نماینده..."
                    value={localRepresentative}
                    onChange={(e) => setLocalRepresentative(e.target.value)}
                    onBlur={applyRepresentativeFilter}
                    onKeyPress={(e) => e.key === 'Enter' && applyRepresentativeFilter()}
                    className="pl-4 pr-10"
                    dir="rtl"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between gap-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                className="flex items-center gap-2"
                disabled={!hasActiveFilters}
              >
                <RotateCcw className="w-4 h-4" />
                پاک کردن همه فیلترها
              </Button>
              
              <div className="text-xs text-gray-500 flex items-center">
                {hasActiveFilters && (
                  <span>فیلترهای فعال: {[
                    searchQuery && 'جستجو',
                    filters.status !== 'all' && 'وضعیت',
                    (filters.dateFrom || filters.dateTo) && 'تاریخ',
                    (filters.minAmount !== undefined || filters.maxAmount !== undefined) && 'مبلغ',
                    filters.representative && 'نماینده'
                  ].filter(Boolean).join(', ')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};