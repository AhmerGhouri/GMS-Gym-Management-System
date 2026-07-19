'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dumbbell } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api/axios';
import { useAuthStore } from '@/lib/stores/auth.store';
import { LoginResponse } from '@gms/types';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      // MOCK LOGIN IMPLEMENTATION
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (data.email === 'admin@gms.local' && data.password === 'password') {
        setAuth(
          {
            id: '1',
            email: 'admin@gms.local',
            firstName: 'Admin',
            lastName: 'User',
            role: 'SUPER_ADMIN' as any,
            isActive: true,
            lastLoginAt: new Date().toISOString(),
          },
          'mock-access-token',
          'mock-refresh-token'
        );
        router.push('/dashboard');
      } else {
        throw new Error('Invalid email or password (use admin@gms.local / password)');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900 shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/10">
            <Dumbbell className="h-6 w-6 text-cyan-500" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-white">Sunain Gym</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to the management suite
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@gms.local"
                className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-cyan-500 hover:text-cyan-400"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="border-slate-800 bg-slate-950 text-white placeholder:text-slate-500 focus-visible:ring-cyan-500"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-cyan-600 text-white hover:bg-cyan-500"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
