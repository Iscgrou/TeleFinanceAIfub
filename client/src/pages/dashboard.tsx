import { useQuery } from "@tanstack/react-query";
import DashboardStats from "@/components/dashboard-stats";
import DashboardCharts from "@/components/dashboard-charts";
import RecentTransactions from "@/components/recent-transactions";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-right">
              <h1 className="text-3xl font-bold text-gray-900">داشبورد مدیریت مالی</h1>
              <p className="text-gray-600 mt-1">
                آخرین به‌روزرسانی: {new Date().toLocaleDateString('fa-IR')} - {new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-4">
              <Button variant="outline" onClick={handleRefresh} disabled={statsLoading}>
                <RefreshCw className={`h-4 w-4 ml-2 ${statsLoading ? 'animate-spin' : ''}`} />
                به‌روزرسانی
              </Button>
              <Button>
                <Download className="h-4 w-4 ml-2" />
                گزارش اکسل
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <DashboardStats stats={stats} isLoading={statsLoading} />

        {/* Charts and Analytics */}
        <DashboardCharts />

        {/* Recent Transactions */}
        <RecentTransactions />
      </div>
    </div>
  );
}
