import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/utils/api';
import { 
  User, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Phone,
  Mail,
  Award,
  Activity,
  Edit,
  FileText,
  CreditCard
} from 'lucide-react';

interface SalesColleague {
  id: number;
  name: string;
  commissionRate: string;
  createdAt: string;
  isActive?: boolean;
  contactInfo?: {
    phone?: string;
    email?: string;
    department?: string;
  };
  performance?: {
    totalSales: number;
    totalCommissions: number;
    activeRepresentatives: number;
    monthlyTarget?: number;
  };
}

interface ColleagueStats {
  totalRepresentatives: number;
  totalCommissions: number;
  thisMonthCommissions: number;
  averageCommissionPerRep: number;
  topRepresentative?: {
    name: string;
    totalDebt: number;
  };
  recentActivity: Array<{
    type: 'commission' | 'representative_added' | 'payment_received';
    description: string;
    amount?: number;
    date: string;
  }>;
}

interface SalesColleagueProfileProps {
  colleagueId: number;
  onEdit?: () => void;
  showActions?: boolean;
}

export default function SalesColleagueProfile({ 
  colleagueId, 
  onEdit, 
  showActions = true 
}: SalesColleagueProfileProps) {
  const queryClient = useQueryClient();
  
  // Fetch colleague data
  const { data: colleague, isLoading: colleagueLoading } = useQuery({
    queryKey: ['/api/sales-colleagues', colleagueId],
    queryFn: () => apiRequest(`/api/sales-colleagues/${colleagueId}`)
  });

  // Fetch colleague stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/sales-colleagues', colleagueId, 'stats'],
    queryFn: () => apiRequest(`/api/sales-colleagues/${colleagueId}/stats`)
  });

  // Fetch assigned representatives
  const { data: representatives } = useQuery({
    queryKey: ['/api/sales-colleagues', colleagueId, 'representatives'],
    queryFn: () => apiRequest(`/api/sales-colleagues/${colleagueId}/representatives`)
  });

  // Fetch commission records
  const { data: commissions } = useQuery({
    queryKey: ['/api/sales-colleagues', colleagueId, 'commissions'],
    queryFn: () => apiRequest(`/api/sales-colleagues/${colleagueId}/commissions?limit=10`)
  });

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('fa-IR').format(parseFloat(amount.toString())) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getPerformanceRating = (colleague: SalesColleague, stats: ColleagueStats) => {
    if (!stats || !colleague.performance?.monthlyTarget) return 'نامشخص';
    
    const achievement = (stats.thisMonthCommissions / colleague.performance.monthlyTarget) * 100;
    
    if (achievement >= 120) return { text: 'عالی', color: 'bg-green-100 text-green-800' };
    if (achievement >= 100) return { text: 'خوب', color: 'bg-blue-100 text-blue-800' };
    if (achievement >= 80) return { text: 'متوسط', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'نیاز به بهبود', color: 'bg-red-100 text-red-800' };
  };

  if (colleagueLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!colleague?.data) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">همکار یافت نشد</h2>
          <p className="text-gray-600">اطلاعات همکار مورد نظر در دسترس نیست</p>
        </div>
      </div>
    );
  }

  const col = colleague.data as SalesColleague;
  const colStats = stats?.data as ColleagueStats;
  const performance = colStats ? getPerformanceRating(col, colStats) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{col.name}</h1>
          <p className="text-gray-600">پروفایل همکار فروش</p>
        </div>
        {showActions && (
          <div className="flex items-center gap-3">
            {onEdit && (
              <Button onClick={onEdit} size="sm">
                <Edit className="h-4 w-4 mr-2" />
                ویرایش
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              اطلاعات پایه
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">نرخ کمیسیون:</span>
              <span className="font-medium">{parseFloat(col.commissionRate).toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">تاریخ عضویت:</span>
              <span className="text-sm">{formatDate(col.createdAt)}</span>
            </div>
            {col.contactInfo?.department && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">دپارتمان:</span>
                <span className="font-medium">{col.contactInfo.department}</span>
              </div>
            )}
            {col.contactInfo?.phone && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">تلفن:</span>
                <span className="font-medium">{col.contactInfo.phone}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Commission Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              کمیسیون
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {colStats ? (
              <>
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">کل کمیسیون</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(colStats.totalCommissions)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">این ماه:</span>
                  <span className="font-medium">{formatCurrency(colStats.thisMonthCommissions)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">میانگین فی نماینده:</span>
                  <span className="text-sm">{formatCurrency(colStats.averageCommissionPerRep)}</span>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <DollarSign className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">در حال بارگذاری...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              عملکرد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {colStats ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">نمایندگان فعال:</span>
                  <span className="font-medium">{colStats.totalRepresentatives.toLocaleString('fa-IR')}</span>
                </div>
                {performance && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">ارزیابی:</span>
                    <Badge className={performance.color}>
                      {performance.text}
                    </Badge>
                  </div>
                )}
                {colStats.topRepresentative && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">برترین نماینده</p>
                    <p className="font-medium">{colStats.topRepresentative.name}</p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(colStats.topRepresentative.totalDebt)}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <Activity className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">در حال بارگذاری...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Representatives */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              نمایندگان تحت مدیریت
            </CardTitle>
            <CardDescription>لیست نمایندگان تخصیص داده شده</CardDescription>
          </CardHeader>
          <CardContent>
            {representatives?.data && representatives.data.length > 0 ? (
              <div className="space-y-3">
                {representatives.data.slice(0, 8).map((rep: any) => (
                  <div key={rep.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{rep.storeName}</p>
                      <p className="text-sm text-gray-600">{rep.panelUsername}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-red-600">{formatCurrency(rep.totalDebt)}</p>
                      <Badge variant={rep.isActive ? "default" : "secondary"} className="text-xs">
                        {rep.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {representatives.data.length > 8 && (
                  <p className="text-center text-sm text-gray-500 pt-2">
                    و {representatives.data.length - 8} نماینده دیگر...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>هیچ نماینده‌ای تخصیص داده نشده</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Commissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              کمیسیون‌های اخیر
            </CardTitle>
            <CardDescription>آخرین کمیسیون‌های محاسبه شده</CardDescription>
          </CardHeader>
          <CardContent>
            {commissions?.data && commissions.data.length > 0 ? (
              <div className="space-y-3">
                {commissions.data.map((commission: any) => (
                  <div key={commission.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">فاکتور #{commission.invoiceId}</p>
                      <p className="text-sm text-gray-600">{formatDate(commission.createdAt)}</p>
                      <p className="text-xs text-gray-500">
                        نرخ: {parseFloat(commission.commissionRate).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-green-700">+{formatCurrency(commission.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>هیچ کمیسیونی یافت نشد</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Timeline */}
      {colStats?.recentActivity && colStats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              فعالیت‌های اخیر
            </CardTitle>
            <CardDescription>آخرین فعالیت‌ها و تغییرات</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {colStats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border-l-2 border-blue-200 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {activity.type === 'commission' && <DollarSign className="h-4 w-4 text-blue-600" />}
                    {activity.type === 'representative_added' && <Users className="h-4 w-4 text-blue-600" />}
                    {activity.type === 'payment_received' && <CreditCard className="h-4 w-4 text-blue-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-600">{formatDate(activity.date)}</p>
                  </div>
                  {activity.amount && (
                    <div className="text-left">
                      <p className="font-bold text-green-600">+{formatCurrency(activity.amount)}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}