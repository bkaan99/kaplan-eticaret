"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  deleteCampaignAction,
  deleteCouponAction,
  saveCampaignAction,
  saveCouponAction,
} from "./actions";

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

const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : "");

function formatDate(iso: string | null): string {
  if (!iso) return "Süresiz";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function useRunner() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    onDone?: () => void,
  ) {
    startTransition(async () => {
      setMessage(null);
      const result = await action();
      setMessage(
        result.ok
          ? { text: "İşlem başarıyla kaydedildi.", error: false }
          : { text: result.error ?? "İşlem başarısız oldu.", error: true },
      );
      if (result.ok) onDone?.();
    });
  }

  return { pending, message, run, setMessage };
}

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
  message: { text: string; error: boolean } | null;
  onClose: () => void;
  onChange: <K extends keyof CouponFormState>(
    key: K,
    value: CouponFormState[K],
  ) => void;
  onSave: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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

  function generateRandomCode() {
    const prefixes = ["KAPLAN", "GURME", "TURSU", "YAZ", "BAHAR", "OZEL"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(10 + Math.random() * 90);
    onChange("code", `${prefix}${num}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-4.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-800">
              🎟️
            </span>
            <div>
              <h2 id={titleId} className="text-base font-bold text-slate-900">
                {form.id ? "Kupon Kodunu Düzenle" : "Yeni İndirim Kuponu Oluştur"}
              </h2>
              <p className="text-[11px] text-slate-500">
                Ödeme aşamasında müşterilerin girebileceği promosyon kodu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {/* Modal Form İçeriği */}
        <div className="flex flex-col gap-4.5 overflow-y-auto px-6 py-5">
          {message && (
            <div
              role={message.error ? "alert" : "status"}
              className={`rounded-xl border p-3 text-xs font-semibold ${
                message.error
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Kupon Kodu */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700">
                Kupon Kodu <span className="text-red-500">*</span>
              </Label>
              <button
                type="button"
                onClick={generateRandomCode}
                className="text-[11px] font-semibold text-emerald-700 hover:underline"
              >
                ⚡ Rastgele Kod Üret
              </button>
            </div>
            <Input
              value={form.code}
              onChange={(e) => onChange("code", e.target.value.toUpperCase())}
              placeholder="Örn: KAPLAN20"
              className="h-10 font-mono text-sm uppercase tracking-wider font-bold text-slate-900"
            />
          </div>

          {/* Tür & İndirim Değeri */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-700">İndirim Türü</Label>
              <Select
                value={form.type}
                onChange={(e) => onChange("type", e.target.value)}
                className="h-9.5 text-xs font-semibold"
              >
                <option value="PERCENT">% Yüzde İndirim</option>
                <option value="FIXED">₺ Sabit Tutar İndirimi</option>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-700">İndirim Tutarı / Oranı</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {form.type === "PERCENT" ? "%" : "₺"}
                </span>
                <Input
                  value={form.value}
                  onChange={(e) => onChange("value", e.target.value)}
                  inputMode="decimal"
                  placeholder={form.type === "PERCENT" ? "20" : "50"}
                  className="h-9.5 pl-7 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Minimum Sepet Tutarı */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Minimum Sepet Tutarı (₺)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                ₺
              </span>
              <Input
                value={form.minSubtotal}
                onChange={(e) => onChange("minSubtotal", e.target.value)}
                inputMode="decimal"
                placeholder="Örn: 250 (Boşsa alt limitsiz uygulanır)"
                className="h-9.5 pl-7 text-xs"
              />
            </div>
          </div>

          {/* Kullanım Limitleri */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-700">Toplam Kullanım Kotası</Label>
              <Input
                value={form.maxUses}
                onChange={(e) => onChange("maxUses", e.target.value)}
                inputMode="numeric"
                placeholder="Örn: 100 (Boşsa sınırsız)"
                className="h-9.5 text-xs font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-700">Müşteri Başına Sınır</Label>
              <Input
                value={form.perCustomerLimit}
                onChange={(e) => onChange("perCustomerLimit", e.target.value)}
                inputMode="numeric"
                placeholder="Örn: 1 (Boşsa sınırsız)"
                className="h-9.5 text-xs font-mono"
              />
            </div>
          </div>

          {/* Geçerlilik Tarihleri */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-700">Başlangıç Tarihi</Label>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => onChange("startsAt", e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-700">Bitiş Tarihi</Label>
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => onChange("endsAt", e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Aktiflik Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onChange("isActive", !form.isActive)}
              className={`flex h-9.5 w-full items-center justify-center gap-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                form.isActive
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-slate-100 text-slate-500"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  form.isActive ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
              <span>{form.isActive ? "● Kupon Aktif (Kullanılabilir)" : "○ Kupon Pasif (Durduruldu)"}</span>
            </button>
          </div>
        </div>

        {/* Modal Alt Çubuk */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Vazgeç
          </Button>
          <Button
            type="button"
            disabled={pending || !form.code.trim() || !form.value.trim()}
            onClick={onSave}
            className="bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
          >
            {pending ? "Kaydediliyor..." : "Kuponu Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CouponSection({ coupons }: { coupons: CouponRow[] }) {
  const { pending, message, run } = useRunner();
  const [form, setForm] = useState<CouponFormState>(blankCoupon);
  const [open, setOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const set = <K extends keyof CouponFormState>(
    key: K,
    value: CouponFormState[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  function openCreate() {
    setForm(blankCoupon);
    setOpen(true);
  }

  function openEdit(coupon: CouponRow) {
    setForm({
      id: coupon.id,
      code: coupon.code,
      type: coupon.type,
      value: String(Number(coupon.value)),
      minSubtotal: coupon.minSubtotal ? String(Number(coupon.minSubtotal)) : "",
      maxUses: coupon.maxUses ? String(coupon.maxUses) : "",
      perCustomerLimit: coupon.perCustomerLimit
        ? String(coupon.perCustomerLimit)
        : "",
      startsAt: toLocalInput(coupon.startsAt),
      endsAt: toLocalInput(coupon.endsAt),
      isActive: coupon.isActive,
    });
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setForm(blankCoupon);
  }

  function copyToClipboard(code: string) {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  }

  return (
    <>
      <Card className="overflow-hidden shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">🎟️</span>
              <CardTitle className="text-base font-bold text-slate-900">
                İndirim Kupon Kodları
              </CardTitle>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Müşterilerin sepet veya ödeme adımında manuel girebileceği indirim kodları
            </p>
          </div>
          <Button
            type="button"
            onClick={openCreate}
            className="bg-emerald-700 text-xs font-bold text-white shadow-2xs hover:bg-emerald-800 cursor-pointer"
          >
            + Yeni Kupon Oluştur
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {message && !open && (
            <div
              className={`m-4 p-3 rounded-xl border text-xs font-semibold ${
                message.error
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {coupons.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {coupons.map((coupon) => {
                const isExpired =
                  coupon.endsAt && new Date(coupon.endsAt) < new Date();
                const usagePercent = coupon.maxUses
                  ? Math.min(100, Math.round((coupon.usedCount / coupon.maxUses) * 100))
                  : null;

                return (
                  <div
                    key={coupon.id}
                    className="group flex flex-col gap-3 p-4.5 sm:flex-row sm:items-center sm:justify-between transition hover:bg-slate-50/70"
                  >
                    {/* Sol Bilgiler: Kupon Kartı */}
                    <div className="flex flex-1 items-start gap-3.5">
                      {/* Kupon İndirim Rozeti */}
                      <div
                        className={`flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border font-bold shadow-2xs ${
                          coupon.type === "PERCENT"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-amber-200 bg-amber-50 text-amber-900"
                        }`}
                      >
                        <span className="text-sm font-extrabold leading-none">
                          {coupon.type === "PERCENT"
                            ? `%${Number(coupon.value)}`
                            : `₺${Number(coupon.value)}`}
                        </span>
                        <span className="text-[9px] font-semibold text-slate-500 uppercase mt-0.5">
                          İndirim
                        </span>
                      </div>

                      {/* Kod ve Koşullar */}
                      <div className="flex flex-col min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold tracking-wider text-slate-900 uppercase">
                            {coupon.code}
                          </span>

                          <button
                            type="button"
                            onClick={() => copyToClipboard(coupon.code)}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                            title="Kupon Kodunu Kopyala"
                          >
                            <span>{copiedCode === coupon.code ? "✓ Kopyalandı" : "Kopyala"}</span>
                          </button>

                          {!coupon.isActive ? (
                            <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-bold text-slate-600">
                              Pasif
                            </span>
                          ) : isExpired ? (
                            <span className="rounded-full bg-red-100 px-2 py-0.2 text-[10px] font-bold text-red-700">
                              Süresi Doldu
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-emerald-800">
                              ● Aktif
                            </span>
                          )}
                        </div>

                        {/* Detay Bilgileri */}
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span>
                            {coupon.minSubtotal
                              ? `Min. sepet: ${coupon.minSubtotal} ₺`
                              : "Alt limitsiz"}
                          </span>
                          <span>·</span>
                          <span>
                            {coupon.usedCount}
                            {coupon.maxUses ? ` / ${coupon.maxUses}` : ""} kullanım
                          </span>
                          {coupon.perCustomerLimit && (
                            <>
                              <span>·</span>
                              <span>Müşteri başı: {coupon.perCustomerLimit} adet</span>
                            </>
                          )}
                          <span>·</span>
                          <span className="text-slate-400">
                            Geçerlilik: {formatDate(coupon.startsAt)} - {formatDate(coupon.endsAt)}
                          </span>
                        </div>

                        {/* Kullanım İlerleme Çubuğu */}
                        {coupon.maxUses && (
                          <div className="mt-2 flex items-center gap-2 max-w-xs">
                            <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  usagePercent! >= 100
                                    ? "bg-red-500"
                                    : usagePercent! >= 75
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">
                              %{usagePercent}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Sağ Eylemler */}
                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(coupon)}
                        className="h-8 text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        Düzenle
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => {
                          if (window.confirm(`"${coupon.code}" kuponunu silmek istediğinize emin misiniz?`)) {
                            run(() => deleteCouponAction(coupon.id));
                          }
                        }}
                        className="h-8 px-2 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                        title="Kuponu Sil"
                      >
                        ✕ Sil
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <span className="text-3xl mb-2">🎟️</span>
              <p className="text-sm font-bold text-slate-800">
                Tanımlı indirim kuponu bulunmuyor
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Müşterilerinize özel indirimler sunmak için yukarıdaki &quot;Yeni Kupon Oluştur&quot; butonunu kullanın.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={openCreate}
                className="mt-4 bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800 cursor-pointer"
              >
                İlk Kuponu Ekle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CouponModal
        open={open}
        form={form}
        pending={pending}
        message={message}
        onClose={closeModal}
        onChange={set}
        onSave={() =>
          run(
            () => saveCouponAction(form.id, form),
            () => closeModal(),
          )
        }
      />
    </>
  );
}

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
  message: { text: string; error: boolean } | null;
  categories: { id: string; label: string }[];
  onClose: () => void;
  onChange: <K extends keyof CampaignFormState>(
    key: K,
    value: CampaignFormState[K],
  ) => void;
  onSave: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Kapat"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
      >
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-6 py-4.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-sm font-bold text-amber-900">
              ⚡
            </span>
            <div>
              <h2 id={titleId} className="text-base font-bold text-slate-900">
                {form.id ? "Kampanyayı Düzenle" : "Yeni Otomatik Kampanya Tanımla"}
              </h2>
              <p className="text-[11px] text-slate-500">
                Koşullu sepet veya kategori indirimi parametreleri
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition cursor-pointer"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {/* Modal Form İçeriği */}
        <div className="flex flex-col gap-4 overflow-y-auto px-6 py-5">
          {message && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold ${
                message.error
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Kampanya Adı */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-700">
              Kampanya Adı <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => onChange("name", e.target.value)}
              placeholder="Örn: 500 TL Üzeri %10 Sepet İndirimi"
              className="h-10 text-xs font-semibold"
            />
          </div>

          {/* Kural Türü */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-bold text-slate-700">Kampanya Kuralı</Label>
            <Select
              value={form.ruleType}
              onChange={(e) => onChange("ruleType", e.target.value)}
              className="h-9.5 text-xs font-semibold"
            >
              <option value="cart-threshold">🛒 Sepet Tutarına Göre İndirim</option>
              <option value="category">📁 Seçili Kategorilere Özel İndirim</option>
            </Select>
          </div>

          {/* İndirim Türü ve Değeri */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-700">İndirim Türü</Label>
              <Select
                value={form.type}
                onChange={(e) => onChange("type", e.target.value)}
                className="h-9.5 text-xs font-semibold"
              >
                <option value="PERCENT">% Yüzde</option>
                <option value="FIXED">₺ Sabit Tutar</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-700">İndirim Tutarı</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  {form.type === "PERCENT" ? "%" : "₺"}
                </span>
                <Input
                  value={form.value}
                  onChange={(e) => onChange("value", e.target.value)}
                  inputMode="decimal"
                  placeholder="10"
                  className="h-9.5 pl-7 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Koşul Detayı */}
          {form.ruleType === "cart-threshold" ? (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Minimum Sepet Tutarı (₺)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  ₺
                </span>
                <Input
                  value={form.minSubtotal}
                  onChange={(e) => onChange("minSubtotal", e.target.value)}
                  inputMode="decimal"
                  placeholder="Örn: 500"
                  className="h-9.5 pl-7 text-xs"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-bold text-slate-700">
                Uygulanacak Kategoriler
              </Label>
              <div className="flex max-h-40 flex-col gap-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs">
                {categories.map((category) => {
                  const isChecked = form.categoryIds.includes(category.id);
                  return (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() =>
                          onChange(
                            "categoryIds",
                            isChecked
                              ? form.categoryIds.filter((id) => id !== category.id)
                              : [...form.categoryIds, category.id],
                          )
                        }
                        className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{category.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Öncelik */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700">Kampanya Önceliği</Label>
              <span className="text-[10px] text-slate-400">Yüksek olan önce uygulanır</span>
            </div>
            <Input
              value={form.priority}
              onChange={(e) => onChange("priority", e.target.value)}
              inputMode="numeric"
              placeholder="0"
              className="h-9 text-xs font-mono"
            />
          </div>

          {/* Tarihler */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-bold text-slate-600">Başlangıç</Label>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => onChange("startsAt", e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-bold text-slate-600">Bitiş</Label>
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => onChange("endsAt", e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Aktiflik Durumu */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onChange("isActive", !form.isActive)}
              className={`flex h-9.5 w-full items-center justify-center gap-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                form.isActive
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-slate-100 text-slate-500"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  form.isActive ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
              <span>{form.isActive ? "● Kampanya Aktif" : "○ Kampanya Pasif"}</span>
            </button>
          </div>
        </div>

        {/* Modal Alt Çubuk */}
        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <Button type="button" variant="outline" size="sm" onClick={onClose} className="text-xs">
            Vazgeç
          </Button>
          <Button
            type="button"
            disabled={pending || !form.name.trim() || !form.value.trim()}
            onClick={onSave}
            className="bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
          >
            {pending ? "Kaydediliyor..." : form.id ? "Değişiklikleri Güncelle" : "Kampanyayı Kaydet"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function CampaignSection({
  campaigns,
  categories,
}: {
  campaigns: CampaignRow[];
  categories: { id: string; label: string }[];
}) {
  const { pending, message, run } = useRunner();
  const [form, setForm] = useState<CampaignFormState>(blankCampaign);
  const [open, setOpen] = useState(false);

  const set = <K extends keyof CampaignFormState>(
    key: K,
    value: CampaignFormState[K],
  ) => setForm((current) => ({ ...current, [key]: value }));

  function openCreate() {
    setForm(blankCampaign);
    setOpen(true);
  }

  function openEdit(campaign: CampaignRow) {
    setForm({
      id: campaign.id,
      name: campaign.name,
      ruleType: campaign.ruleType,
      type: campaign.type,
      value: String(campaign.value),
      categoryIds: campaign.categoryIds,
      minSubtotal:
        campaign.minSubtotal === null ? "" : String(campaign.minSubtotal),
      priority: String(campaign.priority),
      startsAt: toLocalInput(campaign.startsAt),
      endsAt: toLocalInput(campaign.endsAt),
      isActive: campaign.isActive,
    });
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    setForm(blankCampaign);
  }

  return (
    <>
      <Card className="overflow-hidden shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base">⚡</span>
              <CardTitle className="text-base font-bold text-slate-900">
                Otomatik Sepet Kampanyaları
              </CardTitle>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Kupon kodu gerekmeksizin sepet koşulu sağlandığında otomatik uygulanan indirimler
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={openCreate}
            className="bg-emerald-700 text-xs font-bold text-white shadow-2xs hover:bg-emerald-800 cursor-pointer"
          >
            + Yeni Kampanya Tanımla
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {message && !open && (
            <div
              className={`m-4 p-3 rounded-xl border text-xs font-semibold ${
                message.error
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              {message.text}
            </div>
          )}

          {campaigns.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {campaigns.map((campaign) => {
                const amount =
                  campaign.type === "PERCENT"
                    ? `%${campaign.value} İndirim`
                    : `${campaign.value} ₺ İndirim`;

                return (
                  <div
                    key={campaign.id}
                    className="flex flex-col gap-3 p-4.5 transition-all sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/70"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-base font-bold text-amber-900 shadow-2xs">
                        ⚡
                      </span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {campaign.name}
                          </span>
                          {!campaign.isActive ? (
                            <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-bold text-slate-600">
                              Pasif
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.2 text-[10px] font-bold text-emerald-800">
                              ● Aktif
                            </span>
                          )}
                          <span className="rounded-full bg-slate-100 px-2 py-0.2 text-[10px] font-bold text-slate-600">
                            Öncelik: #{campaign.priority}
                          </span>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500">
                          <span className="font-semibold text-emerald-800">
                            {amount}
                          </span>
                          <span>·</span>
                          <span>
                            {campaign.ruleType === "category"
                              ? `${campaign.categoryIds.length} kategoride geçerli`
                              : `${campaign.minSubtotal ?? 0} ₺ ve üzeri sepet`}
                          </span>
                          <span>·</span>
                          <span className="text-slate-400">
                            {formatDate(campaign.startsAt)} - {formatDate(campaign.endsAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(campaign)}
                        className="h-8 text-xs font-semibold text-slate-700 cursor-pointer"
                      >
                        Düzenle
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => {
                          if (window.confirm(`"${campaign.name}" kampanyası silinsin mi?`)) {
                            run(() => deleteCampaignAction(campaign.id));
                          }
                        }}
                        className="h-8 px-2 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
                      >
                        ✕ Sil
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <span className="text-3xl mb-2">⚡</span>
              <p className="text-sm font-bold text-slate-800">
                Tanımlı otomatik kampanya bulunmuyor
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Sepet alt limit veya kategori bazlı otomatik indirimler tanımlamak için yukarıdaki butonu kullanın.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={openCreate}
                className="mt-4 bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800 cursor-pointer"
              >
                İlk Kampanyayı Ekle
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CampaignModal
        open={open}
        form={form}
        pending={pending}
        message={message}
        categories={categories}
        onClose={closeModal}
        onChange={set}
        onSave={() =>
          run(
            () => saveCampaignAction(form.id, form),
            () => closeModal(),
          )
        }
      />
    </>
  );
}

export function PromotionManager({
  coupons,
  campaigns,
  categories,
}: {
  coupons: CouponRow[];
  campaigns: CampaignRow[];
  categories: { id: string; label: string }[];
}) {
  const [activeTab, setActiveTab] = useState<"all" | "coupons" | "campaigns">("all");

  const stats = useMemo(() => {
    const activeCoupons = coupons.filter((c) => c.isActive).length;
    const totalCouponUses = coupons.reduce((sum, c) => sum + c.usedCount, 0);
    const activeCampaigns = campaigns.filter((c) => c.isActive).length;
    return {
      totalCoupons: coupons.length,
      activeCoupons,
      totalCouponUses,
      totalCampaigns: campaigns.length,
      activeCampaigns,
    };
  }, [coupons, campaigns]);

  return (
    <div className="flex flex-col gap-7">
      {/* İstatistik & Genel Bakış Kartları */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Kupon Kodları</span>
            <span className="text-base">🎟️</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {stats.totalCoupons}
          </p>
          <span className="text-[11px] font-semibold text-emerald-700">
            {stats.activeCoupons} tanesi aktif
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Toplam Kupon Kullanımı</span>
            <span className="text-base">🛒</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-emerald-700">
            {stats.totalCouponUses}
          </p>
          <span className="text-[11px] text-slate-400">
            Siparişlerde uygulandı
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Otomatik Kampanyalar</span>
            <span className="text-base">⚡</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {stats.totalCampaigns}
          </p>
          <span className="text-[11px] font-semibold text-emerald-700">
            {stats.activeCampaigns} tanesi devrede
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Kampanya Kuralı</span>
            <span className="text-base">🏷️</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {categories.length}
          </p>
          <span className="text-[11px] text-slate-400">
            Bağlanabilir kategori
          </span>
        </div>
      </div>

      {/* Görünüm Sekmeleri */}
      <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
            activeTab === "all"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Tüm Görünüm
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("coupons")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
            activeTab === "coupons"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>🎟️ Kupon Kodları</span>
          <span className="rounded-full bg-slate-200/70 px-1.5 py-0.2 text-[10px]">
            {coupons.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("campaigns")}
          className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
            activeTab === "campaigns"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>⚡ Otomatik Kampanyalar</span>
          <span className="rounded-full bg-slate-200/70 px-1.5 py-0.2 text-[10px]">
            {campaigns.length}
          </span>
        </button>
      </div>

      {/* Bölümler */}
      {(activeTab === "all" || activeTab === "coupons") && (
        <CouponSection coupons={coupons} />
      )}

      {(activeTab === "all" || activeTab === "campaigns") && (
        <CampaignSection campaigns={campaigns} categories={categories} />
      )}
    </div>
  );
}
