/**
 * PHASE 6.3: Real-time Alerts Component
 * نمایش زنده هشدارهای فعال
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  User,
  RefreshCw,
  Filter,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface LiveAlert {
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
}

export function RealTimeAlerts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'acknowledged' | 'resolved'>('all');

  // Fetch real-time alerts
  const { data: alerts, isLoading, refetch } = useQuery<LiveAlert[]>({
    queryKey: ['/api/alerts/live'],
    refetchInterval: autoRefresh ? 10000 : false, // Refresh every 10 seconds
    refetchOnWindowFocus: true,
  });

  // Acknowledge alert mutation
  const acknowledgeMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return await apiRequest(`/api/alerts/acknowledge/${alertId}`, {
        method: 'POST',
        body: JSON.stringify({ acknowledgedBy: 'admin' }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/live'] });
      toast({
        title: "موفقیت",
        description: "هشدار تأیید شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در تأیید هشدار",
        variant: "destructive",
      });
    },
  });

  // Resolve alert mutation
  const resolveMutation = useMutation({
    mutationFn: async (alertId: number) => {
      return await apiRequest(`/api/alerts/resolve/${alertId}`, {
        method: 'POST',
        body: JSON.stringify({ resolvedBy: 'admin' }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/alerts/live'] });
      toast({
        title: "موفقیت",
        description: "هشدار حل شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در حل هشدار",
        variant: "destructive",
      });
    },
  });

  // Filter alerts based on status
  const filteredAlerts = alerts?.filter(alert => {
    if (filter === 'all') return true;
    return alert.status === filter;
  }) || [];

  // Group alerts by priority
  const groupedAlerts = filteredAlerts.reduce((groups, alert) => {
    const priority = alert.priority >= 4 ? 'critical' : 
                    alert.priority >= 3 ? 'high' : 
                    alert.priority >= 2 ? 'medium' : 'low';
    if (!groups[priority]) groups[priority] = [];
    groups[priority].push(alert);
    return groups;
  }, {} as Record<string, LiveAlert[]>);

  const getPriorityIcon = (priority: number) => {
    if (priority >= 4) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (priority >= 3) return <AlertCircle className="h-4 w-4 text-orange-500" />;
    if (priority >= 2) return <Bell className="h-4 w-4 text-yellow-500" />;
    return <Bell className="h-4 w-4 text-blue-500" />;
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 4) return { label: 'بحرانی', color: 'bg-red-500' };
    if (priority >= 3) return { label: 'بالا', color: 'bg-orange-500' };
    if (priority >= 2) return { label: 'متوسط', color: 'bg-yellow-500' };
    return { label: 'پایین', color: 'bg-blue-500' };
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'اکنون';
    if (diffMins < 60) return `${diffMins} دقیقه پیش`;
    if (diffHours < 24) return `${diffHours} ساعت پیش`;
    return `${diffDays} روز پیش`;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" />
            هشدارهای زنده
            {alerts && (
              <Badge variant="secondary" className="mr-2">
                {filteredAlerts.length}
              </Badge>
            )}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border rounded-lg text-sm bg-background"
            >
              <option value="all">همه</option>
              <option value="pending">در انتظار</option>
              <option value="acknowledged">تأیید شده</option>
              <option value="resolved">حل شده</option>
            </select>
          </div>

          {/* Auto refresh toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 dark:bg-green-900/20' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'خودکار' : 'دستی'}
          </Button>

          {/* Manual refresh */}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Alerts Display */}
      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">همه چیز در وضعیت عادی است!</h3>
              <p className="text-muted-foreground">
                {filter === 'all' ? 
                  'هیچ هشدار فعالی وجود ندارد' : 
                  `هیچ هشدار ${filter === 'pending' ? 'در انتظار' : filter === 'acknowledged' ? 'تأیید شده' : 'حل شده'}ای وجود ندارد`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Critical Alerts First */}
          {groupedAlerts.critical && (
            <Card className="border-red-200 dark:border-red-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  هشدارهای بحرانی ({groupedAlerts.critical.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {groupedAlerts.critical.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onAcknowledge={acknowledgeMutation.mutate}
                        onResolve={resolveMutation.mutate}
                        isProcessing={acknowledgeMutation.isPending || resolveMutation.isPending}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* High Priority Alerts */}
          {groupedAlerts.high && (
            <Card className="border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-orange-600 dark:text-orange-400 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  هشدارهای اولویت بالا ({groupedAlerts.high.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-80 overflow-y-auto">
                  <div className="space-y-3">
                    {groupedAlerts.high.map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onAcknowledge={acknowledgeMutation.mutate}
                        onResolve={resolveMutation.mutate}
                        isProcessing={acknowledgeMutation.isPending || resolveMutation.isPending}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other Alerts */}
          {(groupedAlerts.medium || groupedAlerts.low) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  سایر هشدارها ({(groupedAlerts.medium?.length || 0) + (groupedAlerts.low?.length || 0)})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {[...(groupedAlerts.medium || []), ...(groupedAlerts.low || [])].map((alert) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onAcknowledge={acknowledgeMutation.mutate}
                        onResolve={resolveMutation.mutate}
                        isProcessing={acknowledgeMutation.isPending || resolveMutation.isPending}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// Alert Card Component
interface AlertCardProps {
  alert: LiveAlert;
  onAcknowledge: (alertId: number) => void;
  onResolve: (alertId: number) => void;
  isProcessing: boolean;
}

function AlertCard({ alert, onAcknowledge, onResolve, isProcessing }: AlertCardProps) {
  const priorityInfo = getPriorityLabel(alert.priority);
  const priorityIcon = getPriorityIcon(alert.priority);

  return (
    <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
      {/* Priority Indicator */}
      <div className="flex-shrink-0 mt-1">
        {priorityIcon}
      </div>

      {/* Alert Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`${priorityInfo.color} text-white`}>
              {priorityInfo.label}
            </Badge>
            {getStatusBadge(alert.status)}
            <span className="text-sm text-muted-foreground">
              {formatRelativeTime(alert.createdAt)}
            </span>
          </div>
        </div>

        <div className="space-y-1 mb-3">
          <p className="font-medium text-sm">{alert.message}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {alert.representativeName}
            </span>
            <span>{alert.storeName}</span>
            <span>قانون: {alert.ruleName}</span>
          </div>
        </div>

        {/* Action Buttons */}
        {alert.status === 'pending' && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAcknowledge(alert.id)}
              disabled={isProcessing}
              className="text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              تأیید
            </Button>
            <Button
              size="sm"
              onClick={() => onResolve(alert.id)}
              disabled={isProcessing}
              className="text-xs"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              حل شد
            </Button>
          </div>
        )}

        {alert.status === 'acknowledged' && (
          <Button
            size="sm"
            onClick={() => onResolve(alert.id)}
            disabled={isProcessing}
            className="text-xs"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            حل شد
          </Button>
        )}
      </div>
    </div>
  );
}

// Helper functions moved outside component to avoid re-declarations
function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'اکنون';
  if (diffMins < 60) return `${diffMins} دقیقه پیش`;
  if (diffHours < 24) return `${diffHours} ساعت پیش`;
  return `${diffDays} روز پیش`;
}

function getPriorityIcon(priority: number) {
  if (priority >= 4) return <AlertTriangle className="h-4 w-4 text-red-500" />;
  if (priority >= 3) return <AlertCircle className="h-4 w-4 text-orange-500" />;
  if (priority >= 2) return <Bell className="h-4 w-4 text-yellow-500" />;
  return <Bell className="h-4 w-4 text-blue-500" />;
}

function getPriorityLabel(priority: number) {
  if (priority >= 4) return { label: 'بحرانی', color: 'bg-red-500' };
  if (priority >= 3) return { label: 'بالا', color: 'bg-orange-500' };
  if (priority >= 2) return { label: 'متوسط', color: 'bg-yellow-500' };
  return { label: 'پایین', color: 'bg-blue-500' };
}

function getStatusBadge(status: string) {
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
}