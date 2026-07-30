'use client';

import { Bell, Search, User } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/axios';

export function Header() {
  const user = useAuthStore((state) => state.user);
  
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data,
    refetchInterval: 30000,
  });
  
  const notificationsArray = Array.isArray(data) ? data : (data?.data || []);
  const unreadCount = notificationsArray.filter((n: any) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-800/60 bg-slate-900/40 px-4 shadow-sm backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8 transition-all">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-slate-500"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-white focus:ring-0 sm:text-sm placeholder:text-slate-500 transition-all focus:pl-10"
            placeholder="Search members, invoices..."
            type="search"
            name="search"
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Link href="/notifications" className="relative -m-2.5 p-2.5 text-slate-400 hover:text-cyan-400 transition-colors">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </Link>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-800" aria-hidden="true" />

          {/* Profile dropdown placeholder */}
          <div className="flex items-center gap-x-4 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="h-9 w-9 rounded-full bg-slate-800/80 flex items-center justify-center border border-slate-700">
              <User className="h-5 w-5 text-slate-300" />
            </div>
            <span className="hidden lg:flex lg:flex-col lg:items-start lg:justify-center">
              <span className="text-sm font-semibold leading-5 text-white" aria-hidden="true">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-xs text-cyan-400 font-medium">
                {user?.role?.replace(/_/g, ' ')}
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
