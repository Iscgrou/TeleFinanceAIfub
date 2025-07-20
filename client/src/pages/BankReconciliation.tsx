import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/utils/api';
import { FileUpload, CheckCircle, XCircle, AlertTriangle, DollarSign, Clock } from 'lucide-react';

export default function BankReconciliation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState<any>(null);
  const [selectedDiscrepancy, setSelectedDiscrepancy] = useState<any>(null);
  const [reconciliationNote, setReconciliationNote] = useState<string>('');

  // Fetch reconciliation status
  const { data: reconciliationStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/bank-reconciliation/status'],
    queryFn: () => apiRequest('/api/bank-reconciliation/status')
  });

  // Fetch unreconciled transactions
  const { data: unreconciledData, isLoading: unreconciledLoading } = useQuery({
    queryKey: ['/api/bank-reconciliation/unreconciled'],
    queryFn: () => apiRequest('/api/bank-reconciliation/unreconciled')
  });

  // Upload bank statement mutation
  const uploadMutation = useMutation({
    mutationFn: (data: FormData) =>
      apiRequest('/api/bank-reconciliation/upload-statement', {
        method: 'POST',
        body: data,
      }),
    onSuccess: (result) => {
      toast({
        title: 'موفقیت',
        description: 'فایل صورتحساب بانکی با موفقیت آپلود شد',
      });
      setUploadData(result.data);
      queryClient.invalidateQueries({ queryKey: ['/api/bank-reconciliation/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bank-reconciliation/unreconciled'] });
    },
    onError: () => {
      toast({
        title: 'خطا',
        description: 'خطا در آپلود فایل صورتحساب',
        variant: 'destructive'
      });
    }
  });

  // Process reconciliation mutation
  const processMutation = useMutation({
    mutationFn: () => apiRequest('/api/bank-reconciliation/process', { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: 'موفقیت',
        description: 'تطبیق بانکی با موفقیت انجام شد',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bank-reconciliation/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bank-reconciliation/unreconciled'] });
    },
    onError: () => {
      toast({
        title: 'خطا',
        description: 'خطا در انجام تطبیق بانکی',
        variant: 'destructive'
      });
    }
  });

  // Resolve discrepancy mutation
  const resolveMutation = useMutation({
    mutationFn: (data: { transactionId: number; resolution: string; note: string }) =>
      apiRequest('/api/bank-reconciliation/resolve-discrepancy', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: 'موفقیت',
        description: 'اختلاف با موفقیت حل شد',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bank-reconciliation/unreconciled'] });
      setSelectedDiscrepancy(null);
      setReconciliationNote('');
    },
    onError: () => {
      toast({
        title: 'خطا',
        description: 'خطا در حل اختلاف',
        variant: 'destructive'
      });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const formData = new FormData();
      formData.append('bankStatement', file);
      uploadMutation.mutate(formData);
    }
  };

  const handleProcessReconciliation = () => {
    processMutation.mutate();
  };

  const handleResolveDiscrepancy = (resolution: string) => {
    if (!selectedDiscrepancy || !reconciliationNote) {
      toast({
        title: 'خطا',
        description: 'لطفا یادداشت توضیحی وارد کنید',
        variant: 'destructive'
      });
      return;
    }

    resolveMutation.mutate({
      transactionId: selectedDiscrepancy.id,
      resolution,
      note: reconciliationNote
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reconciled': return { variant: 'default' as const, text: 'تطبیق شده' };
      case 'pending': return { variant: 'secondary' as const, text: 'در انتظار' };
      case 'discrepancy': return { variant: 'destructive' as const, text: 'اختلاف' };
      default: return { variant: 'secondary' as const, text: 'نامعلوم' };
    }
  };

  if (statusLoading || unreconciledLoading) {
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
        <h1 className="text-3xl font-bold">تطبیق بانکی</h1>
        <Button 
          onClick={handleProcessReconciliation}
          disabled={processMutation.isPending}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4" />
          شروع تطبیق خودکار
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تراکنش‌های تطبیق شده</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reconciliationStatus?.data ? reconciliationStatus.data.reconciledCount : 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تراکنش‌های در انتظار</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {reconciliationStatus?.data ? reconciliationStatus.data.pendingCount : 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">اختلافات</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {reconciliationStatus?.data ? reconciliationStatus.data.discrepancyCount : 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مجموع اختلاف</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reconciliationStatus?.data ? formatCurrency(reconciliationStatus.data.totalDiscrepancy) : '---'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">آپلود صورتحساب</TabsTrigger>
          <TabsTrigger value="unreconciled">تراکنش‌های تطبیق نشده</TabsTrigger>
          <TabsTrigger value="discrepancies">اختلافات</TabsTrigger>
          <TabsTrigger value="reports">گزارشات</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>آپلود صورتحساب بانکی</CardTitle>
              <CardDescription>فایل‌های CSV, Excel یا PDF صورتحساب بانکی را آپلود کنید</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">فایل صورتحساب بانکی را انتخاب کنید</h3>
                  <p className="text-sm text-gray-600">CSV, XLSX, یا PDF تا حداکثر 10 مگابایت</p>
                </div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.pdf"
                  onChange={handleFileUpload}
                  className="mt-4"
                />
              </div>

              {uploadMutation.isPending && (
                <div className="text-center">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p>در حال آپلود و پردازش فایل...</p>
                </div>
              )}

              {uploadData && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">نتیجه آپلود</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>تعداد تراکنش‌ها: {uploadData.transactionCount}</div>
                    <div>دوره زمانی: {formatDate(uploadData.startDate)} تا {formatDate(uploadData.endDate)}</div>
                    <div>مجموع واریزی: {formatCurrency(uploadData.totalCredits)}</div>
                    <div>مجموع برداشتی: {formatCurrency(uploadData.totalDebits)}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unreconciled" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تراکنش‌های تطبیق نشده</CardTitle>
              <CardDescription>تراکنش‌هایی که هنوز با سیستم حسابداری تطبیق نشده‌اند</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">تاریخ</TableHead>
                      <TableHead className="text-right">شرح</TableHead>
                      <TableHead className="text-right">مبلغ</TableHead>
                      <TableHead className="text-right">نوع</TableHead>
                      <TableHead className="text-right">وضعیت</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unreconciledData?.data?.transactions?.map((transaction: any) => {
                      const badge = getStatusBadge(transaction.status);
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>{formatDate(transaction.date)}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(Math.abs(transaction.amount))}
                          </TableCell>
                          <TableCell>
                            {transaction.amount >= 0 ? 'واریز' : 'برداشت'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={badge.variant}>{badge.text}</Badge>
                          </TableCell>
                          <TableCell>
                            {transaction.status === 'discrepancy' && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setSelectedDiscrepancy(transaction)}
                                  >
                                    حل اختلاف
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>حل اختلاف تراکنش</DialogTitle>
                                    <DialogDescription>
                                      تراکنش: {transaction.description} - {formatCurrency(Math.abs(transaction.amount))}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="note">یادداشت توضیحی</Label>
                                      <Input
                                        id="note"
                                        value={reconciliationNote}
                                        onChange={(e) => setReconciliationNote(e.target.value)}
                                        placeholder="توضیح درباره حل این اختلاف..."
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter className="gap-2">
                                    <Button 
                                      variant="outline"
                                      onClick={() => handleResolveDiscrepancy('ignore')}
                                      disabled={resolveMutation.isPending}
                                    >
                                      نادیده گرفتن
                                    </Button>
                                    <Button 
                                      variant="default"
                                      onClick={() => handleResolveDiscrepancy('match')}
                                      disabled={resolveMutation.isPending}
                                    >
                                      تطبیق دستی
                                    </Button>
                                    <Button 
                                      variant="destructive"
                                      onClick={() => handleResolveDiscrepancy('adjust')}
                                      disabled={resolveMutation.isPending}
                                    >
                                      تعدیل حساب
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
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

        <TabsContent value="discrepancies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>تحلیل اختلافات</CardTitle>
              <CardDescription>بررسی دقیق اختلافات بین سیستم و بانک</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {reconciliationStatus?.data?.discrepancyTypes?.missing || 0}
                  </div>
                  <div className="text-sm text-red-700">تراکنش‌های گمشده</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {reconciliationStatus?.data?.discrepancyTypes?.duplicate || 0}
                  </div>
                  <div className="text-sm text-orange-700">تراکنش‌های تکراری</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {reconciliationStatus?.data?.discrepancyTypes?.amount || 0}
                  </div>
                  <div className="text-sm text-yellow-700">اختلاف مبلغ</div>
                </div>
              </div>

              {unreconciledData?.data?.discrepancies?.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">اختلافات شناسایی شده:</h4>
                  {unreconciledData.data.discrepancies.map((discrepancy: any, index: number) => (
                    <div key={index} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="font-medium">{discrepancy.type}</span>
                      </div>
                      <div className="text-sm text-gray-700">
                        <div>شرح: {discrepancy.description}</div>
                        <div>مبلغ تفاوت: {formatCurrency(discrepancy.amount)}</div>
                        <div>تاریخ: {formatDate(discrepancy.date)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>گزارش تطبیق بانکی</CardTitle>
              <CardDescription>خلاصه وضعیت تطبیق و آمار کلی</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">آمار کلی</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>نرخ تطبیق موفق:</span>
                      <span className="font-bold">
                        {reconciliationStatus?.data ? 
                          `${((reconciliationStatus.data.reconciledCount / (reconciliationStatus.data.reconciledCount + reconciliationStatus.data.pendingCount + reconciliationStatus.data.discrepancyCount)) * 100).toFixed(1)}%` : 
                          '---'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>آخرین تطبیق:</span>
                      <span className="font-bold">
                        {reconciliationStatus?.data?.lastReconciliation ? 
                          formatDate(reconciliationStatus.data.lastReconciliation) : 
                          'هرگز'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>موجودی بانک:</span>
                      <span className="font-bold">
                        {reconciliationStatus?.data ? formatCurrency(reconciliationStatus.data.bankBalance) : '---'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>موجودی سیستم:</span>
                      <span className="font-bold">
                        {reconciliationStatus?.data ? formatCurrency(reconciliationStatus.data.systemBalance) : '---'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">توصیه‌های بهبود</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>تطبیق روزانه انجام دهید</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>اختلافات را فوراً بررسی کنید</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>از فرمت استاندارد برای آپلود استفاده کنید</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>تمام تراکنش‌ها را ثبت کنید</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}