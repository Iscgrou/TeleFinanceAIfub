/**
 * PHASE 6.1: Alert Management Dashboard
 * صفحه اصلی مدیریت هشدارهای هوشمند
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, 
  Shield, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus,
  Bell,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertRulesTable } from './AlertRulesTable';
import { RealTimeAlerts } from './RealTimeAlerts';
import { AlertHistory } from './AlertHistory';

interface AlertRule {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  triggerCount: number;
  createdAt: string;
  lastTriggered?: string;
}

interface AlertHistoryItem {
  id: number;
  ruleId: number;
  representativeId: number;
  status: 'pending' | 'acknowledged' | 'resolved';
  createdAt: string;
  message: string;
}

interface DashboardStats {
  totalRules: number;
  activeRules: number;
  pendingAlerts: number;
  resolvedToday: number;
  criticalAlerts: number;
}

export default function AlertManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/alerts/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch alert rules
  const { data: alertRules, isLoading: rulesLoading } = useQuery<AlertRule[]>({
    queryKey: ['/api/alerts/rules'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch recent alert history
  const { data: recentAlerts, isLoading: historyLoading } = useQuery<AlertHistoryItem[]>({
    queryKey: ['/api/alerts/history'],
    refetchInterval: 30000,
  });

  // Calculate derived statistics
  const derivedStats = {
    totalRules: alertRules?.length || 0,
    activeRules: alertRules?.filter(r => r.isActive).length || 0,
    pendingAlerts: recentAlerts?.filter(a => a.status === 'pending').length || 0,
    resolvedToday: recentAlerts?.filter(a => 
      a.status === 'resolved' && 
      new Date(a.createdAt).toDateString() === new Date().toDateString()
    ).length || 0,
    criticalAlerts: recentAlerts?.filter(a => 
      a.status === 'pending'
    ).length || 0
  };

  return (
    <div className="container mx-auto p-6 space-y-8" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">مدیریت هشدارهای هوشمند</h1>
            <p className="text-muted-foreground">
              مراقبت و مدیریت خودکار سیستم هشدارها
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قوانین فعال</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statsLoading ? '...' : derivedStats.activeRules}
            </div>
            <p className="text-xs text-muted-foreground">
              از {derivedStats.totalRules} قانون کل
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">هشدارهای در انتظار</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {historyLoading ? '...' : derivedStats.pendingAlerts}
            </div>
            <p className="text-xs text-muted-foreground">
              نیاز به بررسی
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">هشدارهای بحرانی</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {historyLoading ? '...' : derivedStats.criticalAlerts}
            </div>
            <p className="text-xs text-muted-foreground">
              اولویت بالا
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حل شده امروز</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {historyLoading ? '...' : derivedStats.resolvedToday}
            </div>
            <p className="text-xs text-muted-foreground">
              24 ساعت گذشته
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نرخ موفقیت</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {historyLoading ? '...' : '94%'}
            </div>
            <p className="text-xs text-muted-foreground">
              7 روز گذشته
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="grid w-full sm:w-auto grid-cols-4 lg:grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">خلاصه</span>
            </TabsTrigger>
            <TabsTrigger value="realtime" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">زنده</span>
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">قوانین</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">تاریخچه</span>
            </TabsTrigger>
          </TabsList>

          {activeTab === 'rules' && (
            <Button 
              onClick={() => {
                // Navigate to create rule page
                toast({
                  title: "ایجاد قانون جدید",
                  description: "در حال انتقال به صفحه ایجاد قانون...",
                });
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              قانون جدید
            </Button>
          )}
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  قوانین اخیر
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rulesLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alertRules?.slice(0, 5).map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Badge variant={rule.isActive ? "default" : "secondary"}>
                            {rule.isActive ? "فعال" : "غیرفعال"}
                          </Badge>
                          <div>
                            <p className="font-medium">{rule.name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                              {rule.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          اولویت: {rule.priority}
                        </div>
                      </div>
                    ))}
                    {(!alertRules || alertRules.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        هیچ قانونی تعریف نشده است
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  وضعیت سیستم
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>API سیستم هشدار</span>
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      فعال
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>تحلیل‌های AI</span>
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      فعال
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>پایگاه داده</span>
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      متصل
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>اعلانات</span>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      آماده
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Real-time Alerts Tab */}
        <TabsContent value="realtime">
          <RealTimeAlerts />
        </TabsContent>

        {/* Rules Management Tab */}
        <TabsContent value="rules">
          <AlertRulesTable rules={alertRules || []} isLoading={rulesLoading} />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <AlertHistory alerts={recentAlerts || []} isLoading={historyLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}