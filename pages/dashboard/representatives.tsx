import { GetServerSideProps } from 'next'
import { useState } from 'react'
import DashboardLayout from '../../components/DashboardLayout'

interface Representative {
  id: number
  storeName: string
  ownerName: string
  panelUsername: string
  phoneNumber: string
  address: string
  totalDebt: string
  notes: string | null
  createdAt: string
}

interface RepresentativesPageProps {
  representatives: Representative[]
  totalPages: number
  currentPage: number
  search: string
}

export const getServerSideProps: GetServerSideProps<RepresentativesPageProps> = async (context) => {
  const { page = '1', search = '', sort = 'createdAt', order = 'desc' } = context.query
  
  try {
    const url = new URL('http://localhost:5000/api/representatives/paginated')
    url.searchParams.set('page', page as string)
    url.searchParams.set('pageSize', '20')
    url.searchParams.set('search', search as string)
    url.searchParams.set('sortBy', sort as string)
    url.searchParams.set('sortOrder', order as string)
    
    const res = await fetch(url.toString())
    const data = await res.json()
    
    return {
      props: {
        representatives: data.representatives || [],
        totalPages: data.totalPages || 1,
        currentPage: parseInt(page as string),
        search: search as string
      }
    }
  } catch (error) {
    console.error('Failed to fetch representatives:', error)
    return {
      props: {
        representatives: [],
        totalPages: 1,
        currentPage: 1,
        search: ''
      }
    }
  }
}

export default function RepresentativesPage({ representatives, totalPages, currentPage, search }: RepresentativesPageProps) {
  const [searchTerm, setSearchTerm] = useState(search)
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    window.location.href = `/dashboard/representatives?search=${encodeURIComponent(searchTerm)}`
  }
  
  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">نمایندگان</h1>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              لیست تمام نمایندگان و مدیریت اطلاعات آنها
            </p>
          </div>
          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
            >
              افزودن نماینده جدید
            </button>
          </div>
        </div>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mt-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="جستجو در نام فروشگاه، نام مالک یا نام کاربری..."
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            />
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              جستجو
            </button>
          </div>
        </form>
        
        {/* Representatives Table */}
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="py-3.5 pr-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        نام فروشگاه
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        نام مالک
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        نام کاربری
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        شماره تماس
                      </th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                        مجموع بدهی
                      </th>
                      <th scope="col" className="relative py-3.5 pl-3">
                        <span className="sr-only">ویرایش</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                    {representatives.map((rep) => (
                      <tr key={rep.id}>
                        <td className="whitespace-nowrap py-4 pr-3 text-sm font-medium text-gray-900 dark:text-white">
                          {rep.storeName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {rep.ownerName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          @{rep.panelUsername}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {rep.phoneNumber}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Intl.NumberFormat('fa-IR').format(Number(rep.totalDebt))} تومان
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 text-left text-sm font-medium">
                          <a href={`/dashboard/representatives/${rep.id}`} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
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
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex flex-1 justify-between sm:hidden">
              <a
                href={`/dashboard/representatives?page=${currentPage - 1}&search=${encodeURIComponent(searchTerm)}`}
                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
              >
                قبلی
              </a>
              <a
                href={`/dashboard/representatives?page=${currentPage + 1}&search=${encodeURIComponent(searchTerm)}`}
                className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
              >
                بعدی
              </a>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  صفحه <span className="font-medium">{currentPage}</span> از{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <a
                      key={page}
                      href={`/dashboard/representatives?page=${page}&search=${encodeURIComponent(searchTerm)}`}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        page === currentPage
                          ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-gray-800'
                      }`}
                    >
                      {page}
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}