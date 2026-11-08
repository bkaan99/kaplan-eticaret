import { integer } from "@/shared/format";
import Link from "next/link";
import { type ReactNode, type SVGProps } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/shared/cn";

export function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const icons = {
  revenue: (
    <Icon>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 9.5v.01M18 14.5v.01" />
    </Icon>
  ),
  orders: (
    <Icon>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18M16 10a4 4 0 0 1-8 0" />
    </Icon>
  ),
  basket: (
    <Icon>
      <circle cx="9" cy="20" r="1.3" />
      <circle cx="18" cy="20" r="1.3" />
      <path d="M2.5 3h2.6l2.4 11.4a2 2 0 0 0 2 1.6h8.1a2 2 0 0 0 1.9-1.5L21 7H6" />
    </Icon>
  ),
  users: (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  ),
  package: (
    <Icon>
      <path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
    </Icon>
  ),
  returns: (
    <Icon>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </Icon>
  ),
  dealer: (
    <Icon>
      <path d="M3 21h18M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
    </Icon>
  ),
  alert: (
    <Icon>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4M12 17h.01" />
    </Icon>
  ),
  chevron: (
    <Icon width={14} height={14}>
      <path d="m9 18 6-6-6-6" />
    </Icon>
  ),
  check: (
    <Icon width={14} height={14}>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  ),
};

/** Önceki döneme göre değişim. Durum rengi her zaman ok + metinle birlikte. */
export function Delta({
  value,
  className,
}: {
  value: number | null;
  className?: string;
}) {
  if (value === null) return null;
  const up = value > 0;
  const flat = value === 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
        flat
          ? "bg-slate-100 text-slate-600"
          : up
            ? "bg-emerald-50 text-emerald-700"
            : "bg-rose-50 text-rose-700",
        className,
      )}
    >
      <span aria-hidden="true">{flat ? "→" : up ? "↑" : "↓"}</span>
      <span className="sr-only">
        {flat ? "Değişim yok" : up ? "Artış" : "Düşüş"}
      </span>
      %{integer.format(Math.abs(value))}
    </span>
  );
}

export function Panel({
  title,
  subtitle,
  action,
  className,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold text-slate-900">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-[12px] text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="flex-1 px-5 py-4">{children}</div>
    </Card>
  );
}

export function PanelLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-medium text-slate-500 transition-colors hover:text-slate-900"
    >
      {children}
      {icons.chevron}
    </Link>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="flex h-full min-h-24 items-center justify-center text-center text-[12px] text-slate-400">
      {children}
    </p>
  );
}

export function Kpi({
  label,
  icon,
  value,
  change,
  footnote,
}: {
  label: string;
  icon: ReactNode;
  value: ReactNode;
  change: number | null;
  footnote: ReactNode;
}) {
  return (
    <Card className="flex min-w-0 flex-col gap-3 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-slate-500">{label}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          {icon}
        </span>
      </div>
      <div className="truncate text-xl leading-none font-semibold tracking-tight text-slate-900 tabular-nums sm:text-[26px]">
        {value}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Delta value={change} />
        <span className="truncate text-[11px] text-slate-400">{footnote}</span>
      </div>
    </Card>
  );
}
