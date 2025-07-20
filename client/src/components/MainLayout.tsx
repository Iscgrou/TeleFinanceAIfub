import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { 
  Menu, 
  X, 
  BarChart3, 
  Users, 
  FileText, 
  CreditCard, 
  Settings, 
  UserCheck,
  TrendingUp,
  DollarSign,
  Banknote,
  Shield,
  MessageSquare,
  Bot,
  ChevronLeft,
  ChevronRight,
  Home
} from 'lucide-react';
import { useLocation } from 'wouter';

interface NavigationItem {
  id: string;
  title: string;
  icon: any;
  href: string;
  description?: string;
  badge?: string;
  children?: NavigationItem[];
}

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      title: 'داشبورد اصلی',
      icon: BarChart3,
      href: '/dashboard',
      description: 'نمای کلی سیستم و آمار'
    },
    {
      id: 'representatives',
      title: 'مدیریت نمایندگان',
      icon: Users,
      href: '/admin/representatives',
      description: 'مدیریت کامل نمایندگان',
      badge: 'جدید'
    },
    {
      id: 'colleagues',
      title: 'همکاران فروش',
      icon: UserCheck,
      href: '/admin/colleagues',
      description: 'مدیریت همکاران و کمیسیون'
    },
    {
      id: 'invoices',
      title: 'مدیریت فاکتورها',
      icon: FileText,
      href: '/admin/invoices',
      description: 'ایجاد و مدیریت فاکتورها'
    },
    {
      id: 'financial',
      title: 'تحلیل‌های مالی',
      icon: DollarSign,
      href: '/financial',
      description: 'تحلیل‌ها و گزارشات مالی',
      children: [
        {
          id: 'credit',
          title: 'مدیریت اعتبار',
          icon: CreditCard,
          href: '/financial/credit'
        },
        {
          id: 'cashflow',
          title: 'جریان نقدی',
          icon: TrendingUp,
          href: '/financial/cashflow'
        },
        {
          id: 'profitability',
          title: 'سودآوری',
          icon: DollarSign,
          href: '/financial/profitability'
        },
        {
          id: 'reconciliation',
          title: 'تطبیق بانکی',
          icon: Banknote,
          href: '/financial/reconciliation'
        }
      ]
    },
    {
      id: 'security',
      title: 'امنیت سیستم',
      icon: Shield,
      href: '/security',
      description: 'نظارت و امنیت'
    },
    {
      id: 'settings',
      title: 'تنظیمات',
      icon: Settings,
      href: '/settings',
      description: 'تنظیمات کلی سیستم'
    }
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard' && location === '/') return true;
    return location === href || location.startsWith(href + '/');
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`flex items-center gap-3 p-4 border-b ${sidebarCollapsed && !isMobile ? 'justify-center' : ''}`}>
        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
          💰
        </div>
        {(!sidebarCollapsed || isMobile) && (
          <div className="flex-1">
            <h1 className="font-bold text-lg text-gray-900">سیستم مالی</h1>
            <p className="text-xs text-gray-600">مدیریت جامع</p>
          </div>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          if (item.children) {
            return (
              <div key={item.id} className="space-y-1">
                <div className={`flex items-center gap-3 p-3 rounded-lg text-gray-700 ${sidebarCollapsed && !isMobile ? 'justify-center' : ''}`}>
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {(!sidebarCollapsed || isMobile) && (
                    <span className="font-medium">{item.title}</span>
                  )}
                </div>
                {(!sidebarCollapsed || isMobile) && (
                  <div className="ml-6 space-y-1">
                    {item.children.map((child) => (
                      <div 
                        key={child.id} 
                        onClick={() => setLocation(child.href)}
                        className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-colors cursor-pointer ${
                          isActiveRoute(child.href)
                            ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <child.icon className="h-4 w-4" />
                        <span>{child.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div 
              key={item.id} 
              onClick={() => setLocation(item.href)}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors group cursor-pointer ${
                isActiveRoute(item.href)
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                  : 'text-gray-700 hover:bg-gray-50'
              } ${sidebarCollapsed && !isMobile ? 'justify-center' : ''}`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {(!sidebarCollapsed || isMobile) && (
                <>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t space-y-3 ${sidebarCollapsed && !isMobile ? 'px-2' : ''}`}>
        <div className={`flex items-center gap-2 text-xs ${sidebarCollapsed && !isMobile ? 'justify-center' : ''}`}>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          {(!sidebarCollapsed || isMobile) && <span className="text-gray-600">سیستم آنلاین</span>}
        </div>
        
        {(!sidebarCollapsed || isMobile) && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Bot className="h-3 w-3" />
              <span>بوت تلگرام فعال</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <MessageSquare className="h-3 w-3" />
              <span>همگام‌سازی کامل</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex flex-col bg-white border-l shadow-sm transition-all duration-300 ${
        sidebarCollapsed ? 'w-20' : 'w-80'
      }`}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="right" className="w-80 p-0">
          <SidebarContent isMobile={true} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                💰
              </div>
              <h1 className="font-bold text-lg">سیستم مالی</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">آنلاین</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}