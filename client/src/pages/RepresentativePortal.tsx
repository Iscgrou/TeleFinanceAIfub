import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Store, 
  FileText, 
  Calendar, 
  DollarSign, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  User
} from "lucide-react";
import { format } from "date-fns";

interface RepresentativeData {
  representative: {
    id: number;
    storeName: string;
    ownerName: string | null;
    panelUsername: string;
    totalDebt: string;
    isActive: boolean;
    createdAt: string;
  };
  invoices: Array<{
    id: number;
    amount: string;
    status: string;
    issueDate: string;
    usageJsonDetails: any;
  }>;
}

interface RepresentativePortalProps {
  username: string;
}

export default function RepresentativePortal({ username }: RepresentativePortalProps) {
  // Fetch representative data and invoices
  const { data, isLoading, error } = useQuery<RepresentativeData>({
    queryKey: [`/api/representatives/portal/${username}`],
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'paid': { 
        label: 'پرداخت شده', 
        icon: <CheckCircle className="h-3 w-3" />,
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      },
      'partially_paid': { 
        label: 'پرداخت جزئی', 
        icon: <Clock className="h-3 w-3" />,
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      },
      'unpaid': { 
        label: 'پرداخت نشده', 
        icon: <AlertTriangle className="h-3 w-3" />,
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      }
    };
    
    const config = statusConfig[status] || statusConfig['unpaid'];
    return (
      <Badge className={`flex items-center gap-1 ${config.className}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toLocaleString('fa-IR') + ' تومان';
  };

  const getDebtColorClass = (debt: string) => {
    const amount = parseFloat(debt);
    if (amount === 0) return "text-green-600 dark:text-green-400";
    if (amount > 5000000) return "text-red-600 dark:text-red-400";
    if (amount > 1000000) return "text-orange-600 dark:text-orange-400";
    return "text-yellow-600 dark:text-yellow-400";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                در حال بارگذاری اطلاعات نماینده...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <AlertTriangle className="h-20 w-20 text-red-500 mx-auto mb-6" />
              <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
                نماینده یافت نشد
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                نماینده با نام کاربری "{username}" در سیستم موجود نیست یا غیرفعال است.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                لطفاً نام کاربری را بررسی کرده و مجدداً تلاش کنید.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { representative, invoices } = data;
  const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
  const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full mb-6">
              <Store className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {representative.storeName}
            </h1>
            {representative.ownerName && (
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-4 flex items-center justify-center gap-2">
                <User className="h-5 w-5" />
                {representative.ownerName}
              </p>
            )}
            <div className="flex items-center justify-center gap-4">
              <Badge variant="outline" className="px-3 py-1">
                @{representative.panelUsername}
              </Badge>
              <Badge variant={representative.isActive ? "default" : "secondary"}>
                {representative.isActive ? "✅ فعال" : "❌ غیرفعال"}
              </Badge>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">بدهی کل</p>
                    <p className={`text-2xl font-bold ${getDebtColorClass(representative.totalDebt)}`}>
                      {formatAmount(representative.totalDebt)}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">کل فاکتورها</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatAmount(totalInvoiceAmount.toString())}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">فاکتورهای پرداخت شده</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {paidInvoices.toLocaleString('fa-IR')}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">فاکتورهای پرداخت نشده</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {unpaidInvoices.toLocaleString('fa-IR')}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoices List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <FileText className="h-6 w-6" />
                فاکتورهای شما
                <Badge variant="outline" className="text-sm">
                  {invoices.length.toLocaleString('fa-IR')} فاکتور
                </Badge>
              </CardTitle>
              <CardDescription>
                تاریخچه کامل فاکتورهای صادر شده برای {representative.storeName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length > 0 ? (
                <div className="space-y-6">
                  {invoices.map((invoice, index) => (
                    <div key={invoice.id}>
                      <div className="p-6 border dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                              <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                  فاکتور شماره FS-{invoice.id}
                                </h3>
                                {getStatusBadge(invoice.status)}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(invoice.issueDate), 'yyyy/MM/dd')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-gray-600 dark:text-gray-400">مبلغ فاکتور</p>
                              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                {formatAmount(invoice.amount)}
                              </p>
                            </div>
                            
                            <Button 
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => window.open(`/api/invoices/${invoice.id}/download`, '_blank')}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              دانلود فاکتور
                            </Button>
                          </div>
                        </div>
                        
                        {/* Usage Details */}
                        {invoice.usageJsonDetails && (
                          <div className="mt-4 pt-4 border-t dark:border-gray-700">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                              جزئیات استفاده در این دوره:
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <p className="text-gray-600 dark:text-gray-400">حجم کل</p>
                                <p className="font-semibold text-blue-600 dark:text-blue-400">
                                  {(invoice.usageJsonDetails.total_usage / 1024 / 1024 / 1024).toFixed(2)} گیگابایت
                                </p>
                              </div>
                              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                <p className="text-gray-600 dark:text-gray-400">تعداد کاربران</p>
                                <p className="font-semibold text-green-600 dark:text-green-400">
                                  {invoice.usageJsonDetails.user_count || 'نامشخص'} کاربر
                                </p>
                              </div>
                              <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                                <p className="text-gray-600 dark:text-gray-400">نرخ هر گیگابایت</p>
                                <p className="font-semibold text-purple-600 dark:text-purple-400">
                                  {invoice.usageJsonDetails.rate_per_gb || 'پیش‌فرض'} تومان
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {index < invoices.length - 1 && <Separator className="my-4" />}
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
                    هنوز برای این نماینده فاکتوری صادر نشده است.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center py-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                عضویت از: {format(new Date(representative.createdAt), 'yyyy/MM/dd')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                این پورتال برای مشاهده اطلاعات مالی و فاکتورهای شما طراحی شده است.
                <br />
                برای هرگونه سوال یا مشکل، با پشتیبانی تماس بگیرید.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}