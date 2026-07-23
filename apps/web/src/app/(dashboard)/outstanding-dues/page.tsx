'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate } from '@gms/utils';

export default function OutstandingDuesPage() {
  const { data, isLoading } = useQuery({ queryKey: ['payments', 'outstanding-dues'], queryFn: async () => (await api.get('/payments')).data });
  const payments = (data?.data || []).filter((payment: any) => Number(payment.remainingDue) > 0 && payment.paymentStatus !== 'REFUNDED');
  const total = payments.reduce((sum: number, payment: any) => sum + Number(payment.remainingDue), 0);
  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold text-white">Outstanding Dues</h1><p className="text-slate-400">All unpaid and partially paid membership invoices.</p></div>
    <Card className="border-slate-800 bg-slate-900/50"><CardHeader><CardTitle className="text-rose-400">{formatCurrency(total)}</CardTitle></CardHeader></Card>
    <Card className="border-slate-800 bg-slate-900/50"><CardContent className="pt-6"><Table><TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Invoice</TableHead><TableHead>Due</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>{isLoading ? <TableRow><TableCell colSpan={4}>Loading…</TableCell></TableRow> : payments.map((payment: any) => <TableRow key={payment.id}><TableCell>{payment.member?.firstName} {payment.member?.lastName}</TableCell><TableCell>{payment.invoiceNumber}</TableCell><TableCell className="text-rose-400">{formatCurrency(payment.remainingDue)}</TableCell><TableCell>{formatDate(payment.paidAt)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
  </div>;
}
