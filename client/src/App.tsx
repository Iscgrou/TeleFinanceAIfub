import { Router, Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Dashboard } from "@/pages/Dashboard";

// Import pages as we create them
// import { Representatives } from "@/pages/Representatives";
// import { SalesColleagues } from "@/pages/SalesColleagues"; 
// import { Invoices } from "@/pages/Invoices";
// import { Reports } from "@/pages/Reports";
// import { AuditLogs } from "@/pages/AuditLogs";
// import { Settings } from "@/pages/Settings";

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Default fetcher for React Query
const defaultQueryFn = async ({ queryKey }: { queryKey: string[] }) => {
  const url = queryKey[0];
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'خطای سرور' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  
  return response.json();
};

queryClient.setQueryDefaults([''], { queryFn: defaultQueryFn });

// Placeholder components for routes that don't exist yet
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>
        <p className="text-muted-foreground">این بخش در حال توسعه است</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <MainLayout>
          <Switch>
            {/* Dashboard */}
            <Route path="/" component={Dashboard} />
            
            {/* Representatives */}
            <Route path="/representatives">
              <ComingSoon title="مدیریت نمایندگان" />
            </Route>
            
            {/* Sales Colleagues */}
            <Route path="/sales-colleagues">
              <ComingSoon title="مدیریت همکاران فروش" />
            </Route>
            
            {/* Invoices */}
            <Route path="/invoices">
              <ComingSoon title="مدیریت فاکتورها" />
            </Route>
            
            {/* Reports */}
            <Route path="/reports">
              <ComingSoon title="گزارش‌ها و تحلیل‌ها" />
            </Route>
            
            {/* Audit Logs */}
            <Route path="/audit-logs">
              <ComingSoon title="ردگیری تغییرات" />
            </Route>
            
            {/* Settings */}
            <Route path="/settings">
              <ComingSoon title="تنظیمات سیستم" />
            </Route>
            
            {/* 404 */}
            <Route>
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <h2 className="text-2xl font-bold mb-4">صفحه یافت نشد</h2>
                  <p className="text-muted-foreground">صفحه مورد نظر شما وجود ندارد</p>
                </div>
              </div>
            </Route>
          </Switch>
        </MainLayout>
      </Router>
      
      <Toaster />
    </QueryClientProvider>
  );
}