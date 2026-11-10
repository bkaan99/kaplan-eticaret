"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ContactSettings } from "@/modules/settings/settings.types";
import { cn } from "@/shared/cn";
import { sanitizeTurkishMobileInput } from "@/shared/phone/tr-mobile";
import { saveContactSettingsAction } from "./actions";

function Field({
  label,
  required,
  hint,
  action,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[13px] font-medium text-slate-700">
          {label}
          {required ? <span className="text-red-500"> *</span> : null}
        </label>
        {action}
      </div>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-slate-400">{hint}</p> : null}
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
      <header className="border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <h2 className="text-[13px] font-semibold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-[12px] text-slate-500">{description}</p>
      </header>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </section>
  );
}

function TestLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="text-[11px] font-medium text-emerald-700 hover:underline"
    >
      {children}
    </a>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "inline-block h-1.5 w-1.5 rounded-full",
        ok ? "bg-emerald-500" : "bg-slate-300",
      )}
      aria-hidden
    />
  );
}

function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "");
}

function toTelHref(phone: string): string {
  const digits = digitsOnly(phone);
  if (!digits) return "";
  if (digits.startsWith("90")) return `+${digits}`;
  if (digits.startsWith("0")) return `+9${digits}`;
  if (digits.startsWith("5")) return `+90${digits}`;
  return phone.replace(/\s/g, "");
}

/** Kullanıcı adı veya URL → https://instagram.com/... */
function normalizeSocialUrl(
  value: string,
  host: "instagram.com" | "facebook.com",
): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const handle = trimmed.replace(/^@/, "").replace(/^\/+/, "");
  if (!handle) return "";
  if (handle.includes(".") && handle.includes("/")) {
    return `https://${handle}`;
  }
  return `https://${host}/${handle}`;
}

function socialHandle(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const parsed = new URL(
      /^https?:\/\//i.test(url) ? url : `https://${url}`,
    );
    const parts = parsed.pathname.split("/").filter(Boolean);
    return parts[0] ? `@${parts[0]}` : parsed.hostname;
  } catch {
    return url;
  }
}

const SURFACE_HINTS = [
  { label: "Footer", detail: "İletişim satırları" },
  { label: "İletişim", detail: "/iletisim kartları" },
  { label: "WhatsApp", detail: "Yüzen buton" },
  { label: "Form", detail: "Bildirim alıcısı" },
] as const;

