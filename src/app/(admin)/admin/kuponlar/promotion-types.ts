export interface CouponRow {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: string;
  minSubtotal: string | null;
  maxUses: number | null;
  perCustomerLimit: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}

export interface CampaignRow {
  id: string;
  name: string;
  ruleType: string;
  type: "PERCENT" | "FIXED";
  value: number;
  categoryIds: string[];
  minSubtotal: number | null;
  priority: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}

export type Category = { id: string; label: string };

export type Message = { text: string; error: boolean } | null;
