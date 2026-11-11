"use client";

import {
  PERMISSION_GROUPS,
  type Permission,
} from "@/shared/permissions";

export interface RoleView {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  userCount: number;
}

export const LABELS = new Map(
  PERMISSION_GROUPS.flatMap((group) =>
    group.permissions.map((p) => [p.key, p.label] as const),
  ),
);

export function permissionGroupSummary(permissions: string[]) {
  return PERMISSION_GROUPS.map((group) => {
    const total = group.permissions.length;
    const selected = group.permissions.filter((p) =>
      permissions.includes(p.key),
    ).length;
    return {
      label: group.label,
      selected,
      total,
      keys: group.permissions.map((p) => p.key),
    };
  }).filter((g) => g.selected > 0);
}

export function permissionLabel(key: string): string {
  return LABELS.get(key as Permission) ?? key;
}
