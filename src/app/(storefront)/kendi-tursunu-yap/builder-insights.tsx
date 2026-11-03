"use client";

import {
  BRINE_OPTIONS,
  SPICE_OPTIONS,
} from "@/modules/custom-pickle/custom-pickle.types";
import { formatMoney } from "@/shared/money";
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
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4">
      <div>
        <h2 className="text-sm font-bold text-primary">Lezzet profili</h2>
        <dl className="mt-2 flex flex-col gap-2">
          {(
            profile ??
            ["Ekşilik", "Acılık", "Çıtırlık", "Renk"].map((label) => ({
              label,
              value: 0,
              text: "–",
            }))
          ).map((meter) => (
            <div
              key={meter.label}
              className="grid grid-cols-[4.5rem_minmax(0,1fr)_5rem] items-center gap-2 text-xs"
            >
              <dt className="font-medium text-slate-600">{meter.label}</dt>
              <div
                aria-hidden="true"
                className="h-1.5 overflow-hidden rounded-full bg-slate-100"
              >
                <div
                  className="h-full rounded-full bg-primary transition-[width] duration-300"
                  style={{ width: `${Math.round(meter.value * 100)}%` }}
                />
              </div>
              <dd className="text-right font-semibold text-primary">
                {meter.text}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 rounded-xl bg-[#f4f5f0] px-3 py-2 text-xs leading-relaxed text-slate-700">
          {mixNote}
        </p>
      </div>

      <div className="border-t border-slate-100 pt-3">
        <h2 className="text-sm font-bold text-primary">
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
          <div className="mt-1 flex justify-between gap-3 border-t border-slate-100 pt-2 text-sm font-bold text-primary">
            <dt>Toplam</dt>
            <dd>{formatMoney(unit, currency)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
