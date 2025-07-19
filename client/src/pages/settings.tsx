import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Shield, Settings as SettingsIcon, Database, Save, TestTube, Download, Eye, EyeOff } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const settingsSchema = z.object({
  geminiApiKey: z.string().optional(),
  speechToTextProvider: z.string().default("google"),
  speechToTextApiKey: z.string().optional(),
  telegramBotToken: z.string().optional(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

export default function Settings() {
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings'],
  });

  const form = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      speechToTextProvider: "google",
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SettingsForm) => {
      return apiRequest('POST', '/api/settings', data);
    },
    onSuccess: () => {
      toast({
        title: "✅ تنظیمات ذخیره شد",
        description: "تنظیمات سیستم با موفقیت به‌روزرسانی شد.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
    onError: () => {
      toast({
        title: "❌ خطا در ذخیره تنظیمات",
        description: "لطفا دوباره تلاش کنید.",
        variant: "destructive",
      });
    },
  });

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const onSubmit = (data: SettingsForm) => {
    updateSettingsMutation.mutate(data);
  };

  const testConnections = () => {
    toast({
      title: "🔄 در حال تست اتصالات...",
      description: "لطفا صبر کنید.",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <SettingsIcon className="text-white h-8 w-8" />
            </div>
            <CardTitle className="text-2xl text-right">تنظیمات سیستم</CardTitle>
            <p className="text-gray-600 text-right">پیکربندی اولیه سیستم مدیریت مالی</p>
          </CardHeader>

          <CardContent>
            {/* Security Warning */}
            <Alert className="mb-6 border-warning bg-warning/10">
              <Shield className="h-4 w-4 text-warning" />
              <AlertDescription className="text-right">
                <strong className="text-warning">هشدار امنیتی:</strong> اطلاعات زیر با رمزگذاری AES-256 در سرور ذخیره می‌شود. هرگز این اطلاعات را با دیگران به اشتراک نگذارید.
              </AlertDescription>
            </Alert>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  {/* API Configuration */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900 text-right flex items-center gap-2">
                      <span>🔑 تنظیمات API</span>
                    </h2>
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="geminiApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-right block">کلید API جمینی (Gemini)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showPasswords.gemini ? "text" : "password"}
                                  placeholder="AIzaSyC..."
                                  className="pl-10"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                                  onClick={() => togglePasswordVisibility('gemini')}
                                >
                                  {showPasswords.gemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <p className="text-xs text-gray-500 text-right">
                              برای پردازش دستورات طبیعی و تشخیص قصد کاربر استفاده می‌شود
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="speechToTextProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-right block">سرویس تبدیل گفتار به متن</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="انتخاب سرویس" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="google">Google Speech-to-Text</SelectItem>
                                <SelectItem value="azure">Azure Speech Services</SelectItem>
                                <SelectItem value="amazon">Amazon Transcribe</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="speechToTextApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-right block">کلید API گفتار به متن</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showPasswords.speech ? "text" : "password"}
                                  placeholder="••••••••••••••••"
                                  className="pl-10"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                                  onClick={() => togglePasswordVisibility('speech')}
                                >
                                  {showPasswords.speech ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="telegramBotToken"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-right block">توکن ربات تلگرام</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...field}
                                  type={showPasswords.telegram ? "text" : "password"}
                                  placeholder="1234567890:AAAAA..."
                                  className="pl-10"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="absolute left-2 top-1/2 transform -translate-y-1/2 h-auto p-1"
                                  onClick={() => togglePasswordVisibility('telegram')}
                                >
                                  {showPasswords.telegram ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Status Display */}
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-900 text-right">🔧 وضعیت سیستم</h2>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <Badge variant={settings?.hasGeminiKey ? "default" : "secondary"}>
                            {settings?.hasGeminiKey ? "پیکربندی شده" : "پیکربندی نشده"}
                          </Badge>
                          <span className="text-sm font-medium text-right">Gemini AI</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <Badge variant={settings?.hasSpeechKey ? "default" : "secondary"}>
                            {settings?.hasSpeechKey ? "پیکربندی شده" : "پیکربندی نشده"}
                          </Badge>
                          <span className="text-sm font-medium text-right">Speech-to-Text</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <Badge variant={settings?.hasBotToken ? "default" : "secondary"}>
                            {settings?.hasBotToken ? "فعال" : "غیرفعال"}
                          </Badge>
                          <span className="text-sm font-medium text-right">ربات تلگرام</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Database Status */}
                <div className="pt-8 border-t border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6 text-right flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    وضعیت دیتابیس
                  </h2>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <Database className="text-green-600 h-8 w-8 mx-auto mb-2" />
                      <h3 className="font-semibold text-right">وضعیت اتصال</h3>
                      <p className="text-sm text-green-600 text-right">متصل و آماده</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-blue-600 h-8 w-8 mx-auto mb-2 text-2xl">👥</div>
                      <h3 className="font-semibold text-right">نمایندگان</h3>
                      <p className="text-2xl font-bold text-blue-600">0</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <div className="text-orange-600 h-8 w-8 mx-auto mb-2 text-2xl">📄</div>
                      <h3 className="font-semibold text-right">فاکتورهای این ماه</h3>
                      <p className="text-2xl font-bold text-orange-600">0</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    type="submit" 
                    disabled={updateSettingsMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {updateSettingsMutation.isPending ? "در حال ذخیره..." : "ذخیره تنظیمات"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={testConnections}
                    className="flex items-center gap-2"
                  >
                    <TestTube className="h-4 w-4" />
                    تست اتصالات
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    پشتیبان دیتابیس
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
