'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileDown,
  TrendingUp,
  Users,
  DollarSign,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@gms/utils';
import { api } from '@/lib/api/axios';


export default function ReportsPage() {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data;
    },
  });

  const stats = statsData?.data || {
    monthlyRevenue: 0,
    activeMembers: 0,
    todayAttendance: 0,
    outstandingDues: 0,
    revenueTrend: [],
    memberGrowth: [],
    attendancePattern: [],
    membershipDistribution: [],
  };

  if (isLoading) {
    return <div className="text-white">Loading reports...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Reports</h1>
          <p className="text-slate-400">Analytics and insights for your gym.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-300">
            <FileDown className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-300">
            <FileDown className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Revenue"
          value={formatCurrency(stats?.monthlyRevenue || 0)}
          change="+18%"
          trend="up"
          icon={DollarSign}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <SummaryCard
          title="Active Members"
          value={(stats?.activeMembers || 0).toString()}
          change="+3.2%"
          trend="up"
          icon={Users}
          color="text-cyan-500"
          bg="bg-cyan-500/10"
        />
        <SummaryCard
          title="Today's Attendance"
          value={(stats?.todayAttendance || 0).toString()}
          change="+12%"
          trend="up"
          icon={CalendarDays}
          color="text-violet-500"
          bg="bg-violet-500/10"
        />
        <SummaryCard
          title="Outstanding Dues"
          value={formatCurrency(stats?.outstandingDues || 0)}
          change="-2%"
          trend="down"
          icon={TrendingUp}
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-white">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueTrend || []}>
                  <defs>
                    <linearGradient id="reportRevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#reportRevGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Member Growth */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-white">Member Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.memberGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                  />
                  <Line type="monotone" dataKey="members" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: '#0ea5e9', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Patterns */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-white">Weekly Attendance Pattern</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.attendancePattern || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Retention Rate */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-white">Retention Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.memberGrowth || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[80, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                    formatter={(value: number) => [`${value}%`, 'Retention']}
                  />
                  <Line type="monotone" dataKey="members" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base font-medium text-white">Membership Plan Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            {(stats.membershipDistribution || []).map((item: any) => (
              <div key={item.plan} className="rounded-lg bg-slate-800/50 p-4">
                <div className="text-sm text-slate-400">{item.plan}</div>
                <div className="mt-1 text-2xl font-bold text-white">{item.count}</div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-700">
                  <div
                    className="h-2 rounded-full bg-cyan-500 transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-slate-500">{item.percentage}% of total</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  title, value, change, trend, icon: Icon, color, bg,
}: {
  title: string; value: string; change: string; trend: 'up' | 'down';
  icon: React.ElementType; color: string; bg: string;
}) {
  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className={`rounded-lg p-2 ${bg}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <div className={`flex items-center text-xs font-medium ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
            {change}
            {trend === 'up' ? <ArrowUpRight className="ml-0.5 h-3 w-3" /> : <ArrowDownRight className="ml-0.5 h-3 w-3" />}
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-400">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
}
