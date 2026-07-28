'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Plus, Edit, Trash2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api/axios';

const AVAILABLE_PERMISSIONS = [
  { id: 'users.view', label: 'View Users', group: 'Users' },
  { id: 'users.manage', label: 'Manage Users', group: 'Users' },
  { id: 'members.view', label: 'View Members', group: 'Members' },
  { id: 'members.manage', label: 'Manage Members', group: 'Members' },
  { id: 'plans.view', label: 'View Plans', group: 'Plans' },
  { id: 'plans.manage', label: 'Manage Plans', group: 'Plans' },
  { id: 'payments.view', label: 'View Payments', group: 'Payments' },
  { id: 'payments.manage', label: 'Manage Payments', group: 'Payments' },
  { id: 'settings.view', label: 'View Settings', group: 'Settings' },
  { id: 'settings.manage', label: 'Manage Settings', group: 'Settings' },
];

export default function RolesPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [currentRole, setCurrentRole] = useState<any>(null);

  const { data: rolesData, refetch } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data;
    },
  });

  const roles = rolesData?.data || [];

  const handleEdit = (role: any) => {
    setCurrentRole({ ...role });
    setIsEditing(true);
  };

  const handleCreate = () => {
    setCurrentRole({ name: '', permissions: [] });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this role?')) return;
    try {
      await api.delete(`/roles/${id}`);
      toast({ title: 'Success', description: 'Role deleted successfully.', variant: 'success' });
      refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to delete role', variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!currentRole.name) {
      toast({ title: 'Error', description: 'Role name is required', variant: 'destructive' });
      return;
    }
    try {
      if (currentRole.id) {
        await api.patch(`/roles/${currentRole.id}`, {
          name: currentRole.name,
          permissions: currentRole.permissions,
        });
        toast({ title: 'Success', description: 'Role updated successfully.', variant: 'success' });
      } else {
        await api.post('/roles', {
          name: currentRole.name,
          permissions: currentRole.permissions,
        });
        toast({ title: 'Success', description: 'Role created successfully.', variant: 'success' });
      }
      setIsEditing(false);
      refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.response?.data?.message || 'Failed to save role', variant: 'destructive' });
    }
  };

  const togglePermission = (permId: string) => {
    setCurrentRole((prev: any) => {
      const perms = prev.permissions.includes(permId)
        ? prev.permissions.filter((p: string) => p !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions: perms };
    });
  };

  if (isEditing && currentRole) {
    const groups = AVAILABLE_PERMISSIONS.reduce((acc: any, perm) => {
      if (!acc[perm.group]) acc[perm.group] = [];
      acc[perm.group].push(perm);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
            <ArrowLeft className="h-5 w-5 text-slate-400" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {currentRole.id ? 'Edit Role' : 'Create Role'}
            </h1>
            <p className="text-slate-400">Define custom permissions for this role.</p>
          </div>
        </div>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white">Role Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 max-w-md">
              <Label className="text-slate-300">Role Name</Label>
              <Input
                value={currentRole.name}
                onChange={(e) => setCurrentRole({ ...currentRole, name: e.target.value })}
                placeholder="e.g. Senior Trainer"
                className="border-slate-800 bg-slate-950 text-white focus-visible:ring-cyan-500"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-slate-300 text-lg">Permissions</Label>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Object.keys(groups).map((groupName) => (
                  <div key={groupName} className="space-y-3 p-4 rounded-lg bg-slate-800/30 border border-slate-800">
                    <h3 className="font-semibold text-cyan-500">{groupName}</h3>
                    {groups[groupName].map((perm: any) => (
                      <div key={perm.id} className="flex items-center justify-between">
                        <Label className="text-slate-300 cursor-pointer font-normal" onClick={() => togglePermission(perm.id)}>
                          {perm.label}
                        </Label>
                        <Switch
                          checked={currentRole.permissions.includes(perm.id)}
                          onCheckedChange={() => togglePermission(perm.id)}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button className="bg-cyan-600 text-white hover:bg-cyan-500" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" /> Save Role
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings">
            <Button variant="ghost" size="icon" className="text-slate-400">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Custom Roles</h1>
            <p className="text-slate-400">Manage custom roles and access permissions.</p>
          </div>
        </div>
        <Button onClick={handleCreate} className="bg-cyan-600 text-white hover:bg-cyan-500">
          <Plus className="mr-2 h-4 w-4" /> Create Role
        </Button>
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Role Name</TableHead>
                <TableHead className="text-slate-400">Permissions Count</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                    No custom roles found.
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role: any) => (
                  <TableRow key={role.id} className="border-slate-800 hover:bg-slate-800/30">
                    <TableCell className="font-medium text-white flex items-center gap-2">
                      <Shield className="h-4 w-4 text-cyan-500" />
                      {role.name}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {role.permissions.length} permissions
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-rose-400" onClick={() => handleDelete(role.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
