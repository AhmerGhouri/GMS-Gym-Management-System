'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api/axios';
import { Gender } from '@gms/types';

const memberSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  fatherName: z.string().optional(),
  gender: z.nativeEnum(Gender),
  joiningDate: z.string().optional(),
  planId: z.string().optional(),
  admissionFeeType: z.enum(['NONE', 'FULL', 'MANUAL']).default('NONE'),
  manualAdmissionFee: z.coerce.number().min(0, 'Admission fee cannot be negative').optional(),
  timeSlot: z.string().optional(),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  cnic: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
  activityIds: z.array(z.string()).optional(),
});

type MemberFormValues = z.infer<typeof memberSchema>;

export default function NewMemberPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      gender: Gender.MALE,
      joiningDate: new Date().toISOString().split('T')[0],
      admissionFeeType: 'NONE',
      manualAdmissionFee: 0,
      activityIds: [],
    },
  });

  const watchPlanId = watch('planId');
  const watchActivityIds = watch('activityIds');
  const watchAdmissionFeeType = watch('admissionFeeType');
  const watchManualAdmissionFee = watch('manualAdmissionFee');

  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['membership-plans'],
    queryFn: async () => {
      const res = await api.get('/memberships/plans');
      return res.data;
    },
  });

  const plans = (plansData?.data || []).filter((plan: any) => plan.isActive);
  const { data: slotsData } = useQuery({ queryKey: ['gym-slots'], queryFn: async () => (await api.get('/settings/slots')).data });
  const slots = slotsData?.data || [];

  const { data: activitiesData } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const res = await api.get('/activities');
      return res.data;
    },
  });
  const allActivities = (Array.isArray(activitiesData) ? activitiesData : activitiesData?.data || []).filter((act: any) => act.isActive);

  const onSubmit = async (data: MemberFormValues) => {
    setIsLoading(true);
    try {
      await api.post('/members', {
        ...data,
        includeAdmissionFee: data.admissionFeeType === 'FULL',
        email: data.email || undefined,
      });
      toast({
        title: 'Member Created',
        description: `${data.firstName} ${data.lastName} has been registered successfully.`,
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      router.push('/members');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to create member.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div 
        className="flex items-center gap-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link href="/members">
          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <UserPlus className="h-8 w-8 text-cyan-600 dark:text-cyan-500" />
            Add New Member
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Register a new gym member</p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-slate-700 dark:text-slate-300">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="Ahmed"
                        className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-cyan-500"
                        {...register('firstName')}
                      />
                      {errors.firstName && (
                        <p className="text-xs text-rose-500 font-medium">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-slate-700 dark:text-slate-300">Last Name *</Label>
                      <Input
                        id="lastName"
                        placeholder="Khan"
                        className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-cyan-500"
                        {...register('lastName')}
                      />
                      {errors.lastName && (
                        <p className="text-xs text-rose-500 font-medium">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="fatherName" className="text-slate-700 dark:text-slate-300">Father&apos;s Name</Label>
                      <Input
                        id="fatherName"
                        placeholder="Imran Khan"
                        className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-cyan-500"
                        {...register('fatherName')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-300">Gender *</Label>
                      <Select
                        defaultValue={Gender.MALE}
                        onValueChange={(value) => setValue('gender', value as Gender)}
                      >
                        <SelectTrigger className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={Gender.MALE}>Male</SelectItem>
                          <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                          <SelectItem value={Gender.OTHER}>Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="joiningDate" className="text-slate-700 dark:text-slate-300">Membership Start Date</Label>
                      <Input
                        id="joiningDate"
                        type="date"
                        className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus-visible:ring-cyan-500"
                        {...register('joiningDate')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnic" className="text-slate-700 dark:text-slate-300">CNIC</Label>
                      <Input
                        id="cnic"
                        placeholder="35201-1234567-1"
                        className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-cyan-500"
                        {...register('cnic')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Membership Plan (Optional)</Label>
                    <Select
                      onValueChange={(value) => setValue('planId', value)}
                      disabled={isLoadingPlans}
                    >
                      <SelectTrigger className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
                        <SelectValue placeholder={isLoadingPlans ? "Loading plans..." : "Select a plan"} />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((plan: any) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            {plan.name} - Rs. {plan.price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Admission Fee</Label>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                      {(['NONE', 'FULL', 'MANUAL'] as const).map((type) => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" value={type} {...register('admissionFeeType')} />
                          {type === 'NONE' ? 'None' : type === 'FULL' ? 'Full plan fee' : 'Manual amount'}
                        </label>
                      ))}
                    </div>
                    {watchAdmissionFeeType === 'MANUAL' && (
                      <Input type="number" min="0" step="0.01" placeholder="Admission fee" {...register('manualAdmissionFee')} />
                    )}
                    {errors.manualAdmissionFee && <p className="text-xs text-rose-500">{errors.manualAdmissionFee.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Training Slot</Label>
                    <Select onValueChange={(value) => setValue('timeSlot', value)}>
                      <SelectTrigger className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
                        <SelectValue placeholder="Select morning or evening" />
                      </SelectTrigger>
                      <SelectContent>
                        {slots.map((slot: any) => <SelectItem key={slot.id} value={slot.name}>{slot.name} ({slot.start} - {slot.end})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {allActivities.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <Label className="text-slate-700 dark:text-slate-300">Add-on Activities</Label>
                      <div className="grid grid-cols-2 gap-4 border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-slate-50/50 dark:bg-slate-900/30">
                        {allActivities.map((activity: any) => (
                          <label key={activity.id} className="flex items-start space-x-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              value={activity.id}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 bg-white dark:bg-slate-950 dark:border-slate-700"
                              {...register('activityIds')}
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                {activity.name}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                +Rs. {activity.price}
                              </span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grand Total Display */}
                  {(watchPlanId || (watchActivityIds && watchActivityIds.length > 0)) && (() => {
                    const selectedPlan = plans.find((p: any) => p.id === watchPlanId);
                    const planPrice = selectedPlan ? Number(selectedPlan.price) : 0;
                    const admissionFee = watchAdmissionFeeType === 'FULL' && selectedPlan
                      ? Number(selectedPlan.admissionFee || 0)
                      : watchAdmissionFeeType === 'MANUAL' ? Number(watchManualAdmissionFee || 0) : 0;
                    
                    const activitiesPrice = (watchActivityIds || []).reduce((total: number, id: string) => {
                      const act = allActivities.find((a: any) => a.id === id);
                      return total + (act ? Number(act.price) : 0);
                    }, 0);

                    const grandTotal = planPrice + admissionFee + activitiesPrice;

                    return (
                      <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border border-cyan-100 dark:border-cyan-900/50">
                        <div className="flex justify-between items-center mb-2 text-sm text-slate-600 dark:text-slate-400">
                          <span>Membership Plan:</span>
                          <span>Rs. {planPrice}</span>
                        </div>
                        {admissionFee > 0 && (
                          <div className="flex justify-between items-center mb-2 text-sm text-slate-600 dark:text-slate-400">
                            <span>Admission Fee:</span>
                            <span>Rs. {admissionFee}</span>
                          </div>
                        )}
                        {activitiesPrice > 0 && (
                          <div className="flex justify-between items-center mb-2 text-sm text-slate-600 dark:text-slate-400">
                            <span>Add-on Activities:</span>
                            <span>Rs. {activitiesPrice}</span>
                          </div>
                        )}
                        <div className="mt-3 pt-3 border-t border-cyan-200 dark:border-cyan-800 flex justify-between items-center font-bold">
                          <span className="text-slate-800 dark:text-slate-200">Grand Total:</span>
                          <span className="text-lg text-cyan-700 dark:text-cyan-400">Rs. {grandTotal}</span>
                        </div>
                      </div>
                    );
                  })()}

                </CardContent>
              </Card>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300">Phone Number *</Label>
                      <Input
                        id="phone"
                        placeholder="0300-1234567"
                        className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-cyan-500"
                        {...register('phone')}
                      />
                      {errors.phone && (
                        <p className="text-xs text-rose-500 font-medium">{errors.phone.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="ahmed@email.com"
                        className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-cyan-500"
                        {...register('email')}
                      />
                      {errors.email && (
                        <p className="text-xs text-rose-500 font-medium">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-slate-700 dark:text-slate-300">Address</Label>
                    <Textarea
                      id="address"
                      placeholder="House 123, Block B, DHA Phase 5, Lahore"
                      className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-cyan-500 min-h-[80px]"
                      {...register('address')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact" className="text-slate-700 dark:text-slate-300">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      placeholder="0300-9876543"
                      className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-cyan-500"
                      {...register('emergencyContact')}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-white">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Additional notes about this member..."
                    className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-cyan-500 min-h-[120px]"
                    {...register('notes')}
                  />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button
                      type="submit"
                      className="w-full bg-cyan-600 text-white hover:bg-cyan-500 shadow-md transition-all"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Register Member
                        </>
                      )}
                    </Button>
                    <Link href="/members" className="block">
                      <Button type="button" variant="outline" className="w-full border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </form>
    </div>
  );
}
