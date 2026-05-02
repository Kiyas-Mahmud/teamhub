'use client';

import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, registerSchema } from '@team-hub/shared/validators';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { FormField, Input } from '@/components/ui/Input';
import { useAuthStore } from '@/stores/authStore';

function safeNextPath(raw) {
  // Only allow same-origin relative paths starting with `/`. This prevents
  // open-redirect attacks via ?next=https://evil.com.
  if (!raw) return '/';
  try {
    const decoded = decodeURIComponent(raw);
    if (!decoded.startsWith('/') || decoded.startsWith('//')) return '/';
    return decoded;
  } catch {
    return '/';
  }
}

const copyByMode = {
  login: {
    title: 'Sign in',
    body: 'Welcome back. Pick up where your team left off.',
    cta: 'Sign in',
    altText: 'Need an account?',
    altHref: '/register',
    altLabel: 'Create one',
  },
  register: {
    title: 'Create your account',
    body: 'Start a workspace and invite your teammates.',
    cta: 'Create account',
    altText: 'Already have an account?',
    altHref: '/login',
    altLabel: 'Sign in',
  },
};

export function AuthForm({ mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get('next'));
  const [submitting, setSubmitting] = useState(false);
  const copy = copyByMode[mode];
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const schema = mode === 'login' ? loginSchema : registerSchema;

  const {
    register: field,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(values) {
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(values);
      } else {
        await register(values);
      }
      router.push(nextPath);
    } catch (error) {
      toast.error(error.message || 'Could not continue');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-2 lg:hidden">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-[color:var(--accent-contrast)]">
          <span className="text-xs font-bold">T</span>
        </span>
        <span className="text-sm font-semibold tracking-tight">Team Hub</span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-fg">{copy.title}</h1>
      <p className="mt-1.5 text-sm text-muted">{copy.body}</p>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {mode === 'register' && (
          <FormField label="Display name" error={errors.displayName?.message}>
            <Input placeholder="Alex Morgan" {...field('displayName')} />
          </FormField>
        )}

        <FormField label="Email" error={errors.email?.message}>
          <Input type="email" placeholder="you@teamhub.app" {...field('email')} />
        </FormField>

        <FormField label="Password" error={errors.password?.message}>
          <Input type="password" placeholder="••••••••" {...field('password')} />
        </FormField>

        <Button type="submit" disabled={submitting} className="w-full" size="lg">
          {submitting ? 'Working…' : copy.cta}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        {copy.altText}{' '}
        <Link
          className="font-medium text-accent hover:underline"
          href={
            nextPath && nextPath !== '/'
              ? `${copy.altHref}?next=${encodeURIComponent(nextPath)}`
              : copy.altHref
          }
        >
          {copy.altLabel}
        </Link>
      </p>
    </div>
  );
}
