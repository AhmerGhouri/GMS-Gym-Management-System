'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileDown,
  TrendingUp,
  Users,
  UserCheck,
  UserPlus,
  UserX,
  DollarSign,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Printer,
  Calendar,
  RefreshCw,
  Clock,
} from 'lucide-react';
import * as XLSX from 'xlsx';
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
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);

  // Generate list of the last 24 months for the dropdown selector
  const monthOptions = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yr = d.getFullYear();
    const mo = d.getMonth() + 1;
    return {
      year: yr,
      month: mo,
      key: `${yr}-${mo}`,
      label: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      isCurrent: yr === now.getFullYear() && mo === now.getMonth() + 1,
    };
  });

  const { data: statsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['reports-stats', selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats', {
        params: { month: selectedMonth, year: selectedYear },
      });
      return res.data;
    },
  });

  const stats = statsData?.data || {
    monthlyRevenue: 0,
    monthlyNewMembers: 0,
    monthlyExpiredMembers: 0,
    monthlyAttendance: 0,
    monthlyOutstandingDues: 0,
    totalRevenue: 0,
    totalMembers: 0,
    activeMembers: 0,
    expiredMembers: 0,
    totalOutstandingDues: 0,
    todayAttendance: 0,
    selectedMonthLabel: '',
    revenueTrend: [],
    memberGrowth: [],
    attendancePattern: [],
    membershipDistribution: [],
    changes: {},
  };

  const change = (value?: number) => `${(value || 0) >= 0 ? '+' : ''}${value || 0}%`;

  const handleMonthChange = (val: string) => {
    const [yr, mo] = val.split('-').map(Number);
    if (yr && mo) {
      setSelectedYear(yr);
      setSelectedMonth(mo);
    }
  };

  const setQuickMonth = (offset: number) => {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    setSelectedYear(d.getFullYear());
    setSelectedMonth(d.getMonth() + 1);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    const summaryData = [
      { Category: 'Overall Gym Totals', Metric: 'Total All-Time Revenue', Value: formatCurrency(stats.totalRevenue || 0) },
      { Category: 'Overall Gym Totals', Metric: 'Total Registered Members', Value: stats.totalMembers || 0 },
      { Category: 'Overall Gym Totals', Metric: 'Currently Active Members', Value: stats.activeMembers || 0 },
      { Category: 'Overall Gym Totals', Metric: 'Total Outstanding Dues', Value: formatCurrency(stats.totalOutstandingDues || 0) },
      { Category: `Selected Month (${stats.selectedMonthLabel || 'Month'})`, Metric: 'Revenue Collected', Value: formatCurrency(stats.monthlyRevenue || 0) },
      { Category: `Selected Month (${stats.selectedMonthLabel || 'Month'})`, Metric: 'New Members Added', Value: stats.monthlyNewMembers || 0 },
      { Category: `Selected Month (${stats.selectedMonthLabel || 'Month'})`, Metric: 'Members Expired', Value: stats.monthlyExpiredMembers || 0 },
      { Category: `Selected Month (${stats.selectedMonthLabel || 'Month'})`, Metric: 'Total Attendance Check-ins', Value: stats.monthlyAttendance || 0 },
      { Category: `Selected Month (${stats.selectedMonthLabel || 'Month'})`, Metric: 'Month Dues Generated', Value: formatCurrency(stats.monthlyOutstandingDues || 0) },
    ];
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryData), 'Summary Report');

    if (stats.revenueTrend?.length) {
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(stats.revenueTrend), 'Revenue Trend');
    }

    if (stats.memberGrowth?.length) {
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(stats.memberGrowth), 'Member Growth');
    }

    if (stats.attendancePattern?.length) {
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(stats.attendancePattern), 'Attendance Pattern');
    }

    if (stats.membershipDistribution?.length) {
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(stats.membershipDistribution), 'Plan Distribution');
    }

    XLSX.writeFile(workbook, `Gym_Report_${selectedYear}_${String(selectedMonth).padStart(2, '0')}.xlsx`);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:m-0 print:p-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Gym Analytics & Reports</h1>
          <p className="text-slate-400">Comprehensive historical performance and monthly breakdown.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white" onClick={printReport}>
            <Printer className="mr-2 h-4 w-4" /> Export PDF
          </Button>
          <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white" onClick={exportToExcel}>
            <FileDown className="mr-2 h-4 w-4" /> Export Excel
          </Button>
        </div>
      </div>

      {/* SECTION 1: ALL-TIME OVERALL GYM DATA */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
          <TrendingUp className="h-4 w-4 text-cyan-400" />
          Overall Gym Performance (All-Time)
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Revenue (All-Time)"
            value={formatCurrency(stats.totalRevenue || 0)}
            subtitle="All collected payments"
            icon={DollarSign}
            color="text-emerald-500"
            bg="bg-emerald-500/10"
          />
          <SummaryCard
            title="Total Members"
            value={(stats.totalMembers || 0).toString()}
            subtitle="All-time registered members"
            icon={Users}
            color="text-cyan-500"
            bg="bg-cyan-500/10"
          />
          <SummaryCard
            title="Active Members"
            value={(stats.activeMembers || 0).toString()}
            subtitle={`${stats.totalMembers ? Math.round(((stats.activeMembers || 0) / stats.totalMembers) * 100) : 0}% of all members`}
            icon={UserCheck}
            color="text-violet-500"
            bg="bg-violet-500/10"
          />
          <SummaryCard
            title="Total Outstanding Dues"
            value={formatCurrency(stats.totalOutstandingDues || 0)}
            subtitle="Cumulative pending balance"
            icon={Clock}
            color="text-amber-500"
            bg="bg-amber-500/10"
          />
        </div>
      </div>

      {/* SECTION 2: MONTH SELECTION & MONTHLY DATA */}
      <div className="space-y-4 pt-2">
        <Card className="border-cyan-900/40 bg-slate-900/80 shadow-md">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-cyan-400" />
                  <h2 className="text-xl font-bold text-white">
                    {stats.selectedMonthLabel || 'Monthly Performance'}
                  </h2>
                  {stats.isCurrentMonth && (
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                      Current Month
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Select any month to inspect detailed financial metrics, attendance, and member registration history.
                </p>
              </div>

              {/* Month Selector Controls */}
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <Button
                  size="sm"
                  variant={stats.isCurrentMonth ? 'default' : 'outline'}
                  className={stats.isCurrentMonth ? 'bg-cyan-600 text-white' : 'border-slate-700 text-slate-300'}
                  onClick={() => setQuickMonth(0)}
                >
                  This Month
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-700 text-slate-300"
                  onClick={() => setQuickMonth(1)}
                >
                  Last Month
                </Button>

                {/* Dropdown Selector */}
                <div className="w-[200px]">
                  <Select
                    value={`${selectedYear}-${selectedMonth}`}
                    onValueChange={handleMonthChange}
                  >
                    <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200">
                      <SelectValue placeholder="Choose Month" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-800 bg-slate-900 text-slate-200 max-h-72">
                      {monthOptions.map((opt) => (
                        <SelectItem key={opt.key} value={opt.key}>
                          {opt.label} {opt.isCurrent ? ' (Current)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  size="icon"
                  variant="outline"
                  className="border-slate-700 text-slate-300"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  title="Refresh data"
                >
                  <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Selected Month Key Metrics Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-5">
              <MonthlyStatCard
                title={`Revenue (${stats.selectedMonthLabel})`}
                value={formatCurrency(stats.monthlyRevenue || 0)}
                change={change(stats.changes?.monthlyRevenue)}
                trend={(stats.changes?.monthlyRevenue || 0) >= 0 ? 'up' : 'down'}
                icon={DollarSign}
                color="text-emerald-400"
                bg="bg-emerald-500/10"
              />
              <MonthlyStatCard
                title="New Members Added"
                value={(stats.monthlyNewMembers || 0).toString()}
                change={change(stats.changes?.monthlyNewMembers)}
                trend={(stats.changes?.monthlyNewMembers || 0) >= 0 ? 'up' : 'down'}
                icon={UserPlus}
                color="text-cyan-400"
                bg="bg-cyan-500/10"
              />
              <MonthlyStatCard
                title="Members Expired"
                value={(stats.monthlyExpiredMembers || 0).toString()}
                change={change(stats.changes?.monthlyExpiredMembers)}
                trend={(stats.changes?.monthlyExpiredMembers || 0) > 0 ? 'down' : 'up'}
                icon={UserX}
                color="text-amber-400"
                bg="bg-amber-500/10"
              />
              <MonthlyStatCard
                title="Total Check-ins"
                value={(stats.monthlyAttendance || 0).toString()}
                subtitle="Attendance scans in month"
                icon={CalendarDays}
                color="text-violet-400"
                bg="bg-violet-500/10"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: CHARTS & TRENDS (CONTEXTUAL TO SELECTED PERIOD) */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-white flex items-center justify-between">
              <span>Revenue Trend (6-Month Trajectory)</span>
              <span className="text-xs text-slate-400 font-normal">Ending {stats.selectedMonthLabel}</span>
            </CardTitle>
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
            <CardTitle className="text-base font-medium text-white flex items-center justify-between">
              <span>Cumulative Member Growth</span>
              <span className="text-xs text-slate-400 font-normal">Active & Past</span>
            </CardTitle>
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
            <CardTitle className="text-base font-medium text-white">Daily Attendance Pattern (Last 7 Days)</CardTitle>
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

        {/* Plan Distribution */}
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium text-white flex items-center justify-between">
              <span>Plan Distribution ({stats.selectedMonthLabel})</span>
              <span className="text-xs text-slate-400 font-normal">Active Memberships</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.membershipDistribution?.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-slate-500 text-sm">
                No active plan data for this period.
              </div>
            ) : (
              <div className="grid gap-3 pt-2">
                {(stats.membershipDistribution || []).map((item: any) => (
                  <div key={item.plan} className="rounded-lg bg-slate-800/50 p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-200">{item.plan}</div>
                      <div className="text-sm font-bold text-white">{item.count} members ({item.percentage}%)</div>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-slate-700">
                      <div
                        className="h-2 rounded-full bg-cyan-500 transition-all"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <Card className="border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className={`rounded-lg p-2.5 ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs font-medium text-slate-300 mt-0.5">{title}</p>
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function MonthlyStatCard({
  title,
  value,
  change,
  trend,
  subtitle,
  icon: Icon,
  color,
  bg,
}: {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}) {
  return (
    <Card className="border-slate-800 bg-slate-900/90 hover:border-cyan-900/50 transition-all">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className={`rounded-lg p-2 ${bg}`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          {change && trend && (
            <div className={`flex items-center text-xs font-semibold ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {change}
              {trend === 'up' ? <ArrowUpRight className="ml-0.5 h-3 w-3" /> : <ArrowDownRight className="ml-0.5 h-3 w-3" />}
            </div>
          )}
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-xs text-slate-300 mt-0.5 font-medium">{title}</p>
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
