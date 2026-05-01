import { create } from 'zustand';

export const usePresenceStore = create((set) => ({
  onlineUserIds: [],

  setList(users) {
    set({
      onlineUserIds: Array.from(new Set(users)),
    });
  },

  add(userId) {
    set((state) => ({
      onlineUserIds: state.onlineUserIds.includes(userId)
        ? state.onlineUserIds
        : [...state.onlineUserIds, userId],
    }));
  },

  remove(userId) {
    set((state) => ({
      onlineUserIds: state.onlineUserIds.filter((id) => id !== userId),
    }));
  },
}));
