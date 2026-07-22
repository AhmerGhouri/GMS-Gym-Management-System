'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit2, Mail, Phone, MapPin, Calendar, CreditCard, Shield, Loader2 } from 'lucide-react';

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
  const memberId = params.id as string;
  const queryClient = useQueryClient();

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAssigning, setIsAssigning] = useState(false);

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
  const plans = plansData?.data || [];

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      const res = await api.get('/attendance');
      return res.data;
    },
  });
  const attendance = (attendanceData?.data || []).filter((a: any) => a.memberId === memberId);

  const { data: paymentsData } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const res = await api.get('/payments');
      return res.data;
    },
  });
  const payments = (paymentsData?.data || []).filter((p: any) => p.memberId === memberId);

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
      });
      toast({
        title: 'Plan Assigned',
        description: 'Membership plan has been assigned successfully.',
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['member', memberId] });
      queryClient.invalidateQueries({ queryKey: ['memberships'] });
      setShowAssignDialog(false);
      setSelectedPlanId('');
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
      case 'FROZEN': return <Badge className="border-transparent bg-blue-500/15 text-blue-500">Frozen</Badge>;
      case 'SUSPENDED': return <Badge variant="warning">Suspended</Badge>;
      case 'CANCELLED': return <Badge variant="destructive">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID': return <Badge variant="success">Paid</Badge>;
      case 'PARTIAL': return <Badge variant="warning">Partial</Badge>;
      case 'PENDING': return <Badge className="border-transparent bg-amber-500/15 text-amber-500">Pending</Badge>;
      case 'REFUNDED': return <Badge variant="secondary">Refunded</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoadingMember) {
    return <div className="text-white">Loading member details...</div>;
  }

  if (!member) {
    return <div className="text-white">Member not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/members">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg">
                {member.firstName[0]}{member.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  {member.firstName} {member.lastName}
                </h1>
                {getStatusBadge(member.status)}
              </div>
              <p className="text-sm text-slate-400">{member.memberId} • Joined {formatDate(member.joiningDate)}</p>
            </div>
          </div>
        </div>
        <Link href={`/members/${memberId}/edit`}>
          <Button className="bg-cyan-600 text-white hover:bg-cyan-500">
            <Edit2 className="mr-2 h-4 w-4" /> Edit Member
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="membership">Membership</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="border-slate-800 bg-slate-900/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white">Personal Information</CardTitle>
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
              <Card className="border-slate-800 bg-slate-900/50">
                <CardHeader>
                  <CardTitle className="text-white">Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-300">{formatPhone(member.phone)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-300">{member.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                    <span className="text-slate-300">{member.address || 'N/A'}</span>
                  </div>
                  <Separator className="bg-slate-800" />
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-400">Emergency:</span>
                    <span className="text-slate-300">{member.emergencyContact ? formatPhone(member.emergencyContact) : 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>

              {member.notes && (
                <Card className="border-slate-800 bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-white">Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-400">{member.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Membership Tab */}
        <TabsContent value="membership">
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white">Membership History</CardTitle>
              <Button
                className="bg-cyan-600 text-white hover:bg-cyan-500"
                size="sm"
                onClick={() => setShowAssignDialog(true)}
              >
                <CreditCard className="mr-2 h-4 w-4" /> Assign Plan
              </Button>
            </CardHeader>
            <CardContent>
              {memberships.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No memberships assigned yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberships.map((ms: any) => (
                      <TableRow key={ms.id}>
                        <TableCell className="text-white font-medium">{ms.plan?.name || 'N/A'}</TableCell>
                        <TableCell className="text-slate-300">{formatDate(ms.startDate)}</TableCell>
                        <TableCell className="text-slate-300">{formatDate(ms.endDate)}</TableCell>
                        <TableCell>{getMembershipStatusBadge(ms.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance">
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No attendance records found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendance.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-white">{formatDate(log.checkIn)}</TableCell>
                        <TableCell className="text-slate-300">
                          {new Date(log.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {log.checkOut
                            ? new Date(log.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </TableCell>
                        <TableCell className="text-slate-300">{log.duration ? formatDuration(log.duration) : '—'}</TableCell>
                        <TableCell>
                          <Badge variant={log.source === 'Device' ? 'default' : 'outline'} className={log.source === 'Device' ? 'bg-cyan-500/15 text-cyan-500 border-transparent' : ''}>
                            {log.source}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="py-8 text-center text-slate-500">No payment records found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell className="text-white font-mono text-xs">{payment.invoiceNumber}</TableCell>
                        <TableCell className="text-slate-300">{formatCurrency(payment.totalAmount)}</TableCell>
                        <TableCell className="text-emerald-400">{formatCurrency(payment.paidAmount)}</TableCell>
                        <TableCell className={payment.remainingDue > 0 ? 'text-rose-400' : 'text-slate-500'}>
                          {formatCurrency(payment.remainingDue)}
                        </TableCell>
                        <TableCell className="text-slate-300">{payment.paymentMethod}</TableCell>
                        <TableCell>{getPaymentStatusBadge(payment.paymentStatus)}</TableCell>
                        <TableCell className="text-slate-300">{formatDate(payment.paidAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Membership Plan</DialogTitle>
            <DialogDescription>
              Select a plan to assign to {member.firstName} {member.lastName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Membership Plan *</Label>
              <Select onValueChange={setSelectedPlanId} value={selectedPlanId}>
                <SelectTrigger>
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
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignPlan}
                disabled={isAssigning || !selectedPlanId}
                className="bg-cyan-600 hover:bg-cyan-500"
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
    <div>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm text-white">{value}</p>
    </div>
  );
}
