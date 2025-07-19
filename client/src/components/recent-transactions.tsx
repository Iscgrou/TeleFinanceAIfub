import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function RecentTransactions() {
  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['/api/invoices'],
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/payments'],
  });

  const { data: representatives, isLoading: repsLoading } = useQuery({
    queryKey: ['/api/representatives'],
  });

  const isLoading = invoicesLoading || paymentsLoading || repsLoading;

  // Combine and format transactions
  const transactions = [];
  
  if (invoices && representatives) {
    invoices.forEach((invoice: any) => {
      const rep = representatives.find((r: any) => r.id === invoice.representativeId);
      transactions.push({
        id: invoice.id,
        type: 'invoice',
        representativeName: rep?.storeName || 'نامشخص',
        amount: parseFloat(invoice.amount).toLocaleString('fa-IR'),
        status: invoice.status,
        date: new Date(invoice.issueDate).toLocaleDateString('fa-IR')
      });
    });
  }

  if (payments && representatives) {
    payments.forEach((payment: any) => {
      const rep = representatives.find((r: any) => r.id === payment.representativeId);
      transactions.push({
        id: payment.id,
        type: 'payment',
        representativeName: rep?.storeName || 'نامشخص',
        amount: parseFloat(payment.amount).toLocaleString('fa-IR'),
        status: 'paid',
        date: new Date(payment.paymentDate).toLocaleDateString('fa-IR')
      });
    });
  }

  // Sort by date (most recent first)
  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusBadge = (status: string, type: string) => {
    if (type === 'payment') {
      return <Badge className="bg-green-100 text-green-800">پرداخت</Badge>;
    }
    
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">پرداخت شده</Badge>;
      case 'partially_paid':
        return <Badge className="bg-yellow-100 text-yellow-800">پرداخت جزئی</Badge>;
      case 'unpaid':
        return <Badge className="bg-red-100 text-red-800">پرداخت نشده</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'payment':
        return <Badge className="bg-green-100 text-green-800">پرداخت</Badge>;
      case 'invoice':
        return <Badge className="bg-orange-100 text-orange-800">فاکتور</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-right">آخرین تراکنش‌ها</CardTitle>
          <Button variant="ghost" className="text-blue-600 hover:bg-blue-50">
            مشاهده همه
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-right">نماینده</TableHead>
                  <TableHead className="text-right">نوع</TableHead>
                  <TableHead className="text-right">مبلغ</TableHead>
                  <TableHead className="text-right">وضعیت</TableHead>
                  <TableHead className="text-right">تاریخ</TableHead>
                  <TableHead className="text-right">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      هیچ تراکنشی یافت نشد
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.slice(0, 10).map((transaction) => (
                    <TableRow key={`${transaction.type}-${transaction.id}`}>
                      <TableCell className="text-right">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{transaction.representativeName}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {getTypeBadge(transaction.type)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-900">
                        {transaction.amount} تومان
                      </TableCell>
                      <TableCell className="text-right">
                        {getStatusBadge(transaction.status, transaction.type)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-500">
                        {transaction.date}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-900">
                          مشاهده
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 mr-2">
                          حذف
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
