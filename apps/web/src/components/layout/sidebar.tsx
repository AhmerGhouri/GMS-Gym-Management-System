'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarDays,
  Settings,
  LogOut,
  Dumbbell,
  Fingerprint,
  FileText,
  Bell,
  X,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/stores/auth.store';
import { useUiStore } from '@/lib/stores/ui.store';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Members', href: '/members', icon: Users },
  { name: 'Memberships', href: '/memberships', icon: CreditCard },
  { name: 'Activities', href: '/activities', icon: Dumbbell },
  { name: 'Payments', href: '/payments', icon: DollarSign },
  { name: 'Attendance', href: '/attendance', icon: CalendarDays },
  { name: 'Access Control', href: '/devices', icon: Fingerprint },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { isSidebarOpen, setSidebarOpen } = useUiStore();
  const router = useRouter();

  // Filter navigation based on user permissions
  const navItems = navigation.filter(item => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    
    const perms = Array.isArray(user.customRole?.permissions) ? user.customRole.permissions : [];
    
    const reqPermMap: Record<string, string> = {
      '/members': 'members.view',
      '/memberships': 'plans.view',
      '/settings': 'settings.view',
      '/payments': 'payments.view',
      '/users': 'users.view',
      '/reports': 'reports.view',
    };
    
    const reqPerm = reqPermMap[item.href];
    if (!reqPerm) return true;
    
    return perms.includes(reqPerm);
  });

  const sidebarContent = (
    <div className="flex h-full flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 shadow-xl lg:shadow-none">
      <div className="flex h-16 shrink-0 items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
          <Dumbbell className="h-6 w-6 text-cyan-600 dark:text-cyan-500" />
          <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">GMS</span>
        </Link>
        <button 
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-300 relative',
                  isActive
                    ? 'bg-cyan-50 dark:bg-gradient-to-r dark:from-cyan-500/20 dark:to-transparent text-cyan-700 dark:text-cyan-400 dark:shadow-[inset_2px_0_0_0_rgba(34,211,238,1)]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-bg"
                    className="absolute inset-0 rounded-md bg-cyan-100/50 dark:bg-transparent"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors z-10',
                    isActive 
                      ? 'text-cyan-600 dark:text-cyan-400 dark:drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' 
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  )}
                  aria-hidden="true"
                />
                <span className="z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 p-4">
        <button
          onClick={() => {
            logout();
            router.push('/login');
          }}
          className="group flex w-full items-center rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200"
        >
          <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex h-full w-64 flex-col shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/80 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
