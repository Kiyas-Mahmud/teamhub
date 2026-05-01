import { create } from 'zustand';
import { api } from '@/lib/api';
import { disconnectSocket } from '@/lib/socket';

export const useAuthStore = create((set, get) => ({
  user: null,
  status: 'idle',
  isReady: false,

  async fetchSession() {
    if (get().status === 'loading') {
      return;
    }

    set({ status: 'loading' });

    try {
      const user = await api.get('/auth/me');
      set({ user, status: 'authenticated', isReady: true });
      return user;
    } catch (error) {
      set({ user: null, status: 'unauthenticated', isReady: true });
      return null;
    }
  },

  async login(input) {
    set({ status: 'loading' });
    const user = await api.post('/auth/login', input);
    set({ user, status: 'authenticated', isReady: true });
    return user;
  },

  async register(input) {
    set({ status: 'loading' });
    const user = await api.post('/auth/register', input);
    set({ user, status: 'authenticated', isReady: true });
    return user;
  },

  async logout() {
    await api.post('/auth/logout');
    disconnectSocket();
    set({ user: null, status: 'unauthenticated', isReady: true });
  },

  setUser(user) {
    set((state) => ({
      user: {
        ...state.user,
        ...user,
      },
    }));
  },
}));
