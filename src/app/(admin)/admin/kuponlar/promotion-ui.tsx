"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/cn";
import {
  PROMOTION_STATUS_LABELS,
  type PromotionStatus,
} from "./promotion-status";
import { Message } from "./promotion-types";

export const STATUS_STYLES: Record<
  PromotionStatus,
  { pill: string; dot: string }
> = {
  active: {
    pill: "bg-emerald-50 text-emerald-800 ring-emerald-200/70",
    dot: "bg-emerald-500",
  },
  scheduled: {
    pill: "bg-sky-50 text-sky-800 ring-sky-200/70",
    dot: "bg-sky-500",
  },
  expired: {
    pill: "bg-slate-100 text-slate-600 ring-slate-200",
    dot: "bg-slate-400",
  },
  exhausted: {
    pill: "bg-amber-50 text-amber-800 ring-amber-200/70",
    dot: "bg-amber-500",
  },
  inactive: {
    pill: "bg-slate-100 text-slate-600 ring-slate-200",
    dot: "bg-slate-300",
  },
};

export function StatusBadge({ status }: { status: PromotionStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset",
        style.pill,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {PROMOTION_STATUS_LABELS[status]}
    </span>
  );
}

export function Icon({ d, size = 15 }: { d: string[]; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {d.map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  );
}

export const ICONS = {
  copy: [
    "M8 8h11a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1Z",
    "M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3",
  ],
  check: ["M20 6 9 17l-5-5"],
  edit: ["M12 20h9", "M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"],
  trash: ["M3 6h18", "M8 6V4h8v2", "M19 6l-1 14H6L5 6"],
  x: ["M18 6 6 18", "M6 6l12 12"],
  plus: ["M12 5v14", "M5 12h14"],
};

export function Alert({ message }: { message: Message }) {
  if (!message) return null;
  return (
    <div
      role={message.error ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2 text-[12px] font-medium",
        message.error
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800",
      )}
    >
      {message.text}
    </div>
  );
}

export function useRunner() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);

  function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    successText: string,
    onDone?: () => void,
  ) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      setMessage(
        result.ok
          ? { text: successText, error: false }
          : { text: result.error ?? "İşlem başarısız oldu.", error: true },
      );
      if (result.ok) onDone?.();
    });
  }

  return { pending, message, run, setMessage };
}

export function Modal({
  open,
  title,
  description,
  onClose,
  footer,
  children,
}: {
  open: boolean;
  title: string;
  description: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2
              id={titleId}
              className="text-[15px] font-semibold text-slate-900"
            >
              {title}
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-500">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Icon d={ICONS.x} size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5">
          {children}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
          {footer}
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  required,
  action,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-medium text-slate-700">
          {label}
          {required ? <span className="ml-0.5 text-rose-500">*</span> : null}
        </span>
        {action}
      </span>
      {children}
      {hint ? <span className="text-[11px] text-slate-400">{hint}</span> : null}
    </label>
  );
}

export function AffixInput({
  affix,
  ...props
}: React.ComponentProps<typeof Input> & { affix: string }) {
  return (
    <span className="relative block">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[12px] font-medium text-slate-400">
        {affix}
      </span>
      <Input {...props} className={cn("pl-7", props.className)} />
    </span>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 px-3.5 py-3 text-left transition hover:bg-slate-50"
    >
      <span>
        <span className="block text-[13px] font-medium text-slate-800">
          {label}
        </span>
        <span className="block text-[11px] text-slate-500">{description}</span>
      </span>
      <span
        className={cn(
          "relative h-5 w-9 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-4.5" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

export function DateRange({
  startsAt,
  endsAt,
  onStart,
  onEnd,
}: {
  startsAt: string;
  endsAt: string;
  onStart: (value: string) => void;
  onEnd: (value: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Başlangıç" hint="Boşsa hemen geçerli">
        <Input
          type="datetime-local"
          value={startsAt}
          onChange={(e) => onStart(e.target.value)}
        />
      </Field>
      <Field label="Bitiş" hint="Boşsa süresiz">
        <Input
          type="datetime-local"
          value={endsAt}
          onChange={(e) => onEnd(e.target.value)}
        />
      </Field>
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint: ReactNode;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-[12px] font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-xl leading-none font-semibold tracking-tight text-slate-900 tabular-nums sm:text-[26px]">
        {value}
      </p>
      <p className="mt-2 truncate text-[11px] text-slate-400">{hint}</p>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-6 py-14 text-center">
      <p className="text-[13px] font-semibold text-slate-800">{title}</p>
      <p className="max-w-sm text-[12px] text-slate-500">{description}</p>
      <div className="mt-3">{action}</div>
    </div>
  );
}
