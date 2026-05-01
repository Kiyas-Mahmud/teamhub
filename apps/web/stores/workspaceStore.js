import { create } from 'zustand';
import { api } from '@/lib/api';

export const useWorkspaceStore = create((set, get) => ({
  items: [],
  currentWorkspace: null,
  currentRole: null,
  status: 'idle',

  async fetchWorkspaces() {
    set({ status: 'loading' });
    const response = await api.get('/workspaces');
    set({
      items: response.items || [],
      status: 'ready',
    });
    return response.items || [];
  },

  async fetchWorkspace(workspaceId) {
    const workspace = await api.get(`/workspaces/${workspaceId}`);
    set({
      currentWorkspace: workspace,
      currentRole: workspace.role,
      items: upsertWorkspace(get().items, workspace),
    });
    return workspace;
  },

  async createWorkspace(input) {
    const created = await api.post('/workspaces', input);
    set((state) => ({
      items: [{ ...created, role: 'ADMIN' }, ...state.items],
    }));
    return created;
  },

  async inviteMember(workspaceId, input) {
    return api.post(`/workspaces/${workspaceId}/invite`, input);
  },

  async acceptInvite(workspaceId, token) {
    const workspace = await api.post(`/workspaces/${workspaceId}/accept-invite`, { token });
    set((state) => ({
      currentWorkspace: workspace,
      currentRole: workspace.role,
      items: upsertWorkspace(state.items, workspace),
    }));
    return workspace;
  },

  setCurrentWorkspace(workspace) {
    set({
      currentWorkspace: workspace,
      currentRole: workspace?.role || null,
    });
  },
}));

function upsertWorkspace(items, workspace) {
  const next = items.filter((item) => item.id !== workspace.id);
  return [workspace, ...next];
}
