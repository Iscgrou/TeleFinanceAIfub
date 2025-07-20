import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export default function InvoiceHistoryV2() {
  const { toast } = useToast();

  // State Management
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    status: 'all' as 'paid' | 'unpaid' | 'all'
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);

  // Update filters when search changes
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery !== filters.search) {
        setFilters(prev => ({
          ...prev,
          search: searchQuery || undefined,
          page: 1
        }));
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, filters.search]);

  // API Queries
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery<InvoiceHistoryResponse>({
    queryKey: ['/api/invoices/history', filters],
  });

  const { data: statsData } = useQuery<StatsResponse>({
    queryKey: ['/api/invoices/stats'],
  });

  // Export Mutation
  const exportMutation = useMutation({
    mutationFn: async ({ ids, format }: { ids: number[], format: 'excel' | 'pdf' }) => {
      const response = await fetch(
        `/api/invoices/export?ids=${ids.join(',')}&format=${format}`
      );
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `invoices.${format === 'excel' ? 'xlsx' : 'pdf'}`;
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

  // Event Handlers
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

  const formatAmount = (amount: string) => {
    return parseInt(amount).toLocaleString('fa-IR') + ' تومان';
  };

  const getStatusBadge = (isPaid: boolean) => {
    return isPaid ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        پرداخت شده
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800">
        معلق
      </Badge>
    );
  };

  const invoices = invoicesData?.invoices || [];
  const total = invoicesData?.total || 0;
  const currentPage = invoicesData?.page || 1;
  const totalPages = invoicesData?.totalPages || 1;

  return (
    <div className="max-w-7xl mx-auto p-6" dir="rtl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">تاریخچه فاکتورها</h1>
            <p className="text-gray-600 mt-1">مشاهده و مدیریت تمام فاکتورهای صادر شده</p>
          </div>
          
          {selectedInvoices.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {selectedInvoices.length} فاکتور انتخاب شده
              </span>
              <Button
                onClick={() => handleExport('excel')}
                disabled={exportMutation.isPending}
                size="sm"
                variant="outline"
              >
                <Download className="w-4 h-4 ml-2" />
                Excel
              </Button>
              <Button
                onClick={() => handleExport('pdf')}
                disabled={exportMutation.isPending}
                size="sm"
                variant="outline"
              >
                <Download className="w-4 h-4 ml-2" />
                PDF
              </Button>
            </div>
          )}
        </div>

        {/* Stats Overview */}
        {statsData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">کل فاکتورها</p>
                    <p className="text-2xl font-bold">{statsData.totalInvoices || 0}</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">کل مبلغ</p>
                    <p className="text-2xl font-bold">
                      {parseInt(statsData.totalAmount || '0').toLocaleString('fa-IR')} تومان
                    </p>
                  </div>
                  <FileText className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">نمایندگان فعال</p>
                    <p className="text-2xl font-bold">{statsData.activeRepresentatives || 0}</p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">فاکتورهای امروز</p>
                    <p className="text-2xl font-bold">{statsData.todayInvoices || 0}</p>
                  </div>
                  <FileText className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Advanced Filters */}
        <InvoiceFilters
          filters={filters}
          onFiltersChange={setFilters}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Invoice List */}
        {invoicesLoading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select All */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedInvoices.length === invoices.length && invoices.length > 0}
                onChange={() => handleSelectAll()}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-600">انتخاب همه ({invoices.length} فاکتور)</span>
            </div>

            {/* Invoice Cards */}
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.includes(invoice.id)}
                        onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                        className="w-4 h-4"
                      />
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">#{invoice.id}</span>
                          {getStatusBadge(invoice.isPaid)}
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          نماینده: {invoice.representativeName || `Rep-${invoice.representativeId}`}
                        </p>
                        
                        <p className="text-sm text-gray-500">
                          {invoice.persianDate || new Date(invoice.createdAt).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <p className="text-xl font-bold text-blue-600">
                          {formatAmount(invoice.amount)}
                        </p>
                      </div>
                      
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty State */}
            {invoices.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">فاکتوری یافت نشد</h3>
                  <p className="text-gray-500">هیچ فاکتوری با معیارهای انتخابی شما پیدا نشد.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              نمایش {((currentPage - 1) * filters.limit) + 1} تا {Math.min(currentPage * filters.limit, total)} از {total} فاکتور
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({...prev, page: Math.max(1, prev.page - 1)}))}
                disabled={currentPage === 1}
              >
                <ChevronRight className="w-4 h-4" />
                قبلی
              </Button>
              
              <span className="px-3 py-1 text-sm">
                صفحه {currentPage} از {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters(prev => ({...prev, page: Math.min(totalPages, prev.page + 1)}))}
                disabled={currentPage === totalPages}
              >
                بعدی
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}