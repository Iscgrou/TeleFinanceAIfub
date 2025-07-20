import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/utils/api';
import { TrendingUp, TrendingDown, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function CashFlowForecast() {
  const [forecastDays, setForecastDays] = useState<string>('30');
  const [scenarioType, setScenarioType] = useState<string>('realistic');

  // Fetch cash flow forecast
  const { data: forecast, isLoading: forecastLoading, refetch } = useQuery({
    queryKey: ['/api/cash-flow/forecast', forecastDays, scenarioType],
    queryFn: () => apiRequest(`/api/cash-flow/forecast?days=${forecastDays}&scenario=${scenarioType}`)
  });

  // Fetch historical trends
  const { data: trends, isLoading: trendsLoading } = useQuery({
    queryKey: ['/api/cash-flow/trends'],
    queryFn: () => apiRequest('/api/cash-flow/trends')
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getHealthBadgeVariant = (health: string) => {
    switch (health) {
      case 'healthy': return 'default';
      case 'warning': return 'secondary';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

  const getHealthText = (health: string) => {
    switch (health) {
      case 'healthy': return 'سالم';
      case 'warning': return 'هشدار';
      case 'critical': return 'بحرانی';
      default: return 'نامعلوم';
    }
  };

  const handleRefreshForecast = () => {
    refetch();
  };

  if (forecastLoading || trendsLoading) {
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
        <h1 className="text-3xl font-bold">پیش‌بینی جریان نقدی</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="days">دوره پیش‌بینی:</Label>
            <Select value={forecastDays} onValueChange={setForecastDays}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 روز</SelectItem>
                <SelectItem value="30">30 روز</SelectItem>
                <SelectItem value="90">90 روز</SelectItem>
                <SelectItem value="365">1 سال</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="scenario">سناریو:</Label>
            <Select value={scenarioType} onValueChange={setScenarioType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="optimistic">خوشبینانه</SelectItem>
                <SelectItem value="realistic">واقع‌گرایانه</SelectItem>
                <SelectItem value="pessimistic">بدبینانه</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleRefreshForecast} disabled={forecastLoading}>
            بروزرسانی
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">وضعیت جریان نقدی</CardTitle>
            {forecast?.data?.cashFlowHealth === 'healthy' ? 
              <TrendingUp className="h-4 w-4 text-green-600" /> : 
              <TrendingDown className="h-4 w-4 text-red-600" />
            }
          </CardHeader>
          <CardContent>
            <Badge variant={getHealthBadgeVariant(forecast?.data?.cashFlowHealth)}>
              {getHealthText(forecast?.data?.cashFlowHealth)}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">موجودی پیش‌بینی شده</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forecast?.data ? formatCurrency(forecast.data.projectedBalance) : '---'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">درآمد پیش‌بینی شده</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {forecast?.data ? formatCurrency(forecast.data.expectedIncome) : '---'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">روزهای نقدینگی</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forecast?.data ? `${forecast.data.liquidityDays} روز` : '---'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="forecast" className="space-y-4">
        <TabsList>
          <TabsTrigger value="forecast">پیش‌بینی</TabsTrigger>
          <TabsTrigger value="trends">روندها</TabsTrigger>
          <TabsTrigger value="scenarios">سناریوها</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>نمودار پیش‌بینی جریان نقدی</CardTitle>
              <CardDescription>
                پیش‌بینی {forecastDays} روزه جریان نقدی با سناریو {
                  scenarioType === 'optimistic' ? 'خوشبینانه' :
                  scenarioType === 'realistic' ? 'واقع‌گرایانه' : 'بدبینانه'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forecast?.data?.dailyProjections || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                    />
                    <YAxis tickFormatter={(value) => new Intl.NumberFormat('fa-IR', { notation: 'compact' }).format(value)} />
                    <Tooltip 
                      labelFormatter={formatDate}
                      formatter={(value: number) => [formatCurrency(value), '']}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="cumulativeBalance" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="موجودی تجمعی"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="dailyIncome" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="درآمد روزانه"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="dailyExpenses" 
                      stroke="#ff7c7c" 
                      strokeWidth={2}
                      name="هزینه‌های روزانه"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {forecast?.data?.alerts && forecast.data.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  هشدارهای جریان نقدی
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {forecast.data.alerts.map((alert: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-orange-500" />
                      <div>
                        <div className="font-medium">{alert.message}</div>
                        <div className="text-sm text-gray-600">
                          تاریخ: {formatDate(alert.date)} | شدت: {alert.severity === 'high' ? 'بالا' : alert.severity === 'medium' ? 'متوسط' : 'کم'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>روند تاریخی درآمد</CardTitle>
              <CardDescription>تحلیل درآمد ماهانه در 12 ماه گذشته</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends?.data?.monthlyIncome || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => new Intl.NumberFormat('fa-IR', { notation: 'compact' }).format(value)} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'درآمد']} />
                    <Legend />
                    <Bar dataKey="income" fill="#82ca9d" name="درآمد ماهانه" />
                    <Bar dataKey="expenses" fill="#ff7c7c" name="هزینه‌های ماهانه" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>میانگین دریافت پرداخت</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {trends?.data ? `${trends.data.averagePaymentDelay} روز` : '---'}
                </div>
                <p className="text-sm text-muted-foreground">
                  میانگین زمان دریافت پرداخت از نمایندگان
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>نرخ وصولی</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {trends?.data ? `${trends.data.collectionRate.toFixed(1)}%` : '---'}
                </div>
                <p className="text-sm text-muted-foreground">
                  درصد موفقیت در وصول طلب از نمایندگان
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>سناریو خوشبینانه</CardTitle>
                <CardDescription>فرض بهترین وضعیت</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>نرخ وصولی:</span>
                    <span className="font-bold">95%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>رشد درآمد:</span>
                    <span className="font-bold text-green-600">+15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>کاهش هزینه:</span>
                    <span className="font-bold text-green-600">-5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>سناریو واقع‌گرایانه</CardTitle>
                <CardDescription>بر اساس روندهای فعلی</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>نرخ وصولی:</span>
                    <span className="font-bold">
                      {trends?.data ? `${trends.data.collectionRate.toFixed(1)}%` : '---'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>رشد درآمد:</span>
                    <span className="font-bold">0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>تغییر هزینه:</span>
                    <span className="font-bold">0%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>سناریو بدبینانه</CardTitle>
                <CardDescription>فرض بدترین وضعیت</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>نرخ وصولی:</span>
                    <span className="font-bold">70%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>کاهش درآمد:</span>
                    <span className="font-bold text-red-600">-10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>افزایش هزینه:</span>
                    <span className="font-bold text-red-600">+10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>مقایسه سناریوها</CardTitle>
              <CardDescription>پیش‌بینی موجودی نهایی در سناریوهای مختلف</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">سناریو</TableHead>
                    <TableHead className="text-right">موجودی پایان دوره</TableHead>
                    <TableHead className="text-right">تغییر نسبت به فعلی</TableHead>
                    <TableHead className="text-right">ریسک نقدینگی</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">خوشبینانه</TableCell>
                    <TableCell className="text-green-600">
                      {forecast?.data ? formatCurrency(forecast.data.projectedBalance * 1.15) : '---'}
                    </TableCell>
                    <TableCell className="text-green-600">+15%</TableCell>
                    <TableCell>
                      <Badge variant="default">کم</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">واقع‌گرایانه</TableCell>
                    <TableCell>
                      {forecast?.data ? formatCurrency(forecast.data.projectedBalance) : '---'}
                    </TableCell>
                    <TableCell>0%</TableCell>
                    <TableCell>
                      <Badge variant="secondary">متوسط</Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">بدبینانه</TableCell>
                    <TableCell className="text-red-600">
                      {forecast?.data ? formatCurrency(forecast.data.projectedBalance * 0.85) : '---'}
                    </TableCell>
                    <TableCell className="text-red-600">-15%</TableCell>
                    <TableCell>
                      <Badge variant="destructive">بالا</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}