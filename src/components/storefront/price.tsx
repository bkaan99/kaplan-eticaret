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
    <span className="inline-flex flex-wrap items-baseline gap-x-2">
      <span>
        <span
          className={`text-base font-bold ${compareAt ? "text-brand-pepper" : "text-primary"}`}
        >
          {formatMoney(value, currency)}
        </span>
        {prefix ? (
          <span className="text-xs text-muted-foreground">{prefix}</span>
        ) : null}
      </span>
      {compareAt ? (
        <span className="text-sm text-muted-foreground line-through">
          {formatMoney(compareAt, currency)}
        </span>
      ) : null}
    </span>
  );
}
