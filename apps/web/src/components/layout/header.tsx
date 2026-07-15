'use client';

import { Bell, Search, User } from 'lucide-react';
import { useAuthStore } from '@/lib/stores/auth.store';

export function Header() {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-800 bg-slate-950/80 px-4 shadow-sm backdrop-blur-md sm:gap-x-6 sm:px-6 lg:px-8">
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
            className="block h-full w-full border-0 bg-transparent py-0 pl-8 pr-0 text-white focus:ring-0 sm:text-sm placeholder:text-slate-500"
            placeholder="Search members, invoices..."
            type="search"
            name="search"
          />
        </form>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button type="button" className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-300">
            <span className="sr-only">View notifications</span>
            <Bell className="h-5 w-5" aria-hidden="true" />
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-slate-800" aria-hidden="true" />

          {/* Profile dropdown placeholder */}
          <div className="flex items-center gap-x-4">
            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
              <User className="h-5 w-5 text-slate-400" />
            </div>
            <span className="hidden lg:flex lg:items-center">
              <span className="text-sm font-semibold leading-6 text-white" aria-hidden="true">
                {user?.firstName} {user?.lastName}
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
