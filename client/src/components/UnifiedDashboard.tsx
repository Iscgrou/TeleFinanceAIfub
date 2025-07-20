import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/utils/api';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Banknote, 
  Shield,
  FileText,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  Eye
} from 'lucide-react';
import CreditManagement from '../pages/CreditManagement';
import CashFlowForecast from '../pages/CashFlowForecast';
import ProfitabilityAnalysis from '../pages/ProfitabilityAnalysis';
import BankReconciliation from '../pages/BankReconciliation';
import SecurityDashboard from './SecurityDashboard';

interface Representative {
  id: number;
  storeName: string;
  ownerName: string | null;
  panelUsername: string;
  totalDebt: string;
  isActive: boolean;
  createdAt: string;
}

interface DashboardStats {
  totalRepresentatives: number;
  totalDebt: number;
  activeRepresentatives: number;
  averageDebt: number;
  unpaidInvoices: number;
  overduePayments: number;
}

export default function UnifiedDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: () => apiRequest('/api/dashboard/stats')
  });

  // Fetch representatives
  const { data: repsData, isLoading: repsLoading, refetch: refetchReps } = useQuery({
    queryKey: ['/api/representatives'],
    queryFn: () => apiRequest('/api/representatives')
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const refreshData = () => {
    refetchStats();
    refetchReps();
  };

  if (statsLoading || repsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const dashboardStats = stats?.data as DashboardStats;
  const representatives = repsData?.data as Representative[] || [];

  // Calculate additional metrics
  const topDebtors = representatives
    .sort((a, b) => parseFloat(b.totalDebt) - parseFloat(a.totalDebt))
    .slice(0, 5);

  const recentPayments = representatives
    .filter(rep => parseFloat(rep.totalDebt) > 0)
    .slice(0, 3);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">داشبورد مدیریت مالی</h1>
          <p className="text-gray-600">نمای جامع سیستم مدیریت نمایندگان و امور مالی</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            بروزرسانی
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            سیستم آنلاین
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-white border">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            نمای کلی
          </TabsTrigger>
          <TabsTrigger value="credit" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            مدیریت اعتبار
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            جریان نقدی
          </TabsTrigger>
          <TabsTrigger value="profitability" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            سودآوری
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            تطبیق بانکی
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            امنیت
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-r-4 border-r-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">کل نمایندگان</CardTitle>
                <Users className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {dashboardStats ? dashboardStats.totalRepresentatives.toLocaleString('fa-IR') : '---'}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {dashboardStats ? `${dashboardStats.activeRepresentatives.toLocaleString('fa-IR')} فعال` : '---'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-r-4 border-r-red-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">کل بدهی</CardTitle>
                <DollarSign className="h-5 w-5 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {dashboardStats ? formatCurrency(dashboardStats.totalDebt) : '---'}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  میانگین: {dashboardStats ? formatCurrency(dashboardStats.averageDebt) : '---'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-r-4 border-r-yellow-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">فاکتورهای پرداخت نشده</CardTitle>
                <FileText className="h-5 w-5 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {dashboardStats ? dashboardStats.unpaidInvoices.toLocaleString('fa-IR') : '---'}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  نیاز به پیگیری
                </p>
              </CardContent>
            </Card>

            <Card className="border-r-4 border-r-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">پرداخت‌های معوق</CardTitle>
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {dashboardStats ? dashboardStats.overduePayments.toLocaleString('fa-IR') : '---'}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  نیاز به اقدام فوری
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts and Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Debtors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  بالاترین بدهکاران
                </CardTitle>
                <CardDescription>
                  لیست نمایندگان با بیشترین میزان بدهی
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topDebtors.map((rep, index) => (
                    <div key={rep.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{rep.storeName}</p>
                          <p className="text-sm text-gray-600">{rep.panelUsername}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-red-600">
                          {formatCurrency(parseFloat(rep.totalDebt))}
                        </p>
                        <Badge variant={rep.isActive ? "default" : "secondary"} className="text-xs">
                          {rep.isActive ? "فعال" : "غیرفعال"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                {topDebtors.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>هیچ بدهکاری یافت نشد</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  فعالیت‌های اخیر
                </CardTitle>
                <CardDescription>
                  آخرین تغییرات و بروزرسانی‌ها
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPayments.map((rep) => (
                    <div key={rep.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{rep.storeName}</p>
                          <p className="text-sm text-gray-600">
                            ایجاد شده: {new Date(rep.createdAt).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        نماینده جدید
                      </Badge>
                    </div>
                  ))}
                </div>
                {recentPayments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>فعالیت اخیری یافت نشد</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>اقدامات سریع</CardTitle>
              <CardDescription>دسترسی سریع به عملکردهای پرکاربرد</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  <Users className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium">افزودن نماینده</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  <FileText className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium">ایجاد فاکتور</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                  <span className="text-sm font-medium">ثبت پرداخت</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                  <span className="text-sm font-medium">گزارش مالی</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit">
          <CreditManagement />
        </TabsContent>

        <TabsContent value="cashflow">
          <CashFlowForecast />
        </TabsContent>

        <TabsContent value="profitability">
          <ProfitabilityAnalysis />
        </TabsContent>

        <TabsContent value="reconciliation">
          <BankReconciliation />
        </TabsContent>

        <TabsContent value="security">
          <SecurityDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}