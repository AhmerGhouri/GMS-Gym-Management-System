'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, Trash2, Info, CreditCard, Users, Settings } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => await api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => await api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: 'Success', description: 'All notifications marked as read', variant: 'success' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => await api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: 'Deleted', description: 'Notification removed' });
    },
  });

  const notifications = Array.isArray(data) ? data : (data?.data || []);
  const filteredNotifications = filter === 'ALL' ? notifications : notifications.filter((n: any) => n.type === filter);
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'PAYMENT': return <CreditCard className="h-5 w-5 text-emerald-400" />;
      case 'MEMBERSHIP': return <Users className="h-5 w-5 text-cyan-400" />;
      case 'SYSTEM': return <Settings className="h-5 w-5 text-violet-400" />;
      default: return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-slate-400 mt-1">Stay updated with gym activities and alerts.</p>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
          >
            <Check className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex gap-2 pb-2 overflow-x-auto">
        {['ALL', 'MEMBERSHIP', 'PAYMENT', 'SYSTEM'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f 
                ? 'bg-cyan-500 text-white' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-slate-400 text-center py-12">Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-xl border border-slate-800/60 border-dashed">
            <Bell className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-1">No notifications</h3>
            <p className="text-slate-500">You're all caught up!</p>
          </div>
        ) : (
          filteredNotifications.map((n: any) => (
            <Card 
              key={n.id} 
              className={`relative overflow-hidden transition-all duration-300 ${
                n.isRead ? 'glass' : 'bg-slate-800/80 border-slate-700 shadow-md'
              }`}
            >
              {!n.isRead && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500"></div>
              )}
              <CardContent className="p-4 flex gap-4 sm:items-start group">
                <div className="mt-1 flex-shrink-0 bg-slate-900/50 p-2 rounded-lg">
                  {getTypeIcon(n.type)}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                    <h3 className={`font-medium ${!n.isRead ? 'text-white' : 'text-slate-300'}`}>
                      {n.title}
                    </h3>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{n.message}</p>
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.isRead && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-cyan-400"
                      onClick={() => markReadMutation.mutate(n.id)}
                      title="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-slate-400 hover:text-rose-400"
                    onClick={() => deleteMutation.mutate(n.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
