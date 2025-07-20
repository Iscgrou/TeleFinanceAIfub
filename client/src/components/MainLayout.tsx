import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Menu, 
  X, 
  BarChart3, 
  Users, 
  FileText, 
  Settings, 
  UserCheck,
  Activity,
  Search,
  MessageSquare,
  Bot,
  ChevronLeft,
  ChevronRight,
  Home,
  Sun,
  Moon,
  History,
  MessageCircle,
  Brain,
  Shield,
  AlertTriangle,
  Bug
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
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [chatOpen, setChatOpen] = useState(false);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      title: 'داشبورد',
      icon: Home,
      href: '/dashboard',
      description: 'نمای کلی سیستم'
    },
    {
      id: 'representatives',
      title: 'نمایندگان',
      icon: Users,
      href: '/admin/representatives',
      description: 'مدیریت نمایندگان'
    },
    {
      id: 'colleagues',
      title: 'همکاران فروش',
      icon: UserCheck,
      href: '/admin/colleagues',
      description: 'مدیریت همکاران'
    },
    {
      id: 'invoices',
      title: 'فاکتورها',
      icon: FileText,
      href: '/admin/invoices',
      description: 'مدیریت فاکتورها'
    },
    {
      id: 'invoice-history',
      title: 'تاریخچه فاکتورها',
      icon: FileText,
      href: '/invoices/history',
      description: 'مشاهده تاریخچه فاکتورها'
    },
    {
      id: 'reports',
      title: 'گزارش‌ها',
      icon: BarChart3,
      href: '/reports',
      description: 'گزارشات مالی'
    },
    {
      id: 'ai-analytics',
      title: 'تحلیل‌های هوشمند',
      icon: Brain,
      href: '/ai-analytics',
      description: 'تحلیل AI برای بدهی‌ها',
      badge: 'جدید'
    },
    {
      id: 'alerts',
      title: 'مدیریت هشدارها',
      icon: Shield,
      href: '/alerts',
      description: 'سیستم هشدارهای هوشمند',
      badge: 'جدید'
    },
    {
      id: 'debug',
      title: 'CADUCEUS v1.0',
      icon: Bug,
      href: '/debug',
      description: 'سیستم عیب‌یابی 100 بلوکی',
      badge: 'Beta'
    },
    {
      id: 'activity',
      title: 'ردگیری تغییرات',
      icon: History,
      href: '/activity',
      description: 'تاریخچه فعالیت‌ها'
    },
    {
      id: 'settings',
      title: 'تنظیمات',
      icon: Settings,
      href: '/settings',
      description: 'تنظیمات سیستم'
    }
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard' && location === '/') return true;
    return location === href || location.startsWith(href + '/');
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={`p-4 border-b ${sidebarCollapsed && !isMobile ? 'px-2' : ''}`}>
        <div className={`flex items-center gap-3 ${sidebarCollapsed && !isMobile ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            💰
          </div>
          {(!sidebarCollapsed || isMobile) && (
            <div className="flex-1">
              <h1 className="font-bold text-lg text-gray-900">پنل مدیریت</h1>
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
        
        {/* Search Box */}
        {(!sidebarCollapsed || isMobile) && (
          <div className="mt-4 relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="جستجوی سریع..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-3 text-sm"
            />
          </div>
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
        {/* Theme Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleTheme}
          className={`w-full ${sidebarCollapsed && !isMobile ? 'justify-center px-2' : ''}`}
        >
          {theme === 'light' ? (
            <>
              <Moon className="h-4 w-4 flex-shrink-0" />
              {(!sidebarCollapsed || isMobile) && <span className="mr-2">پوسته تاریک</span>}
            </>
          ) : (
            <>
              <Sun className="h-4 w-4 flex-shrink-0" />
              {(!sidebarCollapsed || isMobile) && <span className="mr-2">پوسته روشن</span>}
            </>
          )}
        </Button>
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
      
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <Button
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
          onClick={() => setChatOpen(!chatOpen)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      {/* Chat Window */}
      {chatOpen && (
        <div className="fixed bottom-24 left-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl z-50 flex flex-col">
          <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg flex items-center justify-between">
            <h3 className="font-semibold">دستیار هوش مصنوعی</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setChatOpen(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="text-center text-gray-500 text-sm">
              <Bot className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>سلام! من دستیار هوش مصنوعی شما هستم.</p>
              <p className="mt-2">چطور می‌تونم کمکتون کنم؟</p>
            </div>
          </div>
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="سوال خود را بپرسید..."
                className="flex-1"
              />
              <Button size="sm">
                ارسال
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}