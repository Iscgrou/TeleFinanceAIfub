import { Route, Router, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";

// Import pages
import Dashboard from "./pages/Dashboard";
import Representatives from "./pages/Representatives";
import Invoices from "./pages/Invoices";
import Payments from "./pages/Payments";
import Settings from "./pages/Settings";
import RepresentativePortal from "./pages/RepresentativePortal";

// Theme Provider
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <div className="theme-provider">
      {children}
    </div>
  );
}

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

// Main Navigation Component
function Navigation() {
  const [location] = useLocation();
  
  const navItems = [
    { path: "/", label: "📊 داشبورد", icon: "📊" },
    { path: "/representatives", label: "👥 نمایندگان", icon: "👥" },
    { path: "/invoices", label: "📄 فاکتورها", icon: "📄" },
    { path: "/payments", label: "💳 پرداخت‌ها", icon: "💳" },
    { path: "/settings", label: "⚙️ تنظیمات", icon: "⚙️" },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-8 rtl:space-x-reverse">
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            💼 سیستم مدیریت مالی
          </div>
          <div className="flex space-x-6 rtl:space-x-reverse">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <span
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    location === item.path
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                      : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <button
            onClick={() => {
              const newTheme = document.documentElement.classList.contains("dark") ? "light" : "dark";
              localStorage.setItem("theme", newTheme);
              document.documentElement.classList.toggle("dark");
            }}
            className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            🌙
          </button>
        </div>
      </div>
    </nav>
  );
}

// Layout Component
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}

// Main App Component
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <Route path="/representatives/portal/:username">
            {(params) => <RepresentativePortal username={params.username} />}
          </Route>
          <Route path="*">
            <Layout>
              <Route path="/" component={Dashboard} />
              <Route path="/representatives" component={Representatives} />
              <Route path="/invoices" component={Invoices} />
              <Route path="/payments" component={Payments} />
              <Route path="/settings" component={Settings} />
            </Layout>
          </Route>
        </Router>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}