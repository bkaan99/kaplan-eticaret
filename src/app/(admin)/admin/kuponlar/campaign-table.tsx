"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/shared/cn";
import { formatMoney } from "@/shared/money";
import { endsSoon, promotionStatus } from "./promotion-status";
import { discountLabel, validity } from "./promotion-form";
import { CampaignRow, Category } from "./promotion-types";
import { ICONS, Icon, StatusBadge } from "./promotion-ui";

export function CampaignTable({
  campaigns,
  categories,
  now,
  pending,
  onEdit,
  onDelete,
}: {
  campaigns: CampaignRow[];
  categories: Category[];
  now: Date;
  pending: boolean;
  onEdit: (campaign: CampaignRow) => void;
  onDelete: (campaign: CampaignRow) => void;
}) {
  const categoryName = new Map(categories.map((c) => [c.id, c.label]));
  return (
    <ul className="divide-y divide-slate-100">
      {campaigns.map((campaign) => {
        const status = promotionStatus(campaign, now);
        const soon = endsSoon(campaign, status, now);
        const names = campaign.categoryIds
          .map((id) => categoryName.get(id))
          .filter((name): name is string => Boolean(name));
        const rule =
          campaign.ruleType === "category"
            ? names.length > 0
              ? `Kategoriler: ${names.slice(0, 3).join(", ")}${names.length > 3 ? ` +${names.length - 3}` : ""}`
              : "Kategori seçilmemiş"
            : `${formatMoney(campaign.minSubtotal ?? 0)} ve üzeri sepet`;

        return (
          <li
            key={campaign.id}
            className="grid gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/60 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-6"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[13px] font-semibold text-slate-800 tabular-nums">
                {discountLabel(campaign.type, campaign.value)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-slate-900">
                  {campaign.name}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  {rule}
                </p>
              </div>
            </div>

            <div className="text-[12px] text-slate-600">
              {campaign.ruleType === "category"
                ? "Kategori indirimi"
                : "Sepet indirimi"}
              <span className="text-slate-400">
                {" "}
                · öncelik {campaign.priority}
              </span>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              <span
                className={cn(
                  "text-[11px]",
                  soon ? "font-medium text-amber-700" : "text-slate-500",
                )}
              >
                {soon ? "Yakında bitiyor · " : ""}
                {validity(campaign.startsAt, campaign.endsAt)}
              </span>
            </div>

            <div className="flex items-center gap-1 justify-self-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(campaign)}
              >
                <Icon d={ICONS.edit} size={14} />
                Düzenle
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => onDelete(campaign)}
                className="text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                title="Kampanyayı sil"
                aria-label={`${campaign.name} kampanyasını sil`}
              >
                <Icon d={ICONS.trash} size={14} />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
