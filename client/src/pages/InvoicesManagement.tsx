import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Eye, Download, Search, Plus, DollarSign, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';

// Form validation schema
const invoiceSchema = z.object({
  representativeId: z.string().min(1, 'انتخاب نماینده الزامی است'),
  amount: z.string().min(1, 'مبلغ الزامی است'),
  status: z.enum(['unpaid', 'partially_paid', 'paid']).default('unpaid')
});

type Invoice = {
  id: number;
  representativeId: number;
  amount: string;
  status: 'unpaid' | 'partially_paid' | 'paid';
  createdAt: string;
  representative?: {
    storeName: string;
    ownerName: string;
  };
  usageJsonDetails?: any;
};

type Representative = {
  id: number;
  storeName: string;
  ownerName: string;
  panelUsername: string;
  totalDebt: string;
};

export default function InvoicesManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch invoices
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['/api/invoices'],
    queryFn: () => apiRequest('/api/invoices')
  });

  // Fetch representatives
  const { data: repsData } = useQuery({
    queryKey: ['/api/representatives'],
    queryFn: () => apiRequest('/api/representatives')
  });

  const invoices: Invoice[] = Array.isArray(invoicesData) ? invoicesData : invoicesData?.data || [];
  const representatives: Representative[] = Array.isArray(repsData) ? repsData : repsData?.data || [];

  // Create invoice mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/invoices', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/invoices'] });
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({ title: '✅ فاکتور با موفقیت ایجاد شد' });
    },
    onError: (error: any) => {
      console.error('Invoice creation error:', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'خطا در ایجاد فاکتور';
      const validationErrors = error?.response?.data?.errors;
      
      if (validationErrors && Array.isArray(validationErrors)) {
        const errorDetails = validationErrors.map((err: any) => err.message).join(', ');
        toast({ 
          title: '❌ خطا در ایجاد فاکتور', 
          description: errorDetails,
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: '❌ خطا در ایجاد فاکتور', 
          description: errorMessage,
          variant: 'destructive' 
        });
      }
    }
  });

  // Generate invoice image mutation
  const generateImageMutation = useMutation({
    mutationFn: (invoiceId: number) => 
      apiRequest(`/api/invoices/${invoiceId}/generate-image`, { method: 'POST' }),
    onSuccess: (response) => {
      // Create download link for the image
      const link = document.createElement('a');
      link.href = response.imageUrl;
      link.download = `invoice_${response.invoiceId}.png`;
      link.click();
      toast({ title: '✅ تصویر فاکتور دانلود شد' });
    },
    onError: () => {
      toast({ title: '❌ خطا در تولید تصویر فاکتور', variant: 'destructive' });
    }
  });

  // Form
  const createForm = useForm({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      representativeId: '',
      amount: '',
      status: 'unpaid' as const
    }
  });

  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.representative?.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.representative?.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('fa-IR').format(Number(amount)) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default">پرداخت شده</Badge>;
      case 'partially_paid':
        return <Badge variant="secondary">پرداخت جزئی</Badge>;
      case 'unpaid':
        return <Badge variant="destructive">پرداخت نشده</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const onCreateSubmit = (data: any) => {
    createMutation.mutate({
      ...data,
      representativeId: Number(data.representativeId),
      amount: Number(data.amount)
    });
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handleGenerateImage = (invoiceId: number) => {
    generateImageMutation.mutate(invoiceId);
  };

  // Calculate statistics
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const unpaidCount = invoices.filter(inv => inv.status === 'unpaid').length;
  const paidCount = invoices.filter(inv => inv.status === 'paid').length;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">مدیریت فاکتورها</h1>
          <p className="text-gray-600">ایجاد، مشاهده و مدیریت فاکتورهای نمایندگان</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => window.location.href = '/admin'} 
            variant="outline"
            className="flex items-center gap-2"
          >
            ← بازگشت به داشبورد
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            ایجاد فاکتور جدید
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل فاکتورها</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {filteredInvoices.length} فاکتور یافت شده
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل مبلغ</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount.toString())}</div>
            <p className="text-xs text-muted-foreground">
              مجموع کل فاکتورها
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">پرداخت نشده</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unpaidCount}</div>
            <p className="text-xs text-muted-foreground">
              فاکتورهای پرداخت نشده
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">پرداخت شده</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{paidCount}</div>
            <p className="text-xs text-muted-foreground">
              فاکتورهای پرداخت شده
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            جستجو و فیلتر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">جستجو در فاکتورها</Label>
              <Input
                id="search"
                placeholder="نام فروشگاه یا نام مالک..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Label>وضعیت فاکتور</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="unpaid">پرداخت نشده</SelectItem>
                  <SelectItem value="partially_paid">پرداخت جزئی</SelectItem>
                  <SelectItem value="paid">پرداخت شده</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>لیست فاکتورها ({filteredInvoices.length})</CardTitle>
          <CardDescription>
            مدیریت و بایگانی فاکتورهای نمایندگان
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                فاکتوری یافت نشد
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' ? 'جستجوی شما نتیجه‌ای نداشت' : 'هنوز فاکتوری ایجاد نشده'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  اولین فاکتور را ایجاد کنید
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>شماره فاکتور</TableHead>
                  <TableHead>نماینده</TableHead>
                  <TableHead>مبلغ</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead>تاریخ ایجاد</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      #{invoice.id}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {invoice.representative?.storeName || 'نامشخص'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.representative?.ownerName || 'نامشخص'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatCurrency(invoice.amount)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(invoice.status)}
                    </TableCell>
                    <TableCell>
                      {formatDate(invoice.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewInvoice(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateImage(invoice.id)}
                          disabled={generateImageMutation.isPending}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>ایجاد فاکتور جدید</DialogTitle>
            <DialogDescription>
              فاکتور جدید برای نماینده ایجاد کنید
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="representativeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نماینده</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="نماینده را انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        {representatives.map((rep) => (
                          <SelectItem key={rep.id} value={rep.id.toString()}>
                            {rep.storeName} - {rep.ownerName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>مبلغ (تومان)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'در حال ایجاد...' : 'ایجاد فاکتور'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>جزئیات فاکتور #{selectedInvoice?.id}</DialogTitle>
            <DialogDescription>
              اطلاعات کامل فاکتور
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>نماینده</Label>
                  <p className="font-medium">{selectedInvoice.representative?.storeName}</p>
                </div>
                <div>
                  <Label>مبلغ</Label>
                  <p className="font-medium">{formatCurrency(selectedInvoice.amount)}</p>
                </div>
                <div>
                  <Label>وضعیت</Label>
                  <p>{getStatusBadge(selectedInvoice.status)}</p>
                </div>
                <div>
                  <Label>تاریخ ایجاد</Label>
                  <p className="font-medium">{formatDate(selectedInvoice.createdAt)}</p>
                </div>
              </div>
              
              {selectedInvoice.usageJsonDetails && (
                <div>
                  <Label>جزئیات مصرف</Label>
                  <div className="bg-gray-50 p-4 rounded-md max-h-40 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(selectedInvoice.usageJsonDetails, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => selectedInvoice && handleGenerateImage(selectedInvoice.id)}
              disabled={generateImageMutation.isPending}
            >
              <Download className="h-4 w-4 mr-2" />
              دانلود تصویر فاکتور
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}