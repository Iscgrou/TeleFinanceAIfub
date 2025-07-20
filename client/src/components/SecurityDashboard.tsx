import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/utils/api';
import { Shield, AlertTriangle, Activity, Lock, Users, Eye } from 'lucide-react';

export default function SecurityDashboard() {
  const [timeRange, setTimeRange] = useState('24h');

  // Fetch security metrics
  const { data: securityMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/security/metrics', timeRange],
    queryFn: () => apiRequest(`/api/security/metrics?timeRange=${timeRange}`)
  });

  // Fetch security events
  const { data: securityEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/security/events', timeRange],
    queryFn: () => apiRequest(`/api/security/events?timeRange=${timeRange}`)
  });

  // Fetch audit logs
  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ['/api/security/audit-logs', timeRange],
    queryFn: () => apiRequest(`/api/security/audit-logs?timeRange=${timeRange}`)
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fa-IR');
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'low': return { variant: 'default' as const, text: 'کم' };
      case 'medium': return { variant: 'secondary' as const, text: 'متوسط' };
      case 'high': return { variant: 'destructive' as const, text: 'بالا' };
      case 'critical': return { variant: 'destructive' as const, text: 'بحرانی' };
      default: return { variant: 'secondary' as const, text: 'نامعلوم' };
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'LOGIN_ATTEMPT': return '🔑';
      case 'RATE_LIMIT_EXCEEDED': return '⚡';
      case 'INVALID_TOKEN': return '🚫';
      case 'SUSPICIOUS_ACTIVITY': return '🔍';
      case 'DATA_ACCESS': return '📁';
      default: return '⚠️';
    }
  };

  if (metricsLoading || eventsLoading || auditLoading) {
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
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">داشبورد امنیتی</h1>
        <div className="flex items-center gap-4">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded-md px-3 py-1"
          >
            <option value="1h">1 ساعت گذشته</option>
            <option value="24h">24 ساعت گذشته</option>
            <option value="7d">7 روز گذشته</option>
            <option value="30d">30 روز گذشته</option>
          </select>
        </div>
      </div>

      {/* Security Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">وضعیت امنیتی</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {securityMetrics?.data?.overallStatus === 'secure' ? 'امن' : 'هشدار'}
            </div>
            <p className="text-xs text-muted-foreground">
              سطح امنیت: {securityMetrics?.data?.securityLevel || 'متوسط'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تهدیدات مسدود شده</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {securityMetrics?.data?.blockedThreats || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              در {timeRange === '1h' ? '1 ساعت' : timeRange === '24h' ? '24 ساعت' : timeRange === '7d' ? '7 روز' : '30 روز'} گذشته
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تلاش‌های ورود ناموفق</CardTitle>
            <Lock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {securityMetrics?.data?.failedLogins || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              نرخ موفقیت: {securityMetrics?.data?.loginSuccessRate?.toFixed(1) || '0'}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کاربران فعال</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {securityMetrics?.data?.activeUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              جلسات فعال: {securityMetrics?.data?.activeSessions || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">رویدادهای امنیتی</TabsTrigger>
          <TabsTrigger value="audit">گزارش تراکنش‌ها</TabsTrigger>
          <TabsTrigger value="monitoring">نظارت بر سیستم</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>رویدادهای امنیتی اخیر</CardTitle>
              <CardDescription>لیست آخرین فعالیت‌های امنیتی شناسایی شده</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">زمان</TableHead>
                      <TableHead className="text-right">نوع رویداد</TableHead>
                      <TableHead className="text-right">کاربر</TableHead>
                      <TableHead className="text-right">IP آدرس</TableHead>
                      <TableHead className="text-right">شدت</TableHead>
                      <TableHead className="text-right">جزئیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {securityEvents?.data?.events?.map((event: any) => {
                      const severityBadge = getSeverityBadge(event.severity);
                      return (
                        <TableRow key={event.id}>
                          <TableCell>{formatDate(event.timestamp)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{getEventTypeIcon(event.type)}</span>
                              <span>{event.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>{event.userId || 'ناشناس'}</TableCell>
                          <TableCell>{event.ipAddress}</TableCell>
                          <TableCell>
                            <Badge variant={severityBadge.variant}>
                              {severityBadge.text}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {event.details || 'بدون جزئیات'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>لاگ حسابرسی</CardTitle>
              <CardDescription>تاریخچه کامل فعالیت‌های کاربران</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">زمان</TableHead>
                      <TableHead className="text-right">کاربر</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                      <TableHead className="text-right">منبع</TableHead>
                      <TableHead className="text-right">نتیجه</TableHead>
                      <TableHead className="text-right">جزئیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs?.data?.logs?.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDate(log.timestamp)}</TableCell>
                        <TableCell>{log.userId || 'سیستم'}</TableCell>
                        <TableCell>{log.action}</TableCell>
                        <TableCell>{log.resource}</TableCell>
                        <TableCell>
                          {log.success ? (
                            <Badge variant="default">موفق</Badge>
                          ) : (
                            <Badge variant="destructive">ناموفق</Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {log.details && typeof log.details === 'object' 
                            ? JSON.stringify(log.details, null, 2).substring(0, 100) + '...'
                            : log.details || 'بدون جزئیات'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>وضعیت خدمات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>پایگاه داده</span>
                    <Badge variant="default">✅ فعال</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>سرور وب</span>
                    <Badge variant="default">✅ فعال</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ربات تلگرام</span>
                    <Badge variant="secondary">⏸️ متوقف</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>سیستم یادآوری</span>
                    <Badge variant="default">✅ فعال</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>آمار عملکرد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>زمان پاسخ متوسط</span>
                    <span className="font-bold">
                      {securityMetrics?.data?.avgResponseTime || '< 100'} ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>مصرف CPU</span>
                    <span className="font-bold">
                      {securityMetrics?.data?.cpuUsage || '15'}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>مصرف RAM</span>
                    <span className="font-bold">
                      {securityMetrics?.data?.memoryUsage || '40'}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>درخواست‌های امروز</span>
                    <span className="font-bold">
                      {securityMetrics?.data?.dailyRequests || '1,234'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>توصیه‌های امنیتی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <div className="font-medium">فعال‌سازی احراز هویت دو مرحله‌ای</div>
                    <div className="text-sm text-gray-600">برای افزایش امنیت حساب‌های کاربری</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <Lock className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-medium">بروزرسانی منظم رمزهای عبور</div>
                    <div className="text-sm text-gray-600">تغییر دوره‌ای رمزهای عبور سیستم</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <Eye className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <div className="font-medium">نظارت بر لاگ‌های امنیتی</div>
                    <div className="text-sm text-gray-600">بررسی روزانه گزارشات امنیتی</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}