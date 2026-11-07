"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { formatAdminDate } from "@/components/admin/order-status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/shared/cn";
import { formatMoney } from "@/shared/money";
import {
  deleteCampaignAction,
  deleteCouponAction,
  saveCampaignAction,
  saveCouponAction,
} from "./actions";
import {
  PROMOTION_STATUS_LABELS,
  endsSoon,
  isoToLocalInput,
  localInputToIso,
  promotionStatus,
  type PromotionStatus,
} from "./promotion-status";

export interface CouponRow {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: string;
  minSubtotal: string | null;
  maxUses: number | null;
  perCustomerLimit: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}

export interface CampaignRow {
  id: string;
  name: string;
  ruleType: string;
  type: "PERCENT" | "FIXED";
  value: number;
  categoryIds: string[];
  minSubtotal: number | null;
  priority: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
}

type Category = { id: string; label: string };
type Message = { text: string; error: boolean } | null;

const integer = new Intl.NumberFormat("tr-TR");

/* ------------------------------------------------------------------ */
/* Küçük parçalar                                                      */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<PromotionStatus, { pill: string; dot: string }> = {
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

function StatusBadge({ status }: { status: PromotionStatus }) {
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

function discountLabel(type: "PERCENT" | "FIXED", value: number): string {
  return type === "PERCENT"
    ? `%${integer.format(value)}`
    : formatMoney(value).replace(/,00$/, "");
}

function validity(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt && !endsAt) return "Süresiz";
  if (!startsAt) return `${formatAdminDate(new Date(endsAt!))} tarihine kadar`;
  if (!endsAt)
    return `${formatAdminDate(new Date(startsAt))} tarihinden itibaren`;
  return `${formatAdminDate(new Date(startsAt))} – ${formatAdminDate(new Date(endsAt))}`;
}

function Icon({ d, size = 15 }: { d: string[]; size?: number }) {
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

const ICONS = {
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

function Alert({ message }: { message: Message }) {
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

function useRunner() {
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

/* ------------------------------------------------------------------ */
/* Modal kabuğu ve form alanları                                       */
/* ------------------------------------------------------------------ */

function Modal({
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

function Field({
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

function AffixInput({
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

function Switch({
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

function DateRange({
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

/* ------------------------------------------------------------------ */
/* Kuponlar                                                            */
/* ------------------------------------------------------------------ */

type CouponFormState = {
  id: string | null;
  code: string;
  type: string;
  value: string;
  minSubtotal: string;
  maxUses: string;
  perCustomerLimit: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

const blankCoupon: CouponFormState = {
  id: null,
  code: "",
  type: "PERCENT",
  value: "",
  minSubtotal: "",
  maxUses: "",
  perCustomerLimit: "",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

function randomCode(): string {
  const prefixes = ["KAPLAN", "GURME", "TURSU", "YAZ", "BAHAR", "OZEL"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix}${Math.floor(10 + Math.random() * 90)}`;
}

function CouponModal({
  open,
  form,
  pending,
  message,
  onClose,
  onChange,
  onSave,
}: {
  open: boolean;
  form: CouponFormState;
  pending: boolean;
  message: Message;
  onClose: () => void;
  onChange: <K extends keyof CouponFormState>(
    key: K,
    value: CouponFormState[K],
  ) => void;
  onSave: () => void;
}) {
  const percent = form.type === "PERCENT";
  return (
    <Modal
      open={open}
      title={form.id ? "Kuponu düzenle" : "Yeni kupon"}
      description="Müşterinin sepette veya ödemede gireceği indirim kodu"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            type="button"
            disabled={pending || !form.code.trim() || !form.value.trim()}
            onClick={onSave}
          >
            {pending
              ? "Kaydediliyor…"
              : form.id
                ? "Değişiklikleri kaydet"
                : "Kuponu oluştur"}
          </Button>
        </>
      }
    >
      <Alert message={message} />

      <Field
        label="Kupon kodu"
        required
        hint="3–40 karakter; harf, rakam, - ve _"
        action={
          <button
            type="button"
            onClick={() => onChange("code", randomCode())}
            className="cursor-pointer text-[11px] font-medium text-primary hover:underline"
          >
            Rastgele üret
          </button>
        }
      >
        <Input
          value={form.code}
          onChange={(e) => onChange("code", e.target.value.toUpperCase())}
          placeholder="Örn. KAPLAN20"
          className="font-mono font-semibold tracking-wider uppercase"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="İndirim türü">
          <Select
            value={form.type}
            onChange={(e) => onChange("type", e.target.value)}
          >
            <option value="PERCENT">Yüzde (%)</option>
            <option value="FIXED">Sabit tutar (₺)</option>
          </Select>
        </Field>
        <Field label={percent ? "İndirim oranı" : "İndirim tutarı"} required>
          <AffixInput
            affix={percent ? "%" : "₺"}
            value={form.value}
            onChange={(e) => onChange("value", e.target.value)}
            inputMode="decimal"
            placeholder={percent ? "20" : "50"}
          />
        </Field>
      </div>

      <Field label="Minimum sepet tutarı" hint="Boşsa her sepette geçerli">
        <AffixInput
          affix="₺"
          value={form.minSubtotal}
          onChange={(e) => onChange("minSubtotal", e.target.value)}
          inputMode="decimal"
          placeholder="Örn. 250"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Toplam kullanım kotası" hint="Boşsa sınırsız">
          <Input
            value={form.maxUses}
            onChange={(e) => onChange("maxUses", e.target.value)}
            inputMode="numeric"
            placeholder="Örn. 100"
          />
        </Field>
        <Field label="Müşteri başına" hint="Boşsa sınırsız">
          <Input
            value={form.perCustomerLimit}
            onChange={(e) => onChange("perCustomerLimit", e.target.value)}
            inputMode="numeric"
            placeholder="Örn. 1"
          />
        </Field>
      </div>

      <DateRange
        startsAt={form.startsAt}
        endsAt={form.endsAt}
        onStart={(v) => onChange("startsAt", v)}
        onEnd={(v) => onChange("endsAt", v)}
      />

      <Switch
        checked={form.isActive}
        onChange={(v) => onChange("isActive", v)}
        label="Kupon kullanıma açık"
        description={
          form.isActive
            ? "Geçerlilik tarihleri içinde müşteri kullanabilir"
            : "Kapalıyken kod hiçbir koşulda kabul edilmez"
        }
      />
    </Modal>
  );
}

function CouponTable({
  coupons,
  now,
  pending,
  onEdit,
  onDelete,
}: {
  coupons: CouponRow[];
  now: Date;
  pending: boolean;
  onEdit: (coupon: CouponRow) => void;
  onDelete: (coupon: CouponRow) => void;
}) {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(code: string) {
    if (!navigator?.clipboard?.writeText) return;
    void navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1800);
  }

  return (
    <ul className="divide-y divide-slate-100">
      {coupons.map((coupon) => {
        const status = promotionStatus(coupon, now);
        const soon = endsSoon(coupon, status, now);
        const usage = coupon.maxUses
          ? Math.min(100, Math.round((coupon.usedCount / coupon.maxUses) * 100))
          : null;
        const conditions = [
          coupon.minSubtotal && Number(coupon.minSubtotal) > 0
            ? `${formatMoney(coupon.minSubtotal)} ve üzeri sepet`
            : "Alt limit yok",
          coupon.perCustomerLimit
            ? `müşteri başı ${coupon.perCustomerLimit} kez`
            : null,
        ].filter(Boolean);

        return (
          <li
            key={coupon.id}
            className="grid gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/60 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-6"
          >
            {/* Kod + indirim */}
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[13px] font-semibold text-slate-800 tabular-nums">
                {discountLabel(coupon.type, Number(coupon.value))}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[13px] font-semibold tracking-wider text-slate-900">
                    {coupon.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(coupon.code)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded text-[11px] font-medium text-slate-400 hover:text-slate-700"
                    aria-label={`${coupon.code} kodunu kopyala`}
                  >
                    <Icon
                      d={copied === coupon.code ? ICONS.check : ICONS.copy}
                      size={13}
                    />
                    {copied === coupon.code ? "Kopyalandı" : null}
                  </button>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  {conditions.join(" · ")}
                </p>
              </div>
            </div>

            {/* Kullanım */}
            <div className="min-w-0">
              <p className="text-[12px] text-slate-700 tabular-nums">
                <span className="font-semibold text-slate-900">
                  {integer.format(coupon.usedCount)}
                </span>
                {coupon.maxUses
                  ? ` / ${integer.format(coupon.maxUses)} kullanım`
                  : " kullanım · sınırsız"}
              </p>
              {usage !== null ? (
                <div className="mt-1.5 h-1.5 max-w-40 rounded-full bg-slate-100">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      usage >= 100 ? "bg-amber-500" : "bg-primary",
                    )}
                    style={{ width: `${Math.max(2, usage)}%` }}
                  />
                </div>
              ) : null}
            </div>

            {/* Geçerlilik + durum */}
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              <span
                className={cn(
                  "text-[11px]",
                  soon ? "font-medium text-amber-700" : "text-slate-500",
                )}
              >
                {soon ? "Yakında bitiyor · " : ""}
                {validity(coupon.startsAt, coupon.endsAt)}
              </span>
            </div>

            {/* İşlemler */}
            <div className="flex items-center gap-1 justify-self-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(coupon)}
              >
                <Icon d={ICONS.edit} size={14} />
                Düzenle
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending || coupon.usedCount > 0}
                onClick={() => onDelete(coupon)}
                className="text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                title={
                  coupon.usedCount > 0
                    ? "Kullanılmış kupon silinemez; pasife alabilirsiniz"
                    : "Kuponu sil"
                }
                aria-label={`${coupon.code} kuponunu sil`}
              >
                <Icon d={ICONS.trash} size={14} />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Kampanyalar                                                         */
/* ------------------------------------------------------------------ */

type CampaignFormState = {
  id: string | null;
  name: string;
  ruleType: string;
  type: string;
  value: string;
  categoryIds: string[];
  minSubtotal: string;
  priority: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

const blankCampaign: CampaignFormState = {
  id: null,
  name: "",
  ruleType: "cart-threshold",
  type: "PERCENT",
  value: "",
  categoryIds: [],
  minSubtotal: "",
  priority: "0",
  startsAt: "",
  endsAt: "",
  isActive: true,
};

function CampaignModal({
  open,
  form,
  pending,
  message,
  categories,
  onClose,
  onChange,
  onSave,
}: {
  open: boolean;
  form: CampaignFormState;
  pending: boolean;
  message: Message;
  categories: Category[];
  onClose: () => void;
  onChange: <K extends keyof CampaignFormState>(
    key: K,
    value: CampaignFormState[K],
  ) => void;
  onSave: () => void;
}) {
  const percent = form.type === "PERCENT";
  return (
    <Modal
      open={open}
      title={form.id ? "Kampanyayı düzenle" : "Yeni otomatik kampanya"}
      description="Kod gerekmeden, koşul sağlandığında sepete kendiliğinden uygulanır"
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Vazgeç
          </Button>
          <Button
            type="button"
            disabled={pending || !form.name.trim() || !form.value.trim()}
            onClick={onSave}
          >
            {pending
              ? "Kaydediliyor…"
              : form.id
                ? "Değişiklikleri kaydet"
                : "Kampanyayı oluştur"}
          </Button>
        </>
      }
    >
      <Alert message={message} />

      <Field label="Kampanya adı" required hint="Müşteri sepette bu adı görür">
        <Input
          value={form.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Örn. 500 TL üzeri %10 indirim"
        />
      </Field>

      <Field label="Kural">
        <Select
          value={form.ruleType}
          onChange={(e) => onChange("ruleType", e.target.value)}
        >
          <option value="cart-threshold">
            Sepet tutarı belirli bir limiti geçince
          </option>
          <option value="category">Seçili kategorilerdeki ürünlere</option>
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="İndirim türü">
          <Select
            value={form.type}
            onChange={(e) => onChange("type", e.target.value)}
          >
            <option value="PERCENT">Yüzde (%)</option>
            <option value="FIXED">Sabit tutar (₺)</option>
          </Select>
        </Field>
        <Field label={percent ? "İndirim oranı" : "İndirim tutarı"} required>
          <AffixInput
            affix={percent ? "%" : "₺"}
            value={form.value}
            onChange={(e) => onChange("value", e.target.value)}
            inputMode="decimal"
            placeholder="10"
          />
        </Field>
      </div>

      {form.ruleType === "cart-threshold" ? (
        <Field label="Minimum sepet tutarı">
          <AffixInput
            affix="₺"
            value={form.minSubtotal}
            onChange={(e) => onChange("minSubtotal", e.target.value)}
            inputMode="decimal"
            placeholder="Örn. 500"
          />
        </Field>
      ) : (
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-[12px] font-medium text-slate-700">
            Geçerli kategoriler
            <span className="ml-1.5 font-normal text-slate-400">
              {form.categoryIds.length} seçili
            </span>
          </legend>
          <div className="grid max-h-44 gap-0.5 overflow-y-auto rounded-lg border border-slate-200 p-1.5 sm:grid-cols-2">
            {categories.map((category) => {
              const checked = form.categoryIds.includes(category.id);
              return (
                <label
                  key={category.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors",
                    checked
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      onChange(
                        "categoryIds",
                        checked
                          ? form.categoryIds.filter((id) => id !== category.id)
                          : [...form.categoryIds, category.id],
                      )
                    }
                    className="h-3.5 w-3.5 rounded border-slate-300 accent-primary"
                  />
                  <span className="truncate">{category.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <Field
        label="Öncelik"
        hint="Birden fazla kampanya uygunsa yüksek öncelikli olan önce uygulanır"
      >
        <Input
          value={form.priority}
          onChange={(e) => onChange("priority", e.target.value)}
          inputMode="numeric"
          placeholder="0"
          className="w-28"
        />
      </Field>

      <DateRange
        startsAt={form.startsAt}
        endsAt={form.endsAt}
        onStart={(v) => onChange("startsAt", v)}
        onEnd={(v) => onChange("endsAt", v)}
      />

      <Switch
        checked={form.isActive}
        onChange={(v) => onChange("isActive", v)}
        label="Kampanya devrede"
        description={
          form.isActive
            ? "Geçerlilik tarihleri içinde sepetlere otomatik uygulanır"
            : "Kapalıyken hiçbir sepete uygulanmaz"
        }
      />
    </Modal>
  );
}

function CampaignTable({
  campaigns,
  categories,
  now,
  pending,
  onEdit,
  onDelete,
}: {
  campaigns: CampaignRow[];
  categories: Category[];
  now: Date;
  pending: boolean;
  onEdit: (campaign: CampaignRow) => void;
  onDelete: (campaign: CampaignRow) => void;
}) {
  const categoryName = new Map(categories.map((c) => [c.id, c.label]));
  return (
    <ul className="divide-y divide-slate-100">
      {campaigns.map((campaign) => {
        const status = promotionStatus(campaign, now);
        const soon = endsSoon(campaign, status, now);
        const names = campaign.categoryIds
          .map((id) => categoryName.get(id))
          .filter((name): name is string => Boolean(name));
        const rule =
          campaign.ruleType === "category"
            ? names.length > 0
              ? `Kategoriler: ${names.slice(0, 3).join(", ")}${names.length > 3 ? ` +${names.length - 3}` : ""}`
              : "Kategori seçilmemiş"
            : `${formatMoney(campaign.minSubtotal ?? 0)} ve üzeri sepet`;

        return (
          <li
            key={campaign.id}
            className="grid gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50/60 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-6"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[13px] font-semibold text-slate-800 tabular-nums">
                {discountLabel(campaign.type, campaign.value)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-slate-900">
                  {campaign.name}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  {rule}
                </p>
              </div>
            </div>

            <div className="text-[12px] text-slate-600">
              {campaign.ruleType === "category"
                ? "Kategori indirimi"
                : "Sepet indirimi"}
              <span className="text-slate-400">
                {" "}
                · öncelik {campaign.priority}
              </span>
            </div>

            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              <span
                className={cn(
                  "text-[11px]",
                  soon ? "font-medium text-amber-700" : "text-slate-500",
                )}
              >
                {soon ? "Yakında bitiyor · " : ""}
                {validity(campaign.startsAt, campaign.endsAt)}
              </span>
            </div>

            <div className="flex items-center gap-1 justify-self-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEdit(campaign)}
              >
                <Icon d={ICONS.edit} size={14} />
                Düzenle
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => onDelete(campaign)}
                className="text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                title="Kampanyayı sil"
                aria-label={`${campaign.name} kampanyasını sil`}
              >
                <Icon d={ICONS.trash} size={14} />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Sayfa                                                               */
/* ------------------------------------------------------------------ */

function Stat({
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

function EmptyState({
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

const couponToForm = (coupon: CouponRow): CouponFormState => ({
  id: coupon.id,
  code: coupon.code,
  type: coupon.type,
  value: String(Number(coupon.value)),
  minSubtotal: coupon.minSubtotal ? String(Number(coupon.minSubtotal)) : "",
  maxUses: coupon.maxUses ? String(coupon.maxUses) : "",
  perCustomerLimit: coupon.perCustomerLimit
    ? String(coupon.perCustomerLimit)
    : "",
  startsAt: isoToLocalInput(coupon.startsAt),
  endsAt: isoToLocalInput(coupon.endsAt),
  isActive: coupon.isActive,
});

const campaignToForm = (campaign: CampaignRow): CampaignFormState => ({
  id: campaign.id,
  name: campaign.name,
  ruleType: campaign.ruleType,
  type: campaign.type,
  value: String(campaign.value),
  categoryIds: campaign.categoryIds,
  minSubtotal:
    campaign.minSubtotal === null ? "" : String(campaign.minSubtotal),
  priority: String(campaign.priority),
  startsAt: isoToLocalInput(campaign.startsAt),
  endsAt: isoToLocalInput(campaign.endsAt),
  isActive: campaign.isActive,
});

/** Formdaki yerel tarihleri saat dilimli ISO'ya çevirip gönderir. */
function withIsoDates<T extends { startsAt: string; endsAt: string }>(
  form: T,
): T {
  return {
    ...form,
    startsAt: localInputToIso(form.startsAt),
    endsAt: localInputToIso(form.endsAt),
  };
}

export function PromotionManager({
  coupons,
  campaigns,
  categories,
  now: nowIso,
}: {
  coupons: CouponRow[];
  campaigns: CampaignRow[];
  categories: Category[];
  /** Sunucudaki an; durumlar sunucu ve tarayıcıda aynı hesaplansın diye */
  now: string;
}) {
  const now = useMemo(() => new Date(nowIso), [nowIso]);
  const [tab, setTab] = useState<"coupons" | "campaigns">("coupons");
  const { pending, message, run, setMessage } = useRunner();

  const [couponForm, setCouponForm] = useState<CouponFormState | null>(null);
  const [campaignForm, setCampaignForm] = useState<CampaignFormState | null>(
    null,
  );

  const stats = useMemo(() => {
    const couponStatuses = coupons.map((c) => promotionStatus(c, now));
    const campaignStatuses = campaigns.map((c) => promotionStatus(c, now));
    const soon =
      coupons.filter((c, i) => endsSoon(c, couponStatuses[i]!, now)).length +
      campaigns.filter((c, i) => endsSoon(c, campaignStatuses[i]!, now)).length;
    return {
      activeCoupons: couponStatuses.filter((s) => s === "active").length,
      uses: coupons.reduce((sum, c) => sum + c.usedCount, 0),
      activeCampaigns: campaignStatuses.filter((s) => s === "active").length,
      soon,
    };
  }, [coupons, campaigns, now]);

  function openCoupon(form: CouponFormState) {
    setMessage(null);
    setCouponForm(form);
  }
  function openCampaign(form: CampaignFormState) {
    setMessage(null);
    setCampaignForm(form);
  }

  const tabs = [
    { key: "coupons" as const, label: "Kupon kodları", count: coupons.length },
    {
      key: "campaigns" as const,
      label: "Otomatik kampanyalar",
      count: campaigns.length,
    },
  ];
  const modalOpen = couponForm !== null || campaignForm !== null;

  return (
    <div className="flex flex-col gap-5">
      <section
        aria-label="Özet"
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
      >
        <Stat
          label="Aktif kupon"
          value={integer.format(stats.activeCoupons)}
          hint={`Toplam ${integer.format(coupons.length)} kupon`}
        />
        <Stat
          label="Kupon kullanımı"
          value={integer.format(stats.uses)}
          hint="Tüm kuponlarda toplam"
        />
        <Stat
          label="Devrede kampanya"
          value={integer.format(stats.activeCampaigns)}
          hint={`Toplam ${integer.format(campaigns.length)} kampanya`}
        />
        <Stat
          label="7 gün içinde bitiyor"
          value={integer.format(stats.soon)}
          hint={
            stats.soon > 0 ? "Uzatmak isteyebilirsiniz" : "Yakında biten yok"
          }
        />
      </section>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 px-2 pt-2">
          <div
            role="tablist"
            className="flex gap-1 overflow-x-auto [scrollbar-width:none]"
          >
            {tabs.map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.key)}
                  className={cn(
                    "-mb-px flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 pt-1.5 pb-2.5 text-[13px] font-medium whitespace-nowrap transition-colors",
                    active
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-slate-500 hover:text-slate-800",
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                      active
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {integer.format(item.count)}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="pr-2 pb-2">
            <Button
              type="button"
              size="sm"
              onClick={() =>
                tab === "coupons"
                  ? openCoupon(blankCoupon)
                  : openCampaign(blankCampaign)
              }
            >
              <Icon d={ICONS.plus} size={14} />
              {tab === "coupons" ? "Yeni kupon" : "Yeni kampanya"}
            </Button>
          </div>
        </div>

        {!modalOpen && message ? (
          <div className="border-b border-slate-100 px-4 py-3">
            <Alert message={message} />
          </div>
        ) : null}

        {tab === "coupons" ? (
          coupons.length === 0 ? (
            <EmptyState
              title="Henüz kupon yok"
              description="Müşterilerinize özel indirim kodları oluşturup sosyal medyada veya e-postada paylaşabilirsiniz."
              action={
                <Button
                  type="button"
                  size="sm"
                  onClick={() => openCoupon(blankCoupon)}
                >
                  İlk kuponu oluştur
                </Button>
              }
            />
          ) : (
            <CouponTable
              coupons={coupons}
              now={now}
              pending={pending}
              onEdit={(c) => openCoupon(couponToForm(c))}
              onDelete={(c) => {
                if (window.confirm(`"${c.code}" kuponu silinsin mi?`)) {
                  run(() => deleteCouponAction(c.id), "Kupon silindi.");
                }
              }}
            />
          )
        ) : campaigns.length === 0 ? (
          <EmptyState
            title="Henüz otomatik kampanya yok"
            description="Örneğin “500 TL üzeri %10 indirim” gibi, kod gerektirmeden sepete kendiliğinden uygulanan indirimler tanımlayın."
            action={
              <Button
                type="button"
                size="sm"
                onClick={() => openCampaign(blankCampaign)}
              >
                İlk kampanyayı oluştur
              </Button>
            }
          />
        ) : (
          <CampaignTable
            campaigns={campaigns}
            categories={categories}
            now={now}
            pending={pending}
            onEdit={(c) => openCampaign(campaignToForm(c))}
            onDelete={(c) => {
              if (window.confirm(`"${c.name}" kampanyası silinsin mi?`)) {
                run(() => deleteCampaignAction(c.id), "Kampanya silindi.");
              }
            }}
          />
        )}
      </Card>

      {couponForm ? (
        <CouponModal
          open
          form={couponForm}
          pending={pending}
          message={message}
          onClose={() => setCouponForm(null)}
          onChange={(key, value) =>
            setCouponForm((current) =>
              current ? { ...current, [key]: value } : current,
            )
          }
          onSave={() =>
            run(
              () => saveCouponAction(couponForm.id, withIsoDates(couponForm)),
              couponForm.id ? "Kupon güncellendi." : "Kupon oluşturuldu.",
              () => setCouponForm(null),
            )
          }
        />
      ) : null}

      {campaignForm ? (
        <CampaignModal
          open
          form={campaignForm}
          pending={pending}
          message={message}
          categories={categories}
          onClose={() => setCampaignForm(null)}
          onChange={(key, value) =>
            setCampaignForm((current) =>
              current ? { ...current, [key]: value } : current,
            )
          }
          onSave={() =>
            run(
              () =>
                saveCampaignAction(campaignForm.id, withIsoDates(campaignForm)),
              campaignForm.id
                ? "Kampanya güncellendi."
                : "Kampanya oluşturuldu.",
              () => setCampaignForm(null),
            )
          }
        />
      ) : null}
    </div>
  );
}
