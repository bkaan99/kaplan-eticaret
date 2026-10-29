"use client";

import { useState, useTransition } from "react";
import type {
  CustomPickleConfig,
  PickleBrineOption,
  PickleSpiceOption,
} from "@/modules/custom-pickle/custom-pickle.types";
import { savePickleOptionsAction } from "./actions";

const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-3 focus:ring-primary/10";

export function PickleOptionsManager({
  initialOptions,
  activeSection,
}: {
  initialOptions: CustomPickleConfig;
  activeSection: "brines" | "spices";
}) {
  const [options, setOptions] = useState<CustomPickleConfig>(initialOptions);
  const [editingBrineKey, setEditingBrineKey] = useState<string | null>(null);
  const [editingSpiceKey, setEditingSpiceKey] = useState<string | null>(null);

  // Salamura formu
  const [brineKey, setBrineKey] = useState("");
  const [brineLabel, setBrineLabel] = useState("");
  const [brineDescription, setBrineDescription] = useState("");
  const [brineColor, setBrineColor] = useState("#d6e29a");
  const [brineHasBubbles, setBrineHasBubbles] = useState(false);
  const [brineSortOrder, setBrineSortOrder] = useState("0");
  const [brineIsActive, setBrineIsActive] = useState(true);

  // Acılık formu
  const [spiceKey, setSpiceKey] = useState("");
  const [spiceLabel, setSpiceLabel] = useState("");
  const [spiceDescription, setSpiceDescription] = useState("");
  const [spicePeppers, setSpicePeppers] = useState("1");
  const [spiceTint, setSpiceTint] = useState("0.1");
  const [spiceSortOrder, setSpiceSortOrder] = useState("0");
  const [spiceIsActive, setSpiceIsActive] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function resetBrineForm() {
    setEditingBrineKey(null);
    setBrineKey("");
    setBrineLabel("");
    setBrineDescription("");
    setBrineColor("#d6e29a");
    setBrineHasBubbles(false);
    setBrineSortOrder("0");
    setBrineIsActive(true);
  }

  function editBrine(item: PickleBrineOption) {
    setEditingBrineKey(item.key);
    setBrineKey(item.key);
    setBrineLabel(item.label);
    setBrineDescription(item.description);
    setBrineColor(item.color);
    setBrineHasBubbles(Boolean(item.hasBubbles));
    setBrineSortOrder(String(item.sortOrder));
    setBrineIsActive(item.isActive);
    setError(null);
    setNotice(null);
  }

  function resetSpiceForm() {
    setEditingSpiceKey(null);
    setSpiceKey("");
    setSpiceLabel("");
    setSpiceDescription("");
    setSpicePeppers("1");
    setSpiceTint("0.1");
    setSpiceSortOrder("0");
    setSpiceIsActive(true);
  }

  function editSpice(item: PickleSpiceOption) {
    setEditingSpiceKey(item.key);
    setSpiceKey(item.key);
    setSpiceLabel(item.label);
    setSpiceDescription(item.description ?? "");
    setSpicePeppers(String(item.peppers));
    setSpiceTint(String(item.tint));
    setSpiceSortOrder(String(item.sortOrder));
    setSpiceIsActive(item.isActive);
    setError(null);
    setNotice(null);
  }

  async function persistConfig(newConfig: CustomPickleConfig, successMessage: string) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await savePickleOptionsAction(newConfig);
      if (!result.ok) {
        setError(result.error ?? "Ayarlar kaydedilemedi");
        return;
      }
      setOptions(newConfig);
      setNotice(successMessage);
    });
  }

  function saveBrine() {
    const key = (brineKey || brineLabel.toUpperCase().replace(/[^A-Z0-9]/g, "_")).trim();
    if (!key || !brineLabel.trim()) {
      setError("Anahtar ve etiket zorunludur");
      return;
    }

    const newItem: PickleBrineOption = {
      key,
      label: brineLabel.trim(),
      description: brineDescription.trim(),
      color: brineColor.trim() || "#d6e29a",
      hasBubbles: brineHasBubbles,
      sortOrder: Number(brineSortOrder) || 0,
      isActive: brineIsActive,
    };

    let nextBrines: PickleBrineOption[];
    if (editingBrineKey) {
      nextBrines = options.brines.map((item) =>
        item.key === editingBrineKey ? newItem : item,
      );
    } else {
      if (options.brines.some((item) => item.key === key)) {
        setError(`"${key}" anahtarı zaten mevcut. Lütfen benzersiz bir anahtar seçin.`);
        return;
      }
      nextBrines = [...options.brines, newItem];
    }

    nextBrines.sort((a, b) => a.sortOrder - b.sortOrder);
    const newConfig = { ...options, brines: nextBrines };
    persistConfig(
      newConfig,
      editingBrineKey ? "Salamura tarifi güncellendi" : "Yeni salamura tarifi eklendi",
    );
    resetBrineForm();
  }

  function deleteBrine(key: string) {
    if (options.brines.length <= 1) {
      setError("En az bir salamura seçeneği kalmalıdır");
      return;
    }
    if (!window.confirm("Bu salamura seçeneğini silmek istediğinizden emin misiniz?")) {
      return;
    }
    const nextBrines = options.brines.filter((item) => item.key !== key);
    persistConfig({ ...options, brines: nextBrines }, "Salamura seçeneği silindi");
    if (editingBrineKey === key) resetBrineForm();
  }

  function toggleBrineActive(item: PickleBrineOption) {
    const nextBrines = options.brines.map((b) =>
      b.key === item.key ? { ...b, isActive: !b.isActive } : b,
    );
    persistConfig(
      { ...options, brines: nextBrines },
      item.isActive ? "Salamura pasife alındı" : "Salamura aktife alındı",
    );
  }

  function saveSpice() {
    const key = (spiceKey || spiceLabel.toUpperCase().replace(/[^A-Z0-9]/g, "_")).trim();
    if (!key || !spiceLabel.trim()) {
      setError("Anahtar ve etiket zorunludur");
      return;
    }

    const newItem: PickleSpiceOption = {
      key,
      label: spiceLabel.trim(),
      description: spiceDescription.trim() || null,
      peppers: Math.max(0, Math.min(5, Number(spicePeppers) || 0)),
      tint: Math.max(0, Math.min(1, Number(spiceTint) || 0)),
      sortOrder: Number(spiceSortOrder) || 0,
      isActive: spiceIsActive,
    };

    let nextSpices: PickleSpiceOption[];
    if (editingSpiceKey) {
      nextSpices = options.spices.map((item) =>
        item.key === editingSpiceKey ? newItem : item,
      );
    } else {
      if (options.spices.some((item) => item.key === key)) {
        setError(`"${key}" anahtarı zaten mevcut. Lütfen benzersiz bir anahtar seçin.`);
        return;
      }
      nextSpices = [...options.spices, newItem];
    }

    nextSpices.sort((a, b) => a.sortOrder - b.sortOrder);
    const newConfig = { ...options, spices: nextSpices };
    persistConfig(
      newConfig,
      editingSpiceKey ? "Acılık seviyesi güncellendi" : "Yeni acılık seviyesi eklendi",
    );
    resetSpiceForm();
  }

  function deleteSpice(key: string) {
    if (options.spices.length <= 1) {
      setError("En az bir acılık seçeneği kalmalıdır");
      return;
    }
    if (!window.confirm("Bu acılık seviyesini silmek istediğinizden emin misiniz?")) {
      return;
    }
    const nextSpices = options.spices.filter((item) => item.key !== key);
    persistConfig({ ...options, spices: nextSpices }, "Acılık seviyesi silindi");
    if (editingSpiceKey === key) resetSpiceForm();
  }

  function toggleSpiceActive(item: PickleSpiceOption) {
    const nextSpices = options.spices.map((s) =>
      s.key === item.key ? { ...s, isActive: !s.isActive } : s,
    );
    persistConfig(
      { ...options, spices: nextSpices },
      item.isActive ? "Acılık pasife alındı" : "Acılık aktife alındı",
    );
  }

  return (
    <div className="flex flex-col gap-8">
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

      {activeSection === "brines" ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_minmax(0,1fr)]">
          {/* Salamura Ekle/Düzenle Formu */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="font-semibold text-slate-900">
              {editingBrineKey ? "Salamura Tarifini Düzenle" : "Yeni Salamura Tarifi"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Müşterilerin turşu bidonuna seçeceği salamura suyunun bileşimi ve rengi.
            </p>

            <div className="mt-5 flex flex-col gap-4 text-sm">
              <label className="flex flex-col gap-1.5 font-medium text-slate-700">
                Tarif Adı / Etiket *
                <input
                  type="text"
                  placeholder="örn: Elma Sirkeli, Kaya Tuzlu & Limonlu"
                  className={inputClass}
                  value={brineLabel}
                  onChange={(e) => setBrineLabel(e.target.value)}
                />
              </label>

              <label className="flex flex-col gap-1.5 font-medium text-slate-700">
                Sistem Anahtarı (KEY) *
                <input
                  type="text"
                  placeholder="örn: APPLE_CIDER, LEMON_SALT"
                  className={inputClass}
                  value={brineKey}
                  disabled={Boolean(editingBrineKey)}
                  onChange={(e) =>
                    setBrineKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))
                  }
                />
                <span className="text-xs text-muted-foreground">
                  Büyük harf ve alt çizgi (örn: VINEGAR, NATURAL).
                </span>
              </label>

              <label className="flex flex-col gap-1.5 font-medium text-slate-700">
                Açıklama / Müşteri Bilgisi
                <textarea
                  rows={3}
                  placeholder="Geleneksel sirke ve kaya tuzu dengesi..."
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none focus:border-primary focus:ring-3 focus:ring-primary/10"
                  value={brineDescription}
                  onChange={(e) => setBrineDescription(e.target.value)}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 font-medium text-slate-700">
                  Bidon Sıvı Rengi
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 p-0.5"
                      value={brineColor}
                      onChange={(e) => setBrineColor(e.target.value)}
                    />
                    <input
                      type="text"
                      className={inputClass}
                      value={brineColor}
                      onChange={(e) => setBrineColor(e.target.value)}
                    />
                  </div>
                </label>

                <label className="flex flex-col gap-1.5 font-medium text-slate-700">
                  Sıralama Önceliği
                  <input
                    type="number"
                    className={inputClass}
                    value={brineSortOrder}
                    onChange={(e) => setBrineSortOrder(e.target.value)}
                  />
                </label>
              </div>

              <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-3">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={brineHasBubbles}
                    onChange={(e) => setBrineHasBubbles(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <span>Doğal Fermantasyon Kabarcıkları</span>
                </label>
                <span className="text-xs text-muted-foreground">
                  Seçilirse bidon animasyonunda canlı probiyotik fermantasyon kabarcıkları yükselir.
                </span>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={brineIsActive}
                  onChange={(e) => setBrineIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span>Bu salamura türü aktif olarak seçilebilsin</span>
              </label>

              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={saveBrine}
                  disabled={pending}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {pending ? "Kaydediliyor..." : editingBrineKey ? "Güncelle" : "Salamura Ekle"}
                </button>
                {editingBrineKey ? (
                  <button
                    type="button"
                    onClick={resetBrineForm}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Vazgeç
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          {/* Salamura Listesi */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
              <h3 className="font-semibold text-slate-900">
                Tanımlı Salamura Tarifleri ({options.brines.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Tarif</th>
                    <th className="px-4 py-3">Anahtar</th>
                    <th className="px-4 py-3">Renk</th>
                    <th className="px-4 py-3">Kabarcık</th>
                    <th className="px-4 py-3">Sıra</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {options.brines.map((item) => (
                    <tr
                      key={item.key}
                      className={item.isActive ? "" : "bg-slate-50/60 text-slate-400"}
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">
                            {item.label}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {item.description}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {item.key}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-5 w-5 rounded-full border border-slate-300"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-mono text-xs">{item.color}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {item.hasBubbles ? (
                          <span className="inline-flex rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700">
                            Kabarcıklı
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{item.sortOrder}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3 text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => editBrine(item)}
                            className="text-primary hover:underline"
                          >
                            Düzenle
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleBrineActive(item)}
                            disabled={pending}
                            className="text-slate-600 hover:underline"
                          >
                            {item.isActive ? "Pasif yap" : "Aktif yap"}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteBrine(item.key)}
                            disabled={pending}
                            className="text-red-600 hover:underline"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[380px_minmax(0,1fr)]">
          {/* Acılık Ekle/Düzenle Formu */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="font-semibold text-slate-900">
              {editingSpiceKey ? "Acılık Seviyesini Düzenle" : "Yeni Acılık Seviyesi"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Müşterilerin bidona katmak istediği acılık derecesi ve görsel biber ikonu.
            </p>

            <div className="mt-5 flex flex-col gap-4 text-sm">
              <label className="flex flex-col gap-1.5 font-medium text-slate-700">
                Seviye Adı / Etiket *
                <input
                  type="text"
                  placeholder="örn: Acısız, Orta acı, Çok Acılı (Atom)"
                  className={inputClass}
                  value={spiceLabel}
                  onChange={(e) => setSpiceLabel(e.target.value)}
                />
              </label>

              <label className="flex flex-col gap-1.5 font-medium text-slate-700">
                Sistem Anahtarı (KEY) *
                <input
                  type="text"
                  placeholder="örn: MILD, MEDIUM, HOT, EXTRA_HOT"
                  className={inputClass}
                  value={spiceKey}
                  disabled={Boolean(editingSpiceKey)}
                  onChange={(e) =>
                    setSpiceKey(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))
                  }
                />
                <span className="text-xs text-muted-foreground">
                  Büyük harf ve alt çizgi (örn: MILD, HOT).
                </span>
              </label>

              <label className="flex flex-col gap-1.5 font-medium text-slate-700">
                Açıklama (İsteğe bağlı)
                <input
                  type="text"
                  placeholder="Damakta iz bırakan geleneksel acı lezzet..."
                  className={inputClass}
                  value={spiceDescription}
                  onChange={(e) => setSpiceDescription(e.target.value)}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1.5 font-medium text-slate-700">
                  Biber İkon Sayısı (0-5)
                  <input
                    type="number"
                    min="0"
                    max="5"
                    className={inputClass}
                    value={spicePeppers}
                    onChange={(e) => setSpicePeppers(e.target.value)}
                  />
                </label>

                <label className="flex flex-col gap-1.5 font-medium text-slate-700">
                  Sıralama Önceliği
                  <input
                    type="number"
                    className={inputClass}
                    value={spiceSortOrder}
                    onChange={(e) => setSpiceSortOrder(e.target.value)}
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1.5 font-medium text-slate-700">
                Bidon Kızarıklık Tonu ({Math.round(Number(spiceTint) * 100)}%)
                <input
                  type="range"
                  min="0"
                  max="0.8"
                  step="0.02"
                  className="h-2 w-full cursor-pointer accent-primary"
                  value={spiceTint}
                  onChange={(e) => setSpiceTint(e.target.value)}
                />
                <span className="text-xs text-muted-foreground">
                  Bidon sıvısına eklenecek kırmızı acı biber renk geçirgenliği.
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={spiceIsActive}
                  onChange={(e) => setSpiceIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span>Bu acılık seviyesi aktif olarak seçilebilsin</span>
              </label>

              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={saveSpice}
                  disabled={pending}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {pending ? "Kaydediliyor..." : editingSpiceKey ? "Güncelle" : "Acılık Ekle"}
                </button>
                {editingSpiceKey ? (
                  <button
                    type="button"
                    onClick={resetSpiceForm}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Vazgeç
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          {/* Acılık Listesi */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="border-b border-slate-100 bg-slate-50/70 px-6 py-4">
              <h3 className="font-semibold text-slate-900">
                Tanımlı Acılık Seviyeleri ({options.spices.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Seviye</th>
                    <th className="px-4 py-3">Anahtar</th>
                    <th className="px-4 py-3">Biber Sayısı</th>
                    <th className="px-4 py-3">Kızarıklık</th>
                    <th className="px-4 py-3">Sıra</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {options.spices.map((item) => (
                    <tr
                      key={item.key}
                      className={item.isActive ? "" : "bg-slate-50/60 text-slate-400"}
                    >
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">
                            {item.label}
                          </span>
                          {item.description ? (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {item.description}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">
                        {item.key}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-red-500 font-semibold">
                          {"🌶️".repeat(item.peppers) || <span className="text-slate-400 font-normal">Yok (0)</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs">
                          %{Math.round(item.tint * 100)}
                        </span>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{item.sortOrder}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {item.isActive ? "Aktif" : "Pasif"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-3 text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => editSpice(item)}
                            className="text-primary hover:underline"
                          >
                            Düzenle
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleSpiceActive(item)}
                            disabled={pending}
                            className="text-slate-600 hover:underline"
                          >
                            {item.isActive ? "Pasif yap" : "Aktif yap"}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSpice(item.key)}
                            disabled={pending}
                            className="text-red-600 hover:underline"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
