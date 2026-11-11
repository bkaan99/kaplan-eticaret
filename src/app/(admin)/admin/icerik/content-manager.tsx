"use client";

import { useState } from "react";
import { BannerSection } from "./banner-section";
import {
  type BannerRow,
  type MenuItemRow,
  type PageRow,
} from "./content-types";
import { MenuEditor } from "./menu-editor";
import { PageSection } from "./page-section";
export type { BannerRow, PageRow, MenuItemRow } from "./content-types";

export function ContentManager({
  banners,
  pages,
  headerMenu,
  footerMenu,
}: {
  banners: BannerRow[];
  pages: PageRow[];
  headerMenu: MenuItemRow[];
  footerMenu: MenuItemRow[];
}) {
  const [activeTab, setActiveTab] = useState<"banners" | "pages" | "menus">(
    "banners",
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Üst Sekmeler */}
      <div className="flex items-center overflow-x-auto rounded-2xl border-b border-slate-200/80 bg-white px-2 shadow-2xs [scrollbar-width:none] sm:px-4">
        <button
          type="button"
          onClick={() => setActiveTab("banners")}
          className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-4 text-xs font-bold transition-all cursor-pointer sm:px-4 ${
            activeTab === "banners"
              ? "border-emerald-700 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>🖼️ Vitrin Bannerları</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {banners.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("pages")}
          className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-4 text-xs font-bold transition-all cursor-pointer sm:px-4 ${
            activeTab === "pages"
              ? "border-emerald-700 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>📄 Statik & Kurumsal Sayfalar</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {pages.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("menus")}
          className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-4 text-xs font-bold transition-all cursor-pointer sm:px-4 ${
            activeTab === "menus"
              ? "border-emerald-700 text-emerald-800"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>🧭 Menü & Navigasyon</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {headerMenu.length + footerMenu.length}
          </span>
        </button>
      </div>

      {/* Aktif Sekme İçeriği */}
      {activeTab === "banners" && <BannerSection banners={banners} />}
      {activeTab === "pages" && <PageSection pages={pages} />}
      {activeTab === "menus" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <MenuEditor
            menuKey="header"
            title="Üst Menü (Header) Bağlantıları"
            description="Kullanıcıların sitenin üst gezinme çubuğunda göreceği ek linkler."
            initial={headerMenu}
          />
          <MenuEditor
            menuKey="footer"
            title="Alt Menü (Footer) Bağlantıları"
            description="Sitenin en altındaki Yardım ve Kurumsal sütununda listelenecek linkler."
            initial={footerMenu}
          />
        </div>
      )}
    </div>
  );
}
