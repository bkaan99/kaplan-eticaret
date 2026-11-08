"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/shared/cn";
import {
  deleteCampaignAction,
  deleteCouponAction,
  saveCampaignAction,
  saveCouponAction,
} from "./actions";
import { endsSoon, promotionStatus } from "./promotion-status";
import { CampaignModal } from "./campaign-modal";
import { CampaignTable } from "./campaign-table";
import { CouponModal } from "./coupon-modal";
import { CouponTable } from "./coupon-table";
import {
  CampaignFormState,
  CouponFormState,
  blankCampaign,
  blankCoupon,
  campaignToForm,
  couponToForm,
  integer,
  withIsoDates,
} from "./promotion-form";
import { CampaignRow, Category, CouponRow } from "./promotion-types";
import {
  Alert,
  EmptyState,
  ICONS,
  Icon,
  Stat,
  useRunner,
} from "./promotion-ui";

export function PromotionManager({
  coupons,
  campaigns,
  categories,
  now: nowIso,
}: {
  coupons: CouponRow[];
  campaigns: CampaignRow[];
  categories: Category[];
  /** Sunucudaki an; durumlar sunucu ve tarayıcıda aynı hesaplansın diye */
  now: string;
}) {
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const [tab, setTab] = useState<"coupons" | "campaigns">("coupons");
  const { pending, message, run, setMessage } = useRunner();

  const [couponForm, setCouponForm] = useState<CouponFormState | null>(null);
  const [campaignForm, setCampaignForm] = useState<CampaignFormState | null>(
    null,
  );

  const stats = useMemo(() => {
    const couponStatuses = coupons.map((c) => promotionStatus(c, now));
    const campaignStatuses = campaigns.map((c) => promotionStatus(c, now));
    const soon =
      coupons.filter((c, i) => endsSoon(c, couponStatuses[i]!, now)).length +
      campaigns.filter((c, i) => endsSoon(c, campaignStatuses[i]!, now)).length;
    return {
      activeCoupons: couponStatuses.filter((s) => s === "active").length,
      uses: coupons.reduce((sum, c) => sum + c.usedCount, 0),
      activeCampaigns: campaignStatuses.filter((s) => s === "active").length,
      soon,
    };
  }, [coupons, campaigns, now]);

  function openCoupon(form: CouponFormState) {
    setMessage(null);
    setCouponForm(form);
  }
  function openCampaign(form: CampaignFormState) {
    setMessage(null);
    setCampaignForm(form);
  }

  const tabs = [
    { key: "coupons" as const, label: "Kupon kodları", count: coupons.length },
    {
      key: "campaigns" as const,
      label: "Otomatik kampanyalar",
      count: campaigns.length,
    },
  ];
  const modalOpen = couponForm !== null || campaignForm !== null;

  return (
    <div className="flex flex-col gap-5">
      <section
        aria-label="Özet"
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      >
        <Stat
          label="Aktif kupon"
          value={integer.format(stats.activeCoupons)}
          hint={`Toplam ${integer.format(coupons.length)} kupon`}
        />
        <Stat
          label="Kupon kullanımı"
          value={integer.format(stats.uses)}
          hint="Tüm kuponlarda toplam"
        />
        <Stat
          label="Devrede kampanya"
          value={integer.format(stats.activeCampaigns)}
          hint={`Toplam ${integer.format(campaigns.length)} kampanya`}
        />
        <Stat
          label="7 gün içinde bitiyor"
          value={integer.format(stats.soon)}
          hint={
            stats.soon > 0 ? "Uzatmak isteyebilirsiniz" : "Yakında biten yok"
          }
        />
      </section>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-2 pt-2">
          <div
            role="tablist"
            className="flex gap-1 overflow-x-auto [scrollbar-width:none]"
          >
            {tabs.map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.key)}
                  className={cn(
                    "-mb-px flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 pt-1.5 pb-2.5 text-[13px] font-medium whitespace-nowrap transition-colors",
                    active
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-slate-500 hover:text-slate-800",
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                      active
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {integer.format(item.count)}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="pr-2 pb-2">
            <Button
              type="button"
              size="sm"
              onClick={() =>
                tab === "coupons"
                  ? openCoupon(blankCoupon)
                  : openCampaign(blankCampaign)
              }
            >
              <Icon d={ICONS.plus} size={14} />
              {tab === "coupons" ? "Yeni kupon" : "Yeni kampanya"}
            </Button>
          </div>
        </div>

        {!modalOpen && message ? (
          <div className="border-b border-slate-100 px-4 py-3">
            <Alert message={message} />
          </div>
        ) : null}

        {tab === "coupons" ? (
          coupons.length === 0 ? (
            <EmptyState
              title="Henüz kupon yok"
              description="Müşterilerinize özel indirim kodları oluşturup sosyal medyada veya e-postada paylaşabilirsiniz."
              action={
                <Button
                  type="button"
                  size="sm"
                  onClick={() => openCoupon(blankCoupon)}
                >
                  İlk kuponu oluştur
                </Button>
              }
            />
          ) : (
            <CouponTable
              coupons={coupons}
              now={now}
              pending={pending}
              onEdit={(c) => openCoupon(couponToForm(c))}
              onDelete={(c) => {
                if (window.confirm(`"${c.code}" kuponu silinsin mi?`)) {
                  run(() => deleteCouponAction(c.id), "Kupon silindi.");
                }
              }}
            />
          )
        ) : campaigns.length === 0 ? (
          <EmptyState
            title="Henüz otomatik kampanya yok"
            description="Örneğin “500 TL üzeri %10 indirim” gibi, kod gerektirmeden sepete kendiliğinden uygulanan indirimler tanımlayın."
            action={
              <Button
                type="button"
                size="sm"
                onClick={() => openCampaign(blankCampaign)}
              >
                İlk kampanyayı oluştur
              </Button>
            }
          />
        ) : (
          <CampaignTable
            campaigns={campaigns}
            categories={categories}
            now={now}
            pending={pending}
            onEdit={(c) => openCampaign(campaignToForm(c))}
            onDelete={(c) => {
              if (window.confirm(`"${c.name}" kampanyası silinsin mi?`)) {
                run(() => deleteCampaignAction(c.id), "Kampanya silindi.");
              }
            }}
          />
        )}
      </Card>

      {couponForm ? (
        <CouponModal
          open
          form={couponForm}
          pending={pending}
          message={message}
          onClose={() => setCouponForm(null)}
          onChange={(key, value) =>
            setCouponForm((current) =>
              current ? { ...current, [key]: value } : current,
            )
          }
          onSave={() =>
            run(
              () => saveCouponAction(couponForm.id, withIsoDates(couponForm)),
              couponForm.id ? "Kupon güncellendi." : "Kupon oluşturuldu.",
              () => setCouponForm(null),
            )
          }
        />
      ) : null}

      {campaignForm ? (
        <CampaignModal
          open
          form={campaignForm}
          pending={pending}
          message={message}
          categories={categories}
          onClose={() => setCampaignForm(null)}
          onChange={(key, value) =>
            setCampaignForm((current) =>
              current ? { ...current, [key]: value } : current,
            )
          }
          onSave={() =>
            run(
              () =>
                saveCampaignAction(campaignForm.id, withIsoDates(campaignForm)),
              campaignForm.id
                ? "Kampanya güncellendi."
                : "Kampanya oluşturuldu.",
              () => setCampaignForm(null),
            )
          }
        />
      ) : null}
    </div>
  );
}
