'use client';

import { useState } from 'react';
import { Plus, CreditCard, Clock, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { mockPlans, mockMemberships } from '@/lib/mock-data';
import { formatDate, formatCurrency } from '@gms/utils';
import { MembershipStatus, PlanDuration } from '@gms/types';

const durationLabels: Record<PlanDuration, string> = {
  [PlanDuration.DAILY]: '1 Day',
  [PlanDuration.WEEKLY]: '1 Week',
  [PlanDuration.MONTHLY]: '1 Month',
  [PlanDuration.QUARTERLY]: '3 Months',
  [PlanDuration.HALF_YEARLY]: '6 Months',
  [PlanDuration.YEARLY]: '1 Year',
};

const durationColors: Record<string, string> = {
  DAILY: 'text-slate-400',
  WEEKLY: 'text-blue-400',
  MONTHLY: 'text-cyan-400',
  QUARTERLY: 'text-violet-400',
  HALF_YEARLY: 'text-amber-400',
  YEARLY: 'text-emerald-400',
};

export default function MembershipsPage() {
  const [showPlanDialog, setShowPlanDialog] = useState(false);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Memberships</h1>
          <p className="text-slate-400">Manage membership plans and active subscriptions.</p>
        </div>
        <Button className="bg-cyan-600 text-white hover:bg-cyan-500" onClick={() => setShowPlanDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Plan
        </Button>
      </div>

      {/* Plans Grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Membership Plans</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockPlans.map((plan) => (
            <Card key={plan.id} className="border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-base">{plan.name}</CardTitle>
                  <Badge
                    variant="outline"
                    className={`border-transparent ${durationColors[plan.duration]} bg-slate-800/50`}
                  >
                    {durationLabels[plan.duration]}
                  </Badge>
                </div>
                <CardDescription className="text-slate-400 text-xs">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{formatCurrency(plan.price)}</span>
                  <span className="text-sm text-slate-500">/ {plan.durationDays} days</span>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {plan.durationDays} days
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {mockMemberships.filter((m) => m.planId === plan.id && m.status === 'ACTIVE').length} active
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Active Memberships Table */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Active Memberships</h2>
        <Card className="border-slate-800 bg-slate-900/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockMemberships.map((membership) => (
                <TableRow key={membership.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-medium text-slate-300">
                        {membership.member?.firstName[0]}{membership.member?.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {membership.member?.firstName} {membership.member?.lastName}
                        </div>
                        <div className="text-xs text-slate-500">{membership.member?.memberId}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">{membership.plan?.name || 'N/A'}</TableCell>
                  <TableCell className="text-slate-300">{formatDate(membership.startDate)}</TableCell>
                  <TableCell className="text-slate-300">{formatDate(membership.endDate)}</TableCell>
                  <TableCell>{getMembershipStatusBadge(membership.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Create Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Membership Plan</DialogTitle>
            <DialogDescription>
              Plan creation will be connected to the API once the backend is ready.
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center text-slate-400">
            <CreditCard className="mx-auto h-12 w-12 text-slate-600 mb-3" />
            <p className="text-sm">This feature will be available when the Memberships API module is implemented.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
