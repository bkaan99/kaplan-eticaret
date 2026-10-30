import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading } from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import {
  getProductAdminService,
  getPromotionService,
} from "@/modules/admin/container";
import { adminPage } from "@/modules/admin/guard";
import { PERMISSIONS } from "@/shared/permissions";
import { PromotionManager, type CampaignRow } from "./promotion-manager";

export const metadata: Metadata = { title: "Kupon ve Kampanya Yönetimi" };

function toCampaignRow(campaign: {
  id: string;
  name: string;
  ruleType: string;
  config: unknown;
  priority: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
}): CampaignRow {
  const config = (campaign.config ?? {}) as {
    type?: "PERCENT" | "FIXED";
    value?: number;
    categoryIds?: string[];
    minSubtotal?: number;
  };

  return {
    id: campaign.id,
    name: campaign.name,
    ruleType: campaign.ruleType,
    type: config.type ?? "PERCENT",
    value: config.value ?? 0,
    categoryIds: config.categoryIds ?? [],
    minSubtotal: config.minSubtotal ?? null,
    priority: campaign.priority,
    startsAt: campaign.startsAt?.toISOString() ?? null,
    endsAt: campaign.endsAt?.toISOString() ?? null,
    isActive: campaign.isActive,
  };
}

async function PromotionsContent() {
  const user = await adminPage(PERMISSIONS.PROMOTION_MANAGE);
  if (!user) return <AccessDenied />;

  const promotions = getPromotionService();
  const [coupons, campaigns, references] = await Promise.all([
    promotions.listCoupons(),
    promotions.listCampaigns(),
    getProductAdminService().references(),
  ]);

  return (
    <PromotionManager
      coupons={coupons.map((coupon) => ({
        ...coupon,
        startsAt: coupon.startsAt?.toISOString() ?? null,
        endsAt: coupon.endsAt?.toISOString() ?? null,
      }))}
      campaigns={campaigns.map(toCampaignRow)}
      categories={references.categories}
    />
  );
}

export default function AdminPromotionsPage() {
  return (
    <>
      <PageHeader
        title="Kupon ve Kampanya Yönetimi"
        description="Müşteri indirim kuponları, sepet alt limit kampanyaları ve kategori bazlı otomatik promosyonlar."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/bayi-gruplari"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <span>👥 Bayi Fiyatlandırması</span>
            </Link>
            <Link
              href="/"
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-700 px-3.5 text-xs font-semibold text-white shadow-2xs hover:bg-emerald-800 transition"
            >
              <span>Mağazayı Gör ↗</span>
            </Link>
          </div>
        }
      />
      <Suspense fallback={<AdminLoading />}>
        <PromotionsContent />
      </Suspense>
    </>
  );
}
