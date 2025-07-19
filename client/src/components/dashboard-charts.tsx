import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp } from "lucide-react";

export default function DashboardCharts() {
  // Fetch real representatives data
  const { data: representatives, isLoading: repsLoading } = useQuery({
    queryKey: ['/api/representatives'],
  });

  // Calculate top performers from real data
  const getTopPerformers = () => {
    if (!representatives) return [];
    
    return representatives
      .filter(rep => rep.isActive && parseFloat(rep.totalDebt || '0') > 0)
      .sort((a, b) => parseFloat(b.totalDebt || '0') - parseFloat(a.totalDebt || '0'))
      .slice(0, 5)
      .map(rep => ({
        name: rep.storeName || rep.panelUsername,
        debt: parseFloat(rep.totalDebt || '0'),
        formattedDebt: new Intl.NumberFormat('fa-IR').format(parseFloat(rep.totalDebt || '0')),
        panelUsername: rep.panelUsername
      }));
  };

  const topPerformers = getTopPerformers();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
      {/* Revenue Chart */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-right">روند درآمد (میلیون تومان)</CardTitle>
            <Select defaultValue="7days">
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">۷ روز اخیر</SelectItem>
                <SelectItem value="30days">۳۰ روز اخیر</SelectItem>
                <SelectItem value="3months">۳ ماه اخیر</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center text-gray-400">
                <TrendingUp className="h-16 w-16 mx-auto mb-4" />
                <p className="text-right">نمودار روند درآمد در اینجا نمایش داده می‌شود</p>
                <p className="text-sm mt-2 text-right">استفاده از Chart.js یا D3.js</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-right">برترین نمایندگان</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {repsLoading ? (
              <div className="text-center text-gray-500 py-4">
                در حال بارگیری نمایندگان...
              </div>
            ) : topPerformers.length > 0 ? (
              topPerformers.map((rep, index) => (
                <div key={rep.panelUsername} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="text-right">
                    <p className="font-semibold">{rep.name}</p>
                    <p className="text-sm text-gray-600">@{rep.panelUsername}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-red-600">{rep.formattedDebt}</p>
                    <p className="text-xs text-gray-500">تومان بدهی</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                هیچ نماینده‌ای یافت نشد
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-blue-600 hover:bg-blue-50"
            onClick={() => window.location.href = '/representatives'}
          >
            مشاهده همه نمایندگان ({representatives?.length || 0})
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
