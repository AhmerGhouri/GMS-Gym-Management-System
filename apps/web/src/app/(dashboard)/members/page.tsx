'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, MoreHorizontal, FileDown, Eye, Trash2, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api/axios';
import { Member, ApiResponse, PaginatedResult, MemberStatus } from '@gms/types';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { formatDate } from '@gms/utils';

export default function MembersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const gender = searchParams.get('gender') || undefined;
  const [timeSlot, setTimeSlot] = useState<string | undefined>();
  const [planId, setPlanId] = useState<string | undefined>();
  const [joiningDateFrom, setJoiningDateFrom] = useState('');
  const [joiningDateTo, setJoiningDateTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await api.get<ApiResponse<PaginatedResult<Member>>>('/members', {
        params: { 
          page: 1, 
          limit: 10000, 
          search: search || undefined, 
          status: statusFilter === 'all' ? undefined : statusFilter, 
          gender, 
          timeSlot, 
          planId, 
          joiningDateFrom: joiningDateFrom || undefined, 
          joiningDateTo: joiningDateTo || undefined 
        },
      });
      
      const allMembers = Array.isArray(res.data?.data) ? res.data.data : [];
      if (allMembers.length === 0) {
        toast({ title: 'Export Failed', description: 'No members found to export.', variant: 'destructive' });
        return;
      }

      const csvRows = [];
      const headers = ['Member ID', 'First Name', 'Last Name', 'Gender', 'Phone', 'CNIC', 'Status', 'Joining Date', 'Time Slot'];
      csvRows.push(headers.join(','));

      for (const m of allMembers) {
        const row = [
          m.memberId,
          `"${m.firstName || ''}"`,
          `"${m.lastName || ''}"`,
          m.gender || '',
          m.phone || '',
          m.cnic || '',
          m.status || '',
          m.joiningDate ? new Date(m.joiningDate).toLocaleDateString() : '',
          m.timeSlot || ''
        ];
        csvRows.push(row.join(','));
      }

      const csvData = csvRows.join('\n');
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `members_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({ title: 'Export Successful', description: `Exported ${allMembers.length} members.` });
    } catch (error) {
      console.error('Export error:', error);
      toast({ title: 'Export Failed', description: 'An error occurred while exporting members.', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };
  
  const { data: slotsData } = useQuery({ 
    queryKey: ['gym-slots'], 
    queryFn: async () => (await api.get('/settings/slots')).data 
  });
  const slots = slotsData?.data || [];
  const { data: plansData } = useQuery({
    queryKey: ['membership-plans'],
    queryFn: async () => (await api.get('/memberships/plans')).data,
  });
  const plans = (Array.isArray(plansData) ? plansData : plansData?.data || []).filter((plan: any) => plan.isActive);

  const { data, isLoading } = useQuery({
    queryKey: ['members', page, search, statusFilter, gender, timeSlot, planId, joiningDateFrom, joiningDateTo],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PaginatedResult<Member>>>('/members', {
        params: { page, limit: 10, search: search || undefined, status: statusFilter === 'all' ? undefined : statusFilter, gender, timeSlot, planId, joiningDateFrom: joiningDateFrom || undefined, joiningDateTo: joiningDateTo || undefined },
      });
      return res.data;
    },
  });

  const members = Array.isArray(data?.data) ? data.data : [];
  const meta = data?.meta;

  const getStatusBadge = (status: MemberStatus) => {
    switch (status) {
      case 'ACTIVE': return <Badge variant="success">Active</Badge>;
      case 'INACTIVE': return <Badge variant="secondary">Inactive</Badge>;
      case 'SUSPENDED': return <Badge variant="warning">Suspended</Badge>;
      case 'DELETED': return <Badge variant="destructive">Deleted</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <motion.div 
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Members</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage gym members and their subscriptions.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/members/import">
            <Button variant="outline" className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm">
              <FileDown className="mr-2 h-4 w-4" /> Bulk Import
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={handleExport}
            disabled={isExporting}
            className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm"
          >
            <FileDown className={`mr-2 h-4 w-4 ${isExporting ? 'animate-pulse' : ''}`} /> 
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
          <Link href="/members/new">
            <Button className="bg-cyan-600 text-white hover:bg-cyan-500 shadow-md hover:shadow-lg transition-all">
              <Plus className="mr-2 h-4 w-4" /> Add Member
            </Button>
          </Link>
        </div>
      </motion.div>

      <motion.div 
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-fit rounded-lg bg-slate-100 dark:bg-slate-950 p-1 text-sm shadow-inner">
            {[
              { label: 'All Members', href: '/members', value: undefined },
              { label: 'Male', href: '/members?gender=MALE', value: 'MALE' },
              { label: 'Female', href: '/members?gender=FEMALE', value: 'FEMALE' },
            ].map((tab) => (
              <Link
                key={tab.label}
                href={tab.href}
                className={`rounded-md px-3 py-1.5 transition-all ${
                  gender === tab.value 
                    ? 'bg-white dark:bg-cyan-600 text-slate-900 dark:text-white shadow-sm font-medium' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                onClick={() => setPage(1)}
              >
                {tab.label}
              </Link>
            ))}
            </div>
            <div className="relative w-full lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <Input
                placeholder="Search by name, ID, phone..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:ring-cyan-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Select onValueChange={(value) => { setTimeSlot(value === 'all' ? undefined : value); setPage(1); }}>
            <SelectTrigger className="w-full border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
              <SelectValue placeholder="All slots" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All slots</SelectItem>
              {slots.map((slot: any) => <SelectItem key={slot.id} value={slot.name}>{slot.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
            <SelectTrigger className="w-full border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => { setPlanId(value === 'all' ? undefined : value); setPage(1); }}>
            <SelectTrigger className="w-full border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"><SelectValue placeholder="All plans" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              {plans.map((plan: any) => <SelectItem key={plan.id} value={plan.id}>{plan.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={joiningDateFrom} onChange={(event) => { setJoiningDateFrom(event.target.value); setPage(1); }} className="w-full border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" aria-label="Joining date from" />
          <Input type="date" value={joiningDateTo} onChange={(event) => { setJoiningDateTo(event.target.value); setPage(1); }} className="w-full border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950" aria-label="Joining date to" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-600 dark:text-slate-400">Member</TableHead>
                <TableHead className="text-slate-600 dark:text-slate-400">Contact</TableHead>
                <TableHead className="text-slate-600 dark:text-slate-400">Joined</TableHead>
                <TableHead className="text-slate-600 dark:text-slate-400">Membership Plan</TableHead>
                <TableHead className="text-slate-600 dark:text-slate-400">Time Slot</TableHead>
                <TableHead className="text-slate-600 dark:text-slate-400">Status</TableHead>
                <TableHead className="text-right text-slate-600 dark:text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                      Loading members...
                    </div>
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                      <p>No members found.</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">Try adjusting your search or filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member, i) => (
                  <TableRow 
                    key={member.id} 
                    className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-sm font-medium text-cyan-700 dark:text-cyan-400">
                          {member.firstName[0]}
                          {/* {member.lastName[0]} */}
                        </div>
                        <div>
                          <Link href={`/members/${member.id}`} className="font-medium text-slate-900 dark:text-white hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
                            {member.firstName} {member.lastName}
                          </Link>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{member.memberId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-700 dark:text-slate-300">{member.phone}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{member.email || 'N/A'}</div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                      {formatDate(member.joiningDate)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                      {(member as any).activeMembership?.plan?.name || <span className="text-slate-400 dark:text-slate-500 italic">No active plan</span>}
                    </TableCell>
                    <TableCell className="text-sm text-slate-700 dark:text-slate-300">{(member as any).timeSlot || '—'}</TableCell>
                    <TableCell>
                      {getStatusBadge(member.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shadow-lg">
                          <DropdownMenuItem asChild className="hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-white">
                            <Link href={`/members/${member.id}`}>
                              <Eye className="mr-2 h-4 w-4 text-slate-400" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                            <Link href={`/members/${member.id}?tab=membership`}>
                              <Eye className="mr-2 h-4 w-4 text-slate-400" />
                              View Membership Plan
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                            <Link href={`/payments?memberId=${member.id}`}>
                              <Eye className="mr-2 h-4 w-4 text-slate-400" />
                              View Payment Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
                          <DropdownMenuItem 
                            className="hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer text-rose-500 focus:bg-rose-50 dark:focus:bg-rose-500/10 focus:text-rose-600 dark:focus:text-rose-400"
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this member?')) {
                                try {
                                  await api.delete(`/members/${member.id}`);
                                  toast({ title: 'Deleted', description: 'Member deleted.', variant: 'success' });
                                  queryClient.invalidateQueries({ queryKey: ['members'] });
                                } catch (err: any) {
                                  toast({ title: 'Error', description: err.response?.data?.message || 'Failed to delete member.', variant: 'destructive' });
                                }
                              }
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Member
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination controls */}
        {meta && meta.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800 p-4 gap-4">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Showing <span className="font-medium text-slate-900 dark:text-white">{((meta.page - 1) * meta.limit) + 1}</span> to <span className="font-medium text-slate-900 dark:text-white">{Math.min(meta.page * meta.limit, meta.total)}</span> of <span className="font-medium text-slate-900 dark:text-white">{meta.total}</span> results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!meta.hasPreviousPage}
                className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!meta.hasNextPage}
                className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
