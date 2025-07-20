import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiRequest } from '@/utils/api';
import { TrendingUp, TrendingDown, DollarSign, Users, Target, PieChart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell } from 'recharts';

export default function ProfitabilityAnalysis() {
  const [analysisType, setAnalysisType] = useState<string>('representative');
  const [timePeriod, setTimePeriod] = useState<string>('30');

  // Fetch profitability report
  const { data: profitabilityData, isLoading: profitabilityLoading, refetch } = useQuery({
    queryKey: ['/api/profitability/analysis', analysisType, timePeriod],
    queryFn: () => apiRequest(`/api/profitability/analysis?type=${analysisType}&period=${timePeriod}`)
  });

  // Fetch ROI analysis
  const { data: roiData, isLoading: roiLoading } = useQuery({
    queryKey: ['/api/profitability/roi-analysis'],
    queryFn: () => apiRequest('/api/profitability/roi-analysis')
  });

  // Fetch segment analysis
  const { data: segmentData, isLoading: segmentLoading } = useQuery({
    queryKey: ['/api/profitability/segment-analysis'],
    queryFn: () => apiRequest('/api/profitability/segment-analysis')
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getProfitabilityColor = (margin: number) => {
    if (margin >= 20) return 'text-green-600';
    if (margin >= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProfitabilityBadge = (margin: number) => {
    if (margin >= 20) return { variant: 'default' as const, text: 'عالی' };
    if (margin >= 10) return { variant: 'secondary' as const, text: 'خوب' };
    if (margin >= 0) return { variant: 'secondary' as const, text: 'متوسط' };
    return { variant: 'destructive' as const, text: 'ضعیف' };
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const handleRefreshAnalysis = () => {
    refetch();
  };

  if (profitabilityLoading || roiLoading || segmentLoading) {
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
        <h1 className="text-3xl font-bold">تحلیل سودآوری</h1>
        <div className="flex items-center gap-4">
          <Select value={analysisType} onValueChange={setAnalysisType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="representative">بر اساس نماینده</SelectItem>
              <SelectItem value="product">بر اساس محصول</SelectItem>
              <SelectItem value="region">بر اساس منطقه</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timePeriod} onValueChange={setTimePeriod}>
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
          <Button onClick={handleRefreshAnalysis} disabled={profitabilityLoading}>
            بروزرسانی
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل درآمد</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profitabilityData?.data ? formatCurrency(profitabilityData.data.totalRevenue) : '---'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">سود خالص</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {profitabilityData?.data ? formatCurrency(profitabilityData.data.netProfit) : '---'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حاشیه سود</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProfitabilityColor(profitabilityData?.data?.profitMargin || 0)}`}>
              {profitabilityData?.data ? formatPercentage(profitabilityData.data.profitMargin) : '---'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI میانگین</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roiData?.data ? formatPercentage(roiData.data.averageROI) : '---'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="representatives">نمایندگان</TabsTrigger>
          <TabsTrigger value="segments">بخش‌بندی</TabsTrigger>
          <TabsTrigger value="trends">روندها</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>روند سودآوری ماهانه</CardTitle>
                <CardDescription>تغییرات سود و درآمد در ماه‌های اخیر</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={profitabilityData?.data?.monthlyTrends || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => new Intl.NumberFormat('fa-IR', { notation: 'compact' }).format(value)} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} name="درآمد" />
                      <Line type="monotone" dataKey="profit" stroke="#82ca9d" strokeWidth={2} name="سود" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توزیع سود بر اساس بخش</CardTitle>
                <CardDescription>سهم هر بخش از کل سودآوری</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={segmentData?.data?.segments || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="profit"
                      >
                        {(segmentData?.data?.segments || []).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'سود']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>شاخص‌های کلیدی عملکرد</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {profitabilityData?.data ? formatCurrency(profitabilityData.data.averageOrderValue) : '---'}
                  </div>
                  <div className="text-sm text-blue-700">میانگین ارزش سفارش</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {profitabilityData?.data ? formatPercentage(profitabilityData.data.customerRetentionRate) : '---'}
                  </div>
                  <div className="text-sm text-green-700">نرخ حفظ مشتری</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {profitabilityData?.data ? formatCurrency(profitabilityData.data.customerLifetimeValue) : '---'}
                  </div>
                  <div className="text-sm text-purple-700">ارزش دوره عمر مشتری</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="representatives" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>رتبه‌بندی نمایندگان بر اساس سودآوری</CardTitle>
              <CardDescription>عملکرد سودآوری نمایندگان در دوره انتخاب شده</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">رتبه</TableHead>
                      <TableHead className="text-right">نام فروشگاه</TableHead>
                      <TableHead className="text-right">کل درآمد</TableHead>
                      <TableHead className="text-right">سود خالص</TableHead>
                      <TableHead className="text-right">حاشیه سود</TableHead>
                      <TableHead className="text-right">ROI</TableHead>
                      <TableHead className="text-right">عملکرد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitabilityData?.data?.topPerformers?.map((rep: any, index: number) => {
                      const badge = getProfitabilityBadge(rep.profitMargin);
                      return (
                        <TableRow key={rep.id}>
                          <TableCell className="font-medium">#{index + 1}</TableCell>
                          <TableCell>{rep.storeName}</TableCell>
                          <TableCell>{formatCurrency(rep.revenue)}</TableCell>
                          <TableCell className="text-green-600">{formatCurrency(rep.profit)}</TableCell>
                          <TableCell className={getProfitabilityColor(rep.profitMargin)}>
                            {formatPercentage(rep.profitMargin)}
                          </TableCell>
                          <TableCell>{formatPercentage(rep.roi)}</TableCell>
                          <TableCell>
                            <Badge variant={badge.variant}>{badge.text}</Badge>
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

        <TabsContent value="segments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تحلیل بخش‌های مختلف</CardTitle>
              <CardDescription>مقایسه عملکرد سودآوری بین بخش‌های مختلف کسب‌وکار</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {segmentData?.data?.segments?.map((segment: any, index: number) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-semibold">{segment.name}</h4>
                      <Badge variant={getProfitabilityBadge(segment.profitMargin).variant}>
                        {getProfitabilityBadge(segment.profitMargin).text}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">درآمد</div>
                        <div className="font-bold">{formatCurrency(segment.revenue)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">سود</div>
                        <div className="font-bold text-green-600">{formatCurrency(segment.profit)}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">حاشیه سود</div>
                        <div className={`font-bold ${getProfitabilityColor(segment.profitMargin)}`}>
                          {formatPercentage(segment.profitMargin)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600">سهم از کل</div>
                        <div className="font-bold">{formatPercentage(segment.marketShare)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تحلیل روند سودآوری</CardTitle>
              <CardDescription>بررسی تغییرات سودآوری در طول زمان</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitabilityData?.data?.quarterlyTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="quarter" />
                    <YAxis tickFormatter={(value) => new Intl.NumberFormat('fa-IR', { notation: 'compact' }).format(value)} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" name="درآمد" />
                    <Bar dataKey="profit" fill="#82ca9d" name="سود" />
                    <Bar dataKey="expenses" fill="#ff7c7c" name="هزینه‌ها" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>پیش‌بینی سودآوری</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>سود پیش‌بینی شده ماه آینده:</span>
                    <span className="font-bold text-green-600">
                      {profitabilityData?.data ? formatCurrency(profitabilityData.data.projectedProfit) : '---'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>رشد پیش‌بینی شده:</span>
                    <span className={`font-bold ${(profitabilityData?.data?.projectedGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitabilityData?.data ? formatPercentage(profitabilityData.data.projectedGrowth) : '---'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>اعتماد پیش‌بینی:</span>
                    <span className="font-bold">
                      {profitabilityData?.data ? formatPercentage(profitabilityData.data.forecastConfidence) : '---'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>توصیه‌های بهبود</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profitabilityData?.data?.recommendations?.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}