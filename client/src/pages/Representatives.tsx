import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Store, 
  DollarSign, 
  User, 
  ExternalLink,
  Search,
  AlertTriangle,
  Loader2
} from "lucide-react";
import RepresentativeProfile from "@/components/RepresentativeProfile";

interface Representative {
  id: number;
  storeName: string;
  ownerName: string | null;
  panelUsername: string;
  totalDebt: string;
  isActive: boolean;
  createdAt: string;
}

interface ApiResponse {
  data: Representative[];
  success?: boolean;
}

export default function Representatives() {
  const [search, setSearch] = useState("");
  const [selectedRepresentativeId, setSelectedRepresentativeId] = useState<number | null>(null);

  // Fetch representatives data
  const { data: apiResponse, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ['/api/representatives'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Debug logging
  console.log("Representatives API Response:", apiResponse);
  console.log("Loading state:", isLoading);
  console.log("Error state:", error);

  // Extract representatives from response
  const representatives = apiResponse?.data || [];

  // Filter representatives based on search
  const filteredRepresentatives = representatives.filter(rep => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    return (
      rep.storeName.toLowerCase().includes(searchLower) ||
      rep.panelUsername.toLowerCase().includes(searchLower) ||
      (rep.ownerName && rep.ownerName.toLowerCase().includes(searchLower))
    );
  });

  const formatDebt = (debt: string) => {
    const amount = parseFloat(debt || '0');
    return amount.toLocaleString('fa-IR') + ' تومان';
  };

  const getDebtColor = (debt: string) => {
    const amount = parseFloat(debt || '0');
    if (amount === 0) return 'text-green-600 dark:text-green-400';
    if (amount > 5000000) return 'text-red-600 dark:text-red-400';
    if (amount > 1000000) return 'text-orange-600 dark:text-orange-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  const getStatusBadge = (isActive: boolean) => (
    <Badge variant={isActive ? 'default' : 'secondary'}>
      {isActive ? 'فعال' : 'غیرفعال'}
    </Badge>
  );

  if (error) {
    console.error("API Error:", error);
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                خطا در بارگذاری داده‌ها
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                امکان دریافت اطلاعات نمایندگان وجود ندارد
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                {error.message}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              مدیریت نمایندگان
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              مشاهده و مدیریت نمایندگان فروش و بدهیات آنها
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            جستجو و فیلتر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              placeholder="جستجو در نام فروشگاه، نام کاربری یا نام مالک..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            {search && (
              <Button
                variant="outline"
                onClick={() => setSearch("")}
                size="sm"
              >
                پاک کردن
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Representatives List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              لیست نمایندگان
            </span>
            {!isLoading && (
              <Badge variant="outline">
                {filteredRepresentatives.length.toLocaleString('fa-IR')} نماینده
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            فهرست کامل نمایندگان با اطلاعات بدهی و وضعیت فعالیت
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                در حال بارگذاری نمایندگان...
              </span>
            </div>
          ) : filteredRepresentatives.length > 0 ? (
            <div className="space-y-4">
              {filteredRepresentatives.map((rep) => (
                <div 
                  key={rep.id} 
                  className="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                        <Store className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {rep.storeName}
                          </h3>
                          {getStatusBadge(rep.isActive)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          {rep.ownerName && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {rep.ownerName}
                            </span>
                          )}
                          <span className="font-mono">@{rep.panelUsername}</span>
                          <span>{new Date(rep.createdAt).toLocaleDateString('fa-IR')}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">بدهی کل</p>
                        <p className={`font-bold ${getDebtColor(rep.totalDebt)}`}>
                          {formatDebt(rep.totalDebt)}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedRepresentativeId(rep.id)}
                          className="flex items-center gap-2"
                        >
                          <User className="h-3 w-3" />
                          پروفایل
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/representatives/portal/${rep.panelUsername}`, '_blank')}
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="h-3 w-3" />
                          پورتال
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {search ? "نماینده‌ای یافت نشد" : "هیچ نماینده‌ای یافت نشد"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {search 
                  ? "معیار جستجو را تغییر دهید یا فیلترها را بررسی کنید" 
                  : "هنوز هیچ نماینده‌ای ثبت نشده است"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Representative Profile Modal */}
      {selectedRepresentativeId && (
        <RepresentativeProfile
          representativeId={selectedRepresentativeId}
          onClose={() => setSelectedRepresentativeId(null)}
        />
      )}
    </div>
  );
}