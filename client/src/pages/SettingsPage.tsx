import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import InvoicePreview from "@/components/InvoicePreview";
import { Settings, Palette, FileText, RefreshCw, MessageCircle, Wand2 } from "lucide-react";

interface SystemSettings {
  id: number;
  geminiApiKey: string;
  speechToTextProvider: string;
  speechToTextApiKey: string;
  telegramBotToken: string;
  adminChatId: string;
  invoiceTemplate: string;
  representativePortalTexts: string;
  updatedAt: string;
}

interface InvoiceTemplateConfig {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  footerText: string;
  showQRCode: boolean;
}

interface PortalTexts {
  welcomeTitle: string;
  welcomeSubtitle: string;
  debtSectionTitle: string;
  invoicesSectionTitle: string;
  paymentsSectionTitle: string;
  contactInfo: string;
  emergencyContact: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [invoiceConfig, setInvoiceConfig] = useState<InvoiceTemplateConfig>({
    companyName: "شرکت خدمات پروکسی",
    companyAddress: "تهران، ایران",
    companyPhone: "021-12345678",
    logoUrl: "",
    primaryColor: "#3b82f6",
    secondaryColor: "#64748b", 
    footerText: "با تشکر از همکاری شما",
    showQRCode: true
  });
  const [portalTexts, setPortalTexts] = useState<PortalTexts>({
    welcomeTitle: "پورتال نماینده",
    welcomeSubtitle: "مدیریت حساب و مشاهده وضعیت مالی",
    debtSectionTitle: "وضعیت بدهی",
    invoicesSectionTitle: "فاکتورهای اخیر",
    paymentsSectionTitle: "پرداخت‌های انجام شده",
    contactInfo: "برای سوال یا مشکل با ما تماس بگیرید",
    emergencyContact: "شماره تماس اضطراری: 021-12345678"
  });

