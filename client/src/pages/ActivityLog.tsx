import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Activity, 
  Clock, 
  User, 
  FileText, 
  DollarSign, 
  UserPlus, 
  Edit, 
  Trash2,
  Filter,
  Search
} from 'lucide-react';

export default function ActivityLog() {
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample activity data
  const activities = [
    {
      id: 1,
      type: 'invoice_created',
      title: 'فاکتور جدید صادر شد',
      description: 'فاکتور #1234 برای نماینده احمد محمدی',
      user: 'مدیر سیستم',
      time: '۵ دقیقه پیش',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 2,
      type: 'payment_received',
      title: 'پرداخت دریافت شد',
      description: 'مبلغ ۵,۰۰۰,۰۰۰ تومان از نماینده رضا احمدی',
      user: 'سیستم',
      time: '۱۵ دقیقه پیش',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 3,
      type: 'representative_added',
      title: 'نماینده جدید اضافه شد',
      description: 'نماینده جدید: علی رضایی - فروشگاه رضا',
      user: 'مدیر فروش',
      time: '۱ ساعت پیش',
      icon: UserPlus,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 4,
      type: 'data_updated',
      title: 'اطلاعات نماینده ویرایش شد',
      description: 'تغییر نرخ تعرفه برای نماینده محمد کریمی',
      user: 'مدیر مالی',
      time: '۲ ساعت پیش',
      icon: Edit,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: 5,
      type: 'invoice_deleted',
      title: 'فاکتور حذف شد',
      description: 'فاکتور #1230 به دلیل خطا در ثبت حذف شد',
      user: 'مدیر سیستم',
      time: '۳ ساعت پیش',
      icon: Trash2,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  const activityTypes = {
    all: 'همه فعالیت‌ها',
    invoice_created: 'صدور فاکتور',
    payment_received: 'دریافت پرداخت',
    representative_added: 'افزودن نماینده',
    data_updated: 'ویرایش اطلاعات',
    invoice_deleted: 'حذف فاکتور'
  };

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = filter === 'all' || activity.type === filter;
    const matchesSearch = activity.title.includes(searchQuery) || 
                         activity.description.includes(searchQuery) ||
                         activity.user.includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ردگیری تغییرات</h1>
          <p className="text-gray-600 mt-1">تاریخچه کامل فعالیت‌های سیستم</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-gray-600">
            <Activity className="h-3 w-3 ml-1" />
            {activities.length} فعالیت امروز
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">فیلترها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="جستجو در فعالیت‌ها..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(activityTypes).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 ml-2" />
              فیلترهای پیشرفته
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>فعالیت‌های اخیر</CardTitle>
          <CardDescription>
            لیست تمام تغییرات و رویدادهای ثبت شده در سیستم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredActivities.map((activity, index) => (
              <div key={activity.id} className="relative">
                {/* Timeline Line */}
                {index < filteredActivities.length - 1 && (
                  <div className="absolute top-10 right-6 bottom-0 w-0.5 bg-gray-200"></div>
                )}
                
                {/* Activity Item */}
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-full ${activity.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <activity.icon className={`h-6 w-6 ${activity.color}`} />
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{activity.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {activity.user}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {activity.time}
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {activityTypes[activity.type]}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredActivities.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>هیچ فعالیتی یافت نشد</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline">
          نمایش فعالیت‌های بیشتر
        </Button>
      </div>
    </div>
  );
}