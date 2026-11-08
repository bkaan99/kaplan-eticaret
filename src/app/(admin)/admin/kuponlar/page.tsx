import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading } from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { features } from "@/config/features";
import {
  getProductAdminService,
  getPromotionService,
} from "@/modules/admin/container";
import { adminPage } from "@/modules/admin/guard";
import { PERMISSIONS } from "@/shared/permissions";
import { PromotionManager } from "./promotion-manager";
import type { CampaignRow } from "./promotion-types";

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
      now={new Date().toISOString()}
    />
  );
}

export default function AdminPromotionsPage() {
  return (
    <>
      <PageHeader
        title="Kuponlar ve kampanyalar"
        description="İndirim kodları ve koşul sağlandığında sepete kendiliğinden uygulanan kampanyalar."
        actions={
          features.b2b ? (
            <Link
              href="/admin/bayi-gruplari"
              className={buttonVariants({ variant: "outline" })}
            >
              Bayi fiyatlandırması
            </Link>
          ) : null
        }
      />
      <Suspense fallback={<AdminLoading label="Kampanyalar yükleniyor..." />}>
        <PromotionsContent />
      </Suspense>
    </>
  );
}
