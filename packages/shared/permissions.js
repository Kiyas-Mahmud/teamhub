/**
 * Shared role-based permission matrix used by both API middleware and UI gates.
 */
export const PERMISSIONS = {
  ADMIN: {
    'workspace:create': true,
    'workspace:view': true,
    'workspace:edit': true,
    'workspace:invite': true,
    'workspace:remove_member': true,
    'workspace:change_role': true,

    'goal:create': true,
    'goal:edit_any': true,
    'goal:delete_any': true,

    'milestone:create': true,
    'milestone:edit_any': true,
    'milestone:delete_any': true,

    'actionItem:create': true,
    'actionItem:edit_any': true,
    'actionItem:delete_any': true,

    'announcement:create': true,
    'announcement:edit_any': true,
    'announcement:delete_any': true,
    'announcement:pin': true,

    'comment:create': true,
    'comment:delete_any': true,
    'reaction:toggle': true,
    'analytics:view': true,
    'analytics:export': true,
    'upload:create': true,
  },
  MEMBER: {
    'workspace:create': true,
    'workspace:view': true,
    'workspace:edit': false,
    'workspace:invite': false,
    'workspace:remove_member': false,
    'workspace:change_role': false,

    'goal:create': true,
    'goal:edit_any': false,
    'goal:delete_any': false,

    'milestone:create': true,
    'milestone:edit_any': false,
    'milestone:delete_any': false,

    'actionItem:create': true,
    'actionItem:edit_any': false,
    'actionItem:delete_any': false,

    'announcement:create': false,
    'announcement:edit_any': false,
    'announcement:delete_any': false,
    'announcement:pin': false,

    'comment:create': true,
    'comment:delete_any': false,
    'reaction:toggle': true,
    'analytics:view': true,
    'analytics:export': false,
    'upload:create': true,
  },
};

export function can(role, action) {
  return Boolean(PERMISSIONS[role]?.[action]);
}
