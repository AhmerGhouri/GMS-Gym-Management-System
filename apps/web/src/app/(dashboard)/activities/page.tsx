'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MoreHorizontal, Loader2, Edit2, Activity as ActivityIcon } from 'lucide-react';
import { api } from '@/lib/api/axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
import { formatCurrency } from '@gms/utils';
import { Switch } from '@/components/ui/switch';

const activitySchema = z.object({
  name: z.string().min(2, 'Activity name is required'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  isActive: z.boolean().default(true),
});

type ActivityFormValues = z.infer<typeof activitySchema>;

export default function ActivitiesPage() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<any>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      price: 0,
      isActive: true,
    }
  });

  const isActiveWatch = watch('isActive');

  const { data: activitiesData, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const res = await api.get('/activities');
      return res.data;
    },
  });

  const activities = Array.isArray(activitiesData) ? activitiesData : activitiesData?.data || [];

  const createMutation = useMutation({
    mutationFn: async (data: ActivityFormValues) => {
      const res = await api.post('/activities', data);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: 'Activity Created', description: 'Activity created successfully.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      closeDialog();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to create activity.', variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { id, ...rest } = data;
      const res = await api.patch(`/activities/${id}`, rest);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: 'Activity Updated', description: 'Activity updated successfully.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      closeDialog();
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to update activity.', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/activities/${id}`);
    },
    onSuccess: () => {
      toast({ title: 'Deleted', description: 'Activity deleted successfully.', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to delete activity.', variant: 'destructive' });
    }
  });

  const closeDialog = () => {
    setShowDialog(false);
    setEditingActivity(null);
    reset({ name: '', description: '', price: 0, isActive: true });
  };

  const openCreateDialog = () => {
    setEditingActivity(null);
    reset({ name: '', description: '', price: 0, isActive: true });
    setShowDialog(true);
  };

  const openEditDialog = (activity: any) => {
    setEditingActivity(activity);
    reset({
      name: activity.name,
      description: activity.description || '',
      price: Number(activity.price),
      isActive: activity.isActive,
    });
    setShowDialog(true);
  };

  const onSubmit = (data: ActivityFormValues) => {
    if (editingActivity) {
      updateMutation.mutate({ ...data, id: editingActivity.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Activities & Add-ons</h1>
          <p className="text-slate-400">Manage gym activities that members can purchase.</p>
        </div>
        <Button className="bg-cyan-600 text-white hover:bg-cyan-500 shadow-md" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" /> Add Activity
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="border-slate-800 bg-slate-900/50 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-slate-800/50">
                <TableHead>Activity</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-cyan-500" />
                    Loading activities...
                  </TableCell>
                </TableRow>
              ) : activities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                    <ActivityIcon className="h-10 w-10 mx-auto mb-3 text-slate-600" />
                    No activities defined.
                  </TableCell>
                </TableRow>
              ) : (
                activities.map((activity: any) => (
                  <TableRow key={activity.id} className="border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <TableCell className="font-medium text-white">{activity.name}</TableCell>
                    <TableCell className="text-slate-400">{activity.description || '—'}</TableCell>
                    <TableCell className="text-slate-300 font-mono">{formatCurrency(activity.price)}</TableCell>
                    <TableCell>
                      {activity.isActive ? (
                        <Badge variant="success" className="bg-emerald-500/15 text-emerald-500 border-transparent">Active</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-800 text-slate-400 border-transparent">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-32 bg-slate-900 border-slate-800 text-slate-300">
                          <DropdownMenuItem className="hover:bg-slate-800 hover:text-white cursor-pointer" onClick={() => openEditDialog(activity)}>
                            <Edit2 className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-800" />
                          <DropdownMenuItem 
                            className="hover:bg-slate-800 hover:text-white cursor-pointer text-destructive focus:text-destructive"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this activity?')) {
                                deleteMutation.mutate(activity.id);
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
      </motion.div>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => {
        if (!open) closeDialog();
        else setShowDialog(open);
      }}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle>{editingActivity ? 'Edit Activity' : 'Add Activity'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingActivity ? 'Modify the details of this activity.' : 'Create a new activity that can be added to memberships.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Activity Name *</Label>
              <Input 
                className="bg-slate-950 border-slate-800 focus-visible:ring-cyan-500" 
                placeholder="e.g. Yoga, Steam Bath" 
                {...register('name')} 
              />
              {errors.name && <p className="text-xs text-rose-500">{errors.name.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label className="text-slate-300">Price *</Label>
              <Input 
                type="number"
                className="bg-slate-950 border-slate-800 focus-visible:ring-cyan-500" 
                placeholder="0" 
                {...register('price')} 
              />
              {errors.price && <p className="text-xs text-rose-500">{errors.price.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Description</Label>
              <Textarea 
                className="bg-slate-950 border-slate-800 focus-visible:ring-cyan-500 min-h-[80px]" 
                placeholder="Details about this activity..." 
                {...register('description')} 
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-slate-800 p-3 bg-slate-950/50">
              <div className="space-y-0.5">
                <Label className="text-slate-300">Active Status</Label>
                <p className="text-xs text-slate-500">Allow this activity to be purchased</p>
              </div>
              <Switch 
                checked={isActiveWatch} 
                onCheckedChange={(val) => setValue('isActive', val)} 
                className="data-[state=checked]:bg-cyan-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={closeDialog} className="border-slate-700 hover:bg-slate-800 text-slate-300">
                Cancel
              </Button>
              <Button type="submit" disabled={isMutating} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingActivity ? 'Save Changes' : 'Create Activity'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
