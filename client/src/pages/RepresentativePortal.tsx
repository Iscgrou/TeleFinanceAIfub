import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RepresentativeMessages from '@/components/RepresentativeMessages';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  CreditCard, 
  FileText, 
  DollarSign, 
  Calendar,
  MessageCircle,
  TrendingUp,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

interface Representative {
  id: number;
  storeName: string;
  ownerName: string;
  totalDebt: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  panelUsername: string;
}

interface Invoice {
  id: number;
  amount: string;
  status: string;
  createdAt: string;
  description?: string;
}

interface Payment {
  id: number;
  amount: string;
  paymentDate: string;
  notes?: string;
}

const RepresentativePortal: React.FC = () => {
  const [match, params] = useRoute('/portal/:username');
  const [representative, setRepresentative] = useState<Representative | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  const username = params?.username;

  useEffect(() => {
    if (username) {
      fetchRepresentativeData();
    }
  }, [username]);

  const fetchRepresentativeData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch representative basic info
      const repResponse = await fetch(`/api/representatives/by-username/${username}`);
      if (!repResponse.ok) {
        throw new Error('نماینده یافت نشد');
      }
      const repData = await repResponse.json();
      setRepresentative(repData);

      // Fetch invoices
      const invoiceResponse = await fetch(`/api/representatives/${repData.id}/invoices`);
      if (invoiceResponse.ok) {
        const invoiceData = await invoiceResponse.json();
        setInvoices(invoiceData || []);
      }

      // Fetch payments
      const paymentResponse = await fetch(`/api/representatives/${repData.id}/payments`);
      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        setPayments(paymentData || []);
      }

    } catch (error: any) {
      console.error('Error fetching representative data:', error);
      toast({
        title: "خطا",
        description: error.message || "خطا در دریافت اطلاعات نماینده",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('fa-IR').format(Number(amount)) + ' تومان';
  };

  const formatPersianDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (!match) {
    return <div>صفحه یافت نشد</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">در حال بارگذاری اطلاعات...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!representative) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center p-4 text-red-600">
              نماینده با نام کاربری "{username}" یافت نشد
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-full">
                  <User className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{representative.storeName}</CardTitle>
                  <CardDescription className="text-lg">
                    {representative.ownerName}
                  </CardDescription>
                </div>
              </div>
              <Badge 
                variant={representative.isActive ? "default" : "secondary"}
                className="text-sm"
              >
                {representative.isActive ? 'فعال' : 'غیرفعال'}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">موجودی بدهی</CardTitle>
              <DollarSign className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(representative.totalDebt)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تعداد فاکتورها</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {invoices.length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تعداد پرداخت‌ها</CardTitle>
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {payments.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">کلی</TabsTrigger>
                <TabsTrigger value="invoices">فاکتورها</TabsTrigger>
                <TabsTrigger value="payments">پرداخت‌ها</TabsTrigger>
                <TabsTrigger value="messages">پیام‌ها</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        اطلاعات تماس
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {representative.phoneNumber && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span>{representative.phoneNumber}</span>
                        </div>
                      )}
                      {representative.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span>{representative.email}</span>
                        </div>
                      )}
                      {representative.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span>{representative.address}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        آمار سریع
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span>مجموع فاکتورها:</span>
                        <span className="font-semibold">{invoices.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>مجموع پرداخت‌ها:</span>
                        <span className="font-semibold">{payments.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>موجودی بدهی:</span>
                        <span className="font-semibold text-red-600">
                          {formatCurrency(representative.totalDebt)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="invoices" className="mt-6">
                <div className="space-y-4">
                  {invoices.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2" />
                      <p>هیچ فاکتوری برای نمایش وجود ندارد</p>
                    </div>
                  ) : (
                    invoices.map((invoice) => (
                      <Card key={invoice.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                              فاکتور #{invoice.id}
                            </CardTitle>
                            <Badge variant="outline">
                              {invoice.status === 'paid' ? 'پرداخت شده' : 'در انتظار'}
                            </Badge>
                          </div>
                          <CardDescription>
                            {formatPersianDate(invoice.createdAt)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold">
                              {formatCurrency(invoice.amount)}
                            </span>
                            {invoice.description && (
                              <span className="text-gray-600 text-sm">
                                {invoice.description}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="payments" className="mt-6">
                <div className="space-y-4">
                  {payments.length === 0 ? (
                    <div className="text-center p-8 text-gray-500">
                      <CreditCard className="h-8 w-8 mx-auto mb-2" />
                      <p>هیچ پرداختی برای نمایش وجود ندارد</p>
                    </div>
                  ) : (
                    payments.map((payment) => (
                      <Card key={payment.id}>
                        <CardHeader>
                          <CardTitle className="text-base">
                            پرداخت #{payment.id}
                          </CardTitle>
                          <CardDescription>
                            {formatPersianDate(payment.paymentDate)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-green-600">
                              {formatCurrency(payment.amount)}
                            </span>
                            {payment.notes && (
                              <span className="text-gray-600 text-sm">
                                {payment.notes}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="messages" className="mt-6">
                <RepresentativeMessages 
                  representativeId={representative.id}
                  representativeName={representative.storeName}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RepresentativePortal;