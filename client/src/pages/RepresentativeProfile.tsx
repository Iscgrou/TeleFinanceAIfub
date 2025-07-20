import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/utils/api';
import { 
  User, 
  Store, 
  CreditCard, 
  FileText, 
  TrendingUp, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Activity,
  Eye,
  Edit
} from 'lucide-react';

interface Representative {
  id: number;
  storeName: string;
  ownerName: string | null;
  panelUsername: string;
  totalDebt: string;
  isActive: boolean;
  createdAt: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
  businessInfo?: {
    businessType?: string;
    registrationDate?: string;
    taxId?: string;
  };
}

interface RepresentativeStats {
  totalInvoices: number;
  paidInvoices: number;
  totalPayments: number;
  averageInvoiceAmount: number;
  lastPaymentDate: string | null;
  creditRating: 'excellent' | 'good' | 'fair' | 'poor';
}

interface RepresentativeProfileProps {
  representativeId: number;
  onEdit?: () => void;
  showActions?: boolean;
}

export default function RepresentativeProfile({ 
  representativeId, 
  onEdit, 
  showActions = true 
}: RepresentativeProfileProps) {
  const queryClient = useQueryClient();
  
  // Fetch representative data
  const { data: representative, isLoading: repLoading } = useQuery({
    queryKey: ['/api/representatives', representativeId],
    queryFn: () => apiRequest(`/api/representatives/${representativeId}`)
  });

  // Fetch representative stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/representatives', representativeId, 'stats'],
    queryFn: () => apiRequest(`/api/representatives/${representativeId}/stats`)
  });

  // Fetch recent invoices
  const { data: recentInvoices } = useQuery({
    queryKey: ['/api/representatives', representativeId, 'invoices'],
    queryFn: () => apiRequest(`/api/representatives/${representativeId}/invoices?limit=5`)
  });

  // Fetch recent payments
  const { data: recentPayments } = useQuery({
    queryKey: ['/api/representatives', representativeId, 'payments'],
    queryFn: () => apiRequest(`/api/representatives/${representativeId}/payments?limit=5`)
  });

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('fa-IR').format(parseFloat(amount.toString())) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getCreditRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCreditRatingText = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'عالی';
      case 'good': return 'خوب';
      case 'fair': return 'متوسط';
      case 'poor': return 'ضعیف';
      default: return 'نامشخص';
    }
  };

  if (repLoading) {
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

  if (!representative?.data) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <User className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">نماینده یافت نشد</h2>
          <p className="text-gray-600">اطلاعات نماینده مورد نظر در دسترس نیست</p>
        </div>
      </div>
    );
  }

  const rep = representative.data as Representative;
  const repStats = stats?.data as RepresentativeStats;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{rep.storeName}</h1>
          <p className="text-gray-600">پروفایل کامل نماینده</p>
        </div>
        {showActions && (
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => window.open(`/portal/${rep.panelUsername}`, '_blank')}
              variant="outline"
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              مشاهده پرتال
            </Button>
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
              <Store className="h-5 w-5" />
              اطلاعات پایه
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">نام کاربری:</span>
              <span className="font-medium">{rep.panelUsername}</span>
            </div>
            {rep.ownerName && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">مالک:</span>
                <span className="font-medium">{rep.ownerName}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">وضعیت:</span>
              <Badge variant={rep.isActive ? "default" : "secondary"}>
                {rep.isActive ? "فعال" : "غیرفعال"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">تاریخ عضویت:</span>
              <span className="text-sm">{formatDate(rep.createdAt)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Financial Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              وضعیت مالی
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">بدهی فعلی</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(rep.totalDebt)}
              </p>
            </div>
            {repStats && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">رتبه اعتباری:</span>
                  <Badge className={getCreditRatingColor(repStats.creditRating)}>
                    {getCreditRatingText(repStats.creditRating)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">میانگین فاکتور:</span>
                  <span className="text-sm">{formatCurrency(repStats.averageInvoiceAmount)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              عملکرد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {repStats ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">کل فاکتورها:</span>
                  <span className="font-medium">{repStats.totalInvoices.toLocaleString('fa-IR')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">پرداخت شده:</span>
                  <span className="font-medium text-green-600">{repStats.paidInvoices.toLocaleString('fa-IR')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">کل پرداخت‌ها:</span>
                  <span className="font-medium">{repStats.totalPayments.toLocaleString('fa-IR')}</span>
                </div>
                {repStats.lastPaymentDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">آخرین پرداخت:</span>
                    <span className="text-sm">{formatDate(repStats.lastPaymentDate)}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <Activity className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">در حال بارگذاری آمار...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              فاکتورهای اخیر
            </CardTitle>
            <CardDescription>آخرین فاکتورهای صادر شده</CardDescription>
          </CardHeader>
          <CardContent>
            {recentInvoices?.data && recentInvoices.data.length > 0 ? (
              <div className="space-y-3">
                {recentInvoices.data.map((invoice: any) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">فاکتور #{invoice.id}</p>
                      <p className="text-sm text-gray-600">{formatDate(invoice.createdAt)}</p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold">{formatCurrency(invoice.amount)}</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          invoice.status === 'paid' ? 'border-green-500 text-green-700' :
                          invoice.status === 'partially_paid' ? 'border-yellow-500 text-yellow-700' :
                          'border-red-500 text-red-700'
                        }`}
                      >
                        {invoice.status === 'paid' ? 'پرداخت شده' :
                         invoice.status === 'partially_paid' ? 'نیمه پرداخت' : 'پرداخت نشده'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>هیچ فاکتوری یافت نشد</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              پرداخت‌های اخیر
            </CardTitle>
            <CardDescription>آخرین پرداخت‌های دریافتی</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPayments?.data && recentPayments.data.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.data.map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">پرداخت #{payment.id}</p>
                      <p className="text-sm text-gray-600">{formatDate(payment.createdAt)}</p>
                      {payment.description && (
                        <p className="text-xs text-gray-500">{payment.description}</p>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-green-700">+{formatCurrency(payment.amount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>هیچ پرداختی یافت نشد</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}