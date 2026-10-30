"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ContactSettings } from "@/modules/settings/settings.types";
import { saveContactSettingsAction } from "./actions";

export function SettingsForm({
  initialSettings,
}: {
  initialSettings: ContactSettings;
}) {
  const [form, setForm] = useState<ContactSettings>(initialSettings);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Değişiklik kontrolü (Dirty state)
  const isDirty = useMemo(() => {
    return (
      form.phone !== initialSettings.phone ||
      (form.whatsapp ?? "") !== (initialSettings.whatsapp ?? "") ||
      form.email !== initialSettings.email ||
      form.address !== initialSettings.address ||
      (form.workingHours ?? "") !== (initialSettings.workingHours ?? "") ||
      (form.instagramUrl ?? "") !== (initialSettings.instagramUrl ?? "") ||
      (form.facebookUrl ?? "") !== (initialSettings.facebookUrl ?? "")
    );
  }, [form, initialSettings]);

  function update<K extends keyof ContactSettings>(
    key: K,
    value: ContactSettings[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleReset() {
    setForm(initialSettings);
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
      setNotice("İletişim ve mağaza bilgileri canlı vitrine başarıyla yansıtıldı.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // WhatsApp numarası temizleme (wa.me linki için)
  const cleanWhatsApp = useMemo(() => {
    if (!form.whatsapp) return "";
    return form.whatsapp.replace(/[^0-9]/g, "");
  }, [form.whatsapp]);

  return (
    <div className="flex flex-col gap-6">
      {/* Üst İstatistik & Durum Kartları */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Müşteri Telefonu</span>
            <span className="text-base">📞</span>
          </div>
          <p className="mt-1.5 text-base font-bold tracking-tight text-slate-900 truncate">
            {form.phone || "Tanımlanmadı"}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold">
            ● Vitrinde Aktif
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>WhatsApp Hattı</span>
            <span className="text-base">💬</span>
          </div>
          <p className="mt-1.5 text-base font-bold tracking-tight text-slate-900 truncate">
            {form.whatsapp || "Tanımlanmadı"}
          </p>
          <span
            className={`text-[11px] font-semibold ${
              form.whatsapp ? "text-emerald-700" : "text-slate-400"
            }`}
          >
            {form.whatsapp ? "● Canlı Mesajlaşma Açık" : "○ Bağlantı Yok"}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Resmi E-Posta</span>
            <span className="text-base">✉️</span>
          </div>
          <p className="mt-1.5 text-base font-bold tracking-tight text-slate-900 truncate">
            {form.email || "Tanımlanmadı"}
          </p>
          <span className="text-[11px] text-sky-700 font-semibold">
            ● Bildirimler Aktif
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Tesis & Konum</span>
            <span className="text-base">🏭</span>
          </div>
          <p className="mt-1.5 text-base font-bold tracking-tight text-slate-900 truncate">
            Gedelek / Orhangazi
          </p>
          <span className="text-[11px] text-slate-500">
            Bursa Üretim Tesisi
          </span>
        </div>
      </div>

      {/* Bildirimler */}
      {notice && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center justify-between animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">✓</span>
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-xs hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-800 flex items-center justify-between animate-in fade-in"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Ana Çift Kolonlu Yapı */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr] items-start">
        {/* Sol: Ayar Formu */}
        <form onSubmit={save} className="flex flex-col gap-6">
          {/* Bölüm 1: Müşteri İletişim Kanalları */}
          <Card className="overflow-hidden border-slate-200/80 shadow-xs">
            <CardHeader className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-emerald-50/20 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-base shadow-2xs">
                  📞
                </span>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Müşteri İletişim Kanalları
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Header, footer ve mobil gezinmede müşterilere sunulan doğrudan erişim hatları
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-5 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Telefon */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Müşteri Hizmetleri Telefonu <span className="text-red-500">*</span>
                    </label>
                    {form.phone && (
                      <a
                        href={`tel:${form.phone}`}
                        className="text-[11px] font-semibold text-emerald-700 hover:underline"
                        title="Doğrudan arama testi"
                      >
                        Aramayı Test Et ↗
                      </a>
                    )}
                  </div>
                  <Input
                    type="text"
                    required
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="+90 532 123 45 67 veya 0224 123 45 67"
                    className="h-10 text-xs font-semibold bg-white"
                  />
                  <span className="text-[11px] text-slate-400">
                    Tıklandığında doğrudan telefon arama ekranını tetikler.
                  </span>
                </div>

                {/* WhatsApp */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      WhatsApp Sipariş / Danışma Hattı
                    </label>
                    {cleanWhatsApp && (
                      <a
                        href={`https://wa.me/${cleanWhatsApp}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-emerald-700 hover:underline"
                        title="WhatsApp sohbet bağlantısını test et"
                      >
                        Sohbeti Test Et ↗
                      </a>
                    )}
                  </div>
                  <Input
                    type="text"
                    value={form.whatsapp ?? ""}
                    onChange={(e) => update("whatsapp", e.target.value)}
                    placeholder="+90 532 123 45 67"
                    className="h-10 text-xs font-semibold bg-white"
                  />
                  <span className="text-[11px] text-slate-400">
                    Mobil ve masaüstünde tek tıkla WhatsApp sohbetini açar.
                  </span>
                </div>

                {/* E-Posta */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Resmi E-Posta Adresi <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder="siparis@kaplangurme.com"
                    className="h-10 text-xs font-semibold bg-white"
                  />
                  <span className="text-[11px] text-slate-400">
                    Müşteri bildirimlerinde ve iletişim sayfasında görünür.
                  </span>
                </div>

                {/* Çalışma Saatleri */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Çalışma & Destek Saatleri
                  </label>
                  <Input
                    type="text"
                    value={form.workingHours ?? ""}
                    onChange={(e) => update("workingHours", e.target.value)}
                    placeholder="Hafta içi 08:30 - 18:00, Cmt 09:00 - 14:00"
                    className="h-10 text-xs font-semibold bg-white"
                  />
                  <span className="text-[11px] text-slate-400">
                    Müşterilerin danışma saatlerini bilmesi için gösterilir.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bölüm 2: Tesis ve Konum */}
          <Card className="overflow-hidden border-slate-200/80 shadow-xs">
            <CardHeader className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-amber-50/20 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-base shadow-2xs">
                  🏭
                </span>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Üretim Tesisi ve Resmi Adres
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Faturalarda, Google Schema etiketlerinde ve mağaza altbilgisinde yer alır
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Açık Adres / Fabrika Konumu <span className="text-red-500">*</span>
                  </label>
                  {form.address && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(form.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-semibold text-amber-800 hover:underline"
                    >
                      Haritada Doğrula ↗
                    </a>
                  )}
                </div>
                <textarea
                  rows={3}
                  required
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Gedelek Köyü Kaplan Turşuları Üretim Tesisi, Orhangazi / Bursa"
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-900 outline-none focus:border-emerald-600 focus:ring-3 focus:ring-emerald-600/10"
                />
                <span className="text-[11px] text-slate-400">
                  Resmi tebligat, sevkiyat ve kurumsal iletişim adresi olarak kullanılır.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Bölüm 3: Sosyal Medya */}
          <Card className="overflow-hidden border-slate-200/80 shadow-xs">
            <CardHeader className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-sky-50/20 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-base shadow-2xs">
                  🌐
                </span>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Sosyal Medya Kanalları
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mağazanın resmi sosyal medya profillerine yönlendiren bağlantılar
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Instagram */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Instagram Profili
                    </label>
                    {form.instagramUrl && (
                      <a
                        href={form.instagramUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-pink-700 hover:underline"
                      >
                        Profili Aç ↗
                      </a>
                    )}
                  </div>
                  <Input
                    type="url"
                    value={form.instagramUrl ?? ""}
                    onChange={(e) => update("instagramUrl", e.target.value)}
                    placeholder="https://instagram.com/kaplantursulari"
                    className="h-10 text-xs font-semibold bg-white"
                  />
                </div>

                {/* Facebook */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Facebook Sayfası
                    </label>
                    {form.facebookUrl && (
                      <a
                        href={form.facebookUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-blue-700 hover:underline"
                      >
                        Sayfayı Aç ↗
                      </a>
                    )}
                  </div>
                  <Input
                    type="url"
                    value={form.facebookUrl ?? ""}
                    onChange={(e) => update("facebookUrl", e.target.value)}
                    placeholder="https://facebook.com/kaplantursulari"
                    className="h-10 text-xs font-semibold bg-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kaydetme Butonları */}
          <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-lg backdrop-blur-md">
            <div>
              {isDirty ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  Değişiklik yapıldı (kaydedilmedi)
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Tüm ayarlar güncel
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {isDirty && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={pending}
                  className="h-10 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Sıfırla
                </Button>
              )}

              <Button
                type="submit"
                disabled={pending || !isDirty}
                className="h-10 bg-emerald-700 px-6 text-xs font-bold text-white shadow-md hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
              >
                {pending ? (
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Kaydediliyor...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span>💾</span>
                    <span>Ayarları Kaydet</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Sağ: Canlı Mağaza Vitrini Simülasyonu */}
        <aside className="sticky top-20 flex flex-col gap-5">
          <Card className="overflow-hidden border-slate-200/80 shadow-xs">
            <CardHeader className="border-b border-slate-100 bg-linear-to-r from-slate-50 to-slate-100/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">📱</span>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Canlı Vitrin Simülasyonu
                  </CardTitle>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Canlı Önizleme
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Müşterilerin web ve mobil mağazada gördüğü iletişim görünümü
              </p>
            </CardHeader>

            <CardContent className="flex flex-col gap-4 p-4.5 bg-slate-50/50">
              {/* Mini Header Önizlemesi */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  1. Mağaza Üst Bilgi (Header)
                </span>
                <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2 text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400">KAPLAN</span>
                    <span className="text-[10px] text-slate-400 font-mono">GURME</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-emerald-400 font-bold">
                      📞 {form.phone || "+90 ..."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mini Footer / İletişim Kartı */}
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  2. Mağaza Alt Bilgi (Footer & İletişim)
                </span>

                <div className="rounded-xl border border-slate-100 bg-slate-900 p-4 text-white text-xs space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Müşteri Hizmetleri
                    </span>
                    <p className="mt-1 text-sm font-bold text-white tracking-tight">
                      {form.phone || "+90 (532) ..."}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {form.email || "siparis@kaplangurme.com"}
                    </p>
                  </div>

                  {form.whatsapp && (
                    <div className="flex items-center gap-2 rounded-lg bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-1.5 text-emerald-400">
                      <span className="text-sm">💬</span>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold">WhatsApp Sipariş</span>
                        <span className="text-xs font-semibold">{form.whatsapp}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Fabrika & Tesis
                    </span>
                    <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">
                      {form.address || "Gedelek Köyü, Orhangazi / Bursa"}
                    </p>
                  </div>

                  {form.workingHours && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Çalışma Saatleri
                      </span>
                      <p className="mt-0.5 text-[11px] text-amber-300 font-medium">
                        🕒 {form.workingHours}
                      </p>
                    </div>
                  )}

                  {/* Sosyal Medya İkonları */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    {form.instagramUrl && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-xs">
                        📷
                      </span>
                    )}
                    {form.facebookUrl && (
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-xs">
                        📘
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      Resmi Sosyal Hesaplar
                    </span>
                  </div>
                </div>
              </div>

              {/* Bilgi Kutusu */}
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-[11px] text-emerald-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <span>⚡</span>
                  <span>Anlık Senkronizasyon</span>
                </span>
                <p className="text-emerald-800 leading-relaxed">
                  Burada kaydettiğiniz tüm bilgiler mağaza başlığı, altbilgisi,
                  müşteri faturası ve WhatsApp butonlarında anında güncellenir.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
