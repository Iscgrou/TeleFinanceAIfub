import { GetServerSideProps } from 'next'
import { useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'

interface Invoice {
  id: number
  representativeId: number
  amount: string
  usageDate: string
  dueDate: string
  status: 'unpaid' | 'partially_paid' | 'paid'
  notes: string | null
  createdAt: string
  representativeName?: string
  storeName?: string
}

interface InvoicesPageProps {
  invoices: Invoice[]
  totalInvoices: number
  totalUnpaid: number
  totalAmount: string
  unpaidAmount: string
}

export const getServerSideProps: GetServerSideProps<InvoicesPageProps> = async () => {
  try {
    // Fetch invoices with representative info
    const invoicesRes = await fetch('http://localhost:5000/api/invoices?limit=50')
    const invoicesData = await invoicesRes.json()
    
    // Calculate stats
    const totalAmount = invoicesData.reduce((sum: number, inv: Invoice) => sum + Number(inv.amount), 0)
    const unpaidInvoices = invoicesData.filter((inv: Invoice) => inv.status === 'unpaid')
    const unpaidAmount = unpaidInvoices.reduce((sum: number, inv: Invoice) => sum + Number(inv.amount), 0)
    
    return {
      props: {
        invoices: invoicesData || [],
        totalInvoices: invoicesData.length || 0,
        totalUnpaid: unpaidInvoices.length || 0,
        totalAmount: totalAmount.toString(),
        unpaidAmount: unpaidAmount.toString()
      }
    }
  } catch (error) {
    console.error('Failed to fetch invoices:', error)
    return {
      props: {
        invoices: [],
        totalInvoices: 0,
        totalUnpaid: 0,
        totalAmount: '0',
        unpaidAmount: '0'
      }
    }
  }
}

export default function InvoicesPage({ invoices, totalInvoices, totalUnpaid, totalAmount, unpaidAmount }: InvoicesPageProps) {
  const [filter, setFilter] = useState<'all' | 'unpaid' | 'paid'>('all')
  
  const filteredInvoices = invoices.filter(invoice => {
    if (filter === 'all') return true
    if (filter === 'unpaid') return invoice.status === 'unpaid'
    if (filter === 'paid') return invoice.status === 'paid' || invoice.status === 'partially_paid'
    return true
  })
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unpaid':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">پرداخت نشده</span>
      case 'partially_paid':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">پرداخت جزئی</span>
      case 'paid':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">پرداخت شده</span>
      default:
        return null
    }
  }
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">فاکتورها</h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              مدیریت فاکتورها و وضعیت پرداخت‌ها
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              ایجاد فاکتور جدید
            </button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-blue-500 p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">کل فاکتورها</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">{totalInvoices}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="rounded-md bg-red-500 p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">پرداخت نشده</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">{totalUnpaid}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
          
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
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">مجموع مبلغ</dt>
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
                  <div className="rounded-md bg-yellow-500 p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">بدهی باقیمانده</dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('fa-IR').format(Number(unpaidAmount))} تومان
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="mt-6">
          <div className="sm:hidden">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unpaid' | 'paid')}
              className="block w-full rounded-md border-gray-300 py-2 pr-3 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="all">همه فاکتورها</option>
              <option value="unpaid">پرداخت نشده</option>
              <option value="paid">پرداخت شده</option>
            </select>
          </div>
          <div className="hidden sm:block">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8 space-x-reverse" aria-label="Tabs">
                {[
                  { value: 'all', label: 'همه فاکتورها' },
                  { value: 'unpaid', label: 'پرداخت نشده' },
                  { value: 'paid', label: 'پرداخت شده' }
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setFilter(tab.value as 'all' | 'unpaid' | 'paid')}
                    className={`${
                      filter === tab.value
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
        
        {/* Invoices Table */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="py-3.5 pr-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        شماره فاکتور
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        نماینده
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        مبلغ
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        تاریخ سررسید
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        وضعیت
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3">
                        <span className="sr-only">عملیات</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="whitespace-nowrap py-4 pr-3 text-sm font-medium text-gray-900 dark:text-white">
                          #{invoice.id}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {invoice.storeName || invoice.representativeName || `نماینده ${invoice.representativeId}`}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Intl.NumberFormat('fa-IR').format(Number(invoice.amount))} تومان
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(invoice.dueDate).toLocaleDateString('fa-IR')}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {getStatusBadge(invoice.status)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 text-left text-sm font-medium">
                          <a href={`/dashboard/invoices/${invoice.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                            مشاهده
                          </a>
                        </td>
                      </tr>
                    ))}
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