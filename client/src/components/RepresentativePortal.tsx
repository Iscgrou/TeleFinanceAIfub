import { useState, useEffect } from 'react'
import { api } from '../utils/api'

interface Representative {
  id: number;
  storeName: string;
  ownerName: string | null;
  panelUsername: string;
  totalDebt: string;
  isActive: boolean;
  createdAt: string;
}

interface Invoice {
  id: number;
  representativeId: number;
  amount: string;
  status: string;
  createdAt: string;
  dueDate: string | null;
  usageJsonDetails?: any[];
  issueDate?: string;
}

interface InvoiceDetail {
  invoice: Invoice;
  lineItems: Array<{
    description: string;
    amount: number;
    date: string;
  }>;
}

interface InvoiceTemplate {
  id: number;
  name: string;
  headerTitle: string;
  headerSubtitle: string;
  footerText: string;
  footerContact: string;
  representativeLabel: string;
  invoiceLabel: string;
  lineItemLabel: string;
  totalLabel: string;
  payableLabel: string;
}

interface Payment {
  id: number;
  representativeId: number;
  amount: string;
  createdAt: string;
  description: string | null;
}

interface PortalTexts {
  welcome: string;
  debt_status: string;
  current_debt: string;
  last_payment: string;
  invoice_history: string;
  contact_support: string;
  payment_methods: string;
}

interface RepresentativePortalProps {
  username: string;
}

