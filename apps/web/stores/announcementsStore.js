import { create } from 'zustand';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export const useAnnouncementsStore = create((set, get) => ({
  items: [],

  setAll(items) {
    set({ items });
  },

  async fetchAnnouncements(workspaceId) {
    const response = await api.get(`/workspaces/${workspaceId}/announcements`);
    get().setAll(response.items || []);
    return response.items || [];
  },

  async create(workspaceId, input) {
    const announcement = await api.post(`/workspaces/${workspaceId}/announcements`, input);
    get().upsertFromSocket(announcement);
    return announcement;
  },

  async togglePin(workspaceId, announcementId, pinned) {
    const announcement = await api.patch(
      `/workspaces/${workspaceId}/announcements/${announcementId}/pin`,
      { pinned }
    );
    set((state) => ({
      items: state.items.map((item) => (item.id === announcementId ? announcement : item)),
    }));
    return announcement;
  },

  async toggleReaction(workspaceId, announcementId, emoji) {
    await api.post(`/workspaces/${workspaceId}/announcements/${announcementId}/reactions`, {
      emoji,
    });
    return get().fetchAnnouncements(workspaceId);
  },

  async addComment(workspaceId, announcementId, content) {
    await api.post(`/workspaces/${workspaceId}/announcements/${announcementId}/comments`, {
      content,
    });
    return get().fetchAnnouncements(workspaceId);
  },

  upsertFromSocket(announcement) {
    if (!announcement?.id) {
      return;
    }

    set((state) => {
      const exists = state.items.some((item) => item.id === announcement.id);
      const items = exists
        ? state.items.map((item) => (item.id === announcement.id ? announcement : item))
        : [announcement, ...state.items];

      return {
        items: items.sort((a, b) => Number(b.pinned) - Number(a.pinned)),
      };
    });
  },

  mergeReactionEvent(event) {
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== event.announcementId) {
          return item;
        }

        const reactions =
          event.op === 'remove'
            ? item.reactions.filter(
                (reaction) =>
                  !(reaction.userId === event.userId && reaction.emoji === event.emoji)
              )
            : [
                ...item.reactions,
                {
                  id: `temp_${Date.now()}`,
                  userId: event.userId,
                  emoji: event.emoji,
                  createdAt: new Date().toISOString(),
                },
              ];

        return {
          ...item,
          reactions,
        };
      }),
    }));
  },
}));
