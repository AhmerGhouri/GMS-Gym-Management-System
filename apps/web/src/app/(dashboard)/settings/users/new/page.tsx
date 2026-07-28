'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

export default function AddUserPage() {
  const router = useRouter(); const [saving, setSaving] = useState(false); const [role, setRole] = useState('RECEPTIONIST');
  const submit = async (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); setSaving(true); try { await api.post('/users', { firstName: form.get('firstName'), lastName: form.get('lastName'), email: form.get('email'), password: form.get('password'), role }); toast({ title: 'User Created', description: 'The new user can now sign in.', variant: 'success' }); router.push('/settings'); } catch (error: any) { toast({ title: 'Error', description: error.response?.data?.message || 'Unable to create user.', variant: 'destructive' }); } finally { setSaving(false); } };
  return <div className="max-w-xl space-y-6"><div><h1 className="text-3xl font-bold text-white">Add User</h1><p className="text-slate-400">Create a staff account and assign its role.</p></div><Card className="border-slate-800 bg-slate-900/50"><CardHeader><CardTitle className="text-white">User details</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="space-y-4"><div className="grid grid-cols-2 gap-4"><div><Label>First name</Label><Input name="firstName" required /></div><div><Label>Last name</Label><Input name="lastName" required /></div></div><div><Label>Email</Label><Input name="email" type="email" required /></div><div><Label>Password</Label><Input name="password" type="password" minLength={8} required /></div><div><Label>Role</Label><Select defaultValue={role} onValueChange={setRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="GYM_MANAGER">Gym Manager</SelectItem><SelectItem value="RECEPTIONIST">Receptionist</SelectItem><SelectItem value="SUPER_ADMIN">Super Admin</SelectItem></SelectContent></Select></div><Button disabled={saving} className="bg-cyan-600">{saving ? 'Creating…' : 'Create User'}</Button></form></CardContent></Card></div>;
}
