'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, DollarSign, Search, FileText, CheckCircle, RefreshCw, Filter, X, Download } from 'lucide-react';
import { api } from '@/lib/api/axios';
import { formatCurrency, formatDate } from '@gms/utils';
import { PaymentStatus } from '@gms/types';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const memberIdFilter = searchParams.get('memberId');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  const { data: paymentsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const res = await api.get('/payments');
      return res.data;
    },
  });

  const payments = Array.isArray(paymentsData?.data) ? paymentsData.data : (Array.isArray(paymentsData) ? paymentsData : []);

  const updatePaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...rest } = data;
      const res = await api.patch(`/payments/${id}`, rest);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: 'Payment Updated', description: 'Invoice has been updated.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      if (selectedInvoice?.memberId) queryClient.invalidateQueries({ queryKey: ['member', selectedInvoice.memberId] });
      closePaymentDialog();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update payment.', variant: 'destructive' });
    }
  });

  const filteredPayments = payments.filter((payment: any) => {
    let matches = true;
    if (memberIdFilter && payment.memberId !== memberIdFilter) matches = false;
    if (statusFilter !== 'ALL' && payment.paymentStatus !== statusFilter) {
      matches = false;
    }
    if (search) {
      const s = search.toLowerCase();
      const memberName = `${payment.member?.firstName} ${payment.member?.lastName}`.toLowerCase();
      const invoiceNo = payment.invoiceNumber?.toLowerCase() || '';
      if (!memberName.includes(s) && !invoiceNo.includes(s)) {
        matches = false;
      }
    }
    return matches;
  });

  // Calculate KPIs
  const totalRevenue = payments.reduce((sum: number, p: any) => sum + Number(p.totalAmount || 0), 0);
  const totalReceived = payments.reduce((sum: number, p: any) => sum + Number(p.paidAmount || 0), 0);
  const outstandingDues = payments.reduce((sum: number, p: any) => sum + Number(p.remainingDue || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <Badge variant="success" className="bg-emerald-500/15 text-emerald-500 border-transparent">Paid</Badge>;
      case 'PENDING': return <Badge variant="warning" className="bg-amber-500/15 text-amber-500 border-transparent">Pending</Badge>;
      case 'PARTIAL': return <Badge variant="outline" className="border-blue-500 text-blue-500 bg-blue-500/10">Partial</Badge>;
      case 'OVERDUE': return <Badge variant="destructive" className="bg-rose-500/15 text-rose-500 border-transparent">Overdue</Badge>;
      default: return <Badge variant="secondary" className="bg-slate-800 text-slate-400">{status}</Badge>;
    }
  };

  const openPaymentDialog = (invoice: any) => {
    setSelectedInvoice(invoice);
    setPaymentAmount(Number(invoice.remainingDue));
    setShowPaymentDialog(true);
  };

  const closePaymentDialog = () => {
    setShowPaymentDialog(false);
    setSelectedInvoice(null);
    setPaymentAmount(0);
  };

  const handleProcessPayment = () => {
    if (!selectedInvoice) return;
    updatePaymentMutation.mutate({
      id: selectedInvoice.id,
      paidAmount: paymentAmount,
    });
  };

  const exportToExcel = () => {
    if (!filteredPayments.length) return;

    const exportData = filteredPayments.map((p: any) => ({
      'Invoice No': p.invoiceNumber,
      'Member Name': `${p.member?.firstName} ${p.member?.lastName}`,
      'Total Amount': p.totalAmount,
      'Paid': p.paidAmount,
      'Due': p.remainingDue,
      'Status': p.paymentStatus,
      'Date': new Date(p.createdAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
    XLSX.writeFile(workbook, `Invoices_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Payments & Invoices</h1>
          <p className="text-slate-400">Track revenue, process payments, and manage outstanding dues.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:text-white gap-2"
            onClick={exportToExcel}
            disabled={filteredPayments.length === 0}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            className="border-slate-700 text-slate-300 hover:text-white gap-2"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-emerald-500/10 p-2.5">
                <DollarSign className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalReceived)}</p>
                <p className="text-xs text-slate-400">Total Received</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-rose-500/10 p-2.5">
                <CreditCard className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatCurrency(outstandingDues)}</p>
                <p className="text-xs text-slate-400">Outstanding Dues</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-cyan-500/10 p-2.5">
                <FileText className="h-5 w-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatCurrency(totalRevenue)}</p>
                <p className="text-xs text-slate-400">Total Billed</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters & Table */}
      <Card className="border-slate-800 bg-slate-900/50">
        <div className="flex flex-col gap-4 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-cyan-500" />
            <h3 className="text-sm font-semibold text-white">Filters</h3>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Search member or invoice..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 h-9 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-full sm:w-40 border-slate-800 bg-slate-950 text-slate-300 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
            {(search || statusFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-slate-400 hover:text-white shrink-0"
                onClick={() => { setSearch(''); setStatusFilter('ALL'); }}
                title="Clear Filters"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-slate-800/50">
              <TableHead>Invoice</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Go to Member</TableHead>
              <TableHead>Billed Date</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead className="text-right">Balance Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                  No invoices found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((p: any) => (
                <TableRow key={p.id} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="font-mono text-xs text-slate-400">
                    {p.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-white">
                      {p.member?.firstName} {p.member?.lastName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link href={`/members/${p.memberId}`} className="text-sm text-cyan-500 hover:text-cyan-400 hover:underline">
                      View member
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-300 text-sm">
                    {formatDate(p.createdAt)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-200">
                    {formatCurrency(p.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right font-mono font-medium text-rose-400">
                    {formatCurrency(p.remainingDue)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(p.paymentStatus)}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.paymentStatus !== 'PAID' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500"
                        onClick={() => openPaymentDialog(p)}
                      >
                        Process Pay
                      </Button>
                    ) : (
                      <CheckCircle className="h-5 w-5 text-emerald-500 ml-auto mr-3" />
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="p-4 border-t border-slate-800 bg-slate-900/30">
          <p className="text-xs text-slate-500 text-right">
            Showing {filteredPayments.length} records
          </p>
        </div>
      </Card>

      {/* Payment Processing Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={(open) => !open && closePaymentDialog()}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription className="text-slate-400">
              Record a payment for invoice <span className="font-mono text-slate-300">{selectedInvoice?.invoiceNumber}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center p-3 rounded-md bg-slate-950 border border-slate-800">
              <span className="text-sm text-slate-400">Total Billed</span>
              <span className="font-mono">{formatCurrency(selectedInvoice?.totalAmount || 0)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-md bg-slate-950 border border-slate-800">
              <span className="text-sm text-slate-400">Already Paid</span>
              <span className="font-mono text-emerald-400">{formatCurrency(selectedInvoice?.paidAmount || 0)}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-md bg-rose-500/10 border border-rose-500/20">
              <span className="text-sm font-medium text-rose-400">Remaining Due</span>
              <span className="font-mono font-bold text-rose-400">{formatCurrency(selectedInvoice?.remainingDue || 0)}</span>
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-slate-300">Payment Amount (Rs.) *</Label>
              <Input
                type="number"
                min="0"
                max={selectedInvoice?.remainingDue || 0}
                className="bg-slate-950 border-slate-800 focus-visible:ring-emerald-500"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
              />
              <p className="text-xs text-slate-500">Enter the amount received from the member.</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-4">
            <Button variant="outline" onClick={closePaymentDialog} className="border-slate-700 hover:bg-slate-800 text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayment}
              disabled={updatePaymentMutation.isPending || paymentAmount <= 0 || paymentAmount > (selectedInvoice?.remainingDue || 0)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              {updatePaymentMutation.isPending ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
