'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api/axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
export default function NotificationsPage() {
 const queryClient = useQueryClient(); const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: async () => (await api.get('/notifications')).data }); const notifications = data?.data || [];
 return <div className="space-y-6"><div><h1 className="text-3xl font-bold text-white">Notifications</h1><p className="text-slate-400">Member, membership, payment, and system activity.</p></div><div className="space-y-3">{isLoading ? <p className="text-slate-400">Loading…</p> : notifications.length === 0 ? <p className="text-slate-400">No notifications yet.</p> : notifications.map((notification: any) => <Card key={notification.id} className={`border-slate-800 ${notification.isRead ? 'bg-slate-900/50' : 'bg-cyan-950/30'}`}><CardContent className="flex items-start gap-3 p-4"><Bell className="mt-1 h-4 w-4 text-cyan-400" /><div className="flex-1"><p className="font-medium text-white">{notification.title}</p><p className="mt-1 text-sm text-slate-400">{notification.message}</p><p className="mt-2 text-xs text-slate-500">{new Date(notification.createdAt).toLocaleString()}</p></div>{!notification.isRead && <Button size="sm" variant="ghost" onClick={async () => { await api.patch(`/notifications/${notification.id}/read`); queryClient.invalidateQueries({ queryKey: ['notifications'] }); }}>Mark read</Button>}</CardContent></Card>)}</div></div>;
}
