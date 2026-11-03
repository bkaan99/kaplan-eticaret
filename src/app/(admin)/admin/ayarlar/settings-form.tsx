"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ContactSettings } from "@/modules/settings/settings.types";
import { cn } from "@/shared/cn";
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
      {hint ? <p className="text-[11px] text-slate-400">{hint}</p> : null}
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

    startTransition(async () => {
      const result = await saveContactSettingsAction(form);
      if (!result.ok) {
        setError(result.error ?? "Ayarlar kaydedilemedi");
        return;
      }
      setBaseline(form);
      setNotice("İletişim bilgileri güncellendi.");
    });
  }

  const cleanWhatsApp = useMemo(() => {
    if (!form.whatsapp) return "";
    return form.whatsapp.replace(/[^0-9]/g, "");
  }, [form.whatsapp]);

  const addressPreview = form.address.trim() || "Adres girilmedi";

  return (
    <div className="flex flex-col gap-5">
      {/* Özet şerit */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {[
          { label: "Telefon", value: form.phone || "—" },
          { label: "E-posta", value: form.email || "—" },
          {
            label: "WhatsApp",
            value: form.whatsapp || "Tanımlı değil",
            muted: !form.whatsapp,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-2xs"
          >
            <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
              {item.label}
            </p>
            <p
              className={cn(
                "mt-1 truncate text-[13px] font-semibold text-slate-900",
                item.muted && "font-medium text-slate-400",
              )}
            >
              {item.value}
            </p>
          </div>
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

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
        <form onSubmit={save} className="flex flex-col gap-4">
          <Section
            title="İletişim kanalları"
            description="Header, footer ve iletişim sayfasında gösterilir."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Telefon"
                required
                hint="Tıklanınca arama ekranı açılır."
                action={
                  form.phone ? (
                    <TestLink href={`tel:${form.phone}`}>Test et</TestLink>
                  ) : null
                }
              >
                <Input
                  type="text"
                  required
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="0507 542 03 01"
                  className="bg-white"
                />
              </Field>

              <Field
                label="WhatsApp"
                hint="Boş bırakırsanız WhatsApp butonu gizlenir."
                action={
                  cleanWhatsApp ? (
                    <TestLink href={`https://wa.me/${cleanWhatsApp}`}>
                      Test et
                    </TestLink>
                  ) : null
                }
              >
                <Input
                  type="text"
                  value={form.whatsapp ?? ""}
                  onChange={(e) => update("whatsapp", e.target.value)}
                  placeholder="0507 542 03 01"
                  className="bg-white"
                />
              </Field>

              <Field
                label="E-posta"
                required
                hint="İletişim formu ve bildirimler için."
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

              <Field label="Çalışma saatleri">
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
            description="Footer, fatura ve harita bağlantılarında kullanılır."
          >
            <Field
              label="Açık adres"
              required
              action={
                form.address ? (
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
            description="Footer ve iletişim sayfasındaki profil bağlantıları."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Instagram"
                action={
                  form.instagramUrl ? (
                    <TestLink href={form.instagramUrl}>Aç</TestLink>
                  ) : null
                }
              >
                <Input
                  type="url"
                  value={form.instagramUrl ?? ""}
                  onChange={(e) => update("instagramUrl", e.target.value)}
                  placeholder="https://instagram.com/…"
                  className="bg-white"
                />
              </Field>

              <Field
                label="Facebook"
                action={
                  form.facebookUrl ? (
                    <TestLink href={form.facebookUrl}>Aç</TestLink>
                  ) : null
                }
              >
                <Input
                  type="url"
                  value={form.facebookUrl ?? ""}
                  onChange={(e) => update("facebookUrl", e.target.value)}
                  placeholder="https://facebook.com/…"
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
                  Footer / iletişim görünümü
                </p>
              </div>
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                Canlı
              </span>
            </div>

            <div className="space-y-3 bg-slate-50/60 p-4">
              <div className="rounded-lg border border-slate-200 bg-[#0c1a13] p-4 text-white">
                <p className="text-[10px] font-semibold tracking-wide text-emerald-400/90 uppercase">
                  Müşteri hizmetleri
                </p>
                <p className="mt-1 text-sm font-semibold tracking-tight">
                  {form.phone || "Telefon yok"}
                </p>
                <p className="mt-0.5 text-[12px] text-slate-400">
                  {form.email || "E-posta yok"}
                </p>

                {form.whatsapp ? (
                  <div className="mt-3 rounded-md border border-emerald-800/50 bg-emerald-950/50 px-2.5 py-2">
                    <p className="text-[10px] font-semibold text-emerald-400 uppercase">
                      WhatsApp
                    </p>
                    <p className="text-[12px] font-medium text-emerald-100">
                      {form.whatsapp}
                    </p>
                  </div>
                ) : null}

                <div className="mt-3 border-t border-white/10 pt-3">
                  <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                    Adres
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-300">
                    {addressPreview}
                  </p>
                </div>

                {form.workingHours ? (
                  <p className="mt-2 text-[12px] text-amber-200/90">
                    {form.workingHours}
                  </p>
                ) : null}

                {(form.instagramUrl || form.facebookUrl) && (
                  <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/10 pt-3">
                    {form.instagramUrl ? (
                      <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-medium text-slate-200">
                        Instagram
                      </span>
                    ) : null}
                    {form.facebookUrl ? (
                      <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-medium text-slate-200">
                        Facebook
                      </span>
                    ) : null}
                  </div>
                )}
              </div>

              <p className="text-[11px] leading-relaxed text-slate-500">
                Kaydettiğinizde footer, iletişim sayfası ve ilgili vitrin
                alanları güncellenir.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
