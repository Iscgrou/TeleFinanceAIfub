import { useState, useEffect } from 'react'
import { api } from './utils/api'

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

function App() {
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ totalRepresentatives: 0, totalDebt: 0, activeRepresentatives: 0 });
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    loadData();
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
                    
                    <div className="text-left">
                      <p className="text-sm text-gray-600">بدهی کل</p>
                      <p className={`font-bold text-lg ${getDebtColor(rep.totalDebt)}`}>
                        {formatCurrency(parseFloat(rep.totalDebt))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;