import { GetServerSideProps } from 'next'
import { useState } from 'react'

interface Representative {
  id: number
  storeName: string
  ownerName: string
  panelUsername: string
  phoneNumber: string
  totalDebt: string
  notes: string | null
}

interface Invoice {
  id: number
  amount: string
  usageDate: string
  dueDate: string
  status: 'unpaid' | 'partially_paid' | 'paid'
  notes: string | null
  createdAt: string
}

interface PortalPageProps {
  representative: Representative | null
  invoices: Invoice[]
  error?: string
}

export const getServerSideProps: GetServerSideProps<PortalPageProps> = async (context) => {
  const { username } = context.query
  
  if (!username) {
    return {
      props: {
        representative: null,
        invoices: [],
        error: 'نام کاربری وارد نشده است'
      }
    }
  }
  
  try {
    // Find representative by username
    const repsRes = await fetch(`http://localhost:5000/api/representatives?search=${encodeURIComponent(username as string)}`)
    const representatives = await repsRes.json()
    const representative = representatives.find((rep: Representative) => rep.panelUsername === username)
    
    if (!representative) {
      return {
        props: {
          representative: null,
          invoices: [],
          error: 'نماینده با این نام کاربری یافت نشد'
        }
      }
    }
    
    // Fetch invoices for this representative
    const invoicesRes = await fetch(`http://localhost:5000/api/invoices?representativeId=${representative.id}`)
    const invoices = await invoicesRes.json()
    
    return {
      props: {
        representative,
        invoices: invoices || [],
        error: undefined
      }
    }
  } catch (error) {
    console.error('Portal fetch error:', error)
    return {
      props: {
        representative: null,
        invoices: [],
        error: 'خطا در دریافت اطلاعات'
      }
    }
  }
}

export default function PortalPage({ representative, invoices, error }: PortalPageProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">خطا</h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
          <a href="/portal" className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            تلاش مجدد
          </a>
        </div>
      </div>
    )
  }
  
  if (!representative) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              پورتال نمایندگان
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              نام کاربری خود را وارد کنید
            </p>
          </div>
          <form className="mt-8 space-y-6" action="/portal" method="GET">
            <div>
              <label htmlFor="username" className="sr-only">
                نام کاربری
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                placeholder="نام کاربری پنل"
              />
            </div>
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ورود
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unpaid':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">پرداخت نشده</span>
      case 'partially_paid':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">پرداخت جزئی</span>
      case 'paid':
        return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">پرداخت شده</span>
      default:
        return null
    }
  }
  
  const totalDebt = invoices
    .filter(inv => inv.status === 'unpaid')
    .reduce((sum, inv) => sum + Number(inv.amount), 0)
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {representative.storeName}
              </h1>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {representative.ownerName} • @{representative.panelUsername}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-medium">📄</span>
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      تعداد فاکتورها
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {invoices.length}
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
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-sm font-medium">💰</span>
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      بدهی باقیمانده
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {new Intl.NumberFormat('fa-IR').format(totalDebt)} تومان
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
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm font-medium">✅</span>
                  </div>
                </div>
                <div className="mr-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      فاکتورهای پرداخت شده
                    </dt>
                    <dd className="text-lg font-medium text-gray-900 dark:text-white">
                      {invoices.filter(inv => inv.status === 'paid').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Invoices Table */}
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
              فاکتورهای شما
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              لیست تمام فاکتورها و وضعیت پرداخت آنها
            </p>
          </div>
          
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                هیچ فاکتوری یافت نشد
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                در حال حاضر فاکتوری برای شما ثبت نشده است
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.map((invoice) => (
                <li key={invoice.id}>
                  <div className="px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            #{invoice.id}
                          </span>
                        </div>
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          فاکتور شماره {invoice.id}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          تاریخ سررسید: {new Date(invoice.dueDate).toLocaleDateString('fa-IR')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="text-left ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('fa-IR').format(Number(invoice.amount))} تومان
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {getStatusBadge(invoice.status)}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="ml-4 text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium"
                      >
                        جزئیات
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  فاکتور #{selectedInvoice.id}
                </h3>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">مبلغ:</span>
                  <span className="mr-2 text-sm text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('fa-IR').format(Number(selectedInvoice.amount))} تومان
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">وضعیت:</span>
                  <span className="mr-2">{getStatusBadge(selectedInvoice.status)}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">تاریخ استفاده:</span>
                  <span className="mr-2 text-sm text-gray-900 dark:text-white">
                    {new Date(selectedInvoice.usageDate).toLocaleDateString('fa-IR')}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">تاریخ سررسید:</span>
                  <span className="mr-2 text-sm text-gray-900 dark:text-white">
                    {new Date(selectedInvoice.dueDate).toLocaleDateString('fa-IR')}
                  </span>
                </div>
                {selectedInvoice.notes && (
                  <div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">یادداشت:</span>
                    <p className="mr-2 text-sm text-gray-900 dark:text-white">
                      {selectedInvoice.notes}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-medium rounded-md"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}