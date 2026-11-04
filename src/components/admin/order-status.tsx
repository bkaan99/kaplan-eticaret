import {
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/modules/orders/order-labels";
import type { OrderStatus, PaymentStatus } from "@/modules/orders/order.types";
import { cn } from "@/shared/cn";

/** Her durumun kendi rengi: liste taranırken durum bir bakışta ayırt edilir. */
const ORDER_STATUS_STYLES: Record<OrderStatus, { pill: string; dot: string }> =
  {
    PENDING_PAYMENT: {
      pill: "bg-amber-50 text-amber-800 ring-amber-200/70",
      dot: "bg-amber-500",
    },
    PAID: { pill: "bg-sky-50 text-sky-800 ring-sky-200/70", dot: "bg-sky-500" },
    PROCESSING: {
      pill: "bg-violet-50 text-violet-800 ring-violet-200/70",
      dot: "bg-violet-500",
    },
    SHIPPED: {
      pill: "bg-blue-50 text-blue-800 ring-blue-200/70",
      dot: "bg-blue-500",
    },
    DELIVERED: {
      pill: "bg-emerald-50 text-emerald-800 ring-emerald-200/70",
      dot: "bg-emerald-500",
    },
    CANCELLED: {
      pill: "bg-rose-50 text-rose-800 ring-rose-200/70",
      dot: "bg-rose-500",
    },
    REFUNDED: {
      pill: "bg-slate-100 text-slate-700 ring-slate-200",
      dot: "bg-slate-400",
    },
  };

export function orderStatusDot(status: OrderStatus): string {
  return ORDER_STATUS_STYLES[status].dot;
}

export function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const style = ORDER_STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset",
        style.pill,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

const PAYMENT_STYLES: Record<PaymentStatus, string> = {
  PENDING: "text-amber-700",
  PAID: "text-emerald-700",
  FAILED: "text-rose-700",
  REFUNDED: "text-slate-500",
  PARTIALLY_REFUNDED: "text-slate-500",
};

/** Ödeme durumu: renkli metin (tablo hücresinde ikinci rozet kalabalık yapar). */
export function PaymentStatusText({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const known = status as PaymentStatus;
  return (
    <span
      className={cn(
        "text-[12px] font-medium",
        PAYMENT_STYLES[known] ?? "text-slate-600",
        className,
      )}
    >
      {PAYMENT_STATUS_LABELS[known] ?? status}
    </span>
  );
}

const dateFormat = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});
const timeFormat = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

/** "4 Kas 2026" — Türkiye saatine göre. */
export function formatAdminDate(date: Date): string {
  return dateFormat.format(date);
}

/** "15:32" — Türkiye saatine göre. */
export function formatAdminTime(date: Date): string {
  return timeFormat.format(date);
}
