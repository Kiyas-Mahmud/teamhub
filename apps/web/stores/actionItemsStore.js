import { create } from 'zustand';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export const useActionItemsStore = create((set, get) => ({
  items: [],
  filters: {
    status: '',
    assigneeId: '',
    goalId: '',
  },

  setFilters(filters) {
    set({
      filters: {
        ...get().filters,
        ...filters,
      },
    });
  },

  async fetchItems(workspaceId, filters = get().filters) {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });

    const query = params.toString();
    const response = await api.get(`/workspaces/${workspaceId}/action-items${query ? `?${query}` : ''}`);
    set({ items: response.items || [] });
    return response.items || [];
  },

  async create(workspaceId, input) {
    const item = await api.post(`/workspaces/${workspaceId}/action-items`, input);
    get().upsertFromSocket(item);
    return item;
  },

  async update(workspaceId, actionItemId, patch) {
    const previous = get().items;
    set((state) => ({
      items: state.items.map((item) =>
        item.id === actionItemId
          ? {
              ...item,
              ...patch,
            }
          : item
      ),
    }));

    try {
      const updated = await api.patch(`/workspaces/${workspaceId}/action-items/${actionItemId}`, patch);
      set((state) => ({
        items: state.items.map((item) => (item.id === actionItemId ? updated : item)),
      }));
      return updated;
    } catch (error) {
      set({ items: previous });
      toast.error(error.message || 'Could not update action item');
      throw error;
    }
  },

  async remove(workspaceId, actionItemId) {
    const previous = get().items;
    set((state) => ({
      items: state.items.filter((item) => item.id !== actionItemId),
    }));

    try {
      await api.del(`/workspaces/${workspaceId}/action-items/${actionItemId}`);
    } catch (error) {
      set({ items: previous });
      toast.error(error.message || 'Could not delete action item');
      throw error;
    }
  },

  upsertFromSocket(item) {
    set((state) => {
      const exists = state.items.some((entry) => entry.id === item.id);
      return {
        items: exists
          ? state.items.map((entry) => (entry.id === item.id ? item : entry))
          : [item, ...state.items],
      };
    });
  },

  removeFromSocket(id) {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },
}));
