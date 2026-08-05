'use client';

import { Bell, Search, User, Menu, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useUiStore } from '@/lib/stores/ui.store';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/axios';
import { ThemeToggle } from '../theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, logout } = useAuthStore();
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications')).data,
    refetchInterval: 30000,
  });
  
  const notificationsArray = Array.isArray(data) ? data : (data?.data || []);
  const unreadCount = notificationsArray.filter((n: any) => !n.isRead).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 px-4 shadow-sm backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8 transition-colors">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center gap-x-4 lg:hidden">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-slate-700 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"
            onClick={toggleSidebar}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <form className="relative flex flex-1" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-slate-400 dark:text-slate-500"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-slate-900 dark:text-white focus:ring-0 sm:text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:pl-10 outline-none"
            placeholder="Search members, invoices..."
            type="search"
            name="search"
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <ThemeToggle />

          <Link href="/notifications" className="relative -m-2.5 p-2.5 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
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
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-200 dark:lg:bg-slate-800" aria-hidden="true" />

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-x-4 cursor-pointer hover:opacity-80 transition-opacity outline-none">
              <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                <User className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
              <span className="hidden lg:flex lg:flex-col lg:items-start lg:justify-center">
                <span className="text-sm font-semibold leading-5 text-slate-900 dark:text-white" aria-hidden="true">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-xs text-cyan-600 dark:text-cyan-400 font-medium capitalize">
                  {user?.role?.replace(/_/g, ' ').toLowerCase()}
                </span>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>Settings</DropdownMenuItem>
              <DropdownMenuItem 
                disabled={isLoggingOut}
                onClick={() => {
                  setIsLoggingOut(true);
                  logout();
                  router.push('/login');
                }}
                className="text-rose-500 focus:bg-rose-50 focus:text-rose-600 dark:focus:bg-rose-500/10 dark:focus:text-rose-400"
              >
                {isLoggingOut && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
