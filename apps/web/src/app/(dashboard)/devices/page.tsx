'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/axios';
import {
  Plus,
  Wifi,
  WifiOff,
  Network,
  RefreshCcw,
  MoreHorizontal,
  ShieldCheck,
  ShieldX,
  Fingerprint,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDateTime } from '@gms/utils';
import { AccessResult, DeviceConnectionType } from '@gms/types';

export default function DevicesPage() {
  const [showAddDevice, setShowAddDevice] = useState(false);

  const { data: devicesData, isLoading: isLoadingDevices } = useQuery({
    queryKey: ['devices'],
    queryFn: async () => {
      const res = await api.get('/devices');
      return res.data;
    },
  });

  const { data: logsData, isLoading: isLoadingLogs } = useQuery({
    queryKey: ['access-logs'],
    queryFn: async () => {
      const res = await api.get('/devices/access-logs');
      return res.data;
    },
  });

  const devices = devicesData?.data || [];
  const accessLogs = logsData?.data || [];

  const onlineCount = devices.filter((d: any) => d.status === 'ONLINE').length;
  const offlineCount = devices.filter((d: any) => d.status === 'OFFLINE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Access Control</h1>
          <p className="text-slate-400">Manage biometric devices and monitor gate access.</p>
        </div>
        <Button className="bg-cyan-600 text-white hover:bg-cyan-500" onClick={() => setShowAddDevice(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Device
        </Button>
      </div>

      {/* Device Cards */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-lg font-semibold text-white">Devices</h2>
          <div className="flex items-center gap-2">
            <Badge variant="success" className="text-xs">
              {onlineCount} Online
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {offlineCount} Offline
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoadingDevices ? (
            <div className="text-slate-400 p-4">Loading devices...</div>
          ) : devices.map((device: any) => (
            <Card
              key={device.id}
              className={`border-slate-800 bg-slate-900/50 transition-colors ${
                device.status === 'ONLINE' ? 'hover:border-emerald-800/50' : 'hover:border-rose-800/50'
              }`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2.5 ${
                      device.status === 'ONLINE' ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                    }`}>
                      <Fingerprint className={`h-5 w-5 ${
                        device.status === 'ONLINE' ? 'text-emerald-500' : 'text-rose-500'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{device.name}</h3>
                      <p className="text-xs text-slate-500">{device.serialNumber}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-medium ${
                    device.status === 'ONLINE' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    <div className={`h-2 w-2 rounded-full ${
                      device.status === 'ONLINE' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`} />
                    {device.status}
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">IP Address</span>
                    <span className="font-mono text-slate-300">{device.ipAddress}:{device.port}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Connection</span>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      {device.connectionType === 'ETHERNET' ? (
                        <Network className="h-3.5 w-3.5" />
                      ) : (
                        <Wifi className="h-3.5 w-3.5" />
                      )}
                      {device.connectionType}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Last Sync</span>
                    <span className="text-slate-300 text-xs">
                      {device.lastSyncAt ? formatDateTime(device.lastSyncAt) : 'Never'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 border-slate-700 bg-slate-900 text-slate-300 text-xs">
                    <RefreshCcw className="mr-1.5 h-3 w-3" /> Sync
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Access Logs */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Access Logs</h2>
        <Card className="border-slate-800 bg-slate-900/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingLogs ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    Loading access logs...
                  </TableCell>
                </TableRow>
              ) : accessLogs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-medium text-slate-300">
                        {log.member?.firstName[0]}{log.member?.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {log.member?.firstName} {log.member?.lastName}
                        </div>
                        <div className="text-xs text-slate-500">{log.member?.memberId}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-300">{log.device?.name || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {log.result === AccessResult.GRANTED ? (
                        <>
                          <ShieldCheck className="h-4 w-4 text-emerald-400" />
                          <Badge variant="success">Granted</Badge>
                        </>
                      ) : (
                        <>
                          <ShieldX className="h-4 w-4 text-rose-400" />
                          <Badge variant="destructive">Denied</Badge>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {log.denyReason?.replace(/_/g, ' ') || '—'}
                  </TableCell>
                  <TableCell className="text-slate-300 text-sm">
                    {formatDateTime(log.timestamp)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Add Device Dialog */}
      <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>
              Connect a new biometric access control device.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Device Name</Label>
              <Input
                placeholder="e.g., Main Entrance"
                className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-300">IP Address</Label>
                <Input
                  placeholder="192.168.1.100"
                  className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Port</Label>
                <Input
                  placeholder="4370"
                  defaultValue="4370"
                  className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Connection Type</Label>
              <Select defaultValue="ETHERNET">
                <SelectTrigger className="border-slate-800 bg-slate-950 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETHERNET">Ethernet</SelectItem>
                  <SelectItem value="WIFI">WiFi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDevice(false)} className="border-slate-700 text-slate-300">
              Cancel
            </Button>
            <Button className="bg-cyan-600 text-white hover:bg-cyan-500" onClick={() => setShowAddDevice(false)}>
              Add Device
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
