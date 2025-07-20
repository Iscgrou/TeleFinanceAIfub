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
import { Trash2, Edit, Plus, Search, Users, Percent } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';

// Form validation schema
const colleagueSchema = z.object({
  name: z.string().min(1, 'نام همکار الزامی است'),
  commissionRate: z.string()
    .min(1, 'نرخ کمیسیون الزامی است')
    .refine(val => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, 
      'نرخ کمیسیون باید بین 0 تا 100 باشد')
});

type SalesColleague = {
  id: number;
  name: string;
  commissionRate: string;
  createdAt: string;
};

export default function SalesColleaguesManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedColleague, setSelectedColleague] = useState<SalesColleague | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sales colleagues
  const { data: colleaguesData, isLoading } = useQuery({
    queryKey: ['/api/sales-colleagues'],
    queryFn: () => apiRequest('/api/sales-colleagues')
  });

  const colleagues: SalesColleague[] = colleaguesData || [];

  // Add colleague mutation
  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/sales-colleagues', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-colleagues'] });
      setIsAddDialogOpen(false);
      toast({ title: '✅ همکار فروش با موفقیت اضافه شد' });
    },
    onError: () => {
      toast({ title: '❌ خطا در اضافه کردن همکار فروش', variant: 'destructive' });
    }
  });

  // Update colleague mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/sales-colleagues/${id}`, { method: 'PATCH', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-colleagues'] });
      setIsEditDialogOpen(false);
      setSelectedColleague(null);
      toast({ title: '✅ اطلاعات همکار فروش بروزرسانی شد' });
    },
    onError: () => {
      toast({ title: '❌ خطا در بروزرسانی اطلاعات', variant: 'destructive' });
    }
  });

  // Delete colleague mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/sales-colleagues/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales-colleagues'] });
      toast({ title: '✅ همکار فروش حذف شد' });
    },
    onError: () => {
      toast({ title: '❌ خطا در حذف همکار فروش', variant: 'destructive' });
    }
  });

  // Forms
  const addForm = useForm({
    resolver: zodResolver(colleagueSchema),
    defaultValues: {
      name: '',
      commissionRate: ''
    }
  });

  const editForm = useForm({
    resolver: zodResolver(colleagueSchema)
  });

  // Set edit form data when selectedColleague changes
  useEffect(() => {
    if (selectedColleague && isEditDialogOpen) {
      editForm.reset({
        name: selectedColleague.name,
        commissionRate: selectedColleague.commissionRate
      });
    }
  }, [selectedColleague, isEditDialogOpen, editForm]);

  // Filter colleagues
  const filteredColleagues = colleagues.filter(colleague =>
    colleague.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onAddSubmit = (data: any) => {
    addMutation.mutate(data);
  };

  const onEditSubmit = (data: any) => {
    if (selectedColleague) {
      updateMutation.mutate({ id: selectedColleague.id, data });
    }
  };

  const handleDelete = (colleague: SalesColleague) => {
    if (confirm(`آیا از حذف همکار فروش "${colleague.name}" اطمینان دارید؟`)) {
      deleteMutation.mutate(colleague.id);
    }
  };

  const handleEdit = (colleague: SalesColleague) => {
    setSelectedColleague(colleague);
    setIsEditDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
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
          <h1 className="text-2xl font-bold">مدیریت همکاران فروش</h1>
          <p className="text-gray-600">افزودن، ویرایش و حذف همکاران فروش</p>
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
            افزودن همکار جدید
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            جستجو
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">جستجو در همکاران فروش</Label>
              <Input
                id="search"
                placeholder="نام همکار فروش..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">کل همکاران فروش</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{colleagues.length}</div>
            <p className="text-xs text-muted-foreground">
              {filteredColleagues.length} همکار یافت شده
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">میانگین کمیسیون</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {colleagues.length > 0 
                ? (colleagues.reduce((sum, c) => sum + Number(c.commissionRate), 0) / colleagues.length).toFixed(1)
                : '0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              میانگین نرخ کمیسیون
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">بالاترین کمیسیون</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {colleagues.length > 0 
                ? Math.max(...colleagues.map(c => Number(c.commissionRate))).toFixed(1)
                : '0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              بالاترین نرخ کمیسیون
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Colleagues Table */}
      <Card>
        <CardHeader>
          <CardTitle>لیست همکاران فروش ({filteredColleagues.length})</CardTitle>
          <CardDescription>
            مدیریت کامل همکاران فروش با قابلیت افزودن، ویرایش و حذف
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredColleagues.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                همکار فروشی یافت نشد
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'جستجوی شما نتیجه‌ای نداشت' : 'هنوز همکار فروشی اضافه نشده'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  اولین همکار فروش را اضافه کنید
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>نام همکار</TableHead>
                  <TableHead>نرخ کمیسیون</TableHead>
                  <TableHead>تاریخ عضویت</TableHead>
                  <TableHead>عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredColleagues.map((colleague) => (
                  <TableRow key={colleague.id}>
                    <TableCell className="font-medium">
                      {colleague.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <Percent className="h-3 w-3" />
                        {colleague.commissionRate}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {formatDate(colleague.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(colleague)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(colleague)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Add Colleague Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>افزودن همکار فروش جدید</DialogTitle>
            <DialogDescription>
              اطلاعات همکار فروش جدید را وارد کنید
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام همکار فروش</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="مثال: احمد محمدی" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="commissionRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نرخ کمیسیون (%)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.1" 
                        min="0" 
                        max="100"
                        placeholder="مثال: 7.5" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'در حال افزودن...' : 'افزودن همکار'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Colleague Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>ویرایش همکار فروش</DialogTitle>
            <DialogDescription>
              اطلاعات همکار فروش را ویرایش کنید
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام همکار فروش</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="commissionRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نرخ کمیسیون (%)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.1" 
                        min="0" 
                        max="100"
                      />
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
    </div>
  );
}