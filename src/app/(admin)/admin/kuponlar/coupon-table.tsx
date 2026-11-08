"use client";

import { integer } from "@/shared/format";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/cn";
import { formatMoney } from "@/shared/money";
import { endsSoon, promotionStatus } from "./promotion-status";
import { discountLabel, validity } from "./promotion-form";
import { CouponRow } from "./promotion-types";
import { ICONS, Icon, StatusBadge } from "./promotion-ui";

export function CouponTable({
  coupons,
  now,
  pending,
  onEdit,
  onDelete,
}: {
  coupons: CouponRow[];
  now: Date;
  pending: boolean;
  onEdit: (coupon: CouponRow) => void;
  onDelete: (coupon: CouponRow) => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(code: string) {
    if (!navigator?.clipboard?.writeText) return;
    void navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1800);
  }

  return (
    <ul className="divide-y divide-slate-100">
      {coupons.map((coupon) => {
        const status = promotionStatus(coupon, now);
        const soon = endsSoon(coupon, status, now);
        const usage = coupon.maxUses
          ? Math.min(100, Math.round((coupon.usedCount / coupon.maxUses) * 100))
          : null;
        const conditions = [
          coupon.minSubtotal && Number(coupon.minSubtotal) > 0
            ? `${formatMoney(coupon.minSubtotal)} ve üzeri sepet`
            : "Alt limit yok",
          coupon.perCustomerLimit
            ? `müşteri başı ${coupon.perCustomerLimit} kez`
            : null,
        ].filter(Boolean);

        return (
          <li
            key={coupon.id}
            className="grid gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/60 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-6"
          >
            {/* Kod + indirim */}
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[13px] font-semibold text-slate-800 tabular-nums">
                {discountLabel(coupon.type, Number(coupon.value))}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[13px] font-semibold tracking-wider text-slate-900">
                    {coupon.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(coupon.code)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded text-[11px] font-medium text-slate-400 hover:text-slate-700"
                    aria-label={`${coupon.code} kodunu kopyala`}
                  >
                    <Icon
                      d={copied === coupon.code ? ICONS.check : ICONS.copy}
                      size={13}
                    />
                    {copied === coupon.code ? "Kopyalandı" : null}
                  </button>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  {conditions.join(" · ")}
                </p>
              </div>
            </div>

            {/* Kullanım */}
            <div className="min-w-0">
              <p className="text-[12px] text-slate-700 tabular-nums">
                <span className="font-semibold text-slate-900">
                  {integer.format(coupon.usedCount)}
                </span>
                {coupon.maxUses
                  ? ` / ${integer.format(coupon.maxUses)} kullanım`
                  : " kullanım · sınırsız"}
              </p>
              {usage !== null ? (
                <div className="mt-1.5 h-1.5 max-w-40 rounded-full bg-slate-100">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      usage >= 100 ? "bg-amber-500" : "bg-primary",
                    )}
                    style={{ width: `${Math.max(2, usage)}%` }}
                  />
                </div>
              ) : null}
            </div>

            {/* Geçerlilik + durum */}
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              <span
                className={cn(
                  "text-[11px]",
                  soon ? "font-medium text-amber-700" : "text-slate-500",
                )}
              >
                {soon ? "Yakında bitiyor · " : ""}
                {validity(coupon.startsAt, coupon.endsAt)}
              </span>
            </div>

            {/* İşlemler */}
            <div className="flex items-center gap-1 justify-self-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(coupon)}
              >
                <Icon d={ICONS.edit} size={14} />
                Düzenle
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending || coupon.usedCount > 0}
                onClick={() => onDelete(coupon)}
                className="text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                title={
                  coupon.usedCount > 0
                    ? "Kullanılmış kupon silinemez; pasife alabilirsiniz"
                    : "Kuponu sil"
                }
                aria-label={`${coupon.code} kuponunu sil`}
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
