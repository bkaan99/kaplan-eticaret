import { integer } from "@/shared/format";
import { formatAdminDate } from "@/components/admin/order-status";
import { formatMoney } from "@/shared/money";
import { isoToLocalInput, localInputToIso } from "./promotion-status";
import { CampaignRow, CouponRow } from "./promotion-types";

export function discountLabel(
  type: "PERCENT" | "FIXED",
  value: number,
): string {
  return type === "PERCENT"
    ? `%${integer.format(value)}`
    : formatMoney(value).replace(/,00$/, "");
}

export function validity(
  startsAt: string | null,
  endsAt: string | null,
): string {
  if (!startsAt && !endsAt) return "Süresiz";
  if (!startsAt) return `${formatAdminDate(new Date(endsAt!))} tarihine kadar`;
  if (!endsAt)
    return `${formatAdminDate(new Date(startsAt))} tarihinden itibaren`;
  return `${formatAdminDate(new Date(startsAt))} – ${formatAdminDate(new Date(endsAt))}`;
}

export type CouponFormState = {
  id: string | null;
  code: string;
  type: string;
  value: string;
  minSubtotal: string;
  maxUses: string;
  perCustomerLimit: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

export const blankCoupon: CouponFormState = {
  id: null,
  code: "",
  type: "PERCENT",
  value: "",
  minSubtotal: "",
  maxUses: "",
  perCustomerLimit: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

export function randomCode(): string {
  const prefixes = ["KAPLAN", "GURME", "TURSU", "YAZ", "BAHAR", "OZEL"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix}${Math.floor(10 + Math.random() * 90)}`;
}

export type CampaignFormState = {
  id: string | null;
  name: string;
  ruleType: string;
  type: string;
  value: string;
  categoryIds: string[];
  minSubtotal: string;
  priority: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

export const blankCampaign: CampaignFormState = {
  id: null,
  name: "",
  ruleType: "cart-threshold",
  type: "PERCENT",
  value: "",
  categoryIds: [],
  minSubtotal: "",
  priority: "0",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

export const couponToForm = (coupon: CouponRow): CouponFormState => ({
  id: coupon.id,
  code: coupon.code,
  type: coupon.type,
  value: String(Number(coupon.value)),
  minSubtotal: coupon.minSubtotal ? String(Number(coupon.minSubtotal)) : "",
  maxUses: coupon.maxUses ? String(coupon.maxUses) : "",
  perCustomerLimit: coupon.perCustomerLimit
    ? String(coupon.perCustomerLimit)
    : "",
  startsAt: isoToLocalInput(coupon.startsAt),
  endsAt: isoToLocalInput(coupon.endsAt),
  isActive: coupon.isActive,
});

export const campaignToForm = (campaign: CampaignRow): CampaignFormState => ({
  id: campaign.id,
  name: campaign.name,
  ruleType: campaign.ruleType,
  type: campaign.type,
  value: String(campaign.value),
  categoryIds: campaign.categoryIds,
  minSubtotal:
    campaign.minSubtotal === null ? "" : String(campaign.minSubtotal),
  priority: String(campaign.priority),
  startsAt: isoToLocalInput(campaign.startsAt),
  endsAt: isoToLocalInput(campaign.endsAt),
  isActive: campaign.isActive,
});

export function withIsoDates<T extends { startsAt: string; endsAt: string }>(
  form: T,
): T {
  return {
    ...form,
    startsAt: localInputToIso(form.startsAt),
    endsAt: localInputToIso(form.endsAt),
  };
}
