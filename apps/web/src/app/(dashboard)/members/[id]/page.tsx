'use client';

import { useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit2, Mail, Phone, MapPin, Calendar, CreditCard, Shield, Loader2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api/axios';
import { formatDate, formatDateTime, formatCurrency, formatPhone, formatDuration } from '@gms/utils';
import { MemberStatus, MembershipStatus, PaymentStatus } from '@gms/types';

export default function MemberDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const memberId = params.id as string;
  const initialTab = searchParams.get('tab') === 'membership' ? 'membership' : 'profile';
  const queryClient = useQueryClient();

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [includeAdmissionFee, setIncludeAdmissionFee] = useState(false);

  const { data: memberData, isLoading: isLoadingMember } = useQuery({
    queryKey: ['member', memberId],
    queryFn: async () => {
      const res = await api.get(`/members/${memberId}`);
      return res.data;
    },
  });

  const member = memberData?.data;
  const memberships = member?.memberships || [];

  const { data: plansData } = useQuery({
    queryKey: ['membership-plans'],
    queryFn: async () => {
      const res = await api.get('/memberships/plans');
      return res.data;
    },
  });
  const plans = (plansData?.data || []).filter((plan: any) => plan.isActive);

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance', 'member', memberId],
    queryFn: async () => {
      const res = await api.get(`/attendance/member/${memberId}?take=30`);
      return res.data;
    },
  });
  const attendance = Array.isArray(attendanceData) ? attendanceData : (attendanceData?.data || []);

  const { data: paymentsData } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const res = await api.get('/payments');
      return res.data;
    },
  });
  const payments = (paymentsData?.data || []).filter((p: any) => p.memberId === memberId);

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });
  const settingsArray = settingsData?.data || [];
  const getSetting = (key: string) => settingsArray.find((s: any) => s.key === key)?.value || '';

  const handleAssignPlan = async () => {
    if (!selectedPlanId) {
      toast({ title: 'Error', description: 'Please select a plan.', variant: 'destructive' });
      return;
    }
    setIsAssigning(true);
    try {
      await api.post('/memberships', {
        memberId,
        planId: selectedPlanId,
        startDate: startDate || undefined,
        includeAdmissionFee,
      });
      toast({
        title: 'Plan Assigned',
        description: 'Membership plan has been assigned successfully.',
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['member', memberId] });
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setShowAssignDialog(false);
      setSelectedPlanId('');
      setIncludeAdmissionFee(false);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to assign plan.',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const markPaymentPaid = async (paymentId: string) => {
    try {
      await api.patch(`/payments/${paymentId}`, { paymentStatus: 'PAID' });
      toast({ title: 'Payment Updated', description: 'Payment has been marked as paid.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['member', memberId] });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Unable to update payment.', variant: 'destructive' });
    }
  };

  const printInvoice = (payment: any) => {
    const gymName = getSetting('GYM_NAME') || 'GMS Fitness';
    const gymAddress = getSetting('GYM_ADDRESS') || '123 Fitness Street, Gym City';
    const gymPhone = getSetting('GYM_PHONE') || '+1 234 567 890';
    const gymEmail = getSetting('GYM_EMAIL') || 'contact@gmsfitness.com';

    const status = payment.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID';
    const popup = window.open('', '_blank');
    if (!popup) return;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${payment.invoiceNumber}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
          .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; box-shadow: 0 0 10px rgba(0, 0, 0, 0.05); }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #06b6d4; padding-bottom: 20px; }
          .brand h1 { margin: 0; color: #06b6d4; font-size: 28px; text-transform: uppercase; letter-spacing: 1px; }
          .brand p { margin: 5px 0 0; color: #64748b; font-size: 14px; }
          .details { text-align: right; }
          .details h2 { margin: 0; color: #334155; font-size: 24px; text-transform: uppercase; }
          .details p { margin: 5px 0; color: #64748b; font-size: 14px; }
          .status { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 12px; margin-top: 10px; }
          .status.paid { background-color: #d1fae5; color: #059669; }
          .status.unpaid { background-color: #fee2e2; color: #dc2626; }
          .info-section { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .bill-to h3 { margin: 0 0 10px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
          .bill-to p { margin: 0 0 5px; font-size: 14px; font-weight: 500; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          .table th { padding: 12px; border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; }
          .table td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .table td.amount { text-align: right; font-family: monospace; font-size: 15px; }
          .table th.amount { text-align: right; }
          .summary { width: 300px; margin-left: auto; margin-bottom: 40px; }
          .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
          .summary-row.total { font-weight: bold; font-size: 18px; border-bottom: none; border-top: 2px solid #334155; margin-top: 10px; padding-top: 15px; }
          .summary-row .amount { font-family: monospace; }
          .footer { text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          @media print {
            body { padding: 0; }
            .invoice-box { box-shadow: none; border: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div class="brand">
              <h1>${gymName}</h1>
              <p>${gymAddress}</p>
              <p>${gymPhone} | ${gymEmail}</p>
            </div>
            <div class="details">
              <h2>INVOICE</h2>
              <p># ${payment.invoiceNumber}</p>
              <p>Date: ${new Date(payment.createdAt).toLocaleDateString()}</p>
              <div class="status ${status.toLowerCase()}">${status}</div>
            </div>
          </div>
          
          <div class="info-section">
            <div class="bill-to">
              <h3>Billed To</h3>
              <p>${member.firstName} ${member.lastName}</p>
              <p>Member ID: ${member.memberId}</p>
              <p>Phone: ${member.phone}</p>
              <p>CNIC: ${member.cnic || 'N/A'}</p>
            </div>
            <div class="bill-to" style="text-align: right;">
              <h3>Payment Method</h3>
              <p>${payment.paymentMethod || 'N/A'}</p>
              ${payment.paidAt ? `<p>Paid on: ${new Date(payment.paidAt).toLocaleDateString()}</p>` : ''}
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th class="amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Membership Fee (${payment.membership?.plan?.name || 'Plan'})</td>
                <td class="amount">${formatCurrency(payment.totalAmount - (payment.admissionFee || 0))}</td>
              </tr>
              ${payment.admissionFee > 0 ? `
              <tr>
                <td>Admission Fee</td>
                <td class="amount">${formatCurrency(payment.admissionFee)}</td>
              </tr>
              ` : ''}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <span>Subtotal</span>
              <span class="amount">${formatCurrency(payment.totalAmount)}</span>
            </div>
            <div class="summary-row" style="color: #059669;">
              <span>Amount Paid</span>
              <span class="amount">${formatCurrency(payment.paidAmount)}</span>
            </div>
            <div class="summary-row total">
              <span>Balance Due</span>
              <span class="amount">${formatCurrency(payment.remainingDue)}</span>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for choosing ${gymName}!</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;
    
    popup.document.write(html);
    popup.document.close();
  };

  const getStatusBadge = (status: MemberStatus) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="success">Active</Badge>;
      case 'INACTIVE': return <Badge variant="secondary">Inactive</Badge>;
      case 'SUSPENDED': return <Badge variant="warning">Suspended</Badge>;
      case 'DELETED': return <Badge variant="destructive">Deleted</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMembershipStatusBadge = (status: MembershipStatus) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="success">Active</Badge>;
      case 'EXPIRED': return <Badge variant="secondary">Expired</Badge>;
      case 'FROZEN': return <Badge className="border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-500">Frozen</Badge>;
      case 'SUSPENDED': return <Badge variant="warning">Suspended</Badge>;
      case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID': return <Badge variant="success">Paid</Badge>;
      case 'PARTIAL': return <Badge variant="warning">Partial</Badge>;
      case 'PENDING': return <Badge className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-500">Pending</Badge>;
      case 'REFUNDED': return <Badge variant="secondary">Refunded</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoadingMember) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-600 dark:text-cyan-500" />
          Loading member details...
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-4">
        <div className="text-xl font-medium text-slate-900 dark:text-white">Member not found</div>
        <Link href="/members">
          <Button variant="outline">Back to Members</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div 
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-4">
          <Link href="/members">
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-white dark:border-slate-800 shadow-sm">
              <AvatarFallback className="text-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400">
                {member.firstName[0]}{member.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {member.firstName} {member.lastName}
                </h1>
                {getStatusBadge(member.status)}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {member.memberId} <span className="mx-1">•</span> Joined {formatDate(member.joiningDate)}
              </p>
            </div>
          </div>
        </div>
        <Link href={`/members/${memberId}/edit`}>
          <Button className="bg-cyan-600 text-white hover:bg-cyan-500 shadow-md transition-all w-full sm:w-auto">
            <Edit2 className="mr-2 h-4 w-4" /> Edit Member
          </Button>
        </Link>
      </motion.div>

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList className="bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg">
          <TabsTrigger value="profile" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Profile</TabsTrigger>
          <TabsTrigger value="membership" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Membership</TabsTrigger>
          <TabsTrigger value="attendance" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Attendance</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Payments</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" asChild>
          <motion.div 
            className="grid gap-6 lg:grid-cols-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoField label="Full Name" value={`${member.firstName} ${member.lastName}`} />
                  <InfoField label="Father's Name" value={member.fatherName || 'N/A'} />
                  <InfoField label="Gender" value={member.gender} />
                  <InfoField label="Date of Birth" value={member.dateOfBirth ? formatDate(member.dateOfBirth) : 'N/A'} />
                  <InfoField label="CNIC" value={member.cnic || 'N/A'} />
                  <InfoField label="Member ID" value={member.memberId} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-700 dark:text-slate-300">{formatPhone(member.phone)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-700 dark:text-slate-300">{member.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300">{member.address || 'N/A'}</span>
                  </div>
                  <Separator className="bg-slate-200 dark:bg-slate-800 my-3" />
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Emergency:</span>
                    <span className="text-slate-700 dark:text-slate-300">{member.emergencyContact ? formatPhone(member.emergencyContact) : 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>

              {member.notes && (
                <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{member.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        </TabsContent>

        {/* Membership Tab */}
        <TabsContent value="membership" asChild>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-slate-900 dark:text-white">Membership History</CardTitle>
                <Button
                  className="bg-cyan-600 text-white hover:bg-cyan-500 transition-all shadow-sm w-full sm:w-auto"
                  size="sm"
                  onClick={() => setShowAssignDialog(true)}
                >
                  <CreditCard className="mr-2 h-4 w-4" /> Assign Plan
                </Button>
              </CardHeader>
              <CardContent>
                {memberships.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <CreditCard className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No memberships assigned yet.</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Assign a plan to start billing this member.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200 dark:border-slate-800">
                          <TableHead className="text-slate-600 dark:text-slate-400">Plan</TableHead>
                          <TableHead className="text-slate-600 dark:text-slate-400">Start Date</TableHead>
                          <TableHead className="text-slate-600 dark:text-slate-400">End Date</TableHead>
                          <TableHead className="text-slate-600 dark:text-slate-400">Status</TableHead>
                          <TableHead className="text-slate-600 dark:text-slate-400">Payment</TableHead>
                          <TableHead className="text-right text-slate-600 dark:text-slate-400">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {memberships.map((ms: any) => (
                          <TableRow key={ms.id} className="border-slate-200 dark:border-slate-800">
                            <TableCell className="text-slate-900 dark:text-white font-medium">{ms.plan?.name || 'N/A'}</TableCell>
                            <TableCell className="text-slate-700 dark:text-slate-300">{formatDate(ms.startDate)}</TableCell>
                            <TableCell className="text-slate-700 dark:text-slate-300">{formatDate(ms.endDate)}</TableCell>
                            <TableCell>{getMembershipStatusBadge(ms.status)}</TableCell>
                            <TableCell>
                              {ms.payments?.some((payment: any) => payment.paymentStatus === 'PAID') ? (
                                <Badge variant="success">Paid</Badge>
                              ) : ms.status === 'EXPIRED' ? (
                                <Badge variant="destructive">Unpaid</Badge>
                              ) : (
                                <Badge variant="outline">Not due</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {ms.status === 'ACTIVE' ? (
                                <Button size="sm" variant="outline" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300" onClick={async () => {
                                  try { await api.patch(`/memberships/${ms.id}`, { status: 'INACTIVE' }); queryClient.invalidateQueries({ queryKey: ['member', memberId] }); toast({ title: 'Membership Inactivated', description: 'You can now assign a different plan.', variant: 'success' }); }
                                  catch (err: any) { toast({ title: 'Error', description: err.response?.data?.message || 'Unable to update membership.', variant: 'destructive' }); }
                                }}>Inactivate</Button>
                              ) : (
                                <Button size="sm" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200" onClick={() => toast({ title: 'Payment required', description: 'Mark the pending voucher paid from the Payments tab to activate this membership.', variant: 'destructive' })}>Activate</Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" asChild>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="h-5 w-5 text-cyan-600 dark:text-cyan-500" />
                    Attendance History
                  </CardTitle>
                  <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
                    {attendance.length} records
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center">
                    <Clock className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No attendance records yet.</p>
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Records appear after the member scans at the ZKTeco device.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200 dark:border-slate-800">
                          <TableHead className="text-slate-600 dark:text-slate-400">Date</TableHead>
                          <TableHead className="text-slate-600 dark:text-slate-400">Check In</TableHead>
                          <TableHead className="text-slate-600 dark:text-slate-400">Check Out</TableHead>
                          <TableHead className="text-slate-600 dark:text-slate-400">Duration</TableHead>
                          <TableHead className="text-slate-600 dark:text-slate-400">Device</TableHead>
                          <TableHead className="text-slate-600 dark:text-slate-400">Source</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attendance.map((log: any) => (
                          <TableRow key={log.id} className="border-slate-200 dark:border-slate-800">
                            <TableCell className="text-slate-900 dark:text-white font-medium">{formatDate(log.checkIn)}</TableCell>
                            <TableCell className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                              {new Date(log.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                            <TableCell className="text-blue-600 dark:text-blue-400 font-mono text-sm">
                              {log.checkOut
                                ? new Date(log.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                : <span className="text-slate-400 dark:text-slate-600">—</span>}
                            </TableCell>
                            <TableCell className="text-slate-700 dark:text-slate-300">{log.duration ? formatDuration(log.duration) : '—'}</TableCell>
                            <TableCell className="text-slate-500 dark:text-slate-400 text-xs">{log.device?.name ?? '—'}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  log.source === 'DEVICE'
                                    ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400 border-transparent'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700/30 dark:text-slate-400 border-transparent'
                                }
                              >
                                {log.source}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" asChild>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-white">Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center">
                    <CreditCard className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No payment records found.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-200 dark:border-slate-800">
                          <TableHead className="text-slate-600 dark:text-slate-400">Invoice</TableHead>
                          <TableHead className="text-slate-600 dark:text-slate-400">Amount</TableHead>
                          <TableHead className="text-slate-600 dark:text-slate-400">Paid</TableHead>
                          <TableHead className="text-slate-600 dark:text-slate-400">Due</TableHead>
                          <TableHead className="text-slate-600 dark:text-slate-400">Method</TableHead>
                          <TableHead className="text-slate-600 dark:text-slate-400">Status</TableHead>
                          <TableHead className="text-slate-600 dark:text-slate-400">Date</TableHead>
                          <TableHead className="text-right text-slate-600 dark:text-slate-400">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment: any) => (
                          <TableRow key={payment.id} className="border-slate-200 dark:border-slate-800">
                            <TableCell className="text-slate-900 dark:text-white font-mono text-xs font-medium">{payment.invoiceNumber}</TableCell>
                            <TableCell className="text-slate-700 dark:text-slate-300">{formatCurrency(payment.totalAmount)}</TableCell>
                            <TableCell className="text-emerald-600 dark:text-emerald-400 font-medium">{formatCurrency(payment.paidAmount)}</TableCell>
                            <TableCell className={payment.remainingDue > 0 ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-slate-500 dark:text-slate-500'}>
                              {formatCurrency(payment.remainingDue)}
                            </TableCell>
                            <TableCell className="text-slate-700 dark:text-slate-300">{payment.paymentMethod}</TableCell>
                            <TableCell>{getPaymentStatusBadge(payment.paymentStatus)}</TableCell>
                            <TableCell className="text-slate-700 dark:text-slate-300">{formatDate(payment.paidAt)}</TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline" className="mr-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => printInvoice(payment)}>Invoice</Button>
                              {payment.paymentStatus !== 'PAID' && payment.paymentStatus !== 'REFUNDED' && (
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm" onClick={() => markPaymentPaid(payment.id)}>
                                  Mark Paid
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Assign Plan Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={(open) => {
        setShowAssignDialog(open);
        if (!open) {
          setSelectedPlanId('');
          setStartDate(new Date().toISOString().split('T')[0]);
        }
      }}>
        <DialogContent className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white text-xl">Assign Membership Plan</DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              Select a plan to assign to <span className="font-medium text-slate-700 dark:text-slate-300">{member.firstName} {member.lastName}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Membership Plan *</Label>
              <Select onValueChange={setSelectedPlanId} value={selectedPlanId}>
                <SelectTrigger className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan: any) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} — {formatCurrency(plan.price)} / {plan.durationDays} days
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer pt-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                checked={includeAdmissionFee}
                onChange={(event) => setIncludeAdmissionFee(event.target.checked)}
              />
              Apply the plan&apos;s admission fee
            </label>
            <div className="flex justify-end gap-3 pt-6">
              <Button type="button" variant="outline" onClick={() => setShowAssignDialog(false)} className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                Cancel
              </Button>
              <Button
                onClick={handleAssignPlan}
                disabled={isAssigning || !selectedPlanId}
                className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm"
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Assign Plan
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800/50">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
