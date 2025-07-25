import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Router, Route, Switch } from 'wouter'
import { Toaster } from '@/components/ui/toaster'
import MainLayout from './components/MainLayout'
import UnifiedDashboard from './components/UnifiedDashboard'
import RepresentativePortal from './components/RepresentativePortal'
import RepresentativesManagement from './pages/RepresentativesManagement'
import SalesColleaguesManagement from './pages/SalesColleaguesManagement'
import InvoicesManagement from './pages/InvoicesManagement'
import CreditManagement from './pages/CreditManagement'
import CashFlowForecast from './pages/CashFlowForecast'
import ProfitabilityAnalysis from './pages/ProfitabilityAnalysis'
import BankReconciliation from './pages/BankReconciliation'
import SecurityDashboard from './components/SecurityDashboard'

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Portal Route Component for Representatives
function PortalRoute({ params }: { params: { username: string } }) {
  const { username } = params;
  
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

// Settings Page Component
function SettingsPage() {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">تنظیمات سیستم</h1>
          <p className="text-gray-600">مدیریت تنظیمات کلی و پیکربندی سیستم</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">تنظیمات در حال توسعه</h2>
          <p className="text-gray-600">
            این بخش در حال توسعه است. برای تنظیمات فعلی می‌توانید از داشبورد اصلی استفاده کنید.
          </p>
        </div>
      </div>
    </div>
  );
}

// 404 Page Component
function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">صفحه یافت نشد</h1>
        <p className="text-gray-600 mb-6">صفحه مورد نظر شما وجود ندارد</p>
        <a 
          href="/dashboard" 
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          بازگشت به داشبورد
        </a>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Switch>
          {/* Representative Portal Routes (No Layout) */}
          <Route path="/portal/:username">
            {({ username }) => <PortalRoute params={{ username: username! }} />}
          </Route>

          {/* Main Application Routes (With Layout) */}
          <Route>
            {() => (
              <MainLayout>
                <Switch>
                  {/* Dashboard Routes */}
                  <Route path="/" component={() => <UnifiedDashboard />} />
                  <Route path="/dashboard" component={() => <UnifiedDashboard />} />
                  
                  {/* Management Routes */}
                  <Route path="/admin/representatives" component={RepresentativesManagement} />
                  <Route path="/admin/colleagues" component={SalesColleaguesManagement} />
                  <Route path="/admin/invoices" component={InvoicesManagement} />
                  
                  {/* Financial Analysis Routes */}
                  <Route path="/financial/credit" component={CreditManagement} />
                  <Route path="/financial/cashflow" component={CashFlowForecast} />
                  <Route path="/financial/profitability" component={ProfitabilityAnalysis} />
                  <Route path="/financial/reconciliation" component={BankReconciliation} />
                  
                  {/* Security Route */}
                  <Route path="/security" component={SecurityDashboard} />
                  
                  {/* Settings Route */}
                  <Route path="/settings" component={SettingsPage} />
                  
                  {/* Legacy Route Redirects */}
                  <Route path="/admin/advanced">
                    {() => {
                      // Redirect to unified dashboard
                      window.location.href = '/dashboard';
                      return <div>در حال انتقال...</div>;
                    }}
                  </Route>
                  
                  {/* 404 Route */}
                  <Route component={NotFoundPage} />
                </Switch>
              </MainLayout>
            )}
          </Route>
        </Switch>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}