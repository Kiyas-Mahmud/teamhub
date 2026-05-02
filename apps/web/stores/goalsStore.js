import { create } from 'zustand';
import { toast } from 'sonner';
import { api } from '@/lib/api';

function toRecord(items) {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}

export const useGoalsStore = create((set, get) => ({
  byId: {},
  ids: [],
  currentGoal: null,

  setAll(goals) {
    set({
      byId: toRecord(goals),
      ids: goals.map((goal) => goal.id),
    });
  },

  setCurrentGoal(goal) {
    set((state) => ({
      currentGoal: goal,
      byId: {
        ...state.byId,
        [goal.id]: goal,
      },
      ids: state.ids.includes(goal.id) ? state.ids : [goal.id, ...state.ids],
    }));
  },

  async fetchGoals(workspaceId) {
    const response = await api.get(`/workspaces/${workspaceId}/goals`);
    get().setAll(response.items || []);
    return response.items || [];
  },

  async fetchGoal(workspaceId, goalId) {
    const goal = await api.get(`/workspaces/${workspaceId}/goals/${goalId}`);
    get().setCurrentGoal(goal);
    return goal;
  },

  async create(workspaceId, input) {
    const tempId = `temp_goal_${Date.now()}`;
    const optimistic = {
      id: tempId,
      title: input.title,
      description: input.description || '',
      dueDate: input.dueDate || null,
      status: input.status || 'ACTIVE',
      ownerId: input.ownerId || 'me',
      owner: {
        id: input.ownerId || 'me',
        displayName: 'You',
        avatarUrl: null,
      },
      milestones: [],
      updates: [],
      _optimistic: true,
    };

    set((state) => ({
      byId: { ...state.byId, [tempId]: optimistic },
      ids: [tempId, ...state.ids],
    }));

    try {
      const goal = await api.post(`/workspaces/${workspaceId}/goals`, input);
      set((state) => {
        const { [tempId]: removed, ...rest } = state.byId;
        // The `goal:created` socket event might have raced ahead of this
        // response. If the real id is already in ids, just drop the temp;
        // otherwise swap temp → real id in place.
        const realAlreadyPresent = state.ids.includes(goal.id);
        return {
          byId: { ...rest, [goal.id]: goal },
          ids: realAlreadyPresent
            ? state.ids.filter((id) => id !== tempId)
            : state.ids.map((id) => (id === tempId ? goal.id : id)),
        };
      });
      return goal;
    } catch (error) {
      set((state) => {
        const { [tempId]: removed, ...rest } = state.byId;
        return {
          byId: rest,
          ids: state.ids.filter((id) => id !== tempId),
        };
      });
      toast.error(error.message || 'Could not create goal');
      throw error;
    }
  },

  async update(workspaceId, goalId, patch) {
    const previous = get().byId[goalId];
    set((state) => ({
      byId: {
        ...state.byId,
        [goalId]: {
          ...previous,
          ...patch,
        },
      },
      currentGoal:
        state.currentGoal?.id === goalId
          ? {
              ...state.currentGoal,
              ...patch,
            }
          : state.currentGoal,
    }));

    try {
      const goal = await api.patch(`/workspaces/${workspaceId}/goals/${goalId}`, patch);
      get().setCurrentGoal(goal);
      return goal;
    } catch (error) {
      set((state) => ({
        byId: {
          ...state.byId,
          [goalId]: previous,
        },
        currentGoal: state.currentGoal?.id === goalId ? previous : state.currentGoal,
      }));
      toast.error(error.message || 'Could not update goal');
      throw error;
    }
  },

  async remove(workspaceId, goalId) {
    const previous = get().byId[goalId];
    set((state) => ({
      byId: Object.fromEntries(Object.entries(state.byId).filter(([id]) => id !== goalId)),
      ids: state.ids.filter((id) => id !== goalId),
      currentGoal: state.currentGoal?.id === goalId ? null : state.currentGoal,
    }));

    try {
      await api.del(`/workspaces/${workspaceId}/goals/${goalId}`);
    } catch (error) {
      set((state) => ({
        byId: {
          ...state.byId,
          [goalId]: previous,
        },
        ids: [goalId, ...state.ids],
      }));
      toast.error(error.message || 'Could not delete goal');
      throw error;
    }
  },

  async addMilestone(workspaceId, goalId, input) {
    const goal = await api.post(`/workspaces/${workspaceId}/goals/${goalId}/milestones`, input);
    get().setCurrentGoal(goal);
    return goal;
  },

  async updateMilestone(workspaceId, goalId, milestoneId, patch) {
    const goal = await api.patch(
      `/workspaces/${workspaceId}/goals/${goalId}/milestones/${milestoneId}`,
      patch
    );
    get().setCurrentGoal(goal);
    return goal;
  },

  async deleteMilestone(workspaceId, goalId, milestoneId) {
    const previous = get().currentGoal;
    if (previous?.id === goalId) {
      set((state) => ({
        currentGoal: {
          ...state.currentGoal,
          milestones: (state.currentGoal.milestones || []).filter(
            (m) => m.id !== milestoneId
          ),
        },
      }));
    }
    try {
      await api.del(`/workspaces/${workspaceId}/goals/${goalId}/milestones/${milestoneId}`);
    } catch (error) {
      if (previous) set({ currentGoal: previous });
      toast.error(error.message || 'Could not delete milestone');
      throw error;
    }
  },

  async addUpdate(workspaceId, goalId, content) {
    await api.post(`/workspaces/${workspaceId}/goals/${goalId}/updates`, { content });
    return get().fetchGoal(workspaceId, goalId);
  },

  upsertFromSocket(goal) {
    if (!goal?.id) {
      return;
    }

    set((state) => ({
      byId: {
        ...state.byId,
        [goal.id]: goal,
      },
      ids: state.ids.includes(goal.id) ? state.ids : [goal.id, ...state.ids],
      currentGoal: state.currentGoal?.id === goal.id ? goal : state.currentGoal,
    }));
  },

  removeFromSocket(id) {
    set((state) => ({
      byId: Object.fromEntries(Object.entries(state.byId).filter(([key]) => key !== id)),
      ids: state.ids.filter((goalId) => goalId !== id),
      currentGoal: state.currentGoal?.id === id ? null : state.currentGoal,
    }));
  },
}));
