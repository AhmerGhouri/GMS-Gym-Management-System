'use client';

import { useAuthStore } from '@/lib/stores/auth.store';
import Link from 'next/link';
import { api } from '@/lib/api/axios';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@gms/utils';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
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
  WifiOff,
  Clock,
  Eye,
  EyeOff
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
import { useTheme } from 'next-themes';

const COLORS = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981'];

const activityIcons: Record<string, any> = {
  check_in: LogIn,
  check_out: LogOut,
  payment: CreditCard,
  new_member: UserPlus,
  access_denied: ShieldAlert,
};

const activityColors: Record<string, string> = {
  check_in: 'text-emerald-500 dark:text-emerald-400',
  check_out: 'text-blue-500 dark:text-blue-400',
  payment: 'text-cyan-600 dark:text-cyan-400',
  new_member: 'text-violet-500 dark:text-violet-400',
  access_denied: 'text-rose-500 dark:text-rose-400',
};

const activityBgColors: Record<string, string> = {
  check_in: 'bg-emerald-100 dark:bg-emerald-500/10',
  check_out: 'bg-blue-100 dark:bg-blue-500/10',
  payment: 'bg-cyan-100 dark:bg-cyan-500/10',
  new_member: 'bg-violet-100 dark:bg-violet-500/10',
  access_denied: 'bg-rose-100 dark:bg-rose-500/10',
};

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const { theme } = useTheme();
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);

  const hasReportsAccess = user?.role === 'SUPER_ADMIN' || user?.customRole?.permissions?.includes('reports.view');


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
    offlineDevices: 0,
    pendingJobs: 0,
    revenueTrend: [],
    membershipDistribution: [],
    attendancePattern: [],
    changes: {},
  };
  const change = (value?: number) => `${(value || 0) >= 0 ? '+' : ''}${value || 0}%`;

  const statCards = [
    {
      title: 'Total Members',
      value: isPrivacyMode ? '***' : stats.totalMembers?.toString(),
      icon: Users,
      change: change(stats.changes?.totalMembers),
      trend: 'up' as const,
      color: 'text-cyan-600 dark:text-cyan-500',
      bg: 'bg-cyan-100 dark:bg-cyan-500/10',
      href: '/members',
    },
    {
      title: "Today's Attendance",
      value: isPrivacyMode ? '***' : stats.todayAttendance?.toString(),
      icon: CalendarDays,
      change: change(stats.changes?.todayAttendance),
      trend: 'up' as const,
      color: 'text-violet-600 dark:text-violet-500',
      bg: 'bg-violet-100 dark:bg-violet-500/10',
      href: '/attendance',
    },
    ...(hasReportsAccess ? [{
      title: 'Monthly Revenue',
      value: isPrivacyMode ? '***' : formatCurrency(stats.monthlyRevenue || 0),
      icon: DollarSign,
      change: change(stats.changes?.monthlyRevenue),
      trend: 'up' as const,
      color: 'text-emerald-600 dark:text-emerald-500',
      bg: 'bg-emerald-100 dark:bg-emerald-500/10',
      href: '/reports',
    }] : []),
    {
      title: 'Expired Memberships',
      value: stats.expiredMembers?.toString(),
      icon: UserX,
      change: change(stats.changes?.expiredMembers),
      trend: (stats.changes?.expiredMembers || 0) > 0 ? 'up' as const : 'down' as const,
      color: 'text-amber-600 dark:text-amber-500',
      bg: 'bg-amber-100 dark:bg-amber-500/10',
      href: '/members?status=INACTIVE',
    },
    {
      title: 'Male Members',
      value: stats.maleMembers?.toString() || '0',
      icon: Users,
      change: '',
      trend: 'up' as const,
      color: 'text-blue-600 dark:text-blue-500',
      bg: 'bg-blue-100 dark:bg-blue-500/10',
      href: '/members?gender=MALE',
    },
    {
      title: 'Female Members',
      value: stats.femaleMembers?.toString() || '0',
      icon: Users,
      change: '',
      trend: 'up' as const,
      color: 'text-pink-600 dark:text-pink-500',
      bg: 'bg-pink-100 dark:bg-pink-500/10',
      href: '/members?gender=FEMALE',
    },
    {
      title: 'Offline Devices',
      value: stats.offlineDevices?.toString() || '0',
      icon: WifiOff,
      change: 'Needs attention',
      trend: (stats.offlineDevices || 0) > 0 ? 'up' as const : 'down' as const,
      color: 'text-rose-600 dark:text-rose-500',
      bg: 'bg-rose-100 dark:bg-rose-500/10',
      href: '/devices',
    },
    {
      title: 'Pending Jobs',
      value: stats.pendingJobs?.toString() || '0',
      icon: Clock,
      change: 'In queue',
      trend: 'up' as const,
      color: 'text-indigo-600 dark:text-indigo-500',
      bg: 'bg-indigo-100 dark:bg-indigo-500/10',
      href: '/devices',
    },
  ];

  if (isStatsLoading) {
    return <div className="text-slate-500 dark:text-slate-400 animate-pulse">Loading dashboard...</div>;
  }

  // Handle chart styling based on theme
  const chartAxisColor = theme === 'light' ? '#94a3b8' : '#64748b';
  const chartGridColor = theme === 'light' ? '#e2e8f0' : '#1e293b';
  const chartTooltipBg = theme === 'light' ? '#ffffff' : '#1e293b';
  const chartTooltipBorder = theme === 'light' ? '#e2e8f0' : '#334155';
  const chartTooltipColor = theme === 'light' ? '#0f172a' : '#e2e8f0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
            <button
              onClick={() => setIsPrivacyMode(!isPrivacyMode)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
              title={isPrivacyMode ? "Show values" : "Hide values"}
            >
              {isPrivacyMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ''}. Here is what is happening today.
          </p>
          <div className="mt-2 flex gap-3 text-sm">
            <Link href="/members?gender=MALE" className="text-cyan-600 dark:text-cyan-400 hover:opacity-80">Male: {isPrivacyMode ? '***' : (stats.maleMembers || 0)}</Link>
            <Link href="/members?gender=FEMALE" className="text-violet-600 dark:text-violet-400 hover:opacity-80">Female: {isPrivacyMode ? '***' : (stats.femaleMembers || 0)}</Link>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Link href={stat.href} className="block">
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm transition-all hover:shadow-md hover:border-cyan-200 dark:hover:border-cyan-700 hover:-translate-y-1">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className={`rounded-lg p-2 ${stat.bg}`}>
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <div className={`flex items-center text-xs font-medium ${stat.trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {stat.change}
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="ml-0.5 h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="ml-0.5 h-3 w-3" />
                      )}
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-slate-900 dark:text-white">Revenue Overview</CardTitle>
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
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="month" stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke={chartAxisColor}
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartTooltipBg,
                        border: `1px solid ${chartTooltipBorder}`,
                        borderRadius: '8px',
                        color: chartTooltipColor,
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
        </motion.div>

        {/* Membership Distribution */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-slate-900 dark:text-white">Membership Plans</CardTitle>
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
                        backgroundColor: chartTooltipBg,
                        border: `1px solid ${chartTooltipBorder}`,
                        borderRadius: '8px',
                        color: chartTooltipColor,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(stats.membershipDistribution || []).map((item: any, index: number) => (
                  <div key={item.plan} className="flex items-center gap-2 text-xs">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-slate-600 dark:text-slate-400 truncate">{item.plan}</span>
                    <span className="ml-auto font-medium text-slate-900 dark:text-white">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Attendance Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-slate-900 dark:text-white">Weekly Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.attendancePattern || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                    <XAxis dataKey="date" stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={chartAxisColor} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: chartTooltipBg,
                        border: `1px solid ${chartTooltipBorder}`,
                        borderRadius: '8px',
                        color: chartTooltipColor,
                      }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm h-full">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium text-slate-900 dark:text-white">Recent Activity</CardTitle>
                <Activity className="h-4 w-4 text-slate-400 dark:text-slate-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity: any, index: number) => {
                  const Icon = activityIcons[activity.type] || Activity;
                  const color = activityColors[activity.type];
                  const bgColor = activityBgColors[activity.type] || 'bg-slate-100 dark:bg-slate-800';
                  
                  return (
                    <motion.div 
                      key={activity.id} 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className={`mt-0.5 rounded-full p-2 ${bgColor}`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{activity.memberName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{activity.description}</p>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {new Date(activity.timestamp).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
