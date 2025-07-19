import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Search, 
  Eye, 
  Download, 
  Calendar,
  DollarSign,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";

interface Invoice {
  id: number;
  representativeId: number;
  amount: string;
  status: string;
  issueDate: string;
  representative?: {
    storeName: string;
    panelUsername: string;
  };
}

// Invoice Detail Modal
function InvoiceDetailModal({ invoiceId, onClose }: { invoiceId: number | null; onClose: () => void }) {
  const { data: invoiceData, isLoading } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}/detail`],
    enabled: !!invoiceId,
  });

  if (!invoiceId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              📄 فاکتور شماره #{invoiceId}
            </h2>
            <Button variant="outline" onClick={onClose}>
              ✕ بستن
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری جزئیات فاکتور...</p>
            </div>
          ) : invoiceData ? (
            <div className="space-y-8">
              {/* Invoice Header */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">شماره فاکتور</h3>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      FS-{invoiceData.invoice.id}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">تاریخ صدور</h3>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {new Date(invoiceData.invoice.issueDate).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">وضعیت</h3>
                    <Badge 
                      variant={
                        invoiceData.invoice.status === 'paid' ? 'default' : 
                        invoiceData.invoice.status === 'partially_paid' ? 'secondary' : 'destructive'
                      }
                      className="text-sm px-3 py-1"
                    >
                      {invoiceData.invoice.status === 'paid' ? '✅ پرداخت شده' :
                       invoiceData.invoice.status === 'partially_paid' ? '🔄 پرداخت جزئی' : '❌ پرداخت نشده'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Amount Section */}
              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-xl">
                <div className="text-center">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">مبلغ کل فاکتور</h3>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {parseFloat(invoiceData.invoice.amount).toLocaleString('fa-IR')} تومان
                  </p>
                </div>
              </div>

              {/* Line Items */}
              {invoiceData.lineItems && invoiceData.lineItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    📋 جزئیات خدمات و آیتم‌ها
                  </h3>
                  <div className="space-y-3">
                    {invoiceData.lineItems.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                            {item.description}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(item.date).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600 dark:text-green-400">
                            {item.amount.toLocaleString('fa-IR')} تومان
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t dark:border-gray-700">
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.open(`/api/invoices/${invoiceId}/download`, '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  دانلود فاکتور (PNG)
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    const url = `${window.location.origin}/representatives/portal/${invoiceData.invoice.representative?.panelUsername}`;
                    window.open(url, '_blank');
                  }}
                >
                  مشاهده پورتال نماینده
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400 text-lg">خطا در بارگذاری فاکتور</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Invoices() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch all invoices
  const { data: invoices, isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  // Filter invoices based on search and status
  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch = !searchTerm || 
      invoice.id.toString().includes(searchTerm) ||
      invoice.representative?.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.representative?.panelUsername.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'paid': { label: '✅ پرداخت شده', variant: 'default' as const, color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      'partially_paid': { label: '🔄 پرداخت جزئی', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
      'unpaid': { label: '❌ پرداخت نشده', variant: 'destructive' as const, color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
    };
    const config = statusConfig[status] || statusConfig['unpaid'];
    return <Badge variant={config.variant} className={config.color}>{config.label}</Badge>;
  };

  const getTotalStats = () => {
    if (!filteredInvoices.length) return { total: 0, paid: 0, unpaid: 0, partially: 0 };
    
    return {
      total: filteredInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0),
      paid: filteredInvoices.filter(inv => inv.status === 'paid').length,
      unpaid: filteredInvoices.filter(inv => inv.status === 'unpaid').length,
      partially: filteredInvoices.filter(inv => inv.status === 'partially_paid').length,
    };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          📄 مدیریت فاکتورها
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          مشاهده، مدیریت و دانلود فاکتورهای صادر شده
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">کل مبلغ</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {stats.total.toLocaleString('fa-IR')} تومان
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">پرداخت شده</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {stats.paid.toLocaleString('fa-IR')}
                </p>
              </div>
              <div className="text-green-500 text-2xl">✅</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">پرداخت نشده</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {stats.unpaid.toLocaleString('fa-IR')}
                </p>
              </div>
              <div className="text-red-500 text-2xl">❌</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">پرداخت جزئی</p>
                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {stats.partially.toLocaleString('fa-IR')}
                </p>
              </div>
              <div className="text-yellow-500 text-2xl">🔄</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            جستجو و فیلتر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">جستجو</label>
              <Input
                placeholder="شماره فاکتور، نام نماینده یا نام کاربری..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">فیلتر بر اساس وضعیت</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="paid">پرداخت شده</SelectItem>
                  <SelectItem value="unpaid">پرداخت نشده</SelectItem>
                  <SelectItem value="partially_paid">پرداخت جزئی</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            لیست فاکتورها
            <Badge variant="outline" className="ml-2">
              {filteredInvoices.length.toLocaleString('fa-IR')} فاکتور
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse p-4 border dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredInvoices.length > 0 ? (
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            فاکتور #{invoice.id}
                          </h3>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {invoice.representative && (
                            <p>نماینده: {invoice.representative.storeName} (@{invoice.representative.panelUsername})</p>
                          )}
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(invoice.issueDate).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">مبلغ</p>
                        <p className="font-bold text-lg text-green-600 dark:text-green-400">
                          {parseFloat(invoice.amount).toLocaleString('fa-IR')} تومان
                        </p>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedInvoiceId(invoice.id)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-3 w-3" />
                        مشاهده
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                هیچ فاکتوری یافت نشد
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || statusFilter !== "all" 
                  ? "معیار جستجو یا فیلتر را تغییر دهید" 
                  : "هنوز هیچ فاکتوری صادر نشده است"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal 
        invoiceId={selectedInvoiceId} 
        onClose={() => setSelectedInvoiceId(null)} 
      />
    </div>
  );
}