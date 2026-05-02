'use client';

import { RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="max-w-md rounded-lg glass-panel p-8 text-center shadow-sm">
            <p className="text-2xs font-medium uppercase tracking-wider text-[color:var(--danger)]">
              500
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted">
              The page hit an unexpected error. You can retry without losing your session.
            </p>
            <div className="mt-6">
              <Button onClick={reset}>
                <RefreshCw className="h-3.5 w-3.5" />
                Try again
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
