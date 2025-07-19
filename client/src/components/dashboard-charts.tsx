import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp } from "lucide-react";

export default function DashboardCharts() {
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
            {[
              { name: "فروشگاه دیجیتال", invoices: 12, amount: "۳,۲۴۰,۰۰۰" },
              { name: "فروشگاه آلفا", invoices: 9, amount: "۲,۸۹۰,۰۰۰" },
              { name: "مارکت بتا", invoices: 7, amount: "۲,۱۵۰,۰۰۰" }
            ].map((rep, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="text-right">
                  <p className="font-semibold">{rep.name}</p>
                  <p className="text-sm text-gray-600">{rep.invoices} فاکتور</p>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-green-600">{rep.amount}</p>
                  <p className="text-xs text-gray-500">تومان</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-4 text-blue-600 hover:bg-blue-50">
            مشاهده همه نمایندگان
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
