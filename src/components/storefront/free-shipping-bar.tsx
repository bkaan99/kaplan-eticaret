import { siteConfig } from "@/config/site.config";
import { freeShippingProgress } from "@/modules/checkout/shipping";
import { cn } from "@/shared/cn";
import { formatMoney } from "@/shared/money";
import { TruckIcon } from "./icons";

/** Sepet ara toplamına göre ücretsiz kargoya kalan tutarı gösteren çubuk. */
export function FreeShippingBar({
  subtotal,
  className,
}: {
  subtotal: string;
  className?: string;
}) {
  const threshold = siteConfig.shipping.freeShippingThreshold;
  const progress = freeShippingProgress(subtotal, threshold);

  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        progress.reached
          ? "border-emerald-200 bg-emerald-50/80"
          : "border-slate-200 bg-[#f7f8f3]",
        className,
      )}
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <TruckIcon
          width={18}
          height={18}
          className={progress.reached ? "text-emerald-700" : "text-primary"}
        />
        {progress.reached ? (
          <span>
            Tebrikler, kargonuz{" "}
            <strong className="font-extrabold text-emerald-700">
              ücretsiz!
            </strong>
          </span>
        ) : (
          <span>
            Ücretsiz kargoya{" "}
            <strong className="font-extrabold text-primary">
              {formatMoney(progress.remaining)}
            </strong>{" "}
            kaldı
          </span>
        )}
      </p>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-200/70"
        role="progressbar"
        aria-label="Ücretsiz kargo ilerlemesi"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            progress.reached ? "bg-emerald-500" : "bg-primary",
          )}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      {progress.reached ? null : (
        <p className="mt-2 text-xs text-slate-500">
          {formatMoney(threshold)} ve üzeri siparişlerde kargo bizden.
        </p>
      )}
    </div>
  );
}
