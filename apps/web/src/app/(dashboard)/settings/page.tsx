'use client';

import { useState } from 'react';
import { Save, Building2, Clock, Bell, Users, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';

export default function SettingsPage() {
  const [gymName, setGymName] = useState('IronPulse Gym');
  const [gymAddress, setGymAddress] = useState('Block B, DHA Phase 5, Lahore, Pakistan');
  const [gymPhone, setGymPhone] = useState('042-35761234');
  const [gymEmail, setGymEmail] = useState('info@ironpulse.pk');

  const [notifications, setNotifications] = useState({
    memberExpiry: true,
    paymentReminder: true,
    accessDenied: true,
    dailyReport: false,
    deviceOffline: true,
    newMember: true,
  });

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your changes have been saved successfully.',
      variant: 'success',
    });
  };

  const mockUsers = [
    { id: '1', name: 'Admin User', email: 'admin@gms.local', role: 'SUPER_ADMIN', status: 'Active' },
    { id: '2', name: 'Ahmad Manager', email: 'ahmad@ironpulse.pk', role: 'GYM_MANAGER', status: 'Active' },
    { id: '3', name: 'Receptionist', email: 'reception@ironpulse.pk', role: 'RECEPTIONIST', status: 'Active' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="text-slate-400">Manage your gym configuration and preferences.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-800/50">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Gym Profile */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-cyan-500" />
                  <CardTitle className="text-white">Gym Profile</CardTitle>
                </div>
                <CardDescription className="text-slate-400">
                  Basic information about your gym
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Gym Name</Label>
                  <Input
                    value={gymName}
                    onChange={(e: any) => setGymName(e.currentTarget.value || '')}
                    className="border-slate-800 bg-slate-950 text-white focus-visible:ring-cyan-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Address</Label>
                  <Textarea
                    value={gymAddress}
                    onChange={(e : any) => setGymAddress(e.currentTarget.value)}
                    className="border-slate-800 bg-slate-950 text-white focus-visible:ring-cyan-500 min-h-[80px]"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Phone</Label>
                    <Input
                      value={gymPhone}
                      onChange={(e: any) => setGymPhone(e.currentTarget.value)}
                      className="border-slate-800 bg-slate-950 text-white focus-visible:ring-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Email</Label>
                    <Input
                      value={gymEmail}
                      onChange={(e: any) => setGymEmail(e.currentTarget.value)}
                      className="border-slate-800 bg-slate-950 text-white focus-visible:ring-cyan-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-cyan-500" />
                  <CardTitle className="text-white">Business Hours</CardTitle>
                </div>
                <CardDescription className="text-slate-400">
                  Set your gym&apos;s operating hours
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { day: 'Monday - Friday', open: '06:00', close: '22:00' },
                  { day: 'Saturday', open: '07:00', close: '20:00' },
                  { day: 'Sunday', open: '08:00', close: '18:00' },
                ].map((schedule) => (
                  <div key={schedule.day} className="flex items-center justify-between rounded-lg bg-slate-800/50 px-4 py-3">
                    <span className="text-sm font-medium text-white">{schedule.day}</span>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        defaultValue={schedule.open}
                        className="w-28 border-slate-700 bg-slate-900 text-white text-sm h-8"
                      />
                      <span className="text-slate-500">to</span>
                      <Input
                        type="time"
                        defaultValue={schedule.close}
                        className="w-28 border-slate-700 bg-slate-900 text-white text-sm h-8"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button className="bg-cyan-600 text-white hover:bg-cyan-500" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-cyan-500" />
                <CardTitle className="text-white">Notification Preferences</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Configure which notifications you receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {[
                { key: 'memberExpiry' as const, label: 'Membership Expiry Alerts', desc: 'Get notified when a member\'s membership is about to expire' },
                { key: 'paymentReminder' as const, label: 'Payment Reminders', desc: 'Reminders for outstanding dues and pending payments' },
                { key: 'accessDenied' as const, label: 'Access Denied Alerts', desc: 'Notification when a member is denied gate access' },
                { key: 'dailyReport' as const, label: 'Daily Summary Report', desc: 'Receive a daily email with attendance and revenue summary' },
                { key: 'deviceOffline' as const, label: 'Device Offline Alerts', desc: 'Alert when a biometric device goes offline' },
                { key: 'newMember' as const, label: 'New Member Registration', desc: 'Notification when a new member is registered' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-lg px-4 py-4 hover:bg-slate-800/30 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={(checked) =>
                      setNotifications((prev) => ({ ...prev, [item.key]: checked }))
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end mt-6">
            <Button className="bg-cyan-600 text-white hover:bg-cyan-500" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Save Preferences
            </Button>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-cyan-500" />
                <CardTitle className="text-white">Staff & Users</CardTitle>
              </div>
              <Button className="bg-cyan-600 text-white hover:bg-cyan-500" size="sm">
                Add User
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-white font-medium">{user.name}</TableCell>
                      <TableCell className="text-slate-300">{user.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`border-transparent ${
                            user.role === 'SUPER_ADMIN'
                              ? 'bg-rose-500/15 text-rose-400'
                              : user.role === 'GYM_MANAGER'
                              ? 'bg-cyan-500/15 text-cyan-400'
                              : 'bg-slate-500/15 text-slate-400'
                          }`}
                        >
                          {user.role.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-500" />
                <CardTitle className="text-white">Security Settings</CardTitle>
              </div>
              <CardDescription className="text-slate-400">
                Manage password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-white">Change Password</h3>
                <div className="grid gap-4 max-w-md">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Current Password</Label>
                    <Input
                      type="password"
                      className="border-slate-800 bg-slate-950 text-white focus-visible:ring-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">New Password</Label>
                    <Input
                      type="password"
                      className="border-slate-800 bg-slate-950 text-white focus-visible:ring-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">Confirm New Password</Label>
                    <Input
                      type="password"
                      className="border-slate-800 bg-slate-950 text-white focus-visible:ring-cyan-500"
                    />
                  </div>
                  <Button className="bg-cyan-600 text-white hover:bg-cyan-500 w-fit">
                    Update Password
                  </Button>
                </div>
              </div>

              <Separator className="bg-slate-800" />

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">Session Settings</h3>
                <div className="flex items-center justify-between rounded-lg bg-slate-800/30 px-4 py-3">
                  <div>
                    <p className="text-sm text-white">Auto-logout on inactivity</p>
                    <p className="text-xs text-slate-400">Automatically sign out after 30 minutes of inactivity</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-800/30 px-4 py-3">
                  <div>
                    <p className="text-sm text-white">Two-Factor Authentication</p>
                    <p className="text-xs text-slate-400">Add an extra layer of security to your account</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
