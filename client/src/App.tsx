import { useState, useEffect } from 'react'
import { Router, Route, Switch, useRoute } from 'wouter'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { api } from './utils/api'
import RepresentativePortal from './components/RepresentativePortal'
import AdminDashboard from './components/AdminDashboard'

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

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
  total: number;
  success: boolean;
}

interface Stats {
  totalRepresentatives: number;
  totalDebt: number;
  activeRepresentatives: number;
}

interface Settings {
  id?: number;
  geminiApiKey: string;
  telegramBotToken: string;
  adminChatId: string;
  invoiceTemplate: string;
  representativePortalTexts: string;
}

// Portal Route Component
function PortalRoute() {
  const [, params] = useRoute('/portal/:username');
  const username = params?.username;
  
  if (!username) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">نام کاربری نامعتبر</h2>
          <p className="text-gray-600 mb-4">لطفاً نام کاربری صحیح وارد کنید</p>
        </div>
      </div>
    );
  }
  
  return <RepresentativePortal username={username} />;
}

// Invoices Tab Component
function InvoicesTab() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/invoices');
      setInvoices(response || []);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount).toLocaleString('fa-IR') + ' تومان';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partially_paid': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'paid': return 'پرداخت شده';
      case 'partially_paid': return 'نیمه پرداخت';
      default: return 'پرداخت نشده';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">لیست فاکتورها</h2>
          <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
            {invoices.length.toLocaleString('fa-IR')} فاکتور
          </span>
        </div>
        
        {invoices.length > 0 ? (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">#{invoice.id}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">فاکتور #{invoice.id}</h3>
                    <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-600">
                      <span>📅 {formatDate(invoice.createdAt)}</span>
                      {invoice.dueDate && <span>⏰ سررسید: {formatDate(invoice.dueDate)}</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="text-left">
                    <p className="font-bold text-lg text-gray-900">
                      {formatCurrency(invoice.amount)}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                      {getStatusText(invoice.status)}
                    </span>
                  </div>
                  <button
                    onClick={() => alert('جزئیات فاکتور در حال توسعه است')}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                  >
                    👁️ جزئیات
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-gray-600">هنوز فاکتوری ثبت نشده است</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Payments Tab Component
function PaymentsTab() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/payments');
      setPayments(response || []);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return parseFloat(amount).toLocaleString('fa-IR') + ' تومان';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const showPaymentDetails = (payment) => {
    alert(`جزئیات پرداخت:
شماره پرداخت: ${payment.id}
مبلغ: ${formatCurrency(payment.amount)}
تاریخ ایجاد: ${formatDate(payment.createdAt)}
${payment.paymentDate ? `تاریخ پرداخت: ${formatDate(payment.paymentDate)}` : ''}
${payment.description ? `توضیحات: ${payment.description}` : 'بدون توضیحات'}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">لیست پرداخت‌ها</h2>
          <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
            {payments.length.toLocaleString('fa-IR')} پرداخت
          </span>
        </div>
        
        {payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-xl">💳</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">پرداخت #{payment.id}</h3>
                    <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-600">
                      <span>📅 {formatDate(payment.createdAt)}</span>
                      {payment.paymentDate && <span>📅 تاریخ پرداخت: {formatDate(payment.paymentDate)}</span>}
                    </div>
                    {payment.description && (
                      <p className="text-xs text-gray-500 mt-1">{payment.description}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="text-left">
                    <p className="font-bold text-lg text-green-700">
                      +{formatCurrency(payment.amount)}
                    </p>
                  </div>
                  <button
                    onClick={() => showPaymentDetails(payment)}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors"
                  >
                    👁️ جزئیات
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💳</div>
            <p className="text-gray-600">هنوز پرداختی ثبت نشده است</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Legacy Admin Dashboard Component  
function LegacyAdminDashboard() {
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ totalRepresentatives: 0, totalDebt: 0, activeRepresentatives: 0 });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedRepresentative, setSelectedRepresentative] = useState<Representative | null>(null);
  const [showRepresentativeModal, setShowRepresentativeModal] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    geminiApiKey: '',
    telegramBotToken: '',
    adminChatId: '',
    invoiceTemplate: '',
    representativePortalTexts: ''
  });

  useEffect(() => {
    loadData();
    loadSettings();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Starting data load...');
      const response = await api.get<ApiResponse>('/api/representatives');
      
      if (response && response.data) {
        setRepresentatives(response.data);
        
        // Calculate stats
        const totalDebt = response.data.reduce((sum, rep) => sum + parseFloat(rep.totalDebt || '0'), 0);
        const activeCount = response.data.filter(rep => rep.isActive).length;
        
        setStats({
          totalRepresentatives: response.data.length,
          totalDebt,
          activeRepresentatives: activeCount
        });
        
        console.log('✅ Data loaded successfully:', {
          count: response.data.length,
          totalDebt,
          activeCount
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('💥 Failed to load data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await api.get<Settings>('/api/settings');
      const defaultTemplate = `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <title>فاکتور خرید - ${"{{storeName}}"}}</title>
    <style>
        body { font-family: 'Vazirmatn', sans-serif; direction: rtl; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
        .invoice-info { margin: 20px 0; }
        .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
        .table th { background-color: #f2f2f2; }
        .total { text-align: left; font-weight: bold; font-size: 18px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>فاکتور خرید</h1>
        <p>نماینده: ${"{{storeName}}"}}</p>
        <p>تاریخ: ${"{{currentDate}}"}}</p>
    </div>
    <div class="invoice-info">
        <p><strong>نام فروشگاه:</strong> ${"{{storeName}}"}}</p>
        <p><strong>نام کاربری پنل:</strong> ${"{{panelUsername}}"}}</p>
        <p><strong>شماره فاکتور:</strong> ${"{{invoiceId}}"}}</p>
    </div>
    <table class="table">
        <thead>
            <tr>
                <th>ردیف</th>
                <th>شرح خدمات</th>
                <th>مقدار مصرف</th>
                <th>قیمت واحد</th>
                <th>مبلغ کل</th>
            </tr>
        </thead>
        <tbody>
            ${"{{invoiceItems}}"}
        </tbody>
    </table>
    <div class="total">
        <p>مبلغ کل: ${"{{totalAmount}}"} تومان</p>
    </div>
</body>
</html>`;

      const defaultPortalTexts = `{
  "welcome": "به پرتال نماینده ${"{{storeName}}"} خوش آمدید",
  "debt_status": "وضعیت بدهی شما",
  "current_debt": "بدهی فعلی",
  "last_payment": "آخرین پرداخت",
  "invoice_history": "تاریخچه فاکتورها",
  "contact_support": "تماس با پشتیبانی",
  "payment_methods": "روش‌های پرداخت"
}`;

      setSettings({
        geminiApiKey: response.geminiApiKey || '',
        telegramBotToken: response.telegramBotToken || '',
        adminChatId: response.adminChatId || '',
        invoiceTemplate: response.invoiceTemplate || defaultTemplate,
        representativePortalTexts: response.representativePortalTexts || defaultPortalTexts
      });
    } catch (err) {
      console.log('Using default settings');
    }
  };

  const saveSettings = async () => {
    try {
      await api.post('/api/settings', settings);
      alert('✅ تنظیمات با موفقیت ذخیره شد و برای همه فعال شد');
    } catch (err) {
      alert('❌ خطا در ذخیره تنظیمات');
    }
  };

  const clearFinancialData = async () => {
    if (confirm('⚠️ آیا مطمئن هستید؟ تمام فاکتورها، پرداخت‌ها و بدهی‌ها حذف خواهند شد!')) {
      try {
        await api.delete('/api/clear-financial-data');
        alert('✅ اطلاعات مالی با موفقیت پاکسازی شد');
        loadData(); // Reload data
      } catch (err) {
        alert('❌ خطا در پاکسازی اطلاعات مالی');
      }
    }
  };

  const clearAllData = async () => {
    if (confirm('🚨 خطر! آیا مطمئن هستید؟ تمام اطلاعات سیستم حذف خواهند شد!')) {
      if (confirm('🚨 تأیید نهایی: این عمل غیرقابل بازگشت است!')) {
        try {
          await api.delete('/api/clear-all-data');
          alert('✅ تمام اطلاعات با موفقیت پاکسازی شد');
          loadData(); // Reload data
        } catch (err) {
          alert('❌ خطا در پاکسازی اطلاعات');
        }
      }
    }
  };



  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fa-IR') + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getDebtColor = (debt: string) => {
    const amount = parseFloat(debt || '0');
    if (amount === 0) return 'text-green-600';
    if (amount > 5000000) return 'text-red-600';
    if (amount > 1000000) return 'text-orange-600';
    return 'text-yellow-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">در حال بارگذاری داده‌ها...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">خطا در بارگذاری</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              تلاش مجدد
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">💰</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">سیستم مدیریت مالی</h1>
                <p className="text-gray-600">مرکز کنترل و عملیات مالی</p>
              </div>
            </div>
            <div className="flex space-x-2 space-x-reverse">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📊 داشبورد
              </button>
              <button
                onClick={() => setActiveTab('representatives')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'representatives' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👥 نمایندگان
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'invoices' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📄 فاکتورها
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'payments' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                💳 پرداخت‌ها
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'settings' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⚙️ تنظیمات
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">کل نمایندگان</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalRepresentatives.toLocaleString('fa-IR')}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-2xl">👥</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">نمایندگان فعال</p>
                    <p className="text-3xl font-bold text-green-600">{stats.activeRepresentatives.toLocaleString('fa-IR')}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-2xl">✅</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 card-hover">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">کل بدهی‌ها</p>
                    <p className="text-3xl font-bold text-red-600">{formatCurrency(stats.totalDebt)}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-2xl">💰</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Debtors */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">بالاترین بدهکاران</h2>
              <div className="space-y-3">
                {representatives
                  .filter(rep => parseFloat(rep.totalDebt) > 0)
                  .sort((a, b) => parseFloat(b.totalDebt) - parseFloat(a.totalDebt))
                  .slice(0, 5)
                  .map((rep, index) => (
                    <div key={rep.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{rep.storeName}</p>
                          <p className="text-sm text-gray-600">@{rep.panelUsername}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className={`font-bold ${getDebtColor(rep.totalDebt)}`}>
                          {formatCurrency(parseFloat(rep.totalDebt))}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rep.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rep.isActive ? 'فعال' : 'غیرفعال'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'representatives' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">لیست نمایندگان</h2>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  {representatives.length.toLocaleString('fa-IR')} نماینده
                </span>
              </div>
              
              <div className="space-y-4">
                {representatives.map((rep) => (
                  <div key={rep.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xl">🏪</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 space-x-reverse mb-1">
                          <h3 className="font-semibold text-gray-900">{rep.storeName}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            rep.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {rep.isActive ? 'فعال' : 'غیرفعال'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-600">
                          {rep.ownerName && <span>👤 {rep.ownerName}</span>}
                          <span className="font-mono">@{rep.panelUsername}</span>
                          <span>📅 {formatDate(rep.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <div className="text-left">
                        <p className="text-sm text-gray-600">بدهی کل</p>
                        <p className={`font-bold text-lg ${getDebtColor(rep.totalDebt)}`}>
                          {formatCurrency(parseFloat(rep.totalDebt))}
                        </p>
                      </div>
                      <div className="flex space-x-2 space-x-reverse">
                        <button
                          onClick={() => {
                            setSelectedRepresentative(rep);
                            setShowRepresentativeModal(true);
                          }}
                          className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                        >
                          👁️ پروفایل
                        </button>
                        <button
                          onClick={() => window.open(`/portal/${rep.panelUsername}`, '_blank')}
                          className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors"
                        >
                          🔗 پرتال
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <InvoicesTab />
        )}

        {activeTab === 'payments' && (
          <PaymentsTab />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* API Settings */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">🔑 تنظیمات API</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">کلید API جمینی 2.5 پرو</label>
                  <input
                    type="password"
                    value={settings.geminiApiKey}
                    onChange={(e) => setSettings({...settings, geminiApiKey: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="کلید API جمینی خود را وارد کنید"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">توکن ربات تلگرام</label>
                  <input
                    type="password"
                    value={settings.telegramBotToken}
                    onChange={(e) => setSettings({...settings, telegramBotToken: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="توکن ربات تلگرام خود را وارد کنید"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">شناسه چت ادمین</label>
                  <input
                    type="text"
                    value={settings.adminChatId}
                    onChange={(e) => setSettings({...settings, adminChatId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="شناسه چت ادمین را وارد کنید"
                  />
                </div>
                <button
                  onClick={saveSettings}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  💾 ذخیره تنظیمات
                </button>
              </div>
            </div>

            {/* Invoice Template */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">📄 قالب HTML فاکتور</h2>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  کد HTML قالب فاکتور (متغیرها: storeName, panelUsername, currentDate, invoiceId, invoiceItems, totalAmount)
                </label>
                <textarea
                  value={settings.invoiceTemplate}
                  onChange={(e) => setSettings({...settings, invoiceTemplate: e.target.value})}
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="کد HTML قالب فاکتور"
                />
                <button
                  onClick={saveSettings}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  💾 ذخیره قالب فاکتور
                </button>
              </div>
            </div>

            {/* Portal Texts */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">🌐 متون پرتال نماینده</h2>
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  متون JSON پرتال نماینده (متغیر: storeName)
                </label>
                <textarea
                  value={settings.representativePortalTexts}
                  onChange={(e) => setSettings({...settings, representativePortalTexts: e.target.value})}
                  className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder="متون JSON پرتال"
                />
                <button
                  onClick={saveSettings}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  💾 ذخیره متون پرتال
                </button>
              </div>
            </div>

            {/* Data Management */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">🗂️ مدیریت داده‌ها</h2>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">⚠️ پاکسازی اطلاعات مالی</h3>
                  <p className="text-yellow-700 text-sm mb-3">تمام فاکتورها، پرداخت‌ها و بدهی‌ها حذف می‌شوند اما نمایندگان باقی می‌مانند</p>
                  <button
                    onClick={clearFinancialData}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    🧹 پاکسازی اطلاعات مالی
                  </button>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">🚨 پاکسازی تمام اطلاعات</h3>
                  <p className="text-red-700 text-sm mb-3">تمام داده‌های سیستم شامل نمایندگان، فاکتورها، پرداخت‌ها و... حذف می‌شوند</p>
                  <button
                    onClick={clearAllData}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    🗑️ پاکسازی تمام اطلاعات
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Representative Profile Modal */}
      {showRepresentativeModal && selectedRepresentative && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">پروفایل نماینده</h2>
                <button
                  onClick={() => setShowRepresentativeModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-2xl">🏪</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedRepresentative.storeName}</h3>
                    <p className="text-gray-600">@{selectedRepresentative.panelUsername}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                      selectedRepresentative.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedRepresentative.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-600 text-sm font-medium">بدهی فعلی</p>
                      <p className="text-2xl font-bold text-red-700">
                        {formatCurrency(parseFloat(selectedRepresentative.totalDebt))}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-xl">💰</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">تاریخ عضویت</p>
                      <p className="text-xl font-bold text-green-700">
                        {formatDate(selectedRepresentative.createdAt)}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xl">📅</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Portal Link */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">🔗 لینک پرتال عمومی</h4>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <input
                    type="text"
                    value={`${window.location.origin}/portal/${selectedRepresentative.panelUsername}`}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg font-mono text-sm"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/portal/${selectedRepresentative.panelUsername}`);
                      alert('لینک کپی شد');
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    📋 کپی
                  </button>
                  <button
                    onClick={() => window.open(`/portal/${selectedRepresentative.panelUsername}`, '_blank')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    🔗 بازکردن
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">عملیات سریع</h4>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => alert('ایجاد فاکتور جدید در حال توسعه است')}
                    className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    📄 ایجاد فاکتور
                  </button>
                  <button
                    onClick={() => alert('ثبت پرداخت در حال توسعه است')}
                    className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    💳 ثبت پرداخت
                  </button>
                  <button
                    onClick={() => alert('ارسال پیام در حال توسعه است')}
                    className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    💬 ارسال پیام
                  </button>
                  <button
                    onClick={() => alert('تاریخچه تراکنش‌ها در حال توسعه است')}
                    className="bg-orange-600 text-white px-4 py-3 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    📊 تاریخچه
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main App Component with Routing
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
      <Switch>
        <Route path="/portal/:username" component={PortalRoute} />
        <Route path="/admin/advanced">
          <QueryClientProvider client={queryClient}>
            <AdminDashboard />
            <Toaster />
          </QueryClientProvider>
        </Route>
        <Route path="/" component={LegacyAdminDashboard} />
        <Route>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
              <div className="text-gray-500 text-6xl mb-4">🔍</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">صفحه یافت نشد</h2>
              <p className="text-gray-600 mb-4">صفحه مورد نظر وجود ندارد</p>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                بازگشت به صفحه اصلی
              </button>
            </div>
          </div>
        </Route>
      </Switch>
      <Toaster />
    </Router>
    </QueryClientProvider>
  );
}

export default App;