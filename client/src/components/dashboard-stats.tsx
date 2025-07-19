import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Clock, CheckCircle, Users } from "lucide-react";

interface DashboardStatsProps {
  stats?: {
    totalDebt: string;
    pendingCommissions: string;
    todayPayments: string;
    activeRepresentatives: number;
  };
  isLoading: boolean;
}

export default function DashboardStats({ stats, isLoading }: DashboardStatsProps) {
  const formatCurrency = (amount: string) => {
    return parseFloat(amount || '0').toLocaleString('fa-IR');
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-12 w-12 rounded-full mb-4" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "کل بدهی‌ها",
      value: formatCurrency(stats?.totalDebt || '0'),
      unit: "تومان",
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      iconBg: "bg-red-100",
      change: "+۱۲.۵%",
      changeText: "نسبت به هفته گذشته",
      changeColor: "text-red-600"
    },
    {
      title: "پورسانت معلق",
      value: formatCurrency(stats?.pendingCommissions || '0'),
      unit: "تومان",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-100",
      change: "+۳.۲%",
      changeText: "افزایش این ماه",
      changeColor: "text-orange-600"
    },
    {
      title: "پرداخت‌های امروز",
      value: formatCurrency(stats?.todayPayments || '0'),
      unit: "تومان",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      iconBg: "bg-green-100",
      change: "+۸.۷%",
      changeText: "بهتر از دیروز",
      changeColor: "text-green-600"
    },
    {
      title: "نمایندگان فعال",
      value: stats?.activeRepresentatives?.toString() || '0',
      unit: "نماینده",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      iconBg: "bg-blue-100",
      change: "+۲",
      changeText: "این هفته",
      changeColor: "text-green-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-right">
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.unit}</p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-full flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-xs ${stat.changeColor}`}>{stat.change}</span>
                <span className="text-xs text-gray-500 mr-2">{stat.changeText}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
