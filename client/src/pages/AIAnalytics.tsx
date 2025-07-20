/**
 * AI Analytics Dashboard - Phase 5.1
 * صفحه تحلیل‌های هوشمند بدهی
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Brain,
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  BarChart3,
  Users,
  DollarSign,
  Target,
  Lightbulb,
  Activity
} from 'lucide-react';
// Helper function for currency formatting
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fa-IR', {
    style: 'currency',
    currency: 'IRR',
    minimumFractionDigits: 0,
  }).replace('IRR', '').trim() + ' تومان';
};

interface DebtTrendAnalysis {
  representativeId: number;
  representativeName: string;
  currentDebt: number;
  debtTrend: 'increasing' | 'decreasing' | 'stable';
  trendPercentage: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  predictedDebtIn30Days: number;
  recommendations: string[];
  analysisDate: string;
}

interface AIOverview {
  totalAnalyzed: number;
  riskDistribution: Record<string, number>;
  averageDebt: number;
  totalDebt: number;
  trendingSummary: {
    increasing: number;
    decreasing: number;
    stable: number;
  };
}

export default function AIAnalytics() {
  const { data: overviewData, isLoading: overviewLoading } = useQuery<{
    success: boolean;
    data: AIOverview;
  }>({
    queryKey: ['/api/ai-analytics/overview'],
  });

  const { data: highRiskData, isLoading: highRiskLoading } = useQuery<{
    success: boolean;
    data: DebtTrendAnalysis[];
  }>({
    queryKey: ['/api/ai-analytics/high-risk'],
  });

  const { data: allTrendsData, isLoading: trendsLoading } = useQuery<{
    success: boolean;
    data: DebtTrendAnalysis[];
  }>({
    queryKey: ['/api/ai-analytics/debt-trends'],
  });

  if (overviewLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        <div className="flex items-center gap-3 mb-8">
          <Brain className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">تحلیل‌های هوشمند</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const overview = overviewData?.data;
  const highRisk = highRiskData?.data || [];
  const trends = allTrendsData?.data || [];

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const riskPercentages = overview ? {
    critical: Math.round((overview.riskDistribution.critical / overview.totalAnalyzed) * 100),
    high: Math.round((overview.riskDistribution.high / overview.totalAnalyzed) * 100),
    medium: Math.round((overview.riskDistribution.medium / overview.totalAnalyzed) * 100),
    low: Math.round((overview.riskDistribution.low / overview.totalAnalyzed) * 100)
  } : { critical: 0, high: 0, medium: 0, low: 0 };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Brain className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">تحلیل‌های هوشمند بدهی</h1>
          <p className="text-gray-600 mt-1">سیستم AI برای پیش‌بینی و تحلیل ترندهای مالی</p>
        </div>
      </div>

      {/* Overview Stats */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">کل نمایندگان تحلیل شده</p>
                  <p className="text-3xl font-bold text-blue-600">{overview.totalAnalyzed}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">کل بدهی</p>
                  <p className="text-3xl font-bold text-red-600">
                    {formatCurrency(overview.totalDebt)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">میانگین بدهی</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {formatCurrency(overview.averageDebt)}
                  </p>
                </div>
                <Target className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">نمایندگان پرخطر</p>
                  <p className="text-3xl font-bold text-red-600">
                    {overview.riskDistribution.critical + overview.riskDistribution.high}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        {overview && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                توزیع سطح ریسک
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">بحرانی ({overview.riskDistribution.critical})</span>
                    <span className="text-sm text-gray-600">{riskPercentages.critical}%</span>
                  </div>
                  <Progress value={riskPercentages.critical} className="bg-red-100" />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">بالا ({overview.riskDistribution.high})</span>
                    <span className="text-sm text-gray-600">{riskPercentages.high}%</span>
                  </div>
                  <Progress value={riskPercentages.high} className="bg-orange-100" />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">متوسط ({overview.riskDistribution.medium})</span>
                    <span className="text-sm text-gray-600">{riskPercentages.medium}%</span>
                  </div>
                  <Progress value={riskPercentages.medium} className="bg-yellow-100" />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">پایین ({overview.riskDistribution.low})</span>
                    <span className="text-sm text-gray-600">{riskPercentages.low}%</span>
                  </div>
                  <Progress value={riskPercentages.low} className="bg-green-100" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trend Summary */}
        {overview && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                خلاصه ترندهای بدهی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-lg bg-red-50">
                  <TrendingUp className="w-8 h-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-600">{overview.trendingSummary.increasing}</p>
                  <p className="text-sm text-gray-600">در حال افزایش</p>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-green-50">
                  <TrendingDown className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{overview.trendingSummary.decreasing}</p>
                  <p className="text-sm text-gray-600">در حال کاهش</p>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-blue-50">
                  <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{overview.trendingSummary.stable}</p>
                  <p className="text-sm text-gray-600">پایدار</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* High Risk Representatives */}
      {highRisk.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              نمایندگان پرخطر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {highRisk.slice(0, 10).map((rep) => (
                <div key={rep.representativeId} 
                     className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium">{rep.representativeName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getTrendIcon(rep.debtTrend)}
                        <span className="text-sm text-gray-600">
                          روند: {rep.debtTrend === 'increasing' ? 'افزایشی' : 
                                rep.debtTrend === 'decreasing' ? 'کاهشی' : 'پایدار'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-left space-y-2">
                    <p className="font-bold text-red-600">
                      {formatCurrency(rep.currentDebt)}
                    </p>
                    <Badge className={getRiskColor(rep.riskLevel)}>
                      {rep.riskLevel === 'critical' ? 'بحرانی' : 
                       rep.riskLevel === 'high' ? 'بالا' : 
                       rep.riskLevel === 'medium' ? 'متوسط' : 'پایین'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations for High Risk */}
      {highRisk.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              توصیه‌های هوشمند
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {highRisk.slice(0, 4).map((rep) => (
                <Alert key={rep.representativeId} 
                       className={`${rep.riskLevel === 'critical' ? 'border-red-200' : 'border-orange-200'}`}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="mb-2">
                    {rep.representativeName}
                  </AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {rep.recommendations.slice(0, 3).map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}