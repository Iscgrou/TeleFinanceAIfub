import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  Eye,
  Download
} from "lucide-react";
import { useState } from "react";

interface DashboardStats {
  totalDebt: string;
  pendingCommissions: string;
  todayPayments: string;
  activeRepresentatives: number;
}

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

// Invoice Viewer Modal Component
function InvoiceViewer({ invoiceId, onClose }: { invoiceId: number | null; onClose: () => void }) {
  const { data: invoiceData, isLoading } = useQuery({
    queryKey: [`/api/invoices/${invoiceId}/detail`],
    enabled: !!invoiceId,
  });

  if (!invoiceId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              📄 جزئیات فاکتور #{invoiceId}
            </h2>
            <Button variant="outline" onClick={onClose}>
              ✕ بستن
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">در حال بارگذاری...</p>
            </div>
          ) : invoiceData ? (
            <div className="space-y-6">
              {/* Invoice Basic Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">شماره فاکتور</p>
                    <p className="font-bold text-blue-600 dark:text-blue-400">#{invoiceData.invoice.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">مبلغ</p>
                    <p className="font-bold text-green-600 dark:text-green-400">
                      {parseFloat(invoiceData.invoice.amount).toLocaleString('fa-IR')} تومان
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">تاریخ صدور</p>
                    <p className="font-medium">{new Date(invoiceData.invoice.issueDate).toLocaleDateString('fa-IR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">وضعیت</p>
                    <Badge variant={
                      invoiceData.invoice.status === 'paid' ? 'default' : 
                      invoiceData.invoice.status === 'partially_paid' ? 'secondary' : 'destructive'
                    }>
                      {invoiceData.invoice.status === 'paid' ? 'پرداخت شده' :
                       invoiceData.invoice.status === 'partially_paid' ? 'پرداخت جزئی' : 'پرداخت نشده'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              {invoiceData.lineItems && invoiceData.lineItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
                    📋 جزئیات خدمات
                  </h3>
                  <div className="space-y-2">
                    {invoiceData.lineItems.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{item.description}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(item.date).toLocaleDateString('fa-IR')}</p>
                        </div>
                        <p className="font-bold text-green-600 dark:text-green-400">
                          {item.amount.toLocaleString('fa-IR')} تومان
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button 
                  className="flex-1"
                  onClick={() => window.open(`/api/invoices/${invoiceId}/download`, '_blank')}
                >
                  <Download className="w-4 h-4 mr-2" />
                  دانلود فاکتور
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 dark:text-red-400">خطا در بارگذاری فاکتور</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  // Fetch recent invoices
  const { data: recentInvoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          📊 داشبورد مدیریت مالی
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          مرکز کنترل و نظارت بر عملیات مالی سیستم
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))
        ) : stats ? (
          <>
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  کل بدهی‌ها
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {parseFloat(stats.totalDebt).toLocaleString('fa-IR')} تومان
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  کمیسیون‌های معلق
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {parseFloat(stats.pendingCommissions).toLocaleString('fa-IR')} تومان
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  پرداخت‌های امروز
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {parseFloat(stats.todayPayments).toLocaleString('fa-IR')} تومان
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  نمایندگان فعال
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.activeRepresentatives.toLocaleString('fa-IR')}
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            آخرین فاکتورها
          </CardTitle>
          <CardDescription>
            فاکتورهای اخیر صادر شده در سیستم
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-4 border rounded">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                </div>
              ))}
            </div>
          ) : recentInvoices && recentInvoices.length > 0 ? (
            <div className="space-y-3">
              {recentInvoices.slice(0, 10).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        فاکتور #{invoice.id}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(invoice.issueDate).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        {parseFloat(invoice.amount).toLocaleString('fa-IR')} تومان
                      </p>
                      <Badge variant={
                        invoice.status === 'paid' ? 'default' : 
                        invoice.status === 'partially_paid' ? 'secondary' : 'destructive'
                      }>
                        {invoice.status === 'paid' ? 'پرداخت شده' :
                         invoice.status === 'partially_paid' ? 'پرداخت جزئی' : 'پرداخت نشده'}
                      </Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedInvoiceId(invoice.id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      مشاهده
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">هیچ فاکتوری یافت نشد</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Viewer Modal */}
      <InvoiceViewer 
        invoiceId={selectedInvoiceId} 
        onClose={() => setSelectedInvoiceId(null)} 
      />
    </div>
  );
}