import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download,
  FileText,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { InvoiceFilters } from "@/components/InvoiceFilters";

interface Invoice {
  id: number;
  representativeId: number;
  representativeName?: string;
  amount: string;
  description?: string;
  createdAt: string;
  isPaid: boolean;
  persianDate?: string;
}

interface InvoiceHistoryResponse {
  invoices: Invoice[];
  total: number;
  page: number;
  totalPages: number;
}

interface StatsResponse {
  totalInvoices?: number;
  totalAmount?: string;
  activeRepresentatives?: number;
  todayInvoices?: number;
}

interface FilterParams {
  page: number;
  limit: number;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  representative?: string;
  status?: 'paid' | 'unpaid' | 'all';
  search?: string;
}

export default function InvoiceHistoryPage() {
  const { toast } = useToast();
  
  // State management
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [filters, setFilters] = useState<FilterParams>({
    page: 1,
    limit: 12,
    status: 'all'
  });
  const [searchQuery, setSearchQuery] = useState("");
  
  // Debounced search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchQuery, page: 1 }));
    }, 300);
    
    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  // Data fetching with proper typing
  const { data: invoicesData, isLoading } = useQuery<InvoiceHistoryResponse>({
    queryKey: ['/api/invoices/history', filters],
    retry: 2
  });

  const { data: statsData } = useQuery<StatsResponse>({
    queryKey: ['/api/invoices/stats'],
    retry: 2
  });

  // Bulk export mutation
  const exportMutation = useMutation({
    mutationFn: async (params: { ids: number[], format: 'excel' | 'pdf' }) => {
      const response = await fetch(`/api/invoices/export?ids=${params.ids.join(',')}&format=${params.format}`);
      return response.blob();
    },
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices.${variables.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "صادرات موفق",
        description: "فایل دانلود شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا در صادرات",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    }
  });

  const handleSelectInvoice = (invoiceId: number, checked: boolean) => {
    if (checked) {
      setSelectedInvoices(prev => [...prev, invoiceId]);
    } else {
      setSelectedInvoices(prev => prev.filter(id => id !== invoiceId));
    }
  };

  const handleSelectAll = () => {
    if (invoicesData && selectedInvoices.length === invoicesData.invoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(invoicesData?.invoices?.map((inv: Invoice) => inv.id) || []);
    }
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    if (selectedInvoices.length === 0) {
      toast({
        title: "انتخاب فاکتور",
        description: "لطفاً حداقل یک فاکتور انتخاب کنید",
        variant: "destructive",
      });
      return;
    }
    
    exportMutation.mutate({ ids: selectedInvoices, format });
  };

  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      status: 'all'
    });
    setSearchQuery("");
    setSelectedInvoices([]);
  };

  const formatAmount = (amount: string) => {
    return parseInt(amount).toLocaleString('fa-IR') + ' تومان';
  };

  const getStatusBadge = (isPaid: boolean) => {
    return isPaid ? (
      <Badge className="bg-green-100 text-green-800">پرداخت شده</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">معلق</Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="flex gap-2">
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const invoices = invoicesData?.invoices || [];
  const totalPages = invoicesData ? Math.ceil(invoicesData.total / filters.limit) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600" />
            تاریخچه فاکتورها
          </CardTitle>
          <CardDescription>
            مشاهده و مدیریت تمام فاکتورهای صادر شده
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      {statsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">کل فاکتورها</p>
                  <p className="text-2xl font-bold">{statsData.totalInvoices?.toLocaleString('fa-IR') || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">مجموع مبلغ</p>
                  <p className="text-2xl font-bold">{statsData.totalAmount?.toLocaleString('fa-IR') || '0'} ت</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">نمایندگان فعال</p>
                  <p className="text-2xl font-bold">{statsData.activeRepresentatives?.toLocaleString('fa-IR') || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">امروز</p>
                  <p className="text-2xl font-bold">{statsData.todayInvoices?.toLocaleString('fa-IR') || '0'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="جستجو در فاکتورها..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="flex gap-2">
              <Button 
                variant={filters.status === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, status: 'all', page: 1 }))}
              >
                همه
              </Button>
              <Button 
                variant={filters.status === 'paid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, status: 'paid', page: 1 }))}
              >
                پرداخت شده
              </Button>
              <Button 
                variant={filters.status === 'unpaid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilters(prev => ({ ...prev, status: 'unpaid', page: 1 }))}
              >
                معلق
              </Button>
            </div>

            <Button variant="outline" onClick={resetFilters}>
              <Filter className="h-4 w-4 ml-2" />
              پاک کردن فیلترها
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedInvoices.length > 0 && (
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium">
                {selectedInvoices.length} فاکتور انتخاب شده
              </span>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleExport('excel')}
                  disabled={exportMutation.isPending}
                >
                  <Download className="h-4 w-4 ml-1" />
                  Excel
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleExport('pdf')}
                  disabled={exportMutation.isPending}
                >
                  <Download className="h-4 w-4 ml-1" />
                  PDF
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Cards Grid */}
      <div className="space-y-4">
        {/* Select All */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedInvoices.length === invoices.length && invoices.length > 0}
            onChange={() => handleSelectAll()}
            className="w-4 h-4"
          />
          <Label>انتخاب همه ({invoices.length})</Label>
        </div>

        {/* Invoice Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {invoices.map((invoice: Invoice) => (
            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.includes(invoice.id)}
                      onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="font-bold">#{invoice.id}</span>
                  </div>
                  {getStatusBadge(invoice.isPaid)}
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{invoice.representativeName || 'نماینده'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold text-green-600">
                      {formatAmount(invoice.amount)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{invoice.persianDate || 'بدون تاریخ'}</span>
                  </div>
                </div>

                {/* Description */}
                {invoice.description && (
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm text-gray-700">
                      {invoice.description.length > 100 
                        ? invoice.description.substring(0, 100) + '...'
                        : invoice.description
                      }
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => window.open(`/api/invoices/${invoice.id}/details`, '_blank')}
                  >
                    <Eye className="h-4 w-4 ml-1" />
                    جزئیات
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => exportMutation.mutate({ ids: [invoice.id], format: 'pdf' })}
                  >
                    <Download className="h-4 w-4 ml-1" />
                    دانلود
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {invoices.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                فاکتوری یافت نشد
              </h3>
              <p className="text-gray-500">
                هیچ فاکتوری با معیارهای انتخاب شده وجود ندارد
              </p>
              <Button variant="outline" onClick={resetFilters} className="mt-4">
                پاک کردن فیلترها
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  صفحه {filters.page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page <= 1}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  <ChevronRight className="h-4 w-4" />
                  قبلی
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page >= totalPages}
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  بعدی
                  <ChevronLeft className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}