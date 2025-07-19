import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings as SettingsIcon, 
  Palette, 
  Bot, 
  Save,
  RefreshCw,
  FileText,
  Eye,
  Download
} from "lucide-react";
import { useState, useEffect } from "react";

interface InvoiceTemplate {
  id: number;
  name: string;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string | null;
  headerColor: string;
  footerText: string;
  isDefault: boolean;
}

interface SystemSettings {
  telegramBotToken: string;
  geminiApiKey: string;
  speechApiKey: string;
  defaultCommissionRate: number;
}

export default function Settings() {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate | null>(null);
  const [previewInvoiceId, setPreviewInvoiceId] = useState<number>(1012); // Default test invoice

  // Fetch invoice templates
  const { data: templates, isLoading: templatesLoading, refetch: refetchTemplates } = useQuery<InvoiceTemplate[]>({
    queryKey: ["/api/settings/invoice-templates"],
  });

  // Fetch system settings
  const { data: systemSettings, isLoading: settingsLoading, refetch: refetchSettings } = useQuery<SystemSettings>({
    queryKey: ["/api/settings/system"],
  });

  // Template creation/update mutation
  const templateMutation = useMutation({
    mutationFn: (template: Partial<InvoiceTemplate>) => 
      apiRequest(
        template.id ? `/api/settings/invoice-templates/${template.id}` : "/api/settings/invoice-templates",
        {
          method: template.id ? "PUT" : "POST",
          body: JSON.stringify(template),
        }
      ),
    onSuccess: () => {
      toast({
        title: "✅ موفقیت",
        description: "قالب فاکتور با موفقیت ذخیره شد",
      });
      refetchTemplates();
      setSelectedTemplate(null);
    },
    onError: (error) => {
      toast({
        title: "❌ خطا",
        description: "خطا در ذخیره قالب فاکتور",
        variant: "destructive",
      });
    },
  });

  // System settings update mutation
  const settingsMutation = useMutation({
    mutationFn: (settings: Partial<SystemSettings>) => 
      apiRequest("/api/settings/system", {
        method: "PUT",
        body: JSON.stringify(settings),
      }),
    onSuccess: () => {
      toast({
        title: "✅ موفقیت",
        description: "تنظیمات سیستم با موفقیت به‌روزرسانی شد",
      });
      refetchSettings();
    },
    onError: (error) => {
      toast({
        title: "❌ خطا",
        description: "خطا در به‌روزرسانی تنظیمات سیستم",
        variant: "destructive",
      });
    },
  });

  // Template form component
  function TemplateForm({ template }: { template: InvoiceTemplate | null }) {
    const [formData, setFormData] = useState({
      name: template?.name || "",
      companyName: template?.companyName || "",
      address: template?.address || "",
      phone: template?.phone || "",
      email: template?.email || "",
      logoUrl: template?.logoUrl || "",
      headerColor: template?.headerColor || "#3B82F6",
      footerText: template?.footerText || "",
      isDefault: template?.isDefault || false,
    });

    useEffect(() => {
      if (template) {
        setFormData({
          name: template.name,
          companyName: template.companyName,
          address: template.address,
          phone: template.phone,
          email: template.email,
          logoUrl: template.logoUrl || "",
          headerColor: template.headerColor,
          footerText: template.footerText,
          isDefault: template.isDefault,
        });
      }
    }, [template]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      templateMutation.mutate({
        ...formData,
        id: template?.id,
      });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">نام قالب</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="قالب اصلی"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="companyName">نام شرکت</Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="شرکت مثال"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">آدرس</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            placeholder="آدرس کامل شرکت..."
            rows={2}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">تلفن</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="021-12345678"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">ایمیل</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="info@company.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="logoUrl">لینک لوگو</Label>
            <Input
              id="logoUrl"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="headerColor">رنگ هدر</Label>
            <div className="flex gap-2">
              <Input
                id="headerColor"
                type="color"
                value={formData.headerColor}
                onChange={(e) => setFormData({ ...formData, headerColor: e.target.value })}
                className="w-20"
              />
              <Input
                value={formData.headerColor}
                onChange={(e) => setFormData({ ...formData, headerColor: e.target.value })}
                placeholder="#3B82F6"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="footerText">متن پاورقی</Label>
          <Textarea
            id="footerText"
            value={formData.footerText}
            onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
            placeholder="متشکریم از اعتماد شما..."
            rows={2}
          />
        </div>

        <div className="flex items-center gap-4 pt-4 border-t">
          <Button type="submit" disabled={templateMutation.isPending}>
            {templateMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                ذخیره قالب
              </>
            )}
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setSelectedTemplate(null)}
          >
            انصراف
          </Button>

          {formData.name && (
            <Button 
              type="button" 
              variant="outline"
              onClick={() => window.open(`/api/invoices/${previewInvoiceId}/download?templateId=${template?.id || 'new'}&preview=true`, '_blank')}
            >
              <Eye className="w-4 h-4 mr-2" />
              پیش‌نمایش
            </Button>
          )}
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          ⚙️ تنظیمات سیستم
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          مدیریت تنظیمات کلی سیستم و کاستومایز قالب‌های فاکتور
        </p>
      </div>

      {/* Invoice Templates Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            قالب‌های فاکتور
          </CardTitle>
          <CardDescription>
            مدیریت و کاستومایز قالب‌های فاکتور برای ارسال به نمایندگان
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templatesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse p-4 border dark:border-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Existing Templates */}
              {templates && templates.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">قالب‌های موجود</h3>
                  {templates.map((template) => (
                    <div key={template.id} className="p-4 border dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: template.headerColor }}
                          ></div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {template.name}
                              </h4>
                              {template.isDefault && (
                                <Badge variant="default" className="text-xs">
                                  پیش‌فرض
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {template.companyName}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.open(`/api/invoices/${previewInvoiceId}/download?templateId=${template.id}`, '_blank')}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            دانلود نمونه
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedTemplate(template)}
                          >
                            ویرایش
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              {/* Template Form */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedTemplate ? "ویرایش قالب" : "افزودن قالب جدید"}
                  </h3>
                  {!selectedTemplate && (
                    <Button 
                      variant="outline"
                      onClick={() => setSelectedTemplate({} as InvoiceTemplate)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      قالب جدید
                    </Button>
                  )}
                </div>
                
                {(selectedTemplate || selectedTemplate === null) && (
                  <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <TemplateForm template={selectedTemplate} />
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            تنظیمات سیستم
          </CardTitle>
          <CardDescription>
            تنظیمات کلی ربات تلگرام و خدمات هوش مصنوعی
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settingsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                  <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : systemSettings ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>توکن ربات تلگرام</Label>
                  <Input
                    type="password"
                    value={systemSettings.telegramBotToken}
                    onChange={(e) => settingsMutation.mutate({ telegramBotToken: e.target.value })}
                    placeholder="Bot Token از BotFather..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>کلید API Gemini</Label>
                  <Input
                    type="password"
                    value={systemSettings.geminiApiKey}
                    onChange={(e) => settingsMutation.mutate({ geminiApiKey: e.target.value })}
                    placeholder="Google Gemini API Key..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>کلید API تبدیل صوت به متن</Label>
                  <Input
                    type="password"
                    value={systemSettings.speechApiKey}
                    onChange={(e) => settingsMutation.mutate({ speechApiKey: e.target.value })}
                    placeholder="Speech-to-Text API Key..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>نرخ کمیسیون پیش‌فرض (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={systemSettings.defaultCommissionRate}
                    onChange={(e) => settingsMutation.mutate({ defaultCommissionRate: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  💡 تغییرات تنظیمات بلافاصله اعمال می‌شوند. برای اعمال تنظیمات ربات تلگرام، ربات را مجدداً راه‌اندازی کنید.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">خطا در بارگذاری تنظیمات</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}