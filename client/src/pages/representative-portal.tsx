import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Store, User, FileText, ArrowLeft, Eye } from "lucide-react";
import { format } from "date-fns";

interface Representative {
  id: number;
  storeName: string;
  ownerName: string | null;
  phone: string | null;
  telegramId: string | null;
  panelUsername: string;
  salesColleagueName: string | null;
  totalDebt: string;
  isActive: boolean;
  createdAt: string;
}

interface Invoice {
  id: number;
  representativeId: number;
  amount: string;
  status: 'unpaid' | 'partially_paid' | 'paid';
  issueDate: string;
  usageJsonDetails: any;
  isManual: boolean;
}

interface InvoiceDetail {
  invoice: Invoice;
  lineItems: Array<{
    description: string;
    amount: number;
    date: string;
  }>;
}

export default function RepresentativePortal() {
  const [match, params] = useRoute("/representatives/portal/:username");
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);
  const username = params?.username;

  // Fetch representative data
  const { data: representative, isLoading: repLoading, error: repError } = useQuery<Representative>({
    queryKey: ['/api/representatives/by-username', username],
    enabled: !!username,
  });

  // Fetch invoices for this representative
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ['/api/representatives', representative?.id, 'invoices'],
    enabled: !!representative?.id,
  });

  // Fetch detailed invoice when selected
  const { data: invoiceDetail, isLoading: detailLoading } = useQuery<InvoiceDetail>({
    queryKey: ['/api/invoices', selectedInvoice, 'detail'],
    enabled: !!selectedInvoice,
  });

  if (!match || !username) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">نماینده یافت نشد</h2>
              <p className="text-muted-foreground mt-2">لینک پورتال نامعتبر است</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (repError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">خطا در بارگیری اطلاعات</h2>
              <p className="text-muted-foreground mt-2">نماینده با این شناسه یافت نشد</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toLocaleString('fa-IR') + ' تومان';
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'unpaid': { label: 'پرداخت نشده', variant: 'destructive' as const },
      'partially_paid': { label: 'پرداخت جزئی', variant: 'secondary' as const },
      'paid': { label: 'پرداخت شده', variant: 'default' as const }
    };
    return statusMap[status] || { label: status, variant: 'outline' as const };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Store className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  پورتال نماینده
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  مشاهده فاکتورها و تاریخچه پرداخت‌ها
                </p>
              </div>
            </div>
          </div>
        </div>

        {repLoading ? (
          // Loading state
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : representative ? (
          <div className="space-y-6">
            
            {/* Representative Info Card */}
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader className="bg-blue-50 dark:bg-blue-950/50">
                <CardTitle className="text-xl text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  نماینده {representative.storeName}
                </CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  شناسه پنل: {representative.panelUsername}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {formatAmount(representative.totalDebt)}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">مانده حساب کل</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {invoices.length.toLocaleString('fa-IR')}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">تعداد فاکتورها</div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {invoices.filter(inv => inv.status === 'unpaid').length.toLocaleString('fa-IR')}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">فاکتورهای پرداخت نشده</div>
                    </div>
                  </div>
                </div>
                
                {representative.ownerName && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      صاحب فروشگاه: <span className="font-medium text-slate-900 dark:text-slate-100">{representative.ownerName}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  تاریخچه فاکتورها
                </CardTitle>
                <CardDescription>
                  مشاهده جزئیات و تاریخچه کامل فاکتورهای صادر شده
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : invoices.length > 0 ? (
                  <div className="space-y-3">
                    {invoices.map((invoice) => {
                      const statusInfo = getStatusBadge(invoice.status);
                      return (
                        <div 
                          key={invoice.id}
                          className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded">
                              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                فاکتور شماره FS-{invoice.id}
                              </div>
                              <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(invoice.issueDate), 'yyyy/MM/dd')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-left">
                              <div className="font-semibold text-slate-900 dark:text-slate-100">
                                {formatAmount(invoice.amount)}
                              </div>
                              <Badge variant={statusInfo.variant} className="text-xs">
                                {statusInfo.label}
                              </Badge>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedInvoice(invoice.id)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-3 w-3" />
                              مشاهده جزئیات
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400">هیچ فاکتوری یافت نشد</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Detail Modal/Section */}
            {selectedInvoice && (
              <Card className="border-2 border-green-200 dark:border-green-800">
                <CardHeader className="bg-green-50 dark:bg-green-950/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-green-900 dark:text-green-100 flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      جزئیات فاکتور FS-{selectedInvoice}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedInvoice(null)}
                      className="flex items-center gap-1"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      بستن
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {detailLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-6 w-1/2" />
                    </div>
                  ) : invoiceDetail ? (
                    <div className="space-y-6">
                      {/* Invoice Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">اطلاعات فاکتور</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">شماره فاکتور:</span>
                              <span className="font-medium">FS-{invoiceDetail.invoice.id}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">تاریخ صدور:</span>
                              <span className="font-medium">
                                {format(new Date(invoiceDetail.invoice.issueDate), 'yyyy/MM/dd', { locale: fa })}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">مبلغ کل:</span>
                              <span className="font-bold text-lg">{formatAmount(invoiceDetail.invoice.amount)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-600 dark:text-slate-400">وضعیت:</span>
                              <Badge variant={getStatusBadge(invoiceDetail.invoice.status).variant}>
                                {getStatusBadge(invoiceDetail.invoice.status).label}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Line Items */}
                      {invoiceDetail.lineItems && invoiceDetail.lineItems.length > 0 && (
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">جزئیات مصرف</h4>
                          <div className="space-y-2">
                            {invoiceDetail.lineItems.map((item, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium text-slate-900 dark:text-slate-100">
                                    {item.description}
                                  </div>
                                  <div className="text-sm text-slate-600 dark:text-slate-400">
                                    {format(new Date(item.date), 'yyyy/MM/dd HH:mm', { locale: fa })}
                                  </div>
                                </div>
                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                  {item.amount.toLocaleString('fa-IR')} تومان
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-slate-600 dark:text-slate-400">خطا در بارگیری جزئیات فاکتور</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}