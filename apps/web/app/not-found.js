import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-lg glass-panel p-8 text-center shadow-sm">
        <p className="text-2xs font-medium uppercase tracking-wider text-accent">404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">This page does not exist</h1>
        <p className="mt-2 text-sm text-muted">
          The route may have moved, or the workspace link may no longer be valid.
        </p>
        <Link className="mt-6 inline-flex" href="/">
          <Button>
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
