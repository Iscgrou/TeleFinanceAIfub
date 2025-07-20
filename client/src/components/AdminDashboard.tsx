import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/utils/api';
import { Users, CreditCard, TrendingUp, DollarSign, BarChart3, Banknote, Shield } from 'lucide-react';
import CreditManagement from '../pages/CreditManagement';
import CashFlowForecast from '../pages/CashFlowForecast';
import ProfitabilityAnalysis from '../pages/ProfitabilityAnalysis';
import BankReconciliation from '../pages/BankReconciliation';
import SecurityDashboard from './SecurityDashboard';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: () => apiRequest('/api/dashboard/stats')
  });

  // Fetch representatives
  const { data: repsData, isLoading: repsLoading } = useQuery({
    queryKey: ['/api/representatives'],
    queryFn: () => apiRequest('/api/representatives')
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  if (statsLoading || repsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">داشبورد مدیریت مالی</h1>
          <p className="text-gray-600">سیستم جامع مدیریت نمایندگان و امور مالی</p>
        </div>
      </div>

      <div className="container mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              داشبورد
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

          <TabsContent value="dashboard" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">کل نمایندگان</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.data ? stats.data.totalRepresentatives : '---'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.data ? `${stats.data.activeRepresentatives} فعال` : '---'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">کل بدهی</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.data ? formatCurrency(stats.data.totalDebt) : '---'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    میانگین: {stats?.data ? formatCurrency(stats.data.averageDebt) : '---'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">فاکتورهای پرداخت نشده</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.data ? stats.data.unpaidInvoices : '---'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ارزش: {stats?.data ? formatCurrency(stats.data.unpaidInvoicesValue) : '---'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">وضعیت سیستم</CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge variant="default">عملیاتی</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    آخرین بروزرسانی: الان
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Top Debtors */}
            <Card>
              <CardHeader>
                <CardTitle>بالاترین بدهکاران</CardTitle>
                <CardDescription>نمایندگان با بیشترین میزان بدهی</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {repsData?.data?.slice(0, 5)?.map((rep: any, index: number) => (
                    <div key={rep.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <div>
                          <div className="font-medium">{rep.storeName}</div>
                          <div className="text-sm text-gray-600">{rep.ownerName || 'نامشخص'}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600">{formatCurrency(parseFloat(rep.totalDebt))}</div>
                        <div className="text-sm text-gray-500">
                          <Badge variant={rep.isActive ? "default" : "secondary"}>
                            {rep.isActive ? 'فعال' : 'غیرفعال'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
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
    </div>
  );
}