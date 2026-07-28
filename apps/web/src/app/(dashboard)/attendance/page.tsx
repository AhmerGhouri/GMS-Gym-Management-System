'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock, Search, Users, RefreshCw, Wifi } from 'lucide-react';
import { api } from '@/lib/api/axios';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@gms/utils';

export default function AttendancePage() {
  const [search, setSearch] = useState('');

  const { data: logsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      const res = await api.get('/attendance?take=200');
      return res.data;
    },
    refetchInterval: 60_000, // refresh every minute
  });

  const { data: summaryData } = useQuery({
    queryKey: ['attendance-summary'],
    queryFn: async () => {
      const res = await api.get('/attendance/summary');
      return res.data;
    },
    refetchInterval: 60_000,
  });

  const attendanceLogs = Array.isArray(logsData)
    ? logsData
    : logsData?.data || [];

  const summary = summaryData?.data || summaryData;
  const chartData = summary?.last7Days || [];
  const todayCount = summary?.todayCount ?? attendanceLogs.filter((log: any) => {
    const today = new Date().toDateString();
    return new Date(log.checkIn).toDateString() === today;
  }).length;

  const filteredLogs = attendanceLogs.filter((log: any) => {
    if (!search) return true;
    const memberName = `${log.member?.firstName} ${log.member?.lastName}`.toLowerCase();
    const memberId = log.member?.memberId?.toLowerCase() || '';
    return memberName.includes(search.toLowerCase()) || memberId.includes(search.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Loading attendance logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Attendance</h1>
          <p className="text-slate-400">Live member check-ins from the ZKTeco device.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-slate-700 text-slate-300 hover:text-white gap-2"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-cyan-500/10 p-2.5">
              <Users className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{todayCount}</p>
              <p className="text-xs text-slate-400">Today's Check-ins</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-violet-500/10 p-2.5">
              <CalendarDays className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{attendanceLogs.length}</p>
              <p className="text-xs text-slate-400">Total Records (Last 200)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-emerald-500/10 p-2.5">
              <Wifi className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {attendanceLogs.filter((l: any) => l.source === 'DEVICE').length}
              </p>
              <p className="text-xs text-slate-400">Device Records</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Chart */}
      {chartData.length > 0 && (
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-500" />
              7-Day Attendance Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="attendanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  stroke="#475569"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { weekday: 'short' })}
                />
                <YAxis stroke="#475569" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
                  labelStyle={{ color: '#94a3b8' }}
                  itemStyle={{ color: '#06b6d4' }}
                  labelFormatter={(v) => new Date(v).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#attendanceGrad)"
                  name="Check-ins"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="border-slate-800 bg-slate-900/50">
        <div className="flex items-center border-b border-slate-800 p-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search by member name or ID..."
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              className="pl-9 border-slate-800 bg-slate-950 text-white placeholder:text-slate-500"
            />
          </div>
          <p className="ml-auto text-xs text-slate-500">
            Showing {filteredLogs.length} of {attendanceLogs.length} records
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                  No attendance records found.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-medium text-slate-300">
                        {log.member?.firstName?.[0]}{log.member?.lastName?.[0]}
                      </div>
                      <div className="font-medium text-white">
                        {log.member?.firstName} {log.member?.lastName}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">
                    {log.member?.memberId}
                  </TableCell>
                  <TableCell className="text-slate-300">{formatDate(log.checkIn)}</TableCell>
                  <TableCell className="text-emerald-400 font-mono text-sm">
                    {new Date(log.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell className="text-blue-400 font-mono text-sm">
                    {log.checkOut
                      ? new Date(log.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                      : <span className="text-slate-600">—</span>}
                  </TableCell>
                  <TableCell className="text-slate-400 text-xs">
                    {log.device?.name ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        log.source === 'DEVICE'
                          ? 'bg-cyan-500/15 text-cyan-400 border-transparent'
                          : 'bg-slate-700/30 text-slate-400 border-transparent'
                      }
                    >
                      {log.source}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
