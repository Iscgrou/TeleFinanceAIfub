import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Download, FileText, Filter, TrendingUp, Users, DollarSign, Clock } from 'lucide-react';

export default function Reports() {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('month');

  // Sample data for different report types
  const reportCards = [
    {
      id: 'sales',
      title: 'گزارش فروش',
      icon: DollarSign,
      value: '۴۵,۲۳۱,۰۰۰ تومان',
      change: '+۱۲%',
      color: 'text-green-600'
    },
    {
      id: 'representatives',
      title: 'عملکرد نمایندگان',
      icon: Users,
      value: '۱۹۹ نماینده',
      change: '+۸',
      color: 'text-blue-600'
    },
    {
      id: 'invoices',
      title: 'وضعیت فاکتورها',
      icon: FileText,
      value: '۸۵٪ پرداخت شده',
      change: '+۵%',
      color: 'text-purple-600'
    },
    {
      id: 'commissions',
      title: 'کمیسیون‌ها',
      icon: TrendingUp,
      value: '۳,۵۰۰,۰۰۰ تومان',
      change: '+۱۵%',
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">گزارش‌ها</h1>
          <p className="text-gray-600 mt-1">تحلیل جامع عملکرد و آمار مالی</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">امروز</SelectItem>
              <SelectItem value="week">هفته جاری</SelectItem>
              <SelectItem value="month">ماه جاری</SelectItem>
              <SelectItem value="quarter">سه ماهه</SelectItem>
              <SelectItem value="year">سال جاری</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="h-4 w-4 ml-2" />
            فیلترها
          </Button>
          <Button>
            <Download className="h-4 w-4 ml-2" />
            دانلود گزارش
          </Button>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportCards.map((card) => (
          <Card 
            key={card.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              reportType === card.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => setReportType(card.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className={`text-xs ${card.color} mt-1`}>
                {card.change} نسبت به ماه قبل
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Report Section */}
      <Card>
        <CardHeader>
          <CardTitle>جزئیات گزارش</CardTitle>
          <CardDescription>
            نمایش اطلاعات تفصیلی بر اساس نوع گزارش انتخابی
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4" />
              <p className="text-lg font-medium">نمودار {reportCards.find(r => r.id === reportType)?.title}</p>
              <p className="text-sm mt-2">داده‌های گزارش در اینجا نمایش داده می‌شود</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>گزارش‌های اخیر</CardTitle>
          <CardDescription>
            آخرین گزارش‌های تولید شده
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-gray-400" />
                  <div>
                    <p className="font-medium">گزارش فروش ماهانه</p>
                    <p className="text-sm text-gray-600">تاریخ: ۱۴۰۲/۰۹/۲۵</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">۲.۵ مگابایت</span>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}