export default function RepresentativePortal({ username }: RepresentativePortalProps) {
  const [representative, setRepresentative] = useState<Representative | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [portalTexts, setPortalTexts] = useState<PortalTexts>({
    welcome: "به پرتال نماینده خوش آمدید",
    debt_status: "وضعیت بدهی شما",
    current_debt: "بدهی فعلی",
    last_payment: "آخرین پرداخت",
    invoice_history: "تاریخچه فاکتورها",
    contact_support: "تماس با پشتیبانی",
    payment_methods: "روش‌های پرداخت"
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDetail | null>(null);
  const [invoiceTemplate, setInvoiceTemplate] = useState<InvoiceTemplate | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    loadPortalData();
  }, [username]);

  const loadInvoiceDetails = async (invoiceId: number) => {
    try {
      const response = await api.get<InvoiceDetail>(`/api/invoices/${invoiceId}/detail`);
      setSelectedInvoice(response);
      setShowInvoiceModal(true);
    } catch (error) {
      console.error('Error loading invoice details:', error);
    }
  };

  const loadPortalData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load representative info
      const repResponse = await api.get<Representative>(`/api/representatives/by-username/${username}`);
      setRepresentative(repResponse);

      // Load invoices
      const invoicesResponse = await api.get<Invoice[]>(`/api/representatives/${repResponse.id}/invoices`);
      setInvoices(invoicesResponse);

      // Load payments
      const paymentsResponse = await api.get<Payment[]>(`/api/representatives/${repResponse.id}/payments`);
      setPayments(paymentsResponse);

      // Load portal texts
      try {
        const settingsResponse = await api.get<any>('/api/settings');
        if (settingsResponse?.representativePortalTexts) {
          const texts = JSON.parse(settingsResponse.representativePortalTexts);
          setPortalTexts({
            ...portalTexts,
            ...texts
          });
        }
      } catch (err) {
        console.log('Using default portal texts');
      }

      // Load invoice template
      try {
        const templateResponse = await api.get<{template: InvoiceTemplate}>('/api/invoice-templates/active');
        setInvoiceTemplate(templateResponse.template);
      } catch (err) {
        console.log('No active invoice template found, using defaults');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا در بارگذاری اطلاعات');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('fa-IR') + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const replaceVariables = (text: string) => {
    return text.replace(/\{\{storeName\}\}/g, representative?.storeName || '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">در حال بارگذاری پرتال...</p>
        </div>
      </div>
    );
  }

  if (error || !representative) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4 text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">نماینده یافت نشد</h2>
          <p className="text-gray-600 mb-4">نماینده‌ای با این نام کاربری وجود ندارد</p>
        </div>
      </div>
    );
  }

  const lastPayment = payments.length > 0 ? payments[0] : null;
  const unpaidInvoices = invoices.filter(invoice => invoice.status !== 'paid');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4 space-x-reverse">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-2xl">🏪</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{representative.storeName}</h1>
              <p className="text-gray-600">{replaceVariables(portalTexts.welcome)}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm mt-2 ${
                representative.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {representative.isActive ? 'فعال' : 'غیرفعال'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Debt Status */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{portalTexts.debt_status}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium">{portalTexts.current_debt}</p>
                    <p className="text-2xl font-bold text-red-700">
                      {formatCurrency(parseFloat(representative.totalDebt))}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 text-xl">💰</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">فاکتورهای معوق</p>
                    <p className="text-2xl font-bold text-blue-700">{unpaidInvoices.length.toLocaleString('fa-IR')}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-xl">📄</span>
                  </div>
                </div>
              </div>

              {lastPayment && (
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">{portalTexts.last_payment}</p>
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(parseFloat(lastPayment.amount))}
                      </p>
                      <p className="text-xs text-green-600">{formatDate(lastPayment.createdAt)}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-xl">✅</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Invoice History */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{portalTexts.invoice_history}</h2>
            {invoices.length > 0 ? (
              <div className="space-y-4">
                {invoices.slice(0, 10).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-bold">#{invoice.id}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">فاکتور #{invoice.id}</p>
                        <p className="text-sm text-gray-600">{formatDate(invoice.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="text-left">
                        <p className="font-bold text-lg text-gray-900">
                          {formatCurrency(parseFloat(invoice.amount))}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          invoice.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : invoice.status === 'partially_paid'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {invoice.status === 'paid' ? 'پرداخت شده' : 
                           invoice.status === 'partially_paid' ? 'نیمه پرداخت' : 'پرداخت نشده'}
                        </span>
                      </div>
                      <button
                        onClick={() => loadInvoiceDetails(invoice.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        مشاهده جزئیات
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📄</div>
                <p className="text-gray-600">هنوز فاکتوری ثبت نشده است</p>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">تاریخچه پرداخت‌ها</h2>
            {payments.length > 0 ? (
              <div className="space-y-4">
                {payments.slice(0, 10).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xl">💳</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">پرداخت #{payment.id}</p>
                        <p className="text-sm text-gray-600">{formatDate(payment.createdAt)}</p>
                        {payment.description && (
                          <p className="text-xs text-gray-500">{payment.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-lg text-green-700">
                        +{formatCurrency(parseFloat(payment.amount))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">💳</div>
                <p className="text-gray-600">هنوز پرداختی ثبت نشده است</p>
              </div>
            )}
          </div>

          {/* Contact Support */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{portalTexts.contact_support}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">📞 تماس تلفنی</h3>
                <p className="text-gray-600">۰۲۱-۱۲۳۴۵۶۷۸</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">💬 پشتیبانی آنلاین</h3>
                <p className="text-gray-600">ساعت ۹ تا ۱۸ روزهای کاری</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Invoice Details Modal */}
      {showInvoiceModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">
                    {invoiceTemplate?.headerTitle || 'فاکتور فروش'}
                  </h2>
                  <p className="text-blue-100">
                    {invoiceTemplate?.headerSubtitle || 'سرویس پروکسی پرسرعت'}
                  </p>
                </div>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-white hover:text-blue-200 text-2xl font-bold p-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
              <div className="space-y-8">
                {/* Invoice Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Representative Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      {invoiceTemplate?.representativeLabel || 'اطلاعات نماینده'}
                    </h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">نام فروشگاه:</span> {representative?.storeName}</p>
                      <p><span className="font-medium">نام کاربری:</span> {representative?.panelUsername}</p>
                      {representative?.ownerName && (
                        <p><span className="font-medium">مالک:</span> {representative.ownerName}</p>
                      )}
                    </div>
                  </div>

                  {/* Invoice Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      {invoiceTemplate?.invoiceLabel || 'اطلاعات فاکتور'}
                    </h3>
                    <div className="space-y-2">
                      <p><span className="font-medium">شماره فاکتور:</span> #{selectedInvoice.invoice.id}</p>
                      <p><span className="font-medium">تاریخ صدور:</span> {formatDate(selectedInvoice.invoice.issueDate || selectedInvoice.invoice.createdAt)}</p>
                      <p><span className="font-medium">وضعیت:</span> 
                        <span className={`mr-2 px-2 py-1 rounded-full text-xs ${
                          selectedInvoice.invoice.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : selectedInvoice.invoice.status === 'partially_paid'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {selectedInvoice.invoice.status === 'paid' ? 'پرداخت شده' : 
                           selectedInvoice.invoice.status === 'partially_paid' ? 'نیمه پرداخت' : 'پرداخت نشده'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {invoiceTemplate?.lineItemLabel || 'شرح خدمات'}
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 grid grid-cols-4 text-sm font-medium text-gray-700">
                      <div className="col-span-2">شرح</div>
                      <div>تاریخ</div>
                      <div className="text-left">مبلغ</div>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {selectedInvoice.lineItems.map((item, index) => (
                        <div key={index} className="px-4 py-3 grid grid-cols-4 text-sm">
                          <div className="col-span-2 text-gray-900">{item.description}</div>
                          <div className="text-gray-600">{formatDate(item.date)}</div>
                          <div className="text-left font-medium text-gray-900">
                            {formatCurrency(item.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-blue-900">
                      {invoiceTemplate?.totalLabel || 'جمع کل'}:
                    </span>
                    <span className="text-2xl font-bold text-blue-900">
                      {formatCurrency(parseFloat(selectedInvoice.invoice.amount))}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t pt-6 text-center text-gray-600 space-y-2">
                  <p className="text-sm">
                    {invoiceTemplate?.footerText || 'این فاکتور به صورت خودکار توسط سیستم مدیریت مالی تولید شده است'}
                  </p>
                  <p className="text-sm">
                    {invoiceTemplate?.footerContact || 'در صورت هرگونه سوال با پشتیبانی تماس بگیرید'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}