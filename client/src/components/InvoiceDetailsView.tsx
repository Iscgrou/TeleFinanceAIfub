import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Calendar,
  DollarSign,
  Clock,
  User,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Invoice {
  id: number;
  amount: string;
  status: string;
  createdAt: string;
  description?: string;
  representativeId: number;
}

interface InvoiceDetail {
  id: number;
  invoiceId: number;
  persianDate: string;
  persianMonth: string;
  persianYear: string;
  description?: string;
  notes?: string;
  createdAt: string;
}

interface Props {
  invoice: Invoice;
  representativeName?: string;
  onClose?: () => void;
}

const InvoiceDetailsView: React.FC<Props> = ({ 
  invoice, 
  representativeName = 'نامشخص',
  onClose 
}) => {
  const [details, setDetails] = useState<InvoiceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoiceDetails();
  }, [invoice.id]);

  const fetchInvoiceDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/invoices/${invoice.id}/details`);
      
      if (response.ok) {
        const data = await response.json();
        setDetails(data);
      } else if (response.status === 404) {
        // جزئیات وجود ندارد، آن را ایجاد کنیم
        await createInvoiceDetails();
      } else {
        throw new Error('خطا در دریافت جزئیات فاکتور');
      }
    } catch (error: any) {
      console.error('Error fetching invoice details:', error);
      setError(error.message || 'خطا در دریافت جزئیات');
      toast({
        title: "خطا",
        description: "خطا در دریافت جزئیات فاکتور",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createInvoiceDetails = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: invoice.description || 'فاکتور',
          notes: 'جزئیات تولید شده خودکار'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDetails(data);
        toast({
          title: "موفق",
          description: "جزئیات فاکتور ایجاد شد",
          variant: "default"
        });
      } else {
        throw new Error('خطا در ایجاد جزئیات فاکتور');
      }
    } catch (error: any) {
      console.error('Error creating invoice details:', error);
      setError(error.message || 'خطا در ایجاد جزئیات');
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('fa-IR').format(Number(amount)) + ' تومان';
  };

  const formatPersianDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />پرداخت شده</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />در انتظار</Badge>;
      case 'overdue':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />گذشته از موعد</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="mr-3">در حال بارگذاری جزئیات...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <AlertCircle className="h-12 w-12 mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">خطا در بارگذاری</p>
            <p className="text-sm mb-4">{error}</p>
            <Button onClick={fetchInvoiceDetails} variant="outline">
              تلاش مجدد
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto" dir="rtl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">
                جزئیات فاکتور #{invoice.id}
              </CardTitle>
              <CardDescription>
                {representativeName}
              </CardDescription>
            </div>
          </div>
          {onClose && (
            <Button variant="outline" size="sm" onClick={onClose}>
              بستن
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* اطلاعات اصلی فاکتور */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                مبلغ فاکتور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(invoice.amount)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                وضعیت پرداخت
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getStatusBadge(invoice.status)}
            </CardContent>
          </Card>
        </div>

        {/* تاریخ‌های فاکتور */}
        {details && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                اطلاعات تاریخی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">تاریخ شمسی</div>
                  <div className="font-semibold text-blue-800">
                    {details.persianDate || 'نامشخص'}
                  </div>
                </div>
                <div className="text-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">ماه شمسی</div>
                  <div className="font-semibold text-green-800">
                    {details.persianMonth || 'نامشخص'}
                  </div>
                </div>
                <div className="text-center p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">سال شمسی</div>
                  <div className="font-semibold text-purple-800">
                    {details.persianYear || 'نامشخص'}
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="text-xs text-gray-600 mb-1">تاریخ و زمان ایجاد (میلادی)</div>
                <div className="text-sm font-medium">
                  {formatPersianDateTime(invoice.createdAt)}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* توضیحات فاکتور */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5" />
              توضیحات و یادداشت‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {invoice.description && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">توضیحات فاکتور:</div>
                <div className="text-sm bg-gray-50 p-3 rounded-lg">
                  {invoice.description}
                </div>
              </div>
            )}
            
            {details?.description && details.description !== invoice.description && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">توضیحات جزئیات:</div>
                <div className="text-sm bg-blue-50 p-3 rounded-lg">
                  {details.description}
                </div>
              </div>
            )}

            {details?.notes && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">یادداشت‌ها:</div>
                <div className="text-sm bg-yellow-50 p-3 rounded-lg">
                  {details.notes}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* اطلاعات فنی */}
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <span className="font-medium">شناسه فاکتور:</span> {invoice.id}
          </div>
          <div>
            <span className="font-medium">شناسه نماینده:</span> {invoice.representativeId}
          </div>
          {details && (
            <>
              <div>
                <span className="font-medium">شناسه جزئیات:</span> {details.id}
              </div>
              <div>
                <span className="font-medium">تاریخ ایجاد جزئیات:</span> {formatPersianDateTime(details.createdAt)}
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InvoiceDetailsView;