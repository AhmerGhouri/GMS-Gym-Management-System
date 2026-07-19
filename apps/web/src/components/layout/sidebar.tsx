'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarDays,
  Settings,
  LogOut,
  Dumbbell,
  Fingerprint,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth.store';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Memberships', href: '/memberships', icon: CreditCard },
  { name: 'Attendance', href: '/attendance', icon: CalendarDays },
  { name: 'Access Control', href: '/devices', icon: Fingerprint },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  return (
    <div className="flex h-full w-64 flex-col border-r border-slate-800 bg-slate-950 text-slate-300">
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-cyan-500" />
          <span className="text-lg font-bold text-white tracking-tight">Sunain</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-500'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0',
                    isActive ? 'text-cyan-500' : 'text-slate-500 group-hover:text-slate-400'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-800 p-4">
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="group flex w-full items-center rounded-md px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-900 hover:text-slate-200"
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-slate-500 group-hover:text-slate-400" />
          Sign out
        </button>
      </div>
    </div>
  );
}
