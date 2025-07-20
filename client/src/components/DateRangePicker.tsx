import React, { useState } from 'react';
import { Calendar, CalendarDays, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Using dialog instead of popover for compatibility
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface DateRangePickerProps {
  dateFrom?: string;
  dateTo?: string;
  onDateChange: (dateFrom?: string, dateTo?: string) => void;
  className?: string;
}

// Persian month names
const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

// Helper function to convert Gregorian to Persian date display
const toPersianDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Simple conversion - in production would use proper Jalali conversion
  const year = date.getFullYear() - 621; // Approximate conversion
  const month = date.getMonth();
  const day = date.getDate();
  
  return `${day} ${persianMonths[month]} ${year}`;
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateFrom,
  dateTo,
  onDateChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDateFrom, setTempDateFrom] = useState(dateFrom || '');
  const [tempDateTo, setTempDateTo] = useState(dateTo || '');

  const handleApply = () => {
    onDateChange(tempDateFrom || undefined, tempDateTo || undefined);
    setIsOpen(false);
  };

  const handleReset = () => {
    setTempDateFrom('');
    setTempDateTo('');
    onDateChange(undefined, undefined);
    setIsOpen(false);
  };

  const hasActiveRange = dateFrom || dateTo;

  const getDisplayText = () => {
    if (dateFrom && dateTo) {
      return `${toPersianDate(dateFrom)} تا ${toPersianDate(dateTo)}`;
    }
    if (dateFrom) {
      return `از ${toPersianDate(dateFrom)}`;
    }
    if (dateTo) {
      return `تا ${toPersianDate(dateTo)}`;
    }
    return 'انتخاب بازه تاریخ';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={hasActiveRange ? "default" : "outline"}
          className={`justify-start gap-2 ${className}`}
          size="sm"
        >
          <Calendar className="w-4 h-4" />
          <span className="truncate">{getDisplayText()}</span>
          {hasActiveRange && (
            <X
              className="w-3 h-3 opacity-60 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handleReset();
              }}
            />
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-80">
        <div className="space-y-4" dir="rtl">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">انتخاب بازه تاریخ</h3>
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-2">
              <Label htmlFor="dateFrom" className="text-xs">از تاریخ:</Label>
              <input
                id="dateFrom"
                type="date"
                value={tempDateFrom}
                onChange={(e) => setTempDateFrom(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateTo" className="text-xs">تا تاریخ:</Label>
              <input
                id="dateTo"
                type="date"
                value={tempDateTo}
                onChange={(e) => setTempDateTo(e.target.value)}
                min={tempDateFrom}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-xs file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex justify-between gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="flex-1"
            >
              پاک کردن
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="flex-1"
              disabled={!!(tempDateFrom && tempDateTo && tempDateFrom > tempDateTo)}
            >
              اعمال
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};