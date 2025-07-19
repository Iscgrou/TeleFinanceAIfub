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
  User,
  Phone,
  Mail,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";
import { format } from "date-fns";

interface Representative {
  id: number;
  storeName: string;
  ownerName: string | null;
  phone: string | null;
  telegramId: string | null;
  panelUsername: string;
  salesColleagueName: string | null;
  totalDebt: string;
  isActive: boolean;
  createdAt: string;
}

interface Invoice {
  id: number;
  amount: number;
  status: string;
  issueDate: string;
  usageJsonDetails: any;
}

interface Payment {
  id: number;
  amount: number;
  paymentDate: string;
}

interface Statistics {
  totalInvoiced: number;
  totalPaid: number;
  totalDebt: number;
  invoiceCount: number;
  paymentCount: number;
  unpaidCount: number;
  paidCount: number;
  partiallyPaidCount: number;
}

interface RepresentativeProfileData {
  representative: Representative;
  statistics: Statistics;
  invoices: Invoice[];
  payments: Payment[];
}

interface RepresentativeProfileProps {
  representativeId: number;
  onClose: () => void;
}

export default function RepresentativeProfile({ representativeId, onClose }: RepresentativeProfileProps) {
  const { data, isLoading, error } = useQuery<RepresentativeProfileData>({
    queryKey: [`/api/representatives/${representativeId}/profile`],
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

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('fa-IR') + ' تومان';
  };

  const getDebtSeverity = (debt: number) => {
    if (debt === 0) return { color: 'text-green-600 dark:text-green-400', level: 'بدون بدهی' };
    if (debt > 5000000) return { color: 'text-red-600 dark:text-red-400', level: 'بدهی بالا' };
    if (debt > 1000000) return { color: 'text-orange-600 dark:text-orange-400', level: 'بدهی متوسط' };
    return { color: 'text-yellow-600 dark:text-yellow-400', level: 'بدهی کم' };
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگذاری پروفایل نماینده...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
          <div className="text-center py-8">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">خطا در بارگذاری</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">امکان دریافت اطلاعات نماینده وجود ندارد</p>
            <Button onClick={onClose} variant="outline">بستن</Button>
          </div>
        </div>
      </div>
    );
  }

  const { representative, statistics, invoices, payments } = data;
  const debtInfo = getDebtSeverity(statistics.totalDebt);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  پروفایل نماینده
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{representative.storeName}</p>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              ✕ بستن
            </Button>
          </div>

          {/* Representative Information */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Basic Info */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  اطلاعات کلی
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">نام فروشگاه</p>
                    <p className="font-semibold">{representative.storeName}</p>
                  </div>
                  {representative.ownerName && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">نام مالک</p>
                      <p className="font-semibold">{representative.ownerName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">نام کاربری پنل</p>
                    <p className="font-semibold">{representative.panelUsername}</p>
                  </div>
                  {representative.phone && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">تلفن</p>
                      <p className="font-semibold">{representative.phone}</p>
                    </div>
                  )}
                  {representative.salesColleagueName && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">همکار فروش</p>
                      <p className="font-semibold">{representative.salesColleagueName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">تاریخ عضویت</p>
                    <p className="font-semibold">{new Date(representative.createdAt).toLocaleDateString('fa-IR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">وضعیت:</span>
                  <Badge variant={representative.isActive ? 'default' : 'secondary'}>
                    {representative.isActive ? 'فعال' : 'غیرفعال'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Debt Status */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  وضعیت بدهی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className={`text-3xl font-bold ${debtInfo.color}`}>
                    {formatAmount(statistics.totalDebt)}
                  </p>
                  <p className={`text-sm ${debtInfo.color} mt-1`}>{debtInfo.level}</p>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">کل فاکتورها</p>
                      <p className="font-semibold">{formatAmount(statistics.totalInvoiced)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">کل پرداخت‌ها</p>
                      <p className="font-semibold">{formatAmount(statistics.totalPaid)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">فاکتورها</p>
                <p className="text-xl font-bold">{statistics.invoiceCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">پرداخت نشده</p>
                <p className="text-xl font-bold">{statistics.unpaidCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">پرداخت شده</p>
                <p className="text-xl font-bold">{statistics.paidCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">پرداخت جزئی</p>
                <p className="text-xl font-bold">{statistics.partiallyPaidCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">پرداخت‌ها</p>
                <p className="text-xl font-bold">{statistics.paymentCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Invoices and Payments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  فاکتورهای اخیر
                </CardTitle>
                <CardDescription>
                  آخرین فاکتورهای صادر شده ({Math.min(5, invoices.length)} از {invoices.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {invoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">فاکتور #{invoice.id}</span>
                          {getStatusBadge(invoice.status)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(invoice.issueDate).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold">{formatAmount(invoice.amount)}</p>
                      </div>
                    </div>
                  ))}
                  {invoices.length === 0 && (
                    <p className="text-center text-gray-500 py-4">فاکتوری یافت نشد</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  پرداخت‌های اخیر
                </CardTitle>
                <CardDescription>
                  آخرین پرداخت‌های دریافتی ({Math.min(5, payments.length)} از {payments.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {payments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div>
                        <span className="font-semibold">پرداخت #{payment.id}</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(payment.paymentDate).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-green-600 dark:text-green-400">
                          {formatAmount(payment.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {payments.length === 0 && (
                    <p className="text-center text-gray-500 py-4">پرداختی یافت نشد</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}