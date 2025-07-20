import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  UserCheck, 
  FileText, 
  BarChart3, 
  History, 
  Settings,
  Search,
  Bell,
  Moon,
  Sun,
  LogOut,
  HelpCircle,
  Shield,
  Database,
  CreditCard,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface MainLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  icon: React.ComponentType<any>;
  label: string;
  href?: string;
  badge?: number;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { icon: Home, label: "داشبورد", href: "/" },
  { 
    icon: Users, 
    label: "مدیریت نمایندگان",
    children: [
      { icon: Users, label: "لیست نمایندگان", href: "/representatives" },
      { icon: UserCheck, label: "نمایندگان فعال", href: "/representatives/active" },
      { icon: Shield, label: "سطوح دسترسی", href: "/representatives/permissions" }
    ]
  },
  { icon: UserCheck, label: "همکاران فروش", href: "/sales-colleagues" },
  { 
    icon: FileText, 
    label: "فاکتورها",
    badge: 2,
    children: [
      { icon: FileText, label: "همه فاکتورها", href: "/invoices" },
      { icon: DollarSign, label: "فاکتورهای پرداخت شده", href: "/invoices/paid" },
      { icon: TrendingUp, label: "فاکتورهای معوق", href: "/invoices/overdue", badge: 2 }
    ]
  },
  { 
    icon: CreditCard, 
    label: "پرداخت‌ها",
    children: [
      { icon: CreditCard, label: "لیست پرداخت‌ها", href: "/payments" },
      { icon: DollarSign, label: "ثبت پرداخت جدید", href: "/payments/new" }
    ]
  },
  { 
    icon: BarChart3, 
    label: "گزارش‌ها و تحلیل",
    children: [
      { icon: BarChart3, label: "گزارش مالی", href: "/reports/financial" },
      { icon: TrendingUp, label: "تحلیل عملکرد", href: "/reports/performance" },
      { icon: Users, label: "گزارش نمایندگان", href: "/reports/representatives" }
    ]
  },
  { icon: History, label: "ردگیری تغییرات", href: "/audit-logs" },
  { icon: Settings, label: "تنظیمات", href: "/settings" },
];

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [location] = useLocation();

  useEffect(() => {
    // بررسی حالت دارک مود از localStorage
    const isDark = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    document.documentElement.classList.toggle('dark');
  };

  const toggleExpanded = (label: string) => {
    setExpandedItems(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const isActivePath = (href?: string) => {
    if (!href) return false;
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  const isParentActive = (item: NavItem) => {
    if (item.href && isActivePath(item.href)) return true;
    if (item.children) {
      return item.children.some(child => isActivePath(child.href));
    }
    return false;
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const Icon = item.icon;
    const isExpanded = expandedItems.includes(item.label);
    const isActive = isParentActive(item);
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <li key={item.label}>
          <button
            onClick={() => toggleExpanded(item.label)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <div className="flex items-center space-x-3 space-x-reverse">
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {item.badge}
                </Badge>
              )}
            </div>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {isExpanded && (
            <ul className="mt-1 mr-6 space-y-1">
              {item.children.map(child => renderNavItem(child, depth + 1))}
            </ul>
          )}
        </li>
      );
    }

    return (
      <li key={item.label}>
        <Link href={item.href!} onClick={() => setSidebarOpen(false)}>
          <span
            className={`flex items-center space-x-3 space-x-reverse px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              isActivePath(item.href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{item.label}</span>
            {item.badge && (
              <Badge variant="destructive" className="mr-auto h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {item.badge}
              </Badge>
            )}
          </span>
        </Link>
      </li>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full bg-card border-l border-border shadow-lg z-40 transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0 w-72' : 'translate-x-full w-72 lg:w-20'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className={`flex items-center space-x-3 space-x-reverse ${!sidebarOpen && 'lg:justify-center'}`}>
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-primary-foreground font-bold text-lg">V2</span>
                </div>
                {sidebarOpen && (
                  <div>
                    <h1 className="text-lg font-bold bg-gradient-to-l from-primary to-primary/70 bg-clip-text text-transparent">
                      سیستم مالی V2Ray
                    </h1>
                    <p className="text-xs text-muted-foreground">مدیریت پروکسی حرفه‌ای</p>
                  </div>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleSidebar}
                className="lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Stats - Only when sidebar is open */}
          {sidebarOpen && (
            <div className="p-4 border-b border-border bg-muted/30">
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 bg-primary/10 border-primary/20">
                  <div className="text-xs text-muted-foreground">درآمد امروز</div>
                  <div className="text-sm font-bold text-primary">۲,۵۴۳,۰۰۰</div>
                </Card>
                <Card className="p-3 bg-green-500/10 border-green-500/20">
                  <div className="text-xs text-muted-foreground">نمایندگان فعال</div>
                  <div className="text-sm font-bold text-green-600 dark:text-green-400">۱۹۹</div>
                </Card>
              </div>
            </div>
          )}

          {/* Search Bar - Only when sidebar is open */}
          {sidebarOpen && (
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="جستجو..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9 bg-muted/50"
                />
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {navItems.map(item => renderNavItem(item))}
            </ul>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border bg-muted/30">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start p-2">
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
                      <span className="text-primary-foreground font-medium text-sm">ا</span>
                    </div>
                    {sidebarOpen && (
                      <div className="text-right">
                        <div className="text-sm font-medium">ادمین سیستم</div>
                        <div className="text-xs text-muted-foreground">admin@v2ray.com</div>
                      </div>
                    )}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="flex items-center space-x-2 space-x-reverse">
                  <Settings className="h-4 w-4" />
                  <span>تنظیمات حساب</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center space-x-2 space-x-reverse">
                  <HelpCircle className="h-4 w-4" />
                  <span>راهنما</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center space-x-2 space-x-reverse text-destructive">
                  <LogOut className="h-4 w-4" />
                  <span>خروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Sidebar Footer */}
          {sidebarOpen && (
            <div className="p-4 border-t border-border flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                نسخه 2.0.0
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleDarkMode}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:mr-72' : 'lg:mr-20'}`}>
        {/* Top Header */}
        <header className="bg-card border-b border-border sticky top-0 z-20 backdrop-blur-sm bg-card/95">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4 space-x-reverse">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div>
                <h2 className="text-xl font-semibold">
                  {navItems.find(item => isParentActive(item))?.label || "داشبورد"}
                </h2>
                <div className="flex items-center space-x-2 space-x-reverse text-xs text-muted-foreground mt-1">
                  <Home className="h-3 w-3" />
                  <span>/</span>
                  <span>خانه</span>
                  <span>/</span>
                  <span className="text-foreground">
                    {navItems.find(item => isParentActive(item))?.label || "داشبورد"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4 space-x-reverse">
              {/* Quick Actions */}
              <Button variant="default" size="sm" className="hidden md:flex">
                <FileText className="h-4 w-4 ml-2" />
                فاکتور جدید
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -left-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      3
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold">اعلان‌ها</h3>
                  </div>
                  <DropdownMenuItem className="p-4">
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">فاکتور جدید صادر شد</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          فاکتور #INV2025001 برای علی رضایی صادر شد
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">۵ دقیقه پیش</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-4">
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">پرداخت دریافت شد</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          مبلغ ۳۰۰,۰۰۰ تومان از مریم حسینی
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">۱۰ دقیقه پیش</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="p-4">
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">فاکتور معوق</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          فاکتور حسن کریمی به مبلغ ۲۶۸,۵۰۰ تومان معوق شد
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">۱ ساعت پیش</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <div className="p-2 border-t border-border">
                    <Button variant="ghost" className="w-full text-sm">
                      مشاهده همه اعلان‌ها
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Chatbot */}
              <Button variant="outline" size="icon">
                <MessageSquare className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 bg-muted/30 min-h-[calc(100vh-73px)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}