import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/navigation";
import { Search, User, Phone, CreditCard } from "lucide-react";
import { useState } from "react";

export default function Representatives() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: representatives, isLoading, refetch } = useQuery({
    queryKey: ['/api/representatives'],
  });

  // Filter representatives based on search
  const filteredReps = representatives?.filter(rep => 
    rep.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rep.panelUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rep.ownerName && rep.ownerName.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const totalDebt = filteredReps.reduce((sum, rep) => sum + parseFloat(rep.totalDebt || '0'), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Navigation */}
        <Navigation />
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-right">
              <h1 className="text-3xl font-bold text-gray-900">فهرست نمایندگان</h1>
              <p className="text-gray-600 mt-1">
                مجموع {filteredReps.length} نماینده | بدهی کل: {new Intl.NumberFormat('fa-IR').format(totalDebt)} تومان
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-4">
              <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
                به‌روزرسانی
              </Button>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="جستجو در نمایندگان..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 text-right"
            />
          </div>
        </div>

        {/* Representatives Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredReps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReps.map((rep) => (
              <Card key={rep.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-right flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {rep.storeName}
                    </CardTitle>
                    <Badge variant={rep.isActive ? "default" : "secondary"}>
                      {rep.isActive ? "فعال" : "غیرفعال"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">نام کاربری پنل:</p>
                    <p className="font-medium">@{rep.panelUsername}</p>
                  </div>
                  
                  {rep.ownerName && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">نام مالک:</p>
                      <p className="font-medium">{rep.ownerName}</p>
                    </div>
                  )}

                  {rep.phone && (
                    <div className="text-right flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <p className="font-medium">{rep.phone}</p>
                    </div>
                  )}

                  <div className="text-right">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      بدهی کل:
                    </p>
                    <p className={`font-bold text-lg ${parseFloat(rep.totalDebt || '0') > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {new Intl.NumberFormat('fa-IR').format(parseFloat(rep.totalDebt || '0'))} تومان
                    </p>
                  </div>

                  {rep.salesColleagueName && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">همکار فروش:</p>
                      <p className="font-medium text-blue-600">{rep.salesColleagueName}</p>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <Button variant="outline" size="sm" className="w-full">
                      مشاهده جزئیات
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">هیچ نماینده‌ای یافت نشد</h3>
              <p className="text-gray-500">
                {searchQuery ? "نتیجه‌ای برای جستجوی شما پیدا نشد" : "هنوز هیچ نماینده‌ای ثبت نشده"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}