'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@gms/utils';

export default function MonthlyRevenuePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['payments', 'monthly-revenue'],
    queryFn: async () => (await api.get('/payments')).data,
  });
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const payments = (data?.data || []).filter((payment: any) =>
    new Date(payment.paidAt) >= monthStart && ['PAID', 'PARTIAL'].includes(payment.paymentStatus),
  );
  const total = payments.reduce((sum: number, payment: any) => sum + Number(payment.paidAmount), 0);

  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold text-white">Monthly Revenue</h1><p className="text-slate-400">Payments received in the current calendar month.</p></div>
    <Card className="border-slate-800 bg-slate-900/50"><CardHeader><CardTitle className="text-white">{formatCurrency(total)}</CardTitle></CardHeader></Card>
    <Card className="border-slate-800 bg-slate-900/50"><CardContent className="pt-6"><Table><TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Invoice</TableHead><TableHead>Paid</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>{isLoading ? <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow> : payments.map((payment: any) => <TableRow key={payment.id}><TableCell>{payment.member?.firstName} {payment.member?.lastName}</TableCell><TableCell>{payment.invoiceNumber}</TableCell><TableCell className="text-emerald-400">{formatCurrency(payment.paidAmount)}</TableCell><TableCell>{formatDate(payment.paidAt)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
  </div>;
}
