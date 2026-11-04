import type { RevenueBucket } from "@/modules/reporting/reporting.service";
import { formatMoney } from "@/shared/money";

/** Eksen için "temiz" üst sınır (yarısı da temiz sayı olacak adımlarla). */
export function niceMax(value: number): number {
  if (value <= 0) return 1000;
  const exponent = 10 ** Math.floor(Math.log10(value));
  const step =
    [1, 1.5, 2, 3, 4, 5, 6, 8, 10].find((m) => m * exponent >= value) ?? 10;
  return step * exponent;
}

const number = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });

/** Eksen etiketi: "₺800", "₺1,5 bin", "₺2 mn" — kısaltma açıkça yazılır. */
export function axisLabel(value: number): string {
  if (value === 0) return "0";
  if (value >= 1_000_000) return `₺${number.format(value / 1_000_000)} mn`;
  if (value >= 1_000) return `₺${number.format(value / 1_000)} bin`;
  return `₺${number.format(value)}`;
}

/** Tek serilik ciro sütun grafiği (sunucu bileşeni, kütüphanesiz). */
export function RevenueChart({
  buckets,
  granularity,
}: {
  buckets: RevenueBucket[];
  granularity: "day" | "month";
}) {
  const values = buckets.map((bucket) => Number(bucket.revenue));
  const max = niceMax(Math.max(0, ...values));
  const ticks = [max, max / 2, 0];
  // Çok sütunda etiketler çakışmasın: en fazla ~7 etiket.
  const labelEvery = Math.max(1, Math.ceil(buckets.length / 7));
  const best = values.indexOf(Math.max(...values));
  const empty = values.every((value) => value === 0);

  return (
    <figure className="flex flex-col gap-3">
      <div className="flex h-56 gap-2">
        {/* Y ekseni */}
        <div className="flex w-14 shrink-0 flex-col justify-between pb-6 text-right text-[11px] text-slate-400 tabular-nums">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="-translate-y-1/2 first:translate-y-0 last:translate-y-0"
            >
              {axisLabel(tick)}
            </span>
          ))}
        </div>

        <div className="relative flex min-w-0 flex-1 flex-col">
          {/* Izgara: saç teli, düz, geri planda */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between"
          >
            <div className="border-t border-slate-100" />
            <div className="border-t border-slate-100" />
            <div className="border-t border-slate-200" />
          </div>

          {empty ? (
            <p className="relative m-auto pb-6 text-sm text-slate-400">
              Bu dönemde satış kaydı bulunmuyor.
            </p>
          ) : (
            <ul
              aria-hidden="true"
              className="relative flex flex-1 items-end gap-[2px]"
            >
              {buckets.map((bucket, index) => {
                const value = values[index]!;
                const height = (value / max) * 100;
                const showLabel =
                  index % labelEvery === 0 || index === buckets.length - 1;
                return (
                  <li
                    key={bucket.key}
                    className="group relative flex h-full min-w-0 flex-1 flex-col items-center"
                  >
                    <div className="flex w-full flex-1 items-end justify-center">
                      <div
                        tabIndex={0}
                        className="relative flex h-full w-full max-w-6 cursor-default items-end justify-center outline-none"
                      >
                        <div
                          className="w-full rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-85"
                          style={{
                            height: `${Math.max(value > 0 ? 1.5 : 0, height)}%`,
                          }}
                        />
                        {/* İpucu: hover ve klavye odağında */}
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] whitespace-nowrap text-white shadow-lg group-hover:block group-focus-within:block">
                          <p className="font-semibold">{bucket.label}</p>
                          <p className="tabular-nums">
                            {formatMoney(bucket.revenue)} · {bucket.orderCount}{" "}
                            sipariş
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Etiket sütundan taşabilir (seyrek basılır, komşusuyla çakışmaz) */}
                    <span className="relative mt-1.5 h-4.5 w-full">
                      {showLabel ? (
                        <span className="absolute left-1/2 -translate-x-1/2 text-[10px] whitespace-nowrap text-slate-400">
                          {bucket.label}
                        </span>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {!empty && best >= 0 ? (
        <figcaption className="text-xs text-slate-500">
          En yüksek {granularity === "day" ? "gün" : "ay"}:{" "}
          <strong className="font-semibold text-slate-800">
            {buckets[best]!.label}
          </strong>{" "}
          — {formatMoney(buckets[best]!.revenue)}
        </figcaption>
      ) : null}

      {/* Ekran okuyucu ve tablo görünümü */}
      <details className="text-xs text-slate-500">
        <summary className="cursor-pointer select-none hover:text-slate-800">
          Tablo olarak göster
        </summary>
        <div className="mt-2 max-h-60 overflow-auto rounded-lg border border-slate-200">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-1.5 font-semibold">
                  {granularity === "day" ? "Gün" : "Ay"}
                </th>
                <th className="px-3 py-1.5 text-right font-semibold">
                  Sipariş
                </th>
                <th className="px-3 py-1.5 text-right font-semibold">Ciro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 tabular-nums">
              {buckets.map((bucket) => (
                <tr key={bucket.key}>
                  <td className="px-3 py-1">{bucket.label}</td>
                  <td className="px-3 py-1 text-right">{bucket.orderCount}</td>
                  <td className="px-3 py-1 text-right">
                    {formatMoney(bucket.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
