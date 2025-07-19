import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode } from 'react'

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  
  const menuItems = [
    { name: 'داشبورد', href: '/dashboard', icon: '📊' },
    { name: 'نمایندگان', href: '/dashboard/representatives', icon: '👥' },
    { name: 'فاکتورها', href: '/dashboard/invoices', icon: '📄' },
    { name: 'پرداخت‌ها', href: '/dashboard/payments', icon: '💰' },
    { name: 'همکاران فروش', href: '/dashboard/sales-colleagues', icon: '👔' },
    { name: 'تنظیمات', href: '/dashboard/settings', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="fixed inset-y-0 right-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg">
        <div className="flex h-16 items-center justify-center border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            سیستم مدیریت مالی
          </h2>
        </div>
        <nav className="mt-5 px-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center px-2 py-2 text-base font-medium rounded-md mb-1 ${
                router.pathname === item.href
                  ? 'bg-gray-900 dark:bg-gray-700 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span className="ml-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="mr-64">
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}