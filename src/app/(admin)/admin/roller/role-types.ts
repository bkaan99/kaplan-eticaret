"use client";

import { PERMISSION_GROUPS } from "@/shared/permissions";

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
