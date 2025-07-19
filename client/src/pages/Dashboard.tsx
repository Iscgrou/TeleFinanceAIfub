import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3,
  DollarSign,
  FileText,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2
} from "lucide-react";

interface DashboardStats {
  totalDebt: string;
  pendingCommissions: string;
  todayPayments: string;
  activeRepresentatives: number;
}

interface Representative {
  id: number;
  storeName: string;
  totalDebt: string;
  isActive: boolean;
}

interface Invoice {
  id: number;
  amount: string;
  status: string;
  issueDate: string;
  representativeId: number;
}

interface Payment {
  id: number;
  amount: string;
  paymentDate: string;
  representativeId: number;
}

export default function Dashboard() {
  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  // Fetch representatives
  const { data: repsResponse, isLoading: repsLoading } = useQuery<{data: Representative[]}>({
    queryKey: ['/api/representatives'],
  });

  // Fetch invoices
  const { data: invoicesResponse, isLoading: invoicesLoading } = useQuery<{data: Invoice[]}>({
    queryKey: ['/api/invoices'],
  });

  // Fetch payments
  const { data: paymentsResponse, isLoading: paymentsLoading } = useQuery<{data: Payment[]}>({
    queryKey: ['/api/payments'],
  });

  // Extract data
  const representatives = repsResponse?.data || [];
  const invoices = invoicesResponse?.data || [];
  const payments = paymentsResponse?.data || [];

  console.log("Dashboard Data:", { stats, representatives: representatives.length, invoices: invoices.length, payments: payments.length });

  const formatAmount = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('fa-IR') + ' تومان';
  };

  const getInvoicesByStatus = (status: string) => {
    return invoices.filter(invoice => invoice.status === status);
  };

  const getRecentInvoices = () => {
    return invoices
      .sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime())
      .slice(0, 5);
  };

  const getRecentPayments = () => {
    return payments
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
      .slice(0, 5);
  };

  const getTopDebtors = () => {
    return representatives
      .filter(rep => parseFloat(rep.totalDebt) > 0)
      .sort((a, b) => parseFloat(b.totalDebt) - parseFloat(a.totalDebt))
      .slice(0, 5);
  };

  const isLoading = statsLoading || repsLoading || invoicesLoading || paymentsLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            در حال بارگذاری داشبورد...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              داشبورد مدیریت مالی
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              مرکز کنترل و عملیات مالی سیستم
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل بدهی‌ها</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {stats ? formatAmount(stats.totalDebt) : formatAmount(
                representatives.reduce((sum, rep) => sum + parseFloat(rep.totalDebt || '0'), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              مجموع طلب از نمایندگان
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نمایندگان فعال</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats?.activeRepresentatives ?? representatives.filter(rep => rep.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              از {representatives.length} نماینده کل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل فاکتورها</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {invoices.length.toLocaleString('fa-IR')}
            </div>
            <p className="text-xs text-muted-foreground">
              فاکتورهای صادر شده
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">پرداخت‌های امروز</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats ? formatAmount(stats.todayPayments) : formatAmount(
                payments.filter(p => {
                  const today = new Date();
                  const paymentDate = new Date(p.paymentDate);
                  return paymentDate.toDateString() === today.toDateString();
                }).reduce((sum, p) => sum + parseFloat(p.amount), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              دریافتی امروز
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              فاکتورهای پرداخت نشده
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
              {getInvoicesByStatus('unpaid').length.toLocaleString('fa-IR')}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              مبلغ: {formatAmount(
                getInvoicesByStatus('unpaid').reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              فاکتورهای پرداخت شده
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
              {getInvoicesByStatus('paid').length.toLocaleString('fa-IR')}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              مبلغ: {formatAmount(
                getInvoicesByStatus('paid').reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              پرداخت جزئی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
              {getInvoicesByStatus('partially_paid').length.toLocaleString('fa-IR')}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              مبلغ: {formatAmount(
                getInvoicesByStatus('partially_paid').reduce((sum, inv) => sum + parseFloat(inv.amount), 0)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Top Debtors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle>آخرین فاکتورها</CardTitle>
            <CardDescription>
              {getRecentInvoices().length} فاکتور اخیر از {invoices.length} فاکتور
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getRecentInvoices().length > 0 ? (
                getRecentInvoices().map((invoice) => {
                  const rep = representatives.find(r => r.id === invoice.representativeId);
                  return (
                    <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="font-semibold">فاکتور #{invoice.id}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {rep?.storeName || 'نامشخص'} • {new Date(invoice.issueDate).toLocaleDateString('fa-IR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatAmount(invoice.amount)}</p>
                        <Badge variant={
                          invoice.status === 'paid' ? 'default' : 
                          invoice.status === 'partially_paid' ? 'secondary' : 'destructive'
                        }>
                          {invoice.status === 'paid' ? 'پرداخت شده' : 
                           invoice.status === 'partially_paid' ? 'پرداخت جزئی' : 'پرداخت نشده'}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-4">فاکتوری یافت نشد</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Debtors */}
        <Card>
          <CardHeader>
            <CardTitle>بالاترین بدهکاران</CardTitle>
            <CardDescription>
              {getTopDebtors().length} نماینده با بیشترین بدهی
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getTopDebtors().length > 0 ? (
                getTopDebtors().map((rep, index) => (
                  <div key={rep.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold">{rep.storeName}</p>
                        <Badge variant={rep.isActive ? 'default' : 'secondary'}>
                          {rep.isActive ? 'فعال' : 'غیرفعال'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 dark:text-red-400">
                        {formatAmount(rep.totalDebt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">نماینده‌ای با بدهی یافت نشد</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}