'use client';

import { can } from '@team-hub/shared/permissions';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export function usePermission(action) {
  const role = useWorkspaceStore((state) => state.currentRole);
  return can(role, action);
}
