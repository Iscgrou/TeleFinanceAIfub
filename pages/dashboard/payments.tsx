import { GetServerSideProps } from 'next'
import DashboardLayout from '../../components/DashboardLayout'

interface Payment {
  id: number
  representativeId: number
  amount: string
  paymentDate: string
  notes: string | null
  createdAt: string
  representativeName?: string
  storeName?: string
}

interface PaymentsPageProps {
  payments: Payment[]
  totalAmount: string
  monthlyStats: {
    month: string
    amount: string
    count: number
  }[]
}

export const getServerSideProps: GetServerSideProps<PaymentsPageProps> = async () => {
  try {
    const paymentsRes = await fetch('http://localhost:5000/api/payments?limit=100')
    const payments = await paymentsRes.json()
    
    // Calculate total amount
    const totalAmount = payments.reduce((sum: number, payment: Payment) => sum + Number(payment.amount), 0)
    
    // Calculate monthly stats (simplified)
    const monthlyStats = [
      { month: 'دی ۱۴۰۳', amount: '0', count: 0 },
      { month: 'آذر ۱۴۰۳', amount: '0', count: 0 },
      { month: 'آبان ۱۴۰۳', amount: '0', count: 0 }
    ]
    
    return {
      props: {
        payments: payments || [],
        totalAmount: totalAmount.toString(),
        monthlyStats
      }
    }
  } catch (error) {
    console.error('Failed to fetch payments:', error)
    return {
      props: {
        payments: [],
        totalAmount: '0',
        monthlyStats: []
      }
    }
  }
}

export default function PaymentsPage({ payments, totalAmount, monthlyStats }: PaymentsPageProps) {
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">پرداخت‌ها</h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              مدیریت و ردیابی پرداخت‌های نمایندگان
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              ثبت پرداخت جدید
            </button>
          </div>
        </div>
        
        {/* Stats Overview */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-green-500 p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">کل پرداخت‌ها</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('fa-IR').format(Number(totalAmount))} تومان
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-blue-500 p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">تعداد پرداخت‌ها</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">{payments.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-yellow-500 p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">پرداخت امروز</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {payments.filter(p => new Date(p.paymentDate).toDateString() === new Date().toDateString()).length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-purple-500 p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">میانگین ماهانه</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {payments.length > 0 ? new Intl.NumberFormat('fa-IR').format(Math.round(Number(totalAmount) / 3)) : '0'} تومان
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Payments Table */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="py-3.5 pr-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        شماره پرداخت
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        نماینده
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        مبلغ
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        تاریخ پرداخت
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        یادداشت
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3">
                        <span className="sr-only">عملیات</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-20 text-center">
                          <div className="text-gray-400 text-4xl mb-4">💰</div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            هیچ پرداختی ثبت نشده
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400">
                            پرداخت‌های ثبت شده در اینجا نمایش داده خواهند شد
                          </p>
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="whitespace-nowrap py-4 pr-3 text-sm font-medium text-gray-900 dark:text-white">
                            #{payment.id}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {payment.storeName || payment.representativeName || `نماینده ${payment.representativeId}`}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {new Intl.NumberFormat('fa-IR').format(Number(payment.amount))} تومان
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            {new Date(payment.paymentDate).toLocaleDateString('fa-IR')}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                            {payment.notes || '-'}
                          </td>
                          <td className="relative whitespace-nowrap py-4 pl-3 text-left text-sm font-medium">
                            <a href={`/dashboard/payments/${payment.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                              ویرایش
                            </a>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}