"use client";

import { useState } from "react";
import type { ContactSettings, ShippingSettings } from "@/modules/settings/settings.types";
import { cn } from "@/shared/cn";
import { SettingsForm } from "./settings-form";
import { ShippingSettingsForm } from "./shipping-settings-form";

type TabId = "contact" | "shipping";

const TABS: {
  id: TabId;
  label: string;
  hint: string;
}[] = [
  {
    id: "contact",
    label: "İletişim",
    hint: "Telefon, WhatsApp, e-posta, adres, sosyal",
  },
  {
    id: "shipping",
    label: "Kargo",
    hint: "Ücretsiz kargo eşiği ve sabit ücret",
  },
];

export function SettingsWorkspace({
  contact,
  shipping,
}: {
  contact: ContactSettings;
  shipping: ShippingSettings;
}) {
  const [tab, setTab] = useState<TabId>("contact");

  return (
    <div className="flex flex-col gap-5">
      <nav
        aria-label="Ayar bölümleri"
        className="flex flex-wrap gap-1 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1"
      >
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "min-w-0 flex-1 rounded-lg px-3.5 py-2.5 text-left transition",
                active
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
              )}
            >
              <span className="block text-[13px] font-semibold">{item.label}</span>
              <span
                className={cn(
                  "mt-0.5 block truncate text-[11px]",
                  active ? "text-slate-500" : "text-slate-400",
                )}
              >
                {item.hint}
              </span>
            </button>
          );
        })}
      </nav>

      {tab === "contact" ? (
        <SettingsForm initialSettings={contact} />
      ) : (
        <ShippingSettingsForm initialSettings={shipping} />
      )}
    </div>
  );
}
