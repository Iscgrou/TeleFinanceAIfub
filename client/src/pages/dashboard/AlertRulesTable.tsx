/**
 * PHASE 6.2: Alert Rules Table Component
 * جدول مدیریت قوانین هشدار
 */

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Play, 
  Pause, 
  TestTube,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface AlertRule {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  triggerCount: number;
  createdAt: string;
  lastTriggered?: string;
  conditions?: any[];
  actions?: any[];
}

interface AlertRulesTableProps {
  rules: AlertRule[];
  isLoading: boolean;
}

export function AlertRulesTable({ rules, isLoading }: AlertRulesTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [processingRules, setProcessingRules] = useState<Set<number>>(new Set());

  // Toggle rule active status
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: number; isActive: boolean }) => {
      return await apiRequest(`/api/alerts/rules/${ruleId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
      });
    },
    onSuccess: (_, { ruleId, isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/rules'] });
      toast({
        title: "موفقیت",
        description: `قانون با موفقیت ${isActive ? 'فعال' : 'غیرفعال'} شد`,
      });
      setProcessingRules(prev => {
        const newSet = new Set(prev);
        newSet.delete(ruleId);
        return newSet;
      });
    },
    onError: (error, { ruleId }) => {
      toast({
        title: "خطا",
        description: "خطا در تغییر وضعیت قانون",
        variant: "destructive",
      });
      setProcessingRules(prev => {
        const newSet = new Set(prev);
        newSet.delete(ruleId);
        return newSet;
      });
    },
  });

  // Delete rule
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: number) => {
      return await apiRequest(`/api/alerts/rules/${ruleId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/rules'] });
      toast({
        title: "موفقیت",
        description: "قانون با موفقیت حذف شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در حذف قانون",
        variant: "destructive",
      });
    },
  });

  // Test rule
  const testRuleMutation = useMutation({
    mutationFn: async (ruleId: number) => {
      return await apiRequest(`/api/alerts/test/${ruleId}`, {
        method: 'POST',
        body: JSON.stringify({ representativeId: 1 }), // Test with first representative
      });
    },
    onSuccess: (result) => {
      toast({
        title: "نتیجه تست",
        description: result.triggered ? "قانون فعال شد" : "قانون فعال نشد",
        variant: result.triggered ? "default" : "secondary",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در تست قانون",
        variant: "destructive",
      });
    },
  });

  const handleToggleRule = async (rule: AlertRule) => {
    const newActiveState = !rule.isActive;
    setProcessingRules(prev => new Set(prev).add(rule.id));
    toggleRuleMutation.mutate({ ruleId: rule.id, isActive: newActiveState });
  };

  const handleDeleteRule = async (ruleId: number) => {
    if (confirm('آیا از حذف این قانون مطمئن هستید؟')) {
      deleteRuleMutation.mutate(ruleId);
    }
  };

  const handleTestRule = async (ruleId: number) => {
    testRuleMutation.mutate(ruleId);
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    if (priority >= 3) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    if (priority >= 2) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 4) return 'بحرانی';
    if (priority >= 3) return 'بالا';
    if (priority >= 2) return 'متوسط';
    return 'پایین';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            قوانین هشدار
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          قوانین هشدار ({rules.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rules.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              هیچ قانونی تعریف نشده
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              برای شروع، اولین قانون هشدار خود را ایجاد کنید
            </p>
            <Button>
              <Shield className="h-4 w-4 mr-2" />
              ایجاد قانون جدید
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">نام قانون</TableHead>
                  <TableHead className="text-right">وضعیت</TableHead>
                  <TableHead className="text-right">اولویت</TableHead>
                  <TableHead className="text-right">تعداد فعال‌سازی</TableHead>
                  <TableHead className="text-right">آخرین فعال‌سازی</TableHead>
                  <TableHead className="text-right">تاریخ ایجاد</TableHead>
                  <TableHead className="text-center">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-sm text-muted-foreground max-w-[300px] truncate">
                          {rule.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={rule.isActive ? "default" : "secondary"}
                        className={processingRules.has(rule.id) ? "opacity-50" : ""}
                      >
                        {processingRules.has(rule.id) ? 'در حال پردازش...' : 
                         rule.isActive ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(rule.priority)}>
                        {getPriorityLabel(rule.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {rule.triggerCount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {rule.lastTriggered ? formatDate(rule.lastTriggered) : 'هرگز'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(rule.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => handleToggleRule(rule)}
                              disabled={processingRules.has(rule.id)}
                            >
                              {rule.isActive ? (
                                <>
                                  <Pause className="h-4 w-4 ml-2" />
                                  غیرفعال کردن
                                </>
                              ) : (
                                <>
                                  <Play className="h-4 w-4 ml-2" />
                                  فعال کردن
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTestRule(rule.id)}
                              disabled={testRuleMutation.isPending}
                            >
                              <TestTube className="h-4 w-4 ml-2" />
                              تست قانون
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit2 className="h-4 w-4 ml-2" />
                              ویرایش
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteRule(rule.id)}
                              className="text-red-600 dark:text-red-400"
                              disabled={deleteRuleMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 ml-2" />
                              حذف
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}