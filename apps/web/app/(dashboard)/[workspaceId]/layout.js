import { WorkspaceShell } from '@/components/dashboard/WorkspaceShell';

export default function WorkspaceLayout({ children, params }) {
  return <WorkspaceShell workspaceId={params.workspaceId}>{children}</WorkspaceShell>;
}
