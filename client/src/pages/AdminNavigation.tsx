import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, FileText, BarChart3, Settings, Bot, MessageSquare } from 'lucide-react';

export default function AdminNavigation() {
  const navigationItems = [
    {
      title: 'مدیریت نمایندگان',
      description: 'افزودن، ویرایش، حذف و مدیریت بدهی نمایندگان',
      icon: Users,
      href: '/admin/representatives',
      color: 'blue'
    },
    {
      title: 'مدیریت همکاران فروش',
      description: 'مدیریت همکاران فروش و نرخ کمیسیون‌ها',
      icon: UserCheck,
      href: '/admin/colleagues',
      color: 'green'
    },
    {
      title: 'مدیریت فاکتورها',
      description: 'ایجاد، مشاهده و بایگانی فاکتورهای نمایندگان',
      icon: FileText,
      href: '/admin/invoices',
      color: 'purple'
    },
    {
      title: 'داشبورد یکپارچه',
      description: 'داشبورد مدرن با تمام قابلیت‌ها',
      icon: BarChart3,
      href: '/dashboard',
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700',
      green: 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700',
      purple: 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700',
      orange: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700',
      gray: 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const getIconColorClasses = (color: string) => {
    const colors = {
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600',
      orange: 'text-orange-600',
      gray: 'text-gray-600'
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-2xl">💰</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">مرکز مدیریت مالی</h1>
                <p className="text-gray-600">سیستم جامع مدیریت نمایندگان و عملیات مالی</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                <Bot className="h-4 w-4 inline-block mr-2" />
                بوت تلگرام فعال
              </div>
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                <MessageSquare className="h-4 w-4 inline-block mr-2" />
                همگام‌سازی کامل
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            قابلیت‌های مدیریتی کامل
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            سیستم مدیریت مالی با قابلیت‌های کامل CRUD برای نمایندگان و همکاران فروش، 
            همگام‌سازی دو طرفه بین وب اپ و بوت تلگرام
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card 
                key={item.href}
                className={`transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${getColorClasses(item.color)} border-2`}
              >
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center shadow-lg">
                    <Icon className={`h-8 w-8 ${getIconColorClasses(item.color)}`} />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button 
                    onClick={() => window.location.href = item.href}
                    className="w-full bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm"
                    size="lg"
                  >
                    ورود به بخش
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                وضعیت سیستم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">واجهات CRUD</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    ✅ کامل
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">همگام‌سازی</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    ✅ فعال
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">بوت تلگرام</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    ✅ آماده
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">مدیریت فاکتورها</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                    ✅ پیاده‌سازی شده
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                قابلیت‌های پیاده‌سازی شده
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">افزودن نماینده و همکار فروش</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">حذف نماینده و همکار فروش</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">افزایش/کاهش مبلغ بدهی</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">ویرایش پروفایل</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">مدیریت و بایگانی فاکتورها</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access */}
        <div className="mt-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">دسترسی سریع</h3>
          <div className="flex justify-center gap-4 flex-wrap">
            <Button 
              onClick={() => window.location.href = '/admin/representatives'}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              مدیریت نمایندگان
            </Button>
            <Button 
              onClick={() => window.location.href = '/admin/colleagues'}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              مدیریت همکاران
            </Button>
            <Button 
              onClick={() => window.location.href = '/admin/invoices'}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              مدیریت فاکتورها
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}