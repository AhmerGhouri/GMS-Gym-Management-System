'use client';

import { useState } from 'react';
import { CalendarDays, Clock, Search, Users, ArrowUpRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockAttendanceLogs } from '@/lib/mock-data';
import { formatDate, formatDuration } from '@gms/utils';

export default function AttendancePage() {
  const [search, setSearch] = useState('');

  const filteredLogs = mockAttendanceLogs.filter((log) => {
    if (!search) return true;
    const memberName = `${log.member?.firstName} ${log.member?.lastName}`.toLowerCase();
    return memberName.includes(search.toLowerCase());
  });

  // Today's stats
  const todayLogs = mockAttendanceLogs.filter((log) => {
    const today = new Date().toDateString();
    return new Date(log.checkIn).toDateString() === today;
  });

  const totalCheckedIn = mockAttendanceLogs.length;
  const avgDuration = Math.round(
    mockAttendanceLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / mockAttendanceLogs.length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Attendance</h1>
        <p className="text-slate-400">Track member check-ins and gym activity.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-cyan-500/10 p-2.5">
              <Users className="h-5 w-5 text-cyan-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalCheckedIn}</p>
              <p className="text-xs text-slate-400">Total Check-ins</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-violet-500/10 p-2.5">
              <Clock className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatDuration(avgDuration)}</p>
              <p className="text-xs text-slate-400">Avg. Session</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-emerald-500/10 p-2.5">
              <ArrowUpRight className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {mockAttendanceLogs.filter((l) => l.checkOut).length}
              </p>
              <p className="text-xs text-slate-400">Checked Out</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-slate-800 bg-slate-900/50">
        <div className="flex items-center border-b border-slate-800 p-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search by member name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 border-slate-800 bg-slate-950 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Check In</TableHead>
              <TableHead>Check Out</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  No attendance records found.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-medium text-slate-300">
                        {log.member?.firstName[0]}{log.member?.lastName[0]}
                      </div>
                      <div className="font-medium text-white">
                        {log.member?.firstName} {log.member?.lastName}
                      </div>
                    </div>
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
                  <TableCell className="text-slate-300">
                    {log.duration ? formatDuration(log.duration) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={log.source === 'Device' ? 'default' : 'outline'}
                      className={log.source === 'Device' ? 'bg-cyan-500/15 text-cyan-500 border-transparent' : ''}
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
