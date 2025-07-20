/**
 * PHASE 6.4: Alert History Component
 * تاریخچه کامل هشدارهای سیستم
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Clock, 
  Search, 
  Filter,
  AlertTriangle,
  CheckCircle,
  User,
  Calendar
} from 'lucide-react';

interface AlertHistoryItem {
  id: number;
  ruleId: number;
  ruleName: string;
  representativeId: number;
  representativeName: string;
  storeName: string;
  status: 'pending' | 'acknowledged' | 'resolved';
  priority: number;
  message: string;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  acknowledgedBy?: string;
  resolvedBy?: string;
  responseTime?: number; // minutes to acknowledge
  resolutionTime?: number; // minutes to resolve
}

interface AlertHistoryProps {
  alerts: AlertHistoryItem[];
  isLoading: boolean;
}

export function AlertHistory({ alerts, isLoading }: AlertHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7d');

  // Filter alerts based on search and filters
  const filteredAlerts = alerts.filter(alert => {
    // Text search
    if (searchTerm && !alert.message.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !alert.representativeName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !alert.storeName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !alert.ruleName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Status filter
    if (statusFilter !== 'all' && alert.status !== statusFilter) {
      return false;
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      const priority = parseInt(priorityFilter);
      if (alert.priority !== priority) return false;
    }

    // Date range filter
    if (dateRange !== 'all') {
      const alertDate = new Date(alert.createdAt);
      const now = new Date();
      const daysAgo = parseInt(dateRange.replace('d', ''));
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      if (alertDate < cutoffDate) return false;
    }

    return true;
  });

  // Calculate statistics
  const stats = {
    total: filteredAlerts.length,
    pending: filteredAlerts.filter(a => a.status === 'pending').length,
    acknowledged: filteredAlerts.filter(a => a.status === 'acknowledged').length,
    resolved: filteredAlerts.filter(a => a.status === 'resolved').length,
    avgResponseTime: filteredAlerts
      .filter(a => a.responseTime)
      .reduce((sum, a) => sum + (a.responseTime || 0), 0) / 
      filteredAlerts.filter(a => a.responseTime).length || 0,
    avgResolutionTime: filteredAlerts
      .filter(a => a.resolutionTime)
      .reduce((sum, a) => sum + (a.resolutionTime || 0), 0) / 
      filteredAlerts.filter(a => a.resolutionTime).length || 0,
  };

  const getPriorityBadge = (priority: number) => {
    if (priority >= 4) return <Badge className="bg-red-500 text-white">بحرانی</Badge>;
    if (priority >= 3) return <Badge className="bg-orange-500 text-white">بالا</Badge>;
    if (priority >= 2) return <Badge className="bg-yellow-500 text-white">متوسط</Badge>;
    return <Badge className="bg-blue-500 text-white">پایین</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive">در انتظار</Badge>;
      case 'acknowledged':
        return <Badge variant="secondary">تأیید شده</Badge>;
      case 'resolved':
        return <Badge variant="default">حل شده</Badge>;
      default:
        return <Badge variant="outline">نامشخص</Badge>;
    }
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} دقیقه`;
    const hours = Math.floor(minutes / 60);
    const remainingMins = Math.round(minutes % 60);
    return `${hours}س ${remainingMins}د`;
  };

  return (
    <div className="space-y-6">
      {/* Header and Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">کل هشدارها</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">حل شده</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">زمان پاسخ متوسط</p>
                <p className="text-lg font-bold">
                  {isNaN(stats.avgResponseTime) ? '-' : formatDuration(stats.avgResponseTime)}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">زمان حل متوسط</p>
                <p className="text-lg font-bold">
                  {isNaN(stats.avgResolutionTime) ? '-' : formatDuration(stats.avgResolutionTime)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            فیلترها و جستجو
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در پیام‌ها، نمایندگان..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="pending">در انتظار</SelectItem>
                <SelectItem value="acknowledged">تأیید شده</SelectItem>
                <SelectItem value="resolved">حل شده</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="اولویت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه اولویت‌ها</SelectItem>
                <SelectItem value="4">بحرانی</SelectItem>
                <SelectItem value="3">بالا</SelectItem>
                <SelectItem value="2">متوسط</SelectItem>
                <SelectItem value="1">پایین</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="بازه زمانی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه زمان‌ها</SelectItem>
                <SelectItem value="1d">24 ساعت گذشته</SelectItem>
                <SelectItem value="7d">7 روز گذشته</SelectItem>
                <SelectItem value="30d">30 روز گذشته</SelectItem>
                <SelectItem value="90d">90 روز گذشته</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            تاریخچه هشدارها ({filteredAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">هیچ هشداری یافت نشد</h3>
              <p className="text-gray-500 dark:text-gray-400">
                فیلترها را تنظیم کنید تا نتایج بیشتری مشاهده کنید
              </p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">پیام</TableHead>
                    <TableHead className="text-right">نماینده</TableHead>
                    <TableHead className="text-right">قانون</TableHead>
                    <TableHead className="text-right">اولویت</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">تاریخ ایجاد</TableHead>
                    <TableHead className="text-right">زمان پاسخ</TableHead>
                    <TableHead className="text-right">زمان حل</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow key={alert.id} className="hover:bg-muted/50">
                      <TableCell className="max-w-[300px]">
                        <div className="truncate" title={alert.message}>
                          {alert.message}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{alert.representativeName}</div>
                          <div className="text-sm text-muted-foreground">
                            {alert.storeName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{alert.ruleName}</span>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(alert.priority)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(alert.status)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(alert.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {alert.responseTime ? formatDuration(alert.responseTime) : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {alert.resolutionTime ? formatDuration(alert.resolutionTime) : '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}