import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-8 p-8">
        <h1 className="text-5xl font-bold text-gray-900 dark:text-white">
          سیستم مدیریت مالی پروکسی
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          مدیریت هوشمند نمایندگان، فاکتورها و پرداخت‌ها با قابلیت یادآوری خودکار
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ورود به داشبورد
          </Link>
          <Link
            href="/api/health"
            className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            وضعیت سیستم
          </Link>
        </div>
      </div>
    </div>
  )
}