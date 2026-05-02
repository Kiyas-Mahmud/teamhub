import { create } from 'zustand';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export const useNotificationsStore = create((set, get) => ({
  items: [],
  loaded: false,

  setAll(items) {
    set({ items, loaded: true });
  },

  async fetchAll() {
    try {
      const response = await api.get('/users/me/notifications');
      set({ items: response.items || [], loaded: true });
      return response.items || [];
    } catch (error) {
      // Don't toast — this is a background load. A 401 here just means the
      // session expired and the auth refresh flow will handle it.
      set({ loaded: true });
      return [];
    }
  },

  prepend(notification) {
    if (!notification?.id) return;
    set((state) => {
      // De-dupe — the same notification can arrive over the socket and then
      // also appear in a fetchAll on a later mount.
      const exists = state.items.some((n) => n.id === notification.id);
      if (exists) return state;
      return { items: [notification, ...state.items].slice(0, 50) };
    });
  },

  async markRead(id) {
    const previous = get().items;
    set((state) => ({
      items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    try {
      await api.post(`/users/me/notifications/${id}/read`);
    } catch (error) {
      set({ items: previous });
      toast.error(error.message || 'Could not mark notification as read');
    }
  },

  async markAllRead() {
    const previous = get().items;
    if (!previous.some((n) => !n.read)) return;
    set((state) => ({
      items: state.items.map((n) => ({ ...n, read: true })),
    }));
    try {
      await api.post('/users/me/notifications/read-all');
    } catch (error) {
      set({ items: previous });
      toast.error(error.message || 'Could not mark notifications as read');
    }
  },

  reset() {
    set({ items: [], loaded: false });
  },
}));
