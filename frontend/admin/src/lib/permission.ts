"use client";

import type { AdminRole } from "./auth";

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "超级管理员",
  admin: "管理员",
  operator: "运营",
  developer: "开发",
};

export function getRoleLabel(role: AdminRole): string {
  return ROLE_LABELS[role] ?? role;
}

/** 权限定义：哪些角色可以访问 */
const PERMISSIONS = {
  manager_list: ["super_admin", "admin"],
  manager_create: ["super_admin", "admin"],
  manager_edit_others: ["super_admin", "admin"],
  manager_delete: ["super_admin", "admin"],
  manager_sessions: ["super_admin", "admin"],
  user_kick_session: ["super_admin", "admin", "operator"],
  device_create: ["super_admin", "admin", "operator"],
  api_docs: ["super_admin", "developer"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: AdminRole, perm: Permission): boolean {
  return (PERMISSIONS[perm] as readonly string[]).includes(role);
}

const ROLE_LEVEL: Record<string, number> = {
  super_admin: 100,
  admin: 50,
  operator: 10,
  developer: 10,
};

/** 判断当前角色是否可以管理目标角色 */
export function canManageRole(operatorRole: AdminRole, targetRole: string): boolean {
  return (ROLE_LEVEL[operatorRole] ?? 0) > (ROLE_LEVEL[targetRole] ?? 0);
}

/** 获取当前角色可以创建的角色列表 */
export function getCreatableRoles(role: AdminRole): { label: string; value: string }[] {
  return Object.entries(ROLE_LABELS)
    .filter(([key]) => canManageRole(role, key))
    .map(([key, label]) => ({ label, value: key }));
}

/** 侧边栏菜单可见性 */
const MENU_VISIBILITY: Record<string, AdminRole[]> = {
  "/managers": ["super_admin", "admin"],
  "/manager-sessions": ["super_admin", "admin"],
  "/api-docs": ["super_admin", "developer"],
};

export function isMenuVisible(path: string, role: AdminRole): boolean {
  const allowed = MENU_VISIBILITY[path];
  if (!allowed) return true;
  return allowed.includes(role);
}
