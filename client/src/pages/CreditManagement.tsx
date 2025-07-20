import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/utils/api';
import { CreditCard, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';

export default function CreditManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedRep, setSelectedRep] = useState<any>(null);
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [newCreditLimit, setNewCreditLimit] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Fetch credit report
  const { data: creditReport, isLoading: reportLoading } = useQuery({
    queryKey: ['/api/credit-management/report'],
    queryFn: () => apiRequest('/api/credit-management/report')
  });

  // Check credit availability mutation
  const checkCreditMutation = useMutation({
    mutationFn: (data: { representativeId: number; requestedAmount: number }) =>
      apiRequest('/api/credit-management/check-availability', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (result) => {
      toast({
        title: result.data.approved ? 'اعتبار تأیید شد' : 'اعتبار رد شد',
        description: result.data.message,
        variant: result.data.approved ? 'default' : 'destructive'
      });
    },
    onError: () => {
      toast({
        title: 'خطا',
        description: 'خطا در بررسی اعتبار',
        variant: 'destructive'
      });
    }
  });

  // Update credit limit mutation
  const updateCreditMutation = useMutation({
    mutationFn: (data: { representativeId: number; newCreditLimit: number; adjustReason: string }) =>
      apiRequest('/api/credit-management/update-limit', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: 'موفقیت',
        description: 'حد اعتبار با موفقیت به‌روزرسانی شد',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/credit-management/report'] });
      setSelectedRep(null);
      setNewCreditLimit('');
      setAdjustReason('');
    },
    onError: () => {
      toast({
        title: 'خطا',
        description: 'خطا در به‌روزرسانی حد اعتبار',
        variant: 'destructive'
      });
    }
  });

  // Auto-adjust credit limits mutation
  const autoAdjustMutation = useMutation({
    mutationFn: () => apiRequest('/api/credit-management/auto-adjust', { method: 'POST' }),
    onSuccess: () => {
      toast({
        title: 'موفقیت',
        description: 'تنظیم خودکار حدود اعتبار انجام شد',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/credit-management/report'] });
    },
    onError: () => {
      toast({
        title: 'خطا',
        description: 'خطا در تنظیم خودکار حدود اعتبار',
        variant: 'destructive'
      });
    }
  });

  const handleCheckCredit = () => {
    if (!selectedRep || !creditAmount) {
      toast({
        title: 'خطا',
        description: 'لطفا نماینده و مبلغ را انتخاب کنید',
        variant: 'destructive'
      });
      return;
    }

    checkCreditMutation.mutate({
      representativeId: selectedRep.id,
      requestedAmount: parseFloat(creditAmount)
    });
  };

  const handleUpdateCreditLimit = () => {
    if (!selectedRep || !newCreditLimit || !adjustReason) {
      toast({
        title: 'خطا',
        description: 'لطفا تمام فیلدها را پر کنید',
        variant: 'destructive'
      });
      return;
    }

    updateCreditMutation.mutate({
      representativeId: selectedRep.id,
      newCreditLimit: parseFloat(newCreditLimit),
      adjustReason
    });
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  if (reportLoading) {
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
        <h1 className="text-3xl font-bold">مدیریت اعتبارات</h1>
        <Button 
          onClick={() => autoAdjustMutation.mutate()}
          disabled={autoAdjustMutation.isPending}
          className="flex items-center gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          تنظیم خودکار اعتبارات
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل حد اعتبار</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {creditReport?.data ? formatCurrency(creditReport.data.totalCreditLimit) : '---'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">بدهی مصرف شده</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {creditReport?.data ? formatCurrency(creditReport.data.totalDebtUtilized) : '---'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نرخ مصرف اعتبار</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {creditReport?.data ? `${creditReport.data.utilizationRate.toFixed(1)}%` : '---'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نمایندگان پرخطر</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {creditReport?.data ? creditReport.data.riskDistribution.high + creditReport.data.riskDistribution.critical : '---'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">نمای کلی</TabsTrigger>
          <TabsTrigger value="check">بررسی اعتبار</TabsTrigger>
          <TabsTrigger value="manage">مدیریت حدود</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>گزارش اعتبارات نمایندگان</CardTitle>
              <CardDescription>نمای کلی از وضعیت اعتباری تمام نمایندگان</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">نام فروشگاه</TableHead>
                      <TableHead className="text-right">حد اعتبار</TableHead>
                      <TableHead className="text-right">بدهی فعلی</TableHead>
                      <TableHead className="text-right">درصد مصرف</TableHead>
                      <TableHead className="text-right">سطح ریسک</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditReport?.data?.representatives?.map((rep: any) => (
                      <TableRow key={rep.id}>
                        <TableCell className="font-medium">{rep.storeName}</TableCell>
                        <TableCell>{formatCurrency(rep.creditLimit)}</TableCell>
                        <TableCell>{formatCurrency(rep.currentDebt)}</TableCell>
                        <TableCell>{rep.utilizationRate.toFixed(1)}%</TableCell>
                        <TableCell>
                          <Badge variant={getRiskBadgeVariant(rep.riskLevel)}>
                            {rep.riskLevel === 'low' ? 'کم' : 
                             rep.riskLevel === 'medium' ? 'متوسط' : 
                             rep.riskLevel === 'high' ? 'بالا' : 'بحرانی'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setSelectedRep(rep);
                                  setNewCreditLimit(rep.creditLimit.toString());
                                }}
                              >
                                ویرایش حد اعتبار
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>ویرایش حد اعتبار - {rep.storeName}</DialogTitle>
                                <DialogDescription>
                                  حد اعتبار فعلی: {formatCurrency(rep.creditLimit)}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="newLimit" className="text-right">حد اعتبار جدید</Label>
                                  <Input
                                    id="newLimit"
                                    type="number"
                                    value={newCreditLimit}
                                    onChange={(e) => setNewCreditLimit(e.target.value)}
                                    className="col-span-3"
                                    placeholder="مبلغ به تومان"
                                  />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="reason" className="text-right">دلیل تغییر</Label>
                                  <Textarea
                                    id="reason"
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    className="col-span-3"
                                    placeholder="توضیح دلیل تغییر حد اعتبار..."
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button 
                                  type="submit" 
                                  onClick={handleUpdateCreditLimit}
                                  disabled={updateCreditMutation.isPending}
                                >
                                  به‌روزرسانی
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="check" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>بررسی اعتبار نماینده</CardTitle>
              <CardDescription>بررسی امکان تخصیص اعتبار جدید به نماینده</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="repSelect">انتخاب نماینده</Label>
                  <select 
                    id="repSelect"
                    className="w-full p-2 border rounded-md"
                    value={selectedRep?.id || ''}
                    onChange={(e) => {
                      const rep = creditReport?.data?.representatives?.find((r: any) => r.id === parseInt(e.target.value));
                      setSelectedRep(rep || null);
                    }}
                  >
                    <option value="">انتخاب کنید...</option>
                    {creditReport?.data?.representatives?.map((rep: any) => (
                      <option key={rep.id} value={rep.id}>{rep.storeName}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">مبلغ درخواستی (تومان)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="مبلغ به تومان"
                  />
                </div>
              </div>
              
              {selectedRep && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">اطلاعات اعتباری فعلی:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>حد اعتبار: {formatCurrency(selectedRep.creditLimit)}</div>
                    <div>بدهی فعلی: {formatCurrency(selectedRep.currentDebt)}</div>
                    <div>اعتبار باقی‌مانده: {formatCurrency(selectedRep.creditLimit - selectedRep.currentDebt)}</div>
                    <div>سطح ریسک: 
                      <Badge variant={getRiskBadgeVariant(selectedRep.riskLevel)} className="mr-2">
                        {selectedRep.riskLevel === 'low' ? 'کم' : 
                         selectedRep.riskLevel === 'medium' ? 'متوسط' : 
                         selectedRep.riskLevel === 'high' ? 'بالا' : 'بحرانی'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleCheckCredit}
                disabled={checkCreditMutation.isPending || !selectedRep || !creditAmount}
                className="w-full"
              >
                {checkCreditMutation.isPending ? 'در حال بررسی...' : 'بررسی اعتبار'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>توزیع ریسک نمایندگان</CardTitle>
              <CardDescription>آمار کلی از سطح ریسک نمایندگان</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {creditReport?.data?.riskDistribution?.low || 0}
                  </div>
                  <div className="text-sm text-green-700">ریسک کم</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {creditReport?.data?.riskDistribution?.medium || 0}
                  </div>
                  <div className="text-sm text-yellow-700">ریسک متوسط</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {creditReport?.data?.riskDistribution?.high || 0}
                  </div>
                  <div className="text-sm text-orange-700">ریسک بالا</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {creditReport?.data?.riskDistribution?.critical || 0}
                  </div>
                  <div className="text-sm text-red-700">ریسک بحرانی</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}