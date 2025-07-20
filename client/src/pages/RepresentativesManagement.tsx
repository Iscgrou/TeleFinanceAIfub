import { useState, useEffect } from 'react';
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
import { Trash2, Edit, Plus, Search, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';

// Form validation schemas
const representativeSchema = z.object({
  storeName: z.string().min(1, 'نام فروشگاه الزامی است'),
  ownerName: z.string().min(1, 'نام مالک الزامی است'),
  panelUsername: z.string().min(1, 'نام کاربری پنل الزامی است'),
  phone: z.string().min(1, 'شماره تلفن الزامی است'),
  salesColleagueName: z.string().optional(),
  totalDebt: z.string().default('0'),
  isActive: z.boolean().default(true),
  creditLimit: z.string().default('1000000'),
  riskLevel: z.enum(['low', 'medium', 'high']).default('medium')
});

const debtAdjustmentSchema = z.object({
  amount: z.string().min(1, 'مبلغ الزامی است'),
  description: z.string().min(1, 'توضیحات الزامی است'),
  type: z.enum(['increase', 'decrease'])
});

type Representative = {
  id: number;
  storeName: string;
  ownerName: string;
  panelUsername: string;
  phone: string;
  totalDebt: string;
  salesColleagueName: string;
  isActive: boolean;
  creditLimit: string;
  riskLevel: string;
  createdAt: string;
};

type SalesColleague = {
  id: number;
  name: string;
  commissionRate: string;
  createdAt: string;
};

export default function RepresentativesManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDebtDialogOpen, setIsDebtDialogOpen] = useState(false);
  const [selectedRep, setSelectedRep] = useState<Representative | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debtAdjustmentType, setDebtAdjustmentType] = useState<'increase' | 'decrease'>('increase');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch representatives
  const { data: repsData, isLoading } = useQuery({
    queryKey: ['/api/representatives'],
    queryFn: () => apiRequest('/api/representatives')
  });

  // Fetch sales colleagues
  const { data: colleaguesData } = useQuery({
    queryKey: ['/api/sales-colleagues'],
    queryFn: () => apiRequest('/api/sales-colleagues')
  });

  const representatives: Representative[] = Array.isArray(repsData) ? repsData : repsData?.data || [];
  const colleagues: SalesColleague[] = colleaguesData || [];

  // Add representative mutation
  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/representatives', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
      setIsAddDialogOpen(false);
      toast({ title: '✅ نماینده با موفقیت اضافه شد' });
    },
    onError: () => {
      toast({ title: '❌ خطا در اضافه کردن نماینده', variant: 'destructive' });
    }
  });

  // Update representative mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/representatives/${id}`, { method: 'PATCH', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
      setIsEditDialogOpen(false);
      setSelectedRep(null);
      toast({ title: '✅ اطلاعات نماینده بروزرسانی شد' });
    },
    onError: () => {
      toast({ title: '❌ خطا در بروزرسانی اطلاعات', variant: 'destructive' });
    }
  });

  // Delete representative mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/representatives/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
      toast({ title: '✅ نماینده حذف شد' });
    },
    onError: () => {
      toast({ title: '❌ خطا در حذف نماینده', variant: 'destructive' });
    }
  });

  // Debt adjustment mutation
  const debtMutation = useMutation({
    mutationFn: ({ id, amount, description, type }: { id: number; amount: string; description: string; type: 'increase' | 'decrease' }) => {
      const endpoint = type === 'increase' 
        ? `/api/representatives/${id}/increase-debt`
        : `/api/representatives/${id}/decrease-debt`;
      return apiRequest(endpoint, { method: 'POST', body: { amount, description } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/representatives'] });
      setIsDebtDialogOpen(false);
      setSelectedRep(null);
      toast({ title: '✅ بدهی بروزرسانی شد' });
    },
    onError: () => {
      toast({ title: '❌ خطا در بروزرسانی بدهی', variant: 'destructive' });
    }
  });

  // Forms
  const addForm = useForm({
    resolver: zodResolver(representativeSchema),
    defaultValues: {
      storeName: '',
      ownerName: '',
      panelUsername: '',
      phone: '',
      salesColleagueName: '',
      totalDebt: '0',
      isActive: true,
      creditLimit: '1000000',
      riskLevel: 'medium' as const
    }
  });

  const editForm = useForm({
    resolver: zodResolver(representativeSchema)
  });

  const debtForm = useForm({
    resolver: zodResolver(debtAdjustmentSchema),
    defaultValues: {
      amount: '',
      description: '',
      type: 'increase' as const
    }
  });

  // Set edit form data when selectedRep changes
  useEffect(() => {
    if (selectedRep && isEditDialogOpen) {
      editForm.reset({
        storeName: selectedRep.storeName,
        ownerName: selectedRep.ownerName,
        panelUsername: selectedRep.panelUsername,
        phone: selectedRep.phone,
        salesColleagueName: selectedRep.salesColleagueName,
        totalDebt: selectedRep.totalDebt,
        isActive: selectedRep.isActive,
        creditLimit: selectedRep.creditLimit,
        riskLevel: selectedRep.riskLevel as 'low' | 'medium' | 'high'
      });
    }
  }, [selectedRep, isEditDialogOpen, editForm]);

  // Filter representatives
  const filteredReps = representatives.filter(rep =>
    rep.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.panelUsername.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('fa-IR').format(Number(amount)) + ' تومان';
  };

  const onAddSubmit = (data: any) => {
    addMutation.mutate(data);
  };

  const onEditSubmit = (data: any) => {
    if (selectedRep) {
      updateMutation.mutate({ id: selectedRep.id, data });
    }
  };

  const onDebtSubmit = (data: any) => {
    if (selectedRep) {
      debtMutation.mutate({
        id: selectedRep.id,
        amount: data.amount,
        description: data.description,
        type: debtAdjustmentType
      });
    }
  };

  const handleDelete = (rep: Representative) => {
    if (confirm(`آیا از حذف نماینده "${rep.storeName}" اطمینان دارید؟`)) {
      deleteMutation.mutate(rep.id);
    }
  };

  const openDebtDialog = (rep: Representative, type: 'increase' | 'decrease') => {
    setSelectedRep(rep);
    setDebtAdjustmentType(type);
    setIsDebtDialogOpen(true);
    debtForm.reset({ amount: '', description: '', type });
  };

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
          <h1 className="text-2xl font-bold">مدیریت نمایندگان</h1>
          <p className="text-gray-600">افزودن، ویرایش و حذف نمایندگان</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => window.location.href = '/admin'} 
            variant="outline"
            className="flex items-center gap-2"
          >
            ← بازگشت به داشبورد
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            افزودن نماینده جدید
          </Button>
        </div>
      </div>

      {/* Search */}
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
              <Label htmlFor="search">جستجو در نمایندگان</Label>
              <Input
                id="search"
                placeholder="نام فروشگاه، نام مالک یا نام کاربری..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Representatives Table */}
      <Card>
        <CardHeader>
          <CardTitle>لیست نمایندگان ({filteredReps.length})</CardTitle>
          <CardDescription>
            مدیریت کامل نمایندگان با قابلیت افزودن، ویرایش و حذف
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نام فروشگاه</TableHead>
                <TableHead>نام مالک</TableHead>
                <TableHead>نام کاربری پنل</TableHead>
                <TableHead>تلفن</TableHead>
                <TableHead>بدهی</TableHead>
                <TableHead>همکار فروش</TableHead>
                <TableHead>وضعیت</TableHead>
                <TableHead>عملیات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReps.map((rep) => (
                <TableRow key={rep.id}>
                  <TableCell className="font-medium">{rep.storeName}</TableCell>
                  <TableCell>{rep.ownerName}</TableCell>
                  <TableCell>{rep.panelUsername}</TableCell>
                  <TableCell>{rep.phone}</TableCell>
                  <TableCell>
                    <Badge variant={Number(rep.totalDebt) > 0 ? 'destructive' : 'secondary'}>
                      {formatCurrency(rep.totalDebt)}
                    </Badge>
                  </TableCell>
                  <TableCell>{rep.salesColleagueName || 'نامشخص'}</TableCell>
                  <TableCell>
                    <Badge variant={rep.isActive ? 'default' : 'secondary'}>
                      {rep.isActive ? 'فعال' : 'غیرفعال'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/portal/${rep.panelUsername}`, '_blank')}
                        className="text-purple-600 hover:text-purple-700"
                        title="مشاهده پرتال نماینده"
                      >
                        🔗
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRep(rep);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDebtDialog(rep, 'increase')}
                      >
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDebtDialog(rep, 'decrease')}
                      >
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(rep)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Representative Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>افزودن نماینده جدید</DialogTitle>
            <DialogDescription>
              اطلاعات نماینده جدید را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام فروشگاه</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام مالک</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="panelUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام کاربری پنل</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره تلفن</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="salesColleagueName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>همکار فروش</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="همکار فروش را انتخاب کنید" />
                      </SelectTrigger>
                      <SelectContent>
                        {colleagues.map((colleague) => (
                          <SelectItem key={colleague.id} value={colleague.name}>
                            {colleague.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'در حال افزودن...' : 'افزودن نماینده'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Representative Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>ویرایش نماینده</DialogTitle>
            <DialogDescription>
              اطلاعات نماینده را ویرایش کنید
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="storeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام فروشگاه</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام مالک</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="panelUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام کاربری پنل</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره تلفن</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'در حال بروزرسانی...' : 'بروزرسانی'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Debt Adjustment Dialog */}
      <Dialog open={isDebtDialogOpen} onOpenChange={setIsDebtDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {debtAdjustmentType === 'increase' ? 'افزایش بدهی' : 'کاهش بدهی'}
            </DialogTitle>
            <DialogDescription>
              {debtAdjustmentType === 'increase' 
                ? 'مبلغی به بدهی نماینده اضافه کنید' 
                : 'مبلغی از بدهی نماینده کم کنید'
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...debtForm}>
            <form onSubmit={debtForm.handleSubmit(onDebtSubmit)} className="space-y-4">
              <FormField
                control={debtForm.control}
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
              <FormField
                control={debtForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>توضیحات</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={debtMutation.isPending}>
                  {debtMutation.isPending ? 'در حال پردازش...' : 'تایید'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}