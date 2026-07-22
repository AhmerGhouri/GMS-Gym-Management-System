'use client';

import { useAuthStore } from '@/lib/stores/auth.store';
import { api } from '@/lib/api/axios';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@gms/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Users,
  UserCheck,
  UserX,
  CalendarDays,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  LogIn,
  LogOut,
  CreditCard,
  UserPlus,
  ShieldAlert,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981'];

const activityIcons: Record<string, any> = {
  check_in: LogIn,
  check_out: LogOut,
  payment: CreditCard,
  new_member: UserPlus,
  access_denied: ShieldAlert,
};

const activityColors: Record<string, string> = {
  check_in: 'text-emerald-400',
  check_out: 'text-blue-400',
  payment: 'text-cyan-400',
  new_member: 'text-violet-400',
  access_denied: 'text-rose-400',
};

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats');
      return res.data;
    },
  });

  const { data: recentActivityData, isLoading: isActivityLoading } = useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: async () => {
      const res = await api.get('/dashboard/recent-activity');
      return res.data;
    },
  });

  const recentActivity = recentActivityData?.data || [];

  const stats = statsData?.data || {
    totalMembers: 0,
    activeMembers: 0,
    expiredMembers: 0,
    todayAttendance: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    outstandingDues: 0,
    revenueTrend: [],
    membershipDistribution: [],
    attendancePattern: [],
  };

  const statCards = [
    {
      title: 'Total Members',
      value: stats.totalMembers?.toString(),
      icon: Users,
      change: '+12',
      trend: 'up' as const,
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
    },
    {
      title: 'Active Members',
      value: stats.activeMembers?.toString(),
      icon: UserCheck,
      change: '+8',
      trend: 'up' as const,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Expired',
      value: stats.expiredMembers?.toString(),
      icon: UserX,
      change: '-3',
      trend: 'down' as const,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      title: "Today's Attendance",
      value: stats.todayAttendance?.toString(),
      icon: CalendarDays,
      change: '+5',
      trend: 'up' as const,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.monthlyRevenue || 0),
      icon: DollarSign,
      change: '+18%',
      trend: 'up' as const,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Outstanding Dues',
      value: formatCurrency(stats.outstandingDues || 0),
      icon: TrendingUp,
      change: '-5%',
      trend: 'down' as const,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
    },
  ];

  if (isStatsLoading) {
    return <div className="text-white">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-slate-400">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}. Here is what is happening today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-slate-800 bg-slate-900/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2 ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className={`flex items-center text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                  {stat.change}
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="ml-0.5 h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="ml-0.5 h-3 w-3" />
                  )}
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="border-slate-800 bg-slate-900/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-white">Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.revenueTrend || []}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Membership Distribution */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-white">Membership Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.membershipDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="plan"
                  >
                    {(stats.membershipDistribution || []).map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(stats.membershipDistribution || []).map((item: any, index: number) => (
                <div key={item.plan} className="flex items-center gap-2 text-xs">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-slate-400">{item.plan}</span>
                  <span className="ml-auto font-medium text-white">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Attendance Chart */}
        <Card className="border-slate-800 bg-slate-900/50 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-white">Weekly Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.attendancePattern || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                    }}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-white">Recent Activity</CardTitle>
              <Activity className="h-4 w-4 text-slate-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity: any) => {
                const Icon = activityIcons[activity.type] || Activity;
                const color = activityColors[activity.type];
                return (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-full bg-slate-800 p-1.5">
                      <Icon className={`h-3 w-3 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{activity.memberName}</p>
                      <p className="text-xs text-slate-500 truncate">{activity.description}</p>
                    </div>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(activity.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
