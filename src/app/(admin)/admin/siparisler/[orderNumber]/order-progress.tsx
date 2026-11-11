import type { OrderStatus } from "@/modules/orders/order.types";
import { cn } from "@/shared/cn";
import {
  formatAdminDate,
  formatAdminTime,
} from "@/components/admin/order-status";

const STEPS = [
  { key: "PLACED", label: "Sipariş alındı" },
  { key: "PAID", label: "Ödeme alındı" },
  { key: "PROCESSING", label: "Hazırlanıyor" },
  { key: "SHIPPED", label: "Kargoya verildi" },
  { key: "DELIVERED", label: "Teslim edildi" },
] as const;

/** Durumun akıştaki sırası: bu adıma kadar (dahil) tamamlanmıştır. */
const REACHED: Record<OrderStatus, number> = {
  PENDING_PAYMENT: 0,
  PAID: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: -1,
  REFUNDED: -1,
};

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={12}
      height={12}
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Siparişin yaşam döngüsünü adım adım gösterir; iptal/iade ayrı bir bantla. */
export function OrderProgress({
  status,
  dates,
}: {
  status: OrderStatus;
  /** Bilinen adım tarihleri (adım anahtarına göre) */
  dates: Partial<Record<(typeof STEPS)[number]["key"], Date | null>>;
}) {
  if (status === "CANCELLED" || status === "REFUNDED") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
          <svg
            viewBox="0 0 24 24"
            width={14}
            height={14}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </span>
        <div>
          <p className="text-[13px] font-semibold text-rose-900">
            {status === "CANCELLED"
              ? "Bu sipariş iptal edildi"
              : "Bu siparişin ödemesi iade edildi"}
          </p>
          <p className="text-[12px] text-rose-800/80">
            Sipariş akışı durduruldu; yeni bir işlem yapılamaz.
          </p>
        </div>
      </div>
    );
  }

  const reached = REACHED[status];

  return (
    <ol
      className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] md:grid md:grid-cols-5 md:overflow-visible md:pb-0"
      aria-label="Sipariş akışı"
    >
      {STEPS.map((step, index) => {
        const done = index <= reached;
        const current = index === reached + 1;
        const date = dates[step.key];
        return (
          <li
            key={step.key}
            className="relative flex min-w-[5.75rem] shrink-0 flex-col items-center text-center md:min-w-0"
          >
            {/* Bağlantı çizgisi */}
            {index > 0 ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-3.5 right-1/2 h-0.5 w-[calc(100%+0.5rem)]",
                  index <= reached ? "bg-primary" : "bg-slate-200",
                )}
              />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ring-4 ring-white",
                done
                  ? "bg-primary text-white"
                  : current
                    ? "border-2 border-primary bg-white text-primary"
                    : "border-2 border-slate-200 bg-white text-slate-400",
              )}
            >
              {done ? <Check /> : index + 1}
            </span>
            <span
              className={cn(
                "mt-2 text-[11px] leading-tight font-semibold whitespace-nowrap md:whitespace-normal sm:text-[12px]",
                done || current ? "text-slate-900" : "text-slate-400",
              )}
            >
              {step.label}
            </span>
            <span className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
              {done && date
                ? `${formatAdminDate(date)} ${formatAdminTime(date)}`
                : current
                  ? "Sıradaki adım"
                  : "\u00a0"}
            </span>
            <span className="sr-only">
              {done ? "tamamlandı" : current ? "sıradaki adım" : "bekliyor"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
