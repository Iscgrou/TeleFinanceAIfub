import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  DollarSign,
  AlertCircle
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DashboardStats {
  totalRevenue: number;
  totalCommissions: number;
  netProfit: number;
  activeRepresentatives: number;
  pendingInvoices: number;
  overdueInvoices: number;
  monthlyRevenue: Array<{ month: string; amount: number }>;
  topPerformers: Array<{ name: string; amount: number }>;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
}

function StatCard({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  trend 
}: { 
  title: string; 
  value: string; 
  change?: string; 
  icon: React.ComponentType<any>; 
  trend?: 'up' | 'down' 
}) {
  return (
    <Card className="v2ray-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center pt-1">
            {trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-green-500 ml-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500 ml-1" />
            )}
            <span className={`text-xs ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
              {change}
            </span>
            <span className="text-xs text-muted-foreground mr-1">از ماه قبل</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats');
      if (!response.ok) {
        throw new Error('خطا در دریافت آمار داشبورد');
      }
      const result = await response.json();
      return result.data as DashboardStats;
    }
  });

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold">خطا در بارگذاری داده‌ها</h3>
          <p className="text-muted-foreground">لطفاً دوباره تلاش کنید</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-l from-primary/10 to-secondary/10 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          خوش آمدید به سیستم مدیریت مالی V2Ray
        </h1>
        <p className="text-muted-foreground">
          آخرین وضعیت مالی و عملکرد شما در یک نگاه
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="کل درآمد"
          value={formatCurrency(stats.totalRevenue)}
          change="+12.5%"
          icon={DollarSign}
          trend="up"
        />
        <StatCard
          title="کل کمیسیون‌ها"
          value={formatCurrency(stats.totalCommissions)}
          change="+8.2%"
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          title="سود خالص"
          value={formatCurrency(stats.netProfit)}
          change="+15.3%"
          icon={TrendingUp}
          trend="up"
        />
        <StatCard
          title="نمایندگان فعال"
          value={stats.activeRepresentatives.toString()}
          icon={Users}
        />
      </div>

      {/* Alerts */}
      {(stats.pendingInvoices > 0 || stats.overdueInvoices > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {stats.pendingInvoices > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
              <CardHeader>
                <CardTitle className="text-orange-800 dark:text-orange-200 flex items-center">
                  <FileText className="h-5 w-5 ml-2" />
                  فاکتورهای در انتظار
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {stats.pendingInvoices}
                </div>
                <p className="text-orange-700 dark:text-orange-300">
                  فاکتور در انتظار پرداخت
                </p>
              </CardContent>
            </Card>
          )}
          
          {stats.overdueInvoices > 0 && (
            <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <CardHeader>
                <CardTitle className="text-red-800 dark:text-red-200 flex items-center">
                  <AlertCircle className="h-5 w-5 ml-2" />
                  فاکتورهای معوقه
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {stats.overdueInvoices}
                </div>
                <p className="text-red-700 dark:text-red-300">
                  فاکتور معوقه نیاز به پیگیری
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>روند درآمد ماهانه</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performers Chart */}
        <Card>
          <CardHeader>
            <CardTitle>برترین نمایندگان</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topPerformers}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>عملیات سریع</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <FileText className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">صدور فاکتور جدید</h3>
              <p className="text-sm text-muted-foreground">ایجاد فاکتور برای نماینده</p>
            </div>
            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <Users className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">افزودن نماینده</h3>
              <p className="text-sm text-muted-foreground">ثبت نماینده جدید</p>
            </div>
            <div className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <DollarSign className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">ثبت پرداخت</h3>
              <p className="text-sm text-muted-foreground">ثبت پرداخت جدید</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}