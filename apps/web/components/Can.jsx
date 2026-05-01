'use client';

import { usePermission } from '@/hooks/usePermission';

export function Can({ action, children, fallback = null }) {
  return usePermission(action) ? children : fallback;
}
