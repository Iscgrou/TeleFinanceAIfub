import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, CheckCircle, Clock, Play, RefreshCw, Activity } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface BlockTestResult {
  blockId: string;
  blockName: string;
  category: string;
  tests: {
    healthCheck: { passed: boolean; message: string };
    connectionTest: { passed: boolean; message: string };
    databaseTest: { passed: boolean; message: string };
    loadTest: { passed: boolean; message: string };
    technicalTest: { passed: boolean; message: string };
    securityTest: { passed: boolean; message: string };
  };
  issues: string[];
  recommendations: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
}

interface DebugSummary {
  totalBlocks: number;
  testedBlocks: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  healthyBlocks: number;
  categoryBreakdown: Record<string, {
    total: number;
    healthy: number;
    issues: string[];
  }>;
}

export default function DebugDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testRunning, setTestRunning] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // دریافت خلاصه وضعیت
  const { data: summary, isLoading } = useQuery({
    queryKey: ['/api/debug/report'],
    refetchInterval: 30000, // بروزرسانی هر 30 ثانیه
  });

  // Mutation برای اجرای تست کامل
  const runFullTestMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/debug/test-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "✅ تست کامل انجام شد",
        description: `${data.totalResults} بلوک تست شد. گزارش ذخیره شد.`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/debug/report'] });
      setTestRunning(false);
    },
    onError: () => {
      toast({
        title: "❌ خطا در اجرای تست",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive"
      });
      setTestRunning(false);
    }
  });

  // Mutation برای تست یک بلوک
  const testSingleBlockMutation = useMutation({
    mutationFn: async (blockId: string) => {
      const response = await fetch('/api/debug/test-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId })
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/debug/report'] });
    }
  });

  const handleRunFullTest = () => {
    setTestRunning(true);
    runFullTestMutation.mutate();
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-green-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Telegram Bot': return '🤖';
      case 'Database': return '🗃️';
      case 'Portal': return '🌐';
      case 'Invoice': return '📄';
      case 'Payment': return '💳';
      case 'AI': return '🧠';
      case 'API': return '🔗';
      case 'Authentication': return '🔐';
      case 'Web App': return '💻';
      case 'Notification': return '📢';
      default: return '⚙️';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">در حال بارگذاری داشبورد...</span>
      </div>
    );
  }

  const debugSummary: DebugSummary = (summary as any)?.summary || {
    totalBlocks: 0,
    testedBlocks: 0,
    criticalIssues: 0,
    highIssues: 0,
    mediumIssues: 0,
    lowIssues: 0,
    healthyBlocks: 0,
    categoryBreakdown: {}
  };

  const healthPercentage = debugSummary.totalBlocks > 0 ? 
    Math.round((debugSummary.healthyBlocks / debugSummary.totalBlocks) * 100) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">🔍 CADUCEUS v1.0 - سیستم عیب‌یابی</h1>
          <p className="text-muted-foreground">نظارت جامع بر 100 بلوک سیستم</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleRunFullTest}
            disabled={testRunning}
            className="flex items-center gap-2"
          >
            {testRunning ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {testRunning ? 'در حال تست...' : 'اجرای تست کامل'}
          </Button>
          <Button 
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/debug/report'] })}
          >
            <RefreshCw className="h-4 w-4" />
            بروزرسانی
          </Button>
        </div>
      </div>

      {/* کارت‌های خلاصه */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">کل بلوک‌ها</p>
                <p className="text-2xl font-bold">{debugSummary.totalBlocks}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">بلوک‌های سالم</p>
                <p className="text-2xl font-bold text-green-600">{debugSummary.healthyBlocks}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">مشکلات متوسط</p>
                <p className="text-2xl font-bold text-yellow-600">{debugSummary.mediumIssues}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">سلامت کلی</p>
                <p className="text-2xl font-bold text-blue-600">{healthPercentage}%</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">{healthPercentage}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نمودار سلامت کلی */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 وضعیت کلی سیستم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>سلامت کلی سیستم</span>
              <span>{healthPercentage}%</span>
            </div>
            <Progress value={healthPercentage} className="h-3" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{debugSummary.criticalIssues}</div>
                <div className="text-sm text-muted-foreground">بحرانی</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{debugSummary.highIssues}</div>
                <div className="text-sm text-muted-foreground">مهم</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{debugSummary.mediumIssues}</div>
                <div className="text-sm text-muted-foreground">متوسط</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{debugSummary.lowIssues}</div>
                <div className="text-sm text-muted-foreground">کم</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* تفکیک بر اساس دسته‌بندی */}
      <Card>
        <CardHeader>
          <CardTitle>🏗️ تحلیل بر اساس دسته‌بندی</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(debugSummary.categoryBreakdown).map(([category, data]) => {
              const healthPercent = data.total > 0 ? Math.round((data.healthy / data.total) * 100) : 0;
              return (
                <Card key={category} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCategoryIcon(category)}</span>
                        <span className="font-semibold text-sm">{category}</span>
                      </div>
                      <Badge 
                        variant={healthPercent >= 80 ? "default" : healthPercent >= 60 ? "secondary" : "destructive"}
                      >
                        {healthPercent}%
                      </Badge>
                    </div>
                    <Progress value={healthPercent} className="h-2 mb-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>سالم: {data.healthy}/{data.total}</span>
                      <span>مشکلات: {data.issues.length}</span>
                    </div>
                    {data.issues.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-orange-600 truncate" title={data.issues.join(', ')}>
                          ⚠️ {data.issues[0]}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* مشکلات شناسایی شده */}
      {debugSummary.mediumIssues > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚨 مشکلات شناسایی شده
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(debugSummary.categoryBreakdown)
                .filter(([, data]) => data.issues.length > 0)
                .map(([category, data]) => (
                  <div key={category} className="border-l-4 border-orange-500 pl-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      {getCategoryIcon(category)} {category}
                    </h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      {data.issues.map((issue, idx) => (
                        <li key={idx}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* اقدامات توصیه شده */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            💡 اقدامات اولویت‌دار
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <span className="text-red-600">🔴</span>
              <div>
                <h4 className="font-semibold text-red-700 dark:text-red-300">اقدام فوری</h4>
                <p className="text-sm">تنظیم Telegram Bot Token واقعی برای فعال‌سازی کامل ربات</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
              <span className="text-yellow-600">🟡</span>
              <div>
                <h4 className="font-semibold text-yellow-700 dark:text-yellow-300">بهینه‌سازی عملکرد</h4>
                <p className="text-sm">اضافه کردن pagination به queries دیتابیس برای بهبود عملکرد</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <span className="text-blue-600">🔵</span>
              <div>
                <h4 className="font-semibold text-blue-700 dark:text-blue-300">توسعه آینده</h4>
                <p className="text-sm">تکمیل سیستم notification و اضافه کردن Redis cache</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* آخرین بروزرسانی */}
      <div className="text-center text-sm text-muted-foreground">
        <Clock className="inline h-4 w-4 mr-1" />
        آخرین بروزرسانی: {new Date().toLocaleString('fa-IR')}
      </div>
    </div>
  );
}