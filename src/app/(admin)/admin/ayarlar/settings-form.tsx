"use client";

import { useState, useTransition } from "react";
import type { ContactSettings } from "@/modules/settings/settings.types";
import { saveContactSettingsAction } from "./actions";

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-3 focus:ring-primary/10";

export function SettingsForm({
  initialSettings,
}: {
  initialSettings: ContactSettings;
}) {
  const [form, setForm] = useState<ContactSettings>(initialSettings);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof ContactSettings>(
    key: K,
    value: ContactSettings[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
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
      setNotice("İletişim ve mağaza bilgileri başarıyla güncellendi.");
    });
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* Sol: Ayar Formu */}
      <form onSubmit={save} className="flex flex-col gap-6">
        {notice ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {notice}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">
            Müşteri İletişim Kanalları
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Mağazanın başlık alanında (header), altbilgisinde (footer) ve mobil
            menüde gösterilecek iletişim numaraları.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 font-medium text-slate-700 text-sm">
              Müşteri Hizmetleri Telefonu *
              <input
                type="text"
                required
                placeholder="+90 532 123 45 67 veya 0224 123 45 67"
                className={inputClass}
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
              <span className="text-xs text-muted-foreground">
                Tıklandığında doğrudan arama başlatır (`tel:` bağlantısı).
              </span>
            </label>

            <label className="flex flex-col gap-1.5 font-medium text-slate-700 text-sm">
              WhatsApp Sipariş / Danışma Hattı
              <input
                type="text"
                placeholder="+90 532 123 45 67"
                className={inputClass}
                value={form.whatsapp ?? ""}
                onChange={(e) => update("whatsapp", e.target.value)}
              />
              <span className="text-xs text-muted-foreground">
                WhatsApp sipariş ve hızlı mesajlaşma için kullanılır.
              </span>
            </label>

            <label className="flex flex-col gap-1.5 font-medium text-slate-700 text-sm">
              Resmi E-Posta Adresi *
              <input
                type="email"
                required
                placeholder="siparis@kaplantursu.com"
                className={inputClass}
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
              />
              <span className="text-xs text-muted-foreground">
                Müşteri bildirimleri ve gelen e-postalar için görünür adres.
              </span>
            </label>

            <label className="flex flex-col gap-1.5 font-medium text-slate-700 text-sm">
              Çalışma Saatleri
              <input
                type="text"
                placeholder="Hafta içi 08:30 - 18:00, Cmt 09:00 - 14:00"
                className={inputClass}
                value={form.workingHours ?? ""}
                onChange={(e) => update("workingHours", e.target.value)}
              />
              <span className="text-xs text-muted-foreground">
                Müşteri desteğinin aktif olduğu zaman aralığı.
              </span>
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">
            Fiziksel Tesis ve Konum Bilgileri
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Faturalarda, Google Schema etiketlerinde ve footer alanında
            gösterilecek resmi üretim tesisi adresi.
          </p>

          <div className="mt-6 flex flex-col gap-5 text-sm">
            <label className="flex flex-col gap-1.5 font-medium text-slate-700">
              Açık Adres / Üretim Tesisi *
              <textarea
                rows={3}
                required
                placeholder="Gedelek Köyü Kaplan Turşuları Üretim Tesisi, Orhangazi / Bursa"
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-base font-semibold text-slate-900">
            Sosyal Medya Bağlantıları
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Mağazanın sosyal medya hesaplarına yönlendiren bağlantılar.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 text-sm">
            <label className="flex flex-col gap-1.5 font-medium text-slate-700">
              Instagram Hesabı
              <input
                type="text"
                placeholder="https://instagram.com/kaplantursulari"
                className={inputClass}
                value={form.instagramUrl ?? ""}
                onChange={(e) => update("instagramUrl", e.target.value)}
              />
            </label>

            <label className="flex flex-col gap-1.5 font-medium text-slate-700">
              Facebook Sayfası
              <input
                type="text"
                placeholder="https://facebook.com/kaplantursulari"
                className={inputClass}
                value={form.facebookUrl ?? ""}
                onChange={(e) => update("facebookUrl", e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50"
          >
            {pending ? "Kaydediliyor..." : "Ayarları Kaydet"}
          </button>
        </div>
      </form>

      {/* Sağ: Canlı Vitrin Önizleme Kartı */}
      <aside className="flex flex-col gap-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Vitrin Önizleme
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Müşterilerin sitede göreceği anlık iletişim görünümü:
          </p>

          <div className="mt-5 flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs">
            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider">
                Müşteri Hattı:
              </span>
              <p className="mt-0.5 text-sm font-bold text-primary">
                {form.phone || "+90 ..."}
              </p>
            </div>

            {form.whatsapp ? (
              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider">
                  WhatsApp:
                </span>
                <p className="mt-0.5 text-emerald-700 font-semibold">
                  {form.whatsapp}
                </p>
              </div>
            ) : null}

            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider">
                E-Posta:
              </span>
              <p className="mt-0.5 text-slate-800">{form.email}</p>
            </div>

            <div>
              <span className="font-semibold text-slate-500 uppercase tracking-wider">
                Tesis Adresi:
              </span>
              <p className="mt-0.5 leading-relaxed text-slate-700">
                {form.address}
              </p>
            </div>

            {form.workingHours ? (
              <div>
                <span className="font-semibold text-slate-500 uppercase tracking-wider">
                  Çalışma Saatleri:
                </span>
                <p className="mt-0.5 text-slate-600">{form.workingHours}</p>
              </div>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
