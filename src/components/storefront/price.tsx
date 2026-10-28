import { formatMoney } from "@/shared/money";

export function Price({
  value,
  compareAt,
  currency = "TRY",
  prefix,
}: {
  value: string;
  compareAt?: string | null;
  currency?: string;
  prefix?: string;
}) {
  return (
    <div className="flex flex-col">
      {prefix ? (
        <span className="text-[11px] font-medium text-slate-400">{prefix}</span>
      ) : null}
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold tracking-tight text-slate-900">
          {formatMoney(value, currency)}
        </span>
        {compareAt ? (
          <span className="text-xs font-medium text-slate-400 line-through">
            {formatMoney(compareAt, currency)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
