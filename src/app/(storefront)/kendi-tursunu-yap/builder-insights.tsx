"use client";

import {
  BRINE_OPTIONS,
  SPICE_OPTIONS,
} from "@/modules/custom-pickle/custom-pickle.types";
import { formatMoney } from "@/shared/money";
import { FlavorWheel } from "./flavor-wheel";
import {
  extraFor,
  type CustomPickleBuilderState,
} from "./use-custom-pickle-builder";

/** Sağ sütun: lezzet profili, kısa not ve fiyat kırılımı. */
export function BuilderInsights({
  builder,
}: {
  builder: CustomPickleBuilderState;
}) {
  const {
    profile,
    mixNote,
    chosen,
    shares,
    size,
    base,
    currency,
    unit,
    brine,
    spice,
  } = builder;

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-200/70 bg-white p-5 shadow-[0_1px_2px_rgba(11,35,24,0.04),0_12px_28px_-16px_rgba(11,35,24,0.16)]">
      <div>
        <h2 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          Lezzet çarkı
        </h2>
        <div className="mt-2">
          <FlavorWheel meters={profile} />
        </div>
        <p className="mt-3 rounded-2xl bg-[#f4f5f0] px-3 py-2.5 text-xs leading-relaxed text-slate-700">
          {mixNote}
        </p>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <h2 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          Bidonunuz · {size?.label ?? "Bidon"}
        </h2>
        <dl className="mt-2 flex flex-col gap-1.5 text-xs">
          <div className="flex justify-between gap-3 text-slate-600">
            <dt>Bidon</dt>
            <dd>{formatMoney(base, currency)}</dd>
          </div>
          {chosen.map((item) => (
            <div
              key={item.id}
              className="flex justify-between gap-3 text-slate-600"
            >
              <dt>
                {item.name}
                {shares[item.id] !== undefined ? ` %${shares[item.id]}` : ""}
              </dt>
              <dd>
                +{formatMoney(extraFor(item, size, shares[item.id]), currency)}
              </dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 text-slate-600">
            <dt>Salamura · acılık</dt>
            <dd className="text-right">
              {builder.activeBrine?.label ?? BRINE_OPTIONS[brine] ?? brine} ·{" "}
              {builder.activeSpice?.label ?? SPICE_OPTIONS[spice] ?? spice}
            </dd>
          </div>
          <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-slate-100 pt-2.5 font-display text-lg font-bold text-primary">
            <dt>Toplam</dt>
            <dd>{formatMoney(unit, currency)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
