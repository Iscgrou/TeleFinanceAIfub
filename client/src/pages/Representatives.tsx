import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Store, 
  User, 
  ExternalLink, 
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

interface Representative {
  id: number;
  storeName: string;
  ownerName: string | null;
  panelUsername: string;
  totalDebt: string;
  isActive: boolean;
  createdAt: string;
}

interface PaginatedResponse {
  data: Representative[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function Representatives() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [includeInactive, setIncludeInactive] = useState(false);

  // Fetch paginated representatives
  const { data: repData, isLoading } = useQuery<PaginatedResponse>({
    queryKey: [`/api/representatives/paginated?page=${page}&search=${search}&sortBy=${sortBy}&sortOrder=${sortOrder}&includeInactive=${includeInactive}`],
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page when searching
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
        فعال
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        غیرفعال
      </Badge>
    );
  };

  const formatDebt = (debt: string) => {
    const amount = parseFloat(debt);
    if (amount === 0) return "بدون بدهی";
    return `${amount.toLocaleString('fa-IR')} تومان`;
  };

  const getDebtColor = (debt: string) => {
    const amount = parseFloat(debt);
    if (amount === 0) return "text-green-600 dark:text-green-400";
    if (amount > 5000000) return "text-red-600 dark:text-red-400";
    if (amount > 1000000) return "text-orange-600 dark:text-orange-400";
    return "text-yellow-600 dark:text-yellow-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          👥 مدیریت نمایندگان
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          مشاهده و مدیریت نمایندگان فروش و پورتال‌های آنها
        </p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            جستجو و فیلتر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">جستجو</label>
              <Input
                placeholder="نام فروشگاه، مالک یا نام کاربری..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">مرتب‌سازی بر اساس</label>
              <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">تاریخ ایجاد</SelectItem>
                  <SelectItem value="storeName">نام فروشگاه</SelectItem>
                  <SelectItem value="totalDebt">میزان بدهی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">ترتیب</label>
              <Select value={sortOrder} onValueChange={(value) => setSortOrder(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">نزولی</SelectItem>
                  <SelectItem value="asc">صعودی</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">وضعیت</label>
              <Select 
                value={includeInactive ? "all" : "active"} 
                onValueChange={(value) => setIncludeInactive(value === "all")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">فقط فعال</SelectItem>
                  <SelectItem value="all">همه</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Representatives List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              لیست نمایندگان
              {repData && (
                <Badge variant="outline" className="ml-2">
                  {repData.total.toLocaleString('fa-IR')} نماینده
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
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
          ) : repData && repData.data.length > 0 ? (
            <>
              <div className="space-y-4">
                {repData.data.map((rep) => (
                  <div key={rep.id} className="p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                          <Store className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {rep.storeName}
                            </h3>
                            {getStatusBadge(rep.isActive)}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
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
                ))}
              </div>

              {/* Pagination */}
              {repData.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    صفحه {repData.page.toLocaleString('fa-IR')} از {repData.totalPages.toLocaleString('fa-IR')} 
                    ({repData.total.toLocaleString('fa-IR')} نماینده)
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={!repData.hasPrev}
                      className="flex items-center gap-1"
                    >
                      <ChevronRight className="h-4 w-4" />
                      قبلی
                    </Button>
                    
                    <span className="px-3 py-1 text-sm border dark:border-gray-700 rounded">
                      {repData.page.toLocaleString('fa-IR')}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={!repData.hasNext}
                      className="flex items-center gap-1"
                    >
                      بعدی
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                هیچ نماینده‌ای یافت نشد
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {search ? "معیار جستجو را تغییر دهید یا فیلترها را بررسی کنید" : "هنوز هیچ نماینده‌ای ثبت نشده است"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}