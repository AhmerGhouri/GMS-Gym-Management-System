'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Plus, Search, MoreHorizontal, FileDown, Eye, Trash2, ShieldAlert } from 'lucide-react';
import { api } from '@/lib/api/axios';
import { Member, ApiResponse, PaginatedResult, MemberStatus } from '@gms/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  const status = searchParams.get('status') || undefined;
  const gender = searchParams.get('gender') || undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['members', page, search, status, gender],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PaginatedResult<Member>>>('/members', {
        params: { page, limit: 10, search: search || undefined, status, gender },
      });
      return res.data;
    },
  });

  // The API response interceptor maps paginated results to:
  // { success: true, data: T[], meta: PaginationMeta }
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Members</h1>
          <p className="text-slate-400">Manage gym members and their subscriptions.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-300">
            <FileDown className="mr-2 h-4 w-4" /> Export
          </Button>
          <Link href="/members/new">
            <Button className="bg-cyan-600 text-white hover:bg-cyan-500">
              <Plus className="mr-2 h-4 w-4" /> Add Member
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-800 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-fit rounded-lg bg-slate-950 p-1 text-sm">
            {[
              { label: 'All Members', href: '/members', value: undefined },
              { label: 'Male', href: '/members?gender=MALE', value: 'MALE' },
              { label: 'Female', href: '/members?gender=FEMALE', value: 'FEMALE' },
            ].map((tab) => (
              <Link
                key={tab.label}
                href={tab.href}
                className={`rounded-md px-3 py-1.5 transition-colors ${gender === tab.value ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
                onClick={() => setPage(1)}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search by name, ID, phone..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9 border-slate-800 bg-slate-950 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Membership Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  Loading members...
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  No members found.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-sm font-medium text-slate-300">
                        {member.firstName[0]}{member.lastName[0]}
                      </div>
                      <div>
                        <Link href={`/members/${member.id}`} className="font-medium text-white hover:text-cyan-400">
                          {member.firstName} {member.lastName}
                        </Link>
                        <div className="text-xs text-slate-500">{member.memberId}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-300">{member.phone}</div>
                    <div className="text-xs text-slate-500">{member.email || 'N/A'}</div>
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {formatDate(member.joiningDate)}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {(member as any).activeMembership?.plan?.name || 'No active plan'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(member.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-slate-900 border-slate-800 text-slate-300">
                        <DropdownMenuItem asChild className="hover:bg-slate-800 hover:text-white cursor-pointer">
                          <Link href={`/members/${member.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-800" />
                        <DropdownMenuItem 
                          className="hover:bg-slate-800 hover:text-white cursor-pointer text-destructive"
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

        {/* Pagination controls */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 p-4">
            <div className="text-sm text-slate-500">
              Showing <span className="font-medium text-white">{((meta.page - 1) * meta.limit) + 1}</span> to <span className="font-medium text-white">{Math.min(meta.page * meta.limit, meta.total)}</span> of <span className="font-medium text-white">{meta.total}</span> results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!meta.hasPreviousPage}
                className="border-slate-700 bg-slate-900 text-slate-300 disabled:opacity-50"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={!meta.hasNextPage}
                className="border-slate-700 bg-slate-900 text-slate-300 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
