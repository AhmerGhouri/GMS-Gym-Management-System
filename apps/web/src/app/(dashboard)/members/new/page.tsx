'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useQueryClient, useQuery } from '@tanstack/react-query';

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
import { Separator } from '@/components/ui/separator';
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
  includeAdmissionFee: z.boolean().optional(),
  timeSlot: z.string().optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  cnic: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
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
    formState: { errors },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      gender: Gender.MALE,
      joiningDate: new Date().toISOString().split('T')[0],
      includeAdmissionFee: false,
    },
  });

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

  const onSubmit = async (data: MemberFormValues) => {
    setIsLoading(true);
    try {
      await api.post('/members', {
        ...data,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/members">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Add New Member</h1>
          <p className="text-slate-400">Register a new gym member</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-slate-300">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="Ahmed"
                      className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                      {...register('firstName')}
                    />
                    {errors.firstName && (
                      <p className="text-xs text-destructive">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-300">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Khan"
                      className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                      {...register('lastName')}
                    />
                    {errors.lastName && (
                      <p className="text-xs text-destructive">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fatherName" className="text-slate-300">Father&apos;s Name</Label>
                    <Input
                      id="fatherName"
                      placeholder="Imran Khan"
                      className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                      {...register('fatherName')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Gender *</Label>
                    <Select
                      defaultValue={Gender.MALE}
                      onValueChange={(value) => setValue('gender', value as Gender)}
                    >
                      <SelectTrigger className="border-slate-800 bg-slate-950 text-white">
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
                    <Label htmlFor="joiningDate" className="text-slate-300">Membership Start Date</Label>
                    <Input
                      id="joiningDate"
                      type="date"
                      className="border-slate-800 bg-slate-950 text-white focus-visible:ring-cyan-500"
                      {...register('joiningDate')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cnic" className="text-slate-300">CNIC</Label>
                    <Input
                      id="cnic"
                      placeholder="35201-1234567-1"
                      className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                      {...register('cnic')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Membership Plan (Optional)</Label>
                  <Select
                    onValueChange={(value) => setValue('planId', value)}
                    disabled={isLoadingPlans}
                  >
                    <SelectTrigger className="border-slate-800 bg-slate-950 text-white">
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
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="checkbox" className="h-4 w-4" {...register('includeAdmissionFee')} />
                  Apply the plan&apos;s admission fee
                </label>
                <div className="space-y-2">
                  <Label className="text-slate-300">Training Slot</Label>
                  <Select onValueChange={(value) => setValue('timeSlot', value)}>
                    <SelectTrigger className="border-slate-800 bg-slate-950 text-white"><SelectValue placeholder="Select morning or evening" /></SelectTrigger>
                    <SelectContent>{slots.map((slot: any) => <SelectItem key={slot.id} value={slot.name}>{slot.name} ({slot.start} - {slot.end})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">Phone Number *</Label>
                    <Input
                      id="phone"
                      placeholder="0300-1234567"
                      className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                      {...register('phone')}
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive">{errors.phone.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="ahmed@email.com"
                      className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-slate-300">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="House 123, Block B, DHA Phase 5, Lahore"
                    className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500 min-h-[80px]"
                    {...register('address')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContact" className="text-slate-300">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
                    placeholder="0300-9876543"
                    className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                    {...register('emergencyContact')}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Additional notes about this member..."
                  className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500 min-h-[120px]"
                  {...register('notes')}
                />
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <Button
                    type="submit"
                    className="w-full bg-cyan-600 text-white hover:bg-cyan-500"
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
                    <Button type="button" variant="outline" className="w-full border-slate-700 bg-slate-900 text-slate-300">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