  // Fetch current settings
  const { data: settingsData } = useQuery({
    queryKey: ['/api/settings'],
    onSuccess: (data) => {
      if (data) {
        setSettings(data);
        // Parse JSON configs if they exist
        if (data.invoiceTemplate) {
          try {
            setInvoiceConfig(JSON.parse(data.invoiceTemplate));
          } catch (e) {
            console.log("Failed to parse invoice template config");
          }
        }
        if (data.representativePortalTexts) {
          try {
            setPortalTexts(JSON.parse(data.representativePortalTexts));
          } catch (e) {
            console.log("Failed to parse portal texts config");
          }
        }
      }
    }
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<SystemSettings>) => {
      return await apiRequest('/api/settings', {
        method: 'POST',
        body: JSON.stringify(updatedSettings),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "تنظیمات ذخیره شد",
        description: "تغییرات با موفقیت اعمال شد",
      });
    },
    onError: (error) => {
      toast({
        title: "خطا در ذخیره تنظیمات",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
      console.error('Settings save error:', error);
    }
  });

  const handleSaveApiKeys = () => {
    if (!settings) return;
    saveSettingsMutation.mutate(settings);
  };

  const handleSaveInvoiceTemplate = () => {
    saveSettingsMutation.mutate({
      invoiceTemplate: JSON.stringify(invoiceConfig)
    });
  };

  const handleSavePortalTexts = () => {
    saveSettingsMutation.mutate({
      representativePortalTexts: JSON.stringify(portalTexts)
    });
  };

  const resetToDefaults = () => {
    setInvoiceConfig({
      companyName: "شرکت خدمات پروکسی",
      companyAddress: "تهران، ایران", 
      companyPhone: "021-12345678",
      logoUrl: "",
      primaryColor: "#3b82f6",
      secondaryColor: "#64748b",
      footerText: "با تشکر از همکاری شما",
      showQRCode: true
    });
    
    setPortalTexts({
      welcomeTitle: "پورتال نماینده",
      welcomeSubtitle: "مدیریت حساب و مشاهده وضعیت مالی",
      debtSectionTitle: "وضعیت بدهی",
      invoicesSectionTitle: "فاکتورهای اخیر", 
      paymentsSectionTitle: "پرداخت‌های انجام شده",
      contactInfo: "برای سوال یا مشکل با ما تماس بگیرید",
      emergencyContact: "شماره تماس اضطراری: 021-12345678"
    });

    toast({
      title: "تنظیمات بازنشانی شد",
      description: "تنظیمات به حالت پیشفرض بازگردانده شد"
    });
  };

  if (!settingsData) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تنظیمات سیستم</h1>
          <p className="text-gray-600 mt-1">مدیریت تنظیمات کلی سیستم و شخصی‌سازی</p>
        </div>
      </div>

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api-keys" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="invoice-template" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            قالب فاکتور
          </TabsTrigger>
          <TabsTrigger value="portal-appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            ظاهر پورتال
          </TabsTrigger>
          <TabsTrigger value="data-management" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            مدیریت داده‌ها
          </TabsTrigger>
        </TabsList>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                تنظیمات API و سرویس‌ها
              </CardTitle>
              <CardDescription>
                کلیدهای API و تنظیمات سرویس‌های خارجی
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="gemini-key">کلید API Gemini</Label>
                  <Input
                    id="gemini-key"
                    type="password"
                    placeholder="کلید API Gemini را وارد کنید"
                    value={settings?.geminiApiKey || ""}
                    onChange={(e) => setSettings(prev => prev ? {...prev, geminiApiKey: e.target.value} : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telegram-token">توکن ربات تلگرام</Label>
                  <Input
                    id="telegram-token"
                    type="password"
                    placeholder="توکن ربات تلگرام را وارد کنید"
                    value={settings?.telegramBotToken || ""}
                    onChange={(e) => setSettings(prev => prev ? {...prev, telegramBotToken: e.target.value} : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="speech-key">کلید API تبدیل گفتار به متن</Label>
                  <Input
                    id="speech-key"
                    type="password"
                    placeholder="کلید API تبدیل گفتار به متن"
                    value={settings?.speechToTextApiKey || ""}
                    onChange={(e) => setSettings(prev => prev ? {...prev, speechToTextApiKey: e.target.value} : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-chat">ID چت ادمین</Label>
                  <Input
                    id="admin-chat"
                    placeholder="ID چت تلگرام ادمین"
                    value={settings?.adminChatId || ""}
                    onChange={(e) => setSettings(prev => prev ? {...prev, adminChatId: e.target.value} : null)}
                  />
                </div>
              </div>

              <hr className="my-4 border-gray-200" />

              <Button 
                onClick={handleSaveApiKeys} 
                disabled={saveSettingsMutation.isPending}
                className="w-full"
              >
                {saveSettingsMutation.isPending ? "در حال ذخیره..." : "ذخیره تنظیمات API"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoice Template Tab */}
        <TabsContent value="invoice-template" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                ویرایشگر گرافیکی قالب فاکتور
              </CardTitle>
              <CardDescription>
                شخصی‌سازی ظاهر و محتوای فاکتورها بدون نیاز به کدنویسی
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">اطلاعات شرکت</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company-name">نام شرکت</Label>
                    <Input
                      id="company-name"
                      value={invoiceConfig.companyName}
                      onChange={(e) => setInvoiceConfig(prev => ({...prev, companyName: e.target.value}))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company-address">آدرس شرکت</Label>
                    <Textarea
                      id="company-address"
                      value={invoiceConfig.companyAddress}
                      onChange={(e) => setInvoiceConfig(prev => ({...prev, companyAddress: e.target.value}))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company-phone">تلفن شرکت</Label>
                    <Input
                      id="company-phone"
                      value={invoiceConfig.companyPhone}
                      onChange={(e) => setInvoiceConfig(prev => ({...prev, companyPhone: e.target.value}))}
                    />
                  </div>
                </div>

                {/* Design & Colors */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">طراحی و رنگ‌بندی</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="logo-url">آدرس لوگو (URL)</Label>
                    <Input
                      id="logo-url"
                      placeholder="https://example.com/logo.png"
                      value={invoiceConfig.logoUrl}
                      onChange={(e) => setInvoiceConfig(prev => ({...prev, logoUrl: e.target.value}))}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary-color">رنگ اصلی</Label>
                      <Input
                        id="primary-color"
                        type="color"
                        value={invoiceConfig.primaryColor}
                        onChange={(e) => setInvoiceConfig(prev => ({...prev, primaryColor: e.target.value}))}
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondary-color">رنگ ثانویه</Label>
                      <Input
                        id="secondary-color"
                        type="color"
                        value={invoiceConfig.secondaryColor}
                        onChange={(e) => setInvoiceConfig(prev => ({...prev, secondaryColor: e.target.value}))}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footer-text">متن پایان فاکتور</Label>
                    <Textarea
                      id="footer-text"
                      value={invoiceConfig.footerText}
                      onChange={(e) => setInvoiceConfig(prev => ({...prev, footerText: e.target.value}))}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="show-qr"
                      checked={invoiceConfig.showQRCode}
                      onChange={(e) => setInvoiceConfig(prev => ({...prev, showQRCode: e.target.checked}))}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Label htmlFor="show-qr">نمایش QR Code</Label>
                  </div>
                </div>
              </div>

              <hr className="my-4 border-gray-200" />

              <div className="flex gap-3">
                <Button 
                  onClick={handleSaveInvoiceTemplate}
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending ? "در حال ذخیره..." : "ذخیره قالب فاکتور"}
                </Button>
                
                <Button variant="outline" onClick={() => {
                  // Preview functionality can be added here
                  toast({
                    title: "پیش‌نمایش",
                    description: "قابلیت پیش‌نمایش به زودی اضافه می‌شود"
                  });
                }}>
                  پیش‌نمایش
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* پیش‌نمایش فاکتور */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-600" />
                پیش‌نمایش فاکتور
              </CardTitle>
              <CardDescription>
                مشاهده نمونه فاکتور با تنظیمات قالب فعلی
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoicePreview 
                invoiceId={1211} 
                templateData={invoiceTemplate}
                showDownloadButton={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portal Appearance Tab */}
        <TabsContent value="portal-appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                تنظیمات ظاهر پورتال نماینده
              </CardTitle>
              <CardDescription>
                شخصی‌سازی متون و پیام‌های نمایش داده شده در پورتال عمومی نمایندگان
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">متون اصلی</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="welcome-title">عنوان خوش‌آمدگویی</Label>
                    <Input
                      id="welcome-title"
                      value={portalTexts.welcomeTitle}
                      onChange={(e) => setPortalTexts(prev => ({...prev, welcomeTitle: e.target.value}))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="welcome-subtitle">زیرعنوان توضیحات</Label>
                    <Input
                      id="welcome-subtitle"
                      value={portalTexts.welcomeSubtitle}
                      onChange={(e) => setPortalTexts(prev => ({...prev, welcomeSubtitle: e.target.value}))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="debt-section">عنوان بخش بدهی</Label>
                    <Input
                      id="debt-section"
                      value={portalTexts.debtSectionTitle}
                      onChange={(e) => setPortalTexts(prev => ({...prev, debtSectionTitle: e.target.value}))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">بخش‌های محتوا</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="invoices-section">عنوان بخش فاکتورها</Label>
                    <Input
                      id="invoices-section"
                      value={portalTexts.invoicesSectionTitle}
                      onChange={(e) => setPortalTexts(prev => ({...prev, invoicesSectionTitle: e.target.value}))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payments-section">عنوان بخش پرداخت‌ها</Label>
                    <Input
                      id="payments-section"
                      value={portalTexts.paymentsSectionTitle}
                      onChange={(e) => setPortalTexts(prev => ({...prev, paymentsSectionTitle: e.target.value}))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-info">اطلاعات تماس</Label>
                    <Textarea
                      id="contact-info"
                      value={portalTexts.contactInfo}
                      onChange={(e) => setPortalTexts(prev => ({...prev, contactInfo: e.target.value}))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency-contact">شماره تماس اضطراری</Label>
                <Input
                  id="emergency-contact"
                  value={portalTexts.emergencyContact}
                  onChange={(e) => setPortalTexts(prev => ({...prev, emergencyContact: e.target.value}))}
                />
              </div>

              <hr className="my-4 border-gray-200" />

              <Button 
                onClick={handleSavePortalTexts}
                disabled={saveSettingsMutation.isPending}
                className="w-full"
              >
                {saveSettingsMutation.isPending ? "در حال ذخیره..." : "ذخیره تنظیمات پورتال"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Management Tab */}
        <TabsContent value="data-management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                مدیریت و بازنشانی داده‌ها
              </CardTitle>
              <CardDescription>
                ابزارهای مدیریت، بازنشانی و بازیابی داده‌های سیستم
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Wand2 className="w-5 h-5 text-orange-600" />
                      <h3 className="font-semibold text-orange-800">بازنشانی تنظیمات</h3>
                    </div>
                    <p className="text-orange-700 text-sm mb-4">
                      بازگردانی همه تنظیمات قالب و ظاهر به حالت پیشفرض
                    </p>
                    <Button 
                      variant="outline"
                      onClick={resetToDefaults}
                      className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      بازنشانی به حالت پیشفرض
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <RefreshCw className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-800">بازیابی کش</h3>
                    </div>
                    <p className="text-blue-700 text-sm mb-4">
                      پاک‌سازی کش و بارگذاری مجدد داده‌های سیستم
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        queryClient.clear();
                        window.location.reload();
                      }}
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
                    >
                      بازیابی کش سیستم
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-800">توجه</h4>
                </div>
                <p className="text-yellow-700 text-sm">
                  عملیات بازنشانی قابل برگشت نیستند. لطفاً از تنظیمات مهم پشتیبان تهیه کنید.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}