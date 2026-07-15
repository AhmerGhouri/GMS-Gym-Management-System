'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Search, MoreHorizontal, FileDown } from 'lucide-react';
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
import { formatDate } from '@gms/utils';

export default function MembersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['members', page, search],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PaginatedResult<Member>>>('/members', {
        params: { page, limit: 10, search: search || undefined },
      });
      return res.data;
    },
  });

  const members = data?.data?.items || [];
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
        <div className="flex items-center border-b border-slate-800 p-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search by name, ID, phone..."
              value={search}
              onChange={(e) => {
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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                  Loading members...
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
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
                  <TableCell>
                    {getStatusBadge(member.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
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
