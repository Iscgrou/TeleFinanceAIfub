import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Router, Route, Switch } from 'wouter'
import { Toaster } from '@/components/ui/toaster'
import ErrorBoundary from './components/ErrorBoundary'
import MainLayout from './components/MainLayout'
import UnifiedDashboard from './components/UnifiedDashboard'
import RepresentativePortal from './pages/RepresentativePortal'
import DebugPortal from './components/DebugPortal'
import RepresentativesManagement from './pages/RepresentativesManagement'
import SalesColleaguesManagement from './pages/SalesColleaguesManagement'
import InvoicesManagement from './pages/InvoicesManagement'
import Reports from './pages/Reports'
import ActivityLog from './pages/ActivityLog'
import SettingsPage from './pages/SettingsPage'
import InvoiceHistoryPage from './pages/InvoiceHistoryPage'
import AIAnalytics from './pages/AIAnalytics'
import AlertManagement from './pages/dashboard/AlertManagement'
import DebugDashboard from './pages/DebugDashboard'
import { LazyLoadWrapper } from './components/performance/LazyLoadWrapper'
import { PerformanceMonitor } from './components/performance/PerformanceMonitor'
import { optimizedQueryClient, setupBackgroundCacheManagement, logQueryPerformance } from './lib/optimizedQueryClient'

// Use optimized query client from Phase 7.2
const queryClient = optimizedQueryClient;

// Setup performance monitoring and cache management
if (typeof window !== 'undefined') {
  setupBackgroundCacheManagement();
  logQueryPerformance();
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Switch>
            {/* Representative Portal Routes (No Layout) */}
          <Route path="/portal/:username" component={({ params }) => {
            if (!params?.username) {
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
            return (
              <ErrorBoundary>
                <RepresentativePortal />
              </ErrorBoundary>
            );
          }} />

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
                  
                  {/* Reports and Activity Routes */}
                  <Route path="/reports" component={Reports} />
                  <Route path="/activity" component={ActivityLog} />
                  
                  {/* Settings Route */}
                  <Route path="/settings" component={SettingsPage} />
                  
                  {/* Invoice History Route */}
                  <Route path="/invoices/history" component={InvoiceHistoryPage} />
                  
                  {/* AI Analytics Route - Phase 5.1 with Lazy Loading */}
                  <Route path="/ai-analytics" component={() => (
                    <LazyLoadWrapper>
                      <AIAnalytics />
                    </LazyLoadWrapper>
                  )} />
                  
                  {/* Alert Management Route - Phase 6 Dashboard with Lazy Loading */}
                  <Route path="/alerts" component={() => (
                    <LazyLoadWrapper>
                      <AlertManagement />
                    </LazyLoadWrapper>
                  )} />
                  <Route path="/dashboard/alerts" component={() => (
                    <LazyLoadWrapper>
                      <AlertManagement />
                    </LazyLoadWrapper>
                  )} />
                  
                  {/* Debug Dashboard Route - CADUCEUS v1.0 System */}
                  <Route path="/debug" component={() => (
                    <LazyLoadWrapper>
                      <DebugDashboard />
                    </LazyLoadWrapper>
                  )} />
                  <Route path="/caduceus" component={() => (
                    <LazyLoadWrapper>
                      <DebugDashboard />
                    </LazyLoadWrapper>
                  )} />
                  
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
      <PerformanceMonitor />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}