export function SettingsForm({
  initialSettings,
}: {
  initialSettings: ContactSettings;
}) {
  const [baseline, setBaseline] = useState(initialSettings);
  const [form, setForm] = useState<ContactSettings>(initialSettings);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isDirty = useMemo(() => {
    return (
      form.phone !== baseline.phone ||
      (form.whatsapp ?? "") !== (baseline.whatsapp ?? "") ||
      form.email !== baseline.email ||
      form.address !== baseline.address ||
      (form.workingHours ?? "") !== (baseline.workingHours ?? "") ||
      (form.instagramUrl ?? "") !== (baseline.instagramUrl ?? "") ||
      (form.facebookUrl ?? "") !== (baseline.facebookUrl ?? "")
    );
  }, [form, baseline]);

  const checklist = useMemo(() => {
    const items = [
      { key: "phone", label: "Telefon", ok: form.phone.trim().length >= 7, required: true },
      { key: "email", label: "E-posta", ok: form.email.includes("@"), required: true },
      { key: "address", label: "Adres", ok: form.address.trim().length >= 3, required: true },
      {
        key: "whatsapp",
        label: "WhatsApp",
        ok: digitsOnly(form.whatsapp).length >= 10,
        required: false,
      },
      {
        key: "hours",
        label: "Çalışma saati",
        ok: Boolean(form.workingHours?.trim()),
        required: false,
      },
      {
        key: "social",
        label: "Sosyal medya",
        ok: Boolean(form.instagramUrl?.trim() || form.facebookUrl?.trim()),
        required: false,
      },
    ] as const;
    const requiredDone = items.filter((i) => i.required && i.ok).length;
    const requiredTotal = items.filter((i) => i.required).length;
    const optionalDone = items.filter((i) => !i.required && i.ok).length;
    const optionalTotal = items.filter((i) => !i.required).length;
    return { items, requiredDone, requiredTotal, optionalDone, optionalTotal };
  }, [form]);

  function update<K extends keyof ContactSettings>(
    key: K,
    value: ContactSettings[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleReset() {
    setForm(baseline);
    setError(null);
    setNotice(null);
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const payload: ContactSettings = {
      ...form,
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      whatsapp: form.whatsapp?.trim() || null,
      workingHours: form.workingHours?.trim() || null,
      instagramUrl:
        normalizeSocialUrl(form.instagramUrl ?? "", "instagram.com") || null,
      facebookUrl:
        normalizeSocialUrl(form.facebookUrl ?? "", "facebook.com") || null,
    };

    startTransition(async () => {
      const result = await saveContactSettingsAction(payload);
      if (!result.ok) {
        setError(result.error ?? "Ayarlar kaydedilemedi");
        return;
      }
      setForm(payload);
      setBaseline(payload);
      setNotice("İletişim bilgileri güncellendi. Vitrin 60 sn içinde yansır.");
    });
  }

  const cleanWhatsApp = digitsOnly(form.whatsapp);
  const telHref = toTelHref(form.phone);
  const instagramHandle = socialHandle(form.instagramUrl);
  const facebookHandle = socialHandle(form.facebookUrl);
  const addressPreview = form.address.trim() || "Adres girilmedi";

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-[13px] font-semibold text-slate-900">
              Yayın durumu
            </p>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Zorunlu alanlar tamamlanmadan vitrin eksik görünür.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800">
              <StatusDot ok={checklist.requiredDone === checklist.requiredTotal} />
              Zorunlu {checklist.requiredDone}/{checklist.requiredTotal}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
              <StatusDot ok={checklist.optionalDone === checklist.optionalTotal} />
              Opsiyonel {checklist.optionalDone}/{checklist.optionalTotal}
            </span>
          </div>
        </div>

        <div className="grid gap-px bg-slate-100 sm:grid-cols-3 lg:grid-cols-6">
          {checklist.items.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-2 bg-white px-3.5 py-3"
            >
              <StatusDot ok={item.ok} />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-slate-800">
                  {item.label}
                </p>
                <p className="text-[10px] text-slate-400">
                  {item.required ? "Zorunlu" : "Opsiyonel"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SURFACE_HINTS.map((hint) => (
          <span
            key={hint.label}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 shadow-2xs"
            title={hint.detail}
          >
            <span className="font-semibold text-slate-800">{hint.label}</span>
            <span className="text-slate-400">{hint.detail}</span>
          </span>
        ))}
      </div>

      {notice ? (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[13px] font-medium text-emerald-800"
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-emerald-700/70 hover:text-emerald-900"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-800"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-red-700/70 hover:text-red-900"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.9fr)]">
        <form onSubmit={save} className="flex flex-col gap-4">
          <Section
            title="İletişim kanalları"
            description="Header, footer, yüzen WhatsApp ve /iletisim kartlarında kullanılır."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Telefon"
                required
                hint="Müşteri tıklayınca arama ekranı açılır."
                action={
                  telHref ? (
                    <TestLink href={`tel:${telHref}`}>Ara</TestLink>
                  ) : null
                }
              >
                <Input
                  type="tel"
                  inputMode="tel"
                  required
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="0507 542 03 01"
                  className="bg-white"
                />
              </Field>

              <Field
                label="WhatsApp"
                hint="Boş bırakılırsa yüzen WhatsApp butonu gizlenir."
                action={
                  cleanWhatsApp ? (
                    <TestLink href={`https://wa.me/${cleanWhatsApp}`}>
                      wa.me
                    </TestLink>
                  ) : null
                }
              >
                <Input
                  type="tel"
                  inputMode="numeric"
                  value={form.whatsapp ?? ""}
                  onChange={(e) =>
                    update(
                      "whatsapp",
                      sanitizeTurkishMobileInput(e.target.value) || null,
                    )
                  }
                  placeholder="0507 542 03 01"
                  className="bg-white"
                />
              </Field>

              <Field
                label="E-posta"
                required
                hint="İletişim formu bildirimleri bu adrese gider."
                action={
                  form.email.includes("@") ? (
                    <TestLink href={`mailto:${form.email}`}>Mail</TestLink>
                  ) : null
                }
              >
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="info@kaplantursu.com"
                  className="bg-white"
                />
              </Field>

              <Field
                label="Çalışma saatleri"
                hint="İletişim sayfasındaki ziyaret kartında görünür."
              >
                <Input
                  type="text"
                  value={form.workingHours ?? ""}
                  onChange={(e) => update("workingHours", e.target.value)}
                  placeholder="Hafta içi 08:30 - 18:00"
                  className="bg-white"
                />
              </Field>
            </div>
          </Section>

          <Section
            title="Adres"
            description="Footer, fatura metinleri ve harita aramasında kullanılır."
          >
            <Field
              label="Açık adres"
              required
              action={
                form.address.trim() ? (
                  <TestLink
                    href={`https://maps.google.com/?q=${encodeURIComponent(form.address)}`}
                  >
                    Haritada aç
                  </TestLink>
                ) : null
              }
            >
              <textarea
                rows={3}
                required
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="Çubuk, Ankara / Türkiye"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </Field>
          </Section>

          <Section
            title="Sosyal medya"
            description="Kullanıcı adı veya tam URL yazabilirsiniz; kayıtta normalize edilir."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Instagram"
                hint="Örn. kaplantursu veya https://instagram.com/…"
                action={
                  form.instagramUrl ? (
                    <TestLink
                      href={
                        normalizeSocialUrl(form.instagramUrl, "instagram.com") ||
                        "#"
                      }
                    >
                      Aç
                    </TestLink>
                  ) : null
                }
              >
                <Input
                  type="text"
                  inputMode="url"
                  value={form.instagramUrl ?? ""}
                  onChange={(e) => update("instagramUrl", e.target.value)}
                  onBlur={(e) =>
                    update(
                      "instagramUrl",
                      normalizeSocialUrl(e.target.value, "instagram.com") ||
                        null,
                    )
                  }
                  placeholder="@kaplantursu"
                  className="bg-white"
                />
              </Field>

              <Field
                label="Facebook"
                hint="Örn. kaplantursu veya https://facebook.com/…"
                action={
                  form.facebookUrl ? (
                    <TestLink
                      href={
                        normalizeSocialUrl(form.facebookUrl, "facebook.com") ||
                        "#"
                      }
                    >
                      Aç
                    </TestLink>
                  ) : null
                }
              >
                <Input
                  type="text"
                  inputMode="url"
                  value={form.facebookUrl ?? ""}
                  onChange={(e) => update("facebookUrl", e.target.value)}
                  onBlur={(e) =>
                    update(
                      "facebookUrl",
                      normalizeSocialUrl(e.target.value, "facebook.com") ||
                        null,
                    )
                  }
                  placeholder="kaplantursu"
                  className="bg-white"
                />
              </Field>
            </div>
          </Section>

          <div className="sticky bottom-3 z-20 flex items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white/95 px-3.5 py-2.5 shadow-sm backdrop-blur-md">
            <p className="text-[12px] font-medium text-slate-500">
              {isDirty ? (
                <span className="inline-flex items-center gap-1.5 text-amber-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  Kaydedilmemiş değişiklikler
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Güncel
                </span>
              )}
            </p>

            <div className="flex items-center gap-2">
              {isDirty ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={pending}
                >
                  Vazgeç
                </Button>
              ) : null}
              <Button type="submit" disabled={pending || !isDirty}>
                {pending ? "Kaydediliyor…" : "Kaydet"}
              </Button>
            </div>
          </div>
        </form>

        <aside className="lg:sticky lg:top-16">
          <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-[13px] font-semibold text-slate-900">
                  Vitrin önizlemesi
                </p>
                <p className="text-[11px] text-slate-500">
                  /iletisim kart görünümü
                </p>
              </div>
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                Canlı
              </span>
            </div>

            <div className="space-y-3 bg-slate-50/70 p-4">
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                <PreviewCard
                  title="Telefon"
                  value={form.phone || "Tanımlı değil"}
                  muted={!form.phone}
                />
                <PreviewCard
                  title="WhatsApp"
                  value={form.whatsapp || "Buton gizli"}
                  muted={!form.whatsapp}
                  accent={Boolean(form.whatsapp)}
                />
                <PreviewCard
                  title="E-posta"
                  value={form.email || "Tanımlı değil"}
                  muted={!form.email}
                />
                <PreviewCard
                  title="Adres"
                  value={addressPreview}
                  muted={!form.address.trim()}
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-3">
                <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                  Çalışma saatleri
                </p>
                <p className="mt-1 text-[13px] font-medium text-slate-800">
                  {form.workingHours?.trim() || "Belirtilmedi"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white px-3.5 py-3">
                <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                  Sosyal
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {instagramHandle ? (
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                      IG {instagramHandle}
                    </span>
                  ) : null}
                  {facebookHandle ? (
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700">
                      FB {facebookHandle}
                    </span>
                  ) : null}
                  {!instagramHandle && !facebookHandle ? (
                    <span className="text-[12px] text-slate-400">
                      Bağlantı yok
                    </span>
                  ) : null}
                </div>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-500">
                Kaydettikten sonra OpenNext önbelleği nedeniyle vitrinde en fazla
                ~60 saniye gecikme olabilir.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PreviewCard({
  title,
  value,
  muted,
  accent,
}: {
  title: string;
  value: string;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3.5 py-3",
        accent
          ? "border-emerald-200 bg-emerald-50/70"
          : "border-slate-200 bg-white",
      )}
    >
      <p
        className={cn(
          "text-[10px] font-semibold tracking-wide uppercase",
          accent ? "text-emerald-700" : "text-slate-400",
        )}
      >
        {title}
      </p>
      <p
        className={cn(
          "mt-1 text-[13px] font-semibold break-words",
          muted ? "font-medium text-slate-400" : "text-slate-900",
          accent && !muted && "text-emerald-900",
        )}
      >
        {value}
      </p>
    </div>
  );
}
