'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api/axios';
import { Gender, MemberStatus } from '@gms/types';

const memberSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().optional().or(z.literal('')),
  fatherName: z.string().optional(),
  gender: z.nativeEnum(Gender),
  joiningDate: z.string().optional(),
  phone: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  cnic: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  notes: z.string().optional(),
  status: z.nativeEnum(MemberStatus).optional(),
  timeSlot: z.string().optional(),
  activityIds: z.array(z.string()).optional(),
});

type MemberFormValues = z.infer<typeof memberSchema>;

export default function EditMemberPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      gender: Gender.MALE,
    },
  });

  const { data: memberData, isLoading: isLoadingMember } = useQuery({
    queryKey: ['member', id],
    queryFn: async () => {
      const res = await api.get(`/members/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
  const { data: slotsData } = useQuery({ queryKey: ['gym-slots'], queryFn: async () => (await api.get('/settings/slots')).data });
  const slots = slotsData?.data || [];
  const { data: activitiesData } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => (await api.get('/activities')).data,
  });
  const activities = (Array.isArray(activitiesData) ? activitiesData : activitiesData?.data || []).filter((activity: any) => activity.isActive);
  const selectedActivityIds = watch('activityIds') || [];

  useEffect(() => {
    if (memberData?.data) {
      const member = memberData.data;
      reset({
        firstName: member.firstName,
        lastName: member.lastName || '',
        fatherName: member.fatherName || '',
        gender: member.gender,
        joiningDate: member.joiningDate ? new Date(member.joiningDate).toISOString().split('T')[0] : '',
        phone: member.phone || '',
        email: member.email || '',
        cnic: member.cnic || '',
        address: member.address || '',
        emergencyContact: member.emergencyContact || '',
        notes: member.notes || '',
        status: member.status,
        timeSlot: member.timeSlot || '',
        activityIds: member.memberships?.find((membership: any) => membership.status === 'ACTIVE')?.activities?.map((item: any) => item.activityId) || [],
      });
    }
  }, [memberData, reset]);

  const onSubmit = async (data: MemberFormValues) => {
    setIsSaving(true);
    try {
      await api.patch(`/members/${id}`, {
        ...data,
        email: data.email || undefined,
      });
      toast({
        title: 'Member Updated',
        description: `${data.firstName} ${data.lastName}'s details have been updated.`,
        variant: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['member', id] });
      router.push(`/members/${id}`);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to update member.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingMember) {
    return <div className="text-white">Loading member data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/members/${id}`}>
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Edit Member</h1>
          <p className="text-slate-400">Update member information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
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
                      className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                      {...register('firstName')}
                    />
                    {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-slate-300">Last Name</Label>
                    <Input
                      id="lastName"
                      className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                      {...register('lastName')}
                    />
                    {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fatherName" className="text-slate-300">Father&apos;s Name</Label>
                    <Input
                      id="fatherName"
                      className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                      {...register('fatherName')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Gender *</Label>
                    <Select
                      defaultValue={memberData?.data?.gender || Gender.MALE}
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
                      className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                      {...register('cnic')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Status</Label>
                  <Select
                    defaultValue={memberData?.data?.status || MemberStatus.ACTIVE}
                    onValueChange={(value) => setValue('status', value as MemberStatus)}
                  >
                    <SelectTrigger className="border-slate-800 bg-slate-950 text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MemberStatus.ACTIVE}>Active</SelectItem>
                      <SelectItem value={MemberStatus.INACTIVE}>Inactive</SelectItem>
                      <SelectItem value={MemberStatus.SUSPENDED}>Suspended</SelectItem>
                      <SelectItem value={MemberStatus.DELETED}>Deleted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Training Slot</Label>
                  <Select defaultValue={memberData?.data?.timeSlot || undefined} onValueChange={(value) => setValue('timeSlot', value)}>
                    <SelectTrigger className="border-slate-800 bg-slate-950 text-white"><SelectValue placeholder="Select a slot" /></SelectTrigger>
                    <SelectContent>{slots.map((slot: any) => <SelectItem key={slot.id} value={slot.name}>{slot.name} ({slot.start} - {slot.end})</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {activities.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-slate-300">Add-on Activities</Label>
                    <div className="grid gap-3 sm:grid-cols-2 rounded-lg border border-slate-800 p-4">
                      {activities.map((activity: any) => (
                        <label key={activity.id} className="flex items-center gap-3 cursor-pointer text-sm text-slate-300">
                          <input type="checkbox" value={activity.id} {...register('activityIds')} />
                          <span>{activity.name} <span className="text-slate-500">(Rs. {activity.price})</span></span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500">{selectedActivityIds.length} selected. Saving recalculates the membership invoice balance.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="text-white">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
                    <Input
                      id="phone"
                      className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                      {...register('phone')}
                    />
                    {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                      {...register('email')}
                    />
                    {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-slate-300">Address</Label>
                  <Textarea
                    id="address"
                    className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500 min-h-[80px]"
                    {...register('address')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact" className="text-slate-300">Emergency Contact</Label>
                  <Input
                    id="emergencyContact"
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
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Link href={`/members/${id}`} className="block">
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
