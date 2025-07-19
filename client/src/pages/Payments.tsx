import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  CreditCard, 
  Search, 
  Calendar,
  DollarSign,
  TrendingUp,
  User
} from "lucide-react";
import { useState } from "react";

interface Payment {
  id: number;
  representativeId: number;
  amount: string;
  paymentDate: string;
  representative?: {
    storeName: string;
    panelUsername: string;
    ownerName: string | null;
  };
}

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all payments
  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments"],
  });

  // Filter payments based on search
  const filteredPayments = payments?.filter((payment) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      payment.id.toString().includes(searchTerm) ||
      payment.representative?.storeName.toLowerCase().includes(searchLower) ||
      payment.representative?.panelUsername.toLowerCase().includes(searchLower) ||
      payment.representative?.ownerName?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const getTotalStats = () => {
    if (!filteredPayments.length) return { total: 0, count: 0, avgPayment: 0 };
    
    const total = filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const count = filteredPayments.length;
    
    return {
      total,
      count,
      avgPayment: total / count
    };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          💳 مدیریت پرداخت‌ها
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          مشاهده و تحلیل پرداخت‌های دریافتی از نمایندگان
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">کل مبلغ پرداخت‌ها</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.total.toLocaleString('fa-IR')} تومان
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">تعداد پرداخت‌ها</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.count.toLocaleString('fa-IR')}
                </p>
              </div>
              <CreditCard className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">میانگین پرداخت</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats.avgPayment.toLocaleString('fa-IR')} تومان
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            جستجو در پرداخت‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="شماره پرداخت، نام نماینده یا نام کاربری..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            لیست پرداخت‌ها
            <Badge variant="outline" className="ml-2">
              {filteredPayments.length.toLocaleString('fa-IR')} پرداخت
            </Badge>
          </CardTitle>
          <CardDescription>
            تاریخچه کامل پرداخت‌های دریافتی از نمایندگان
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse p-4 border dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPayments.length > 0 ? (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                        <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            پرداخت #{payment.id}
                          </h3>
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            ✅ تایید شده
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {payment.representative && (
                            <div className="flex items-center gap-4">
                              <p className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {payment.representative.storeName}
                              </p>
                              <p>@{payment.representative.panelUsername}</p>
                              {payment.representative.ownerName && (
                                <p>({payment.representative.ownerName})</p>
                              )}
                            </div>
                          )}
                          <p className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(payment.paymentDate).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">مبلغ پرداخت</p>
                      <p className="font-bold text-xl text-green-600 dark:text-green-400">
                        {parseFloat(payment.amount).toLocaleString('fa-IR')} تومان
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                هیچ پرداختی یافت نشد
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm 
                  ? "معیار جستجو را تغییر دهید" 
                  : "هنوز هیچ پرداختی ثبت نشده است"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}