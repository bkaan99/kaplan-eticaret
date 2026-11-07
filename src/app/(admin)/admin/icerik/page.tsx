import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading } from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { getContentService } from "@/modules/content/container";
import { adminPage } from "@/modules/admin/guard";
import { PERMISSIONS } from "@/shared/permissions";
import { ContentManager } from "./content-manager";

export const metadata: Metadata = { title: "İçerik Yönetimi" };

async function ContentContent() {
  const user = await adminPage(PERMISSIONS.CONTENT_MANAGE);
  if (!user) return <AccessDenied />;

  const content = getContentService();
  const [banners, pages, headerMenu, footerMenu] = await Promise.all([
    content.listBanners(),
    content.listPages(),
    content.menu("header"),
    content.menu("footer"),
  ]);

  return (
    <ContentManager
      banners={banners.map((banner) => ({
        ...banner,
        startsAt: banner.startsAt?.toISOString() ?? null,
        endsAt: banner.endsAt?.toISOString() ?? null,
      }))}
      pages={pages.map((page) => ({
        id: page.id,
        title: page.title,
        slug: page.slug,
        content: page.content,
        isPublished: page.isPublished,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
      }))}
      headerMenu={headerMenu}
      footerMenu={footerMenu}
    />
  );
}

export default function AdminContentPage() {
  return (
    <>
      <PageHeader
        title="İçerik Yönetimi"
        description="Ana sayfa vitrin bannerları, kurumsal & yasal sayfalar (Hakkımızda, SSS...) ve menü navigasyonu."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
            >
              <span>Mağazayı Gör</span>
              <span className="text-slate-400">↗</span>
            </Link>
          </div>
        }
      />
      <Suspense
        fallback={<AdminLoading />}
      >
        <ContentContent />
      </Suspense>
    </>
  );
}
