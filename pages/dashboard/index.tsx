import { GetServerSideProps } from 'next'
import Link from 'next/link'
import DashboardLayout from '../../components/DashboardLayout'

interface DashboardStats {
  totalDebt: string
  pendingCommissions: string
  todayPayments: string
  activeRepresentatives: number
  recentPayments?: any[]
  topDebtors?: any[]
}

interface DashboardPageProps {
  stats: DashboardStats
}

export const getServerSideProps: GetServerSideProps<DashboardPageProps> = async () => {
  try {
    const res = await fetch('http://localhost:5000/api/dashboard/stats')
    const stats = await res.json()
    
    return {
      props: {
        stats
      }
    }
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return {
      props: {
        stats: {
          totalDebt: '0',
          pendingCommissions: '0',
          todayPayments: '0',
          activeRepresentatives: 0,
          recentPayments: [],
          topDebtors: []
        }
      }
    }
  }
}

export default function DashboardPage({ stats }: DashboardPageProps) {
  const cards = [
    {
      name: 'نمایندگان فعال',
      value: stats.activeRepresentatives,
      bgColor: 'bg-blue-500',
    },
    {
      name: 'کل بدهی',
      value: new Intl.NumberFormat('fa-IR').format(Number(stats.totalDebt)) + ' تومان',
      bgColor: 'bg-red-500',
    },
    {
      name: 'پرداخت‌های امروز',
      value: new Intl.NumberFormat('fa-IR').format(Number(stats.todayPayments)) + ' تومان',
      bgColor: 'bg-green-500',
    },
    {
      name: 'کمیسیون معوق',
      value: new Intl.NumberFormat('fa-IR').format(Number(stats.pendingCommissions)) + ' تومان',
      bgColor: 'bg-yellow-500',
    },
  ]

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          داشبورد مدیریت مالی
        </h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div
              key={card.name}
              className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
            >
              <div className={`px-4 py-5 sm:p-6 ${card.bgColor}`}>
                <dt className="text-sm font-medium text-white truncate">
                  {card.name}
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-white">
                  {card.value}
                </dd>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Payments and Top Debtors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Recent Payments */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                آخرین پرداخت‌ها
              </h3>
              <div className="mt-5">
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
                    {!stats.recentPayments || stats.recentPayments.length === 0 ? (
                      <li className="py-4 text-gray-500 dark:text-gray-400 text-center">
                        هیچ پرداختی ثبت نشده است
                      </li>
                    ) : (
                      stats.recentPayments.map((payment) => (
                        <li key={payment.id} className="py-4">
                          <div className="flex items-center space-x-4 space-x-reverse">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {payment.representativeName}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {payment.notes}
                              </p>
                            </div>
                            <div className="text-left">
                              <div className="text-sm text-gray-900 dark:text-white font-medium">
                                {new Intl.NumberFormat('fa-IR').format(payment.amount)} تومان
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(payment.paymentDate).toLocaleDateString('fa-IR')}
                              </div>
                            </div>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Top Debtors */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                بیشترین بدهکاران
              </h3>
              <div className="mt-5">
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200 dark:divide-gray-700">
                    {!stats.topDebtors || stats.topDebtors.length === 0 ? (
                      <li className="py-4 text-gray-500 dark:text-gray-400 text-center">
                        هیچ بدهکاری ثبت نشده است
                      </li>
                    ) : (
                      stats.topDebtors.map((debtor) => (
                        <li key={debtor.id} className="py-4">
                          <div className="flex items-center space-x-4 space-x-reverse">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {debtor.storeName}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {debtor.ownerName} - @{debtor.panelUsername}
                              </p>
                            </div>
                            <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                              {new Intl.NumberFormat('fa-IR').format(debtor.totalDebt)} تومان
                            </div>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}