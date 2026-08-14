'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CreditCard, Clock, Users, MoreHorizontal, Save, Loader2, Edit2 } from 'lucide-react';
import { api } from '@/lib/api/axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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

const planSchema = z.object({
  name: z.string().min(2, 'Plan name is required'),
  gender: z.enum(['MALE', 'FEMALE', 'UNISEX']),
  duration: z.nativeEnum(PlanDuration),
  durationDays: z.coerce.number().min(1, 'Duration must be at least 1 day'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  admissionFee: z.coerce.number().min(0, 'Admission fee cannot be negative'),
  activities: z.string().optional(),
  description: z.string().optional(),
});

type PlanFormValues = z.infer<typeof planSchema>;

export default function MembershipsPage() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const memberIdFilter = searchParams.get('memberId');
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planGender, setPlanGender] = useState('UNISEX');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      duration: PlanDuration.MONTHLY,
      gender: 'UNISEX',
      durationDays: 30,
      price: 0,
      admissionFee: 0,
    }
  });

  // When editing plan changes, populate the form
  useEffect(() => {
    if (editingPlan) {
      reset({
        name: editingPlan.name,
        gender: editingPlan.gender || 'UNISEX',
        duration: editingPlan.duration,
        durationDays: editingPlan.durationDays,
        price: Number(editingPlan.price),
        admissionFee: Number(editingPlan.admissionFee || 0),
        description: editingPlan.description || '',
      });
      setPlanGender(editingPlan.gender || 'UNISEX');
    }
  }, [editingPlan, reset]);

  const createPlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/memberships/plans', data);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: 'Plan Created', description: 'Membership plan created successfully.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['membership-plans'] });
      closePlanDialog();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create plan.', variant: 'destructive' });
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...rest } = data;
      const res = await api.patch(`/memberships/plans/${id}`, rest);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: 'Plan Updated', description: 'Membership plan updated successfully.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['membership-plans'] });
      closePlanDialog();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update plan.', variant: 'destructive' });
    }
  });

  const closePlanDialog = () => {
    setShowPlanDialog(false);
    setEditingPlan(null);
    setPlanGender('UNISEX');
    reset({
      duration: PlanDuration.MONTHLY,
      gender: 'UNISEX',
      durationDays: 30,
      price: 0,
      admissionFee: 0,
      name: '',
      description: '',
    });
  };

  const openEditDialog = (plan: any) => {
    setEditingPlan(plan);
    setShowPlanDialog(true);
  };

  const openCreateDialog = () => {
    setEditingPlan(null);
    setPlanGender('UNISEX');
    reset({
      duration: PlanDuration.MONTHLY,
      gender: 'UNISEX',
      durationDays: 30,
      price: 0,
      admissionFee: 0,
      name: '',
      description: '',
    });
    setShowPlanDialog(true);
  };

  const onSubmit = (data: PlanFormValues) => {
    if (editingPlan) {
      updatePlanMutation.mutate({ ...data, id: editingPlan.id });
    } else {
      createPlanMutation.mutate(data);
    }
  };

  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['membership-plans'],
    queryFn: async () => {
      const res = await api.get('/memberships/plans');
      
      console.log("Membership" , res.data)
      return res.data;
    },
  });

  const { data: membershipsData, isLoading: isLoadingMemberships } = useQuery({
    queryKey: ['memberships'],
    queryFn: async () => {
      const res = await api.get('/memberships');
      console.log("Plansss" , res.data)
      return res.data;
    },
  });

  const plans = plansData?.data || [];
  console.log('Plan ID' , plans)
  const memberships = membershipsData?.data || [];
  console.log
  const visibleMemberships = memberIdFilter
    ? memberships.filter((membership: any) => membership.memberId === memberIdFilter)
    : memberships;

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

  const isMutating = createPlanMutation.isPending || updatePlanMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Memberships</h1>
          <p className="text-slate-400">Manage membership plans and active subscriptions.</p>
        </div>
        <Button className="bg-cyan-600 text-white hover:bg-cyan-500" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Create Plan
        </Button>
      </div>

      {/* Plans Grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Membership Plans</h2>
        {isLoadingPlans ? (
          <div className="text-slate-400">Loading plans...</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan: any) => (
              <Card key={plan.id} className="border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-base">{plan.name}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`border-transparent ${durationColors[plan.duration]} bg-slate-800/50`}
                      >
                        {durationLabels[plan.duration as PlanDuration]}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32 bg-slate-900 border-slate-800 text-slate-300">
                          <DropdownMenuItem
                            className="hover:bg-slate-800 hover:text-white cursor-pointer"
                            onClick={() => openEditDialog(plan)}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-800" />
                          <DropdownMenuItem
                            className="hover:bg-slate-800 hover:text-white cursor-pointer text-destructive"
                            onClick={async () => {
                              
                              if (confirm('Delete this plan?')) {
                                try {
                                  await api.delete(`/memberships/plans/${plan.id}`);
                                  queryClient.invalidateQueries({ queryKey: ['membership-plans'] });
                                  toast({ title: 'Deleted', description: 'Plan deleted.', variant: 'success' });
                                } catch (err) {
                                  toast({ title: 'Error', description: 'Failed to delete plan.', variant: 'destructive' });
                                }
                              }
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
                  <p className="mt-2 text-xs text-slate-400">For: {plan.gender === 'UNISEX' ? 'Unisex' : plan.gender === 'MALE' ? 'Male' : 'Female'}</p>
                  <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {plan.durationDays} days
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {memberships.filter((m: any) => m.planId === plan.id && m.status === 'ACTIVE').length} active
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingMemberships ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                    Loading memberships...
                  </TableCell>
                </TableRow>
              ) : memberships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                    No active memberships.
                  </TableCell>
                </TableRow>
              ) : (
                visibleMemberships.map((membership: any) => (
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
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32 bg-slate-900 border-slate-800 text-slate-300">
                          <DropdownMenuItem
                            className="hover:bg-slate-800 hover:text-white cursor-pointer"
                            onClick={async () => {
                              const status = membership.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
                              try {
                                await api.patch(`/memberships/${membership.id}`, { status });
                                queryClient.invalidateQueries({ queryKey: ['memberships'] });
                                toast({ title: status === 'ACTIVE' ? 'Membership Activated' : 'Membership Inactivated', description: status === 'ACTIVE' ? 'Membership is active.' : 'You can now assign another plan.', variant: 'success' });
                              } catch (err: any) { toast({ title: 'Error', description: err.response?.data?.message || 'Unable to update membership.', variant: 'destructive' }); }
                            }}
                          >{membership.status === 'ACTIVE' ? 'Inactivate' : 'Activate'}</DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-800" />
                          <DropdownMenuItem
                            className="hover:bg-slate-800 hover:text-white cursor-pointer text-destructive"
                            onClick={async () => {
                              if (confirm('Delete this membership?')) {
                                try {
                                  await api.delete(`/memberships/${membership.id}`);
                                  queryClient.invalidateQueries({ queryKey: ['memberships'] });
                                  toast({ title: 'Deleted', description: 'Membership deleted.', variant: 'success' });
                                } catch (err) {
                                  toast({ title: 'Error', description: 'Failed to delete membership.', variant: 'destructive' });
                                }
                              }
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Create/Edit Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={(open) => {
        if (!open) closePlanDialog();
        else setShowPlanDialog(open);
      }}>
          <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Edit Membership Plan' : 'Create Membership Plan'}</DialogTitle>
            <DialogDescription>
              {editingPlan
                ? 'Update the details of this membership plan.'
                : 'Define a new membership plan that members can subscribe to.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Plan Name *</Label>
              <Input placeholder="e.g. Basic Monthly" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select defaultValue={editingPlan?.gender || 'UNISEX'} onValueChange={(val) => { setPlanGender(val); setValue('gender', val as PlanFormValues['gender']); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNISEX">Unisex</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration Type *</Label>
                <Select
                  defaultValue={editingPlan?.duration || PlanDuration.MONTHLY}
                  onValueChange={(val) => setValue('duration', val as PlanDuration)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(durationLabels).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duration (Days) *</Label>
                <Input type="number" min="1" {...register('durationDays')} />
                {errors.durationDays && <p className="text-xs text-destructive">{errors.durationDays.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Price (Rs.) *</Label>
              <Input type="number" min="0" {...register('price')} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Admission Fee (Rs.)</Label>
              <Input type="number" min="0" {...register('admissionFee')} />
              <p className="text-xs text-slate-500">Applied only when selected while assigning this plan.</p>
              {errors.admissionFee && <p className="text-xs text-destructive">{errors.admissionFee.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="What does this plan include?" {...register('description')} />
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-2 bg-background pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={closePlanDialog}>Cancel</Button>
              <Button type="submit" disabled={isMutating} className="bg-cyan-600 hover:bg-cyan-500">
                {isMutating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
