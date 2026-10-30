"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PERMISSION_GROUPS } from "@/shared/permissions";
import { deleteRoleAction, saveRoleAction } from "./actions";

export interface RoleView {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  userCount: number;
}

const LABELS = new Map(
  PERMISSION_GROUPS.flatMap((group) =>
    group.permissions.map((p) => [p.key, p.label] as const),
  ),
);

/* -------------------------------------------------------------------------- */
/*                                 ROLE MODAL                                 */
/* -------------------------------------------------------------------------- */

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  grantable: string[];
  onSave: () => void;
  pending: boolean;
  message: { text: string; error: boolean } | null;
}

function RoleModal({
  isOpen,
  onClose,
  editingId,
  name,
  setName,
  description,
  setDescription,
  selected,
  setSelected,
  grantable,
  onSave,
  pending,
  message,
}: RoleModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  function togglePermission(permission: string) {
    setSelected((current) =>
      current.includes(permission)
        ? current.filter((p) => p !== permission)
        : [...current, permission],
    );
  }

  function toggleGroup(groupKeys: string[], allInGroupSelected: boolean) {
    const grantableGroupKeys = groupKeys.filter((k) => grantable.includes(k));
    if (allInGroupSelected) {
      // Gruptaki tüm seçilileri kaldır
      setSelected((current) =>
        current.filter((k) => !grantableGroupKeys.includes(k)),
      );
    } else {
      // Gruptaki verilebilir tüm yetkileri ekle
      setSelected((current) =>
        Array.from(new Set([...current, ...grantableGroupKeys])),
      );
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Kutusu */}
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-emerald-50/20 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-lg shadow-2xs">
              🛡️
            </span>
            <div>
              <h2
                id="role-modal-title"
                className="text-base font-bold text-slate-900"
              >
                {editingId ? "Yetki Rolünü Düzenle" : "Yeni Yetki Rolü Oluştur"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {editingId
                  ? `"${name}" rolünün izin ve açıklamalarını güncelliyorsunuz`
                  : "Personellerin yönetim panelindeki erişim sınırlarını belirleyin"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        {/* Modal Form Gövdesi (Kaydırılabilir) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {message && (
            <div
              role={message.error ? "alert" : "status"}
              className={`rounded-2xl border p-3.5 text-xs font-semibold flex items-center gap-2 ${
                message.error
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
            >
              <span>{message.error ? "⚠️" : "✓"}</span>
              <span>{message.text}</span>
            </div>
          )}

          {/* Temel Bilgiler */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role-name" className="text-xs font-bold text-slate-700">
                Rol Adı <span className="text-red-500">*</span>
              </Label>
              <Input
                autoFocus
                id="role-name"
                value={name}
                maxLength={40}
                onChange={(event) => setName(event.target.value)}
                placeholder="Örn: Sipariş ve Kargo Sorumlusu"
                className="h-10 text-xs font-semibold bg-white"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role-description" className="text-xs font-bold text-slate-700">
                Açıklama (İsteğe bağlı)
              </Label>
              <Input
                id="role-description"
                value={description}
                maxLength={200}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Örn: Yalnızca sipariş ve kargo süreçlerini yönetir"
                className="h-10 text-xs bg-white"
              />
            </div>
          </div>

          {/* Yetki İzinleri Matrisi */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Yetki ve İzin Grupları
                </span>
                <p className="text-[11px] text-slate-500">
                  Bu role atanacak modül izinlerini işaretleyin
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                {selected.length} Yetki Seçildi
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {PERMISSION_GROUPS.map((group) => {
                const groupKeys = group.permissions.map((p) => p.key);
                const grantableKeys = groupKeys.filter((k) =>
                  grantable.includes(k),
                );
                const selectedInGroup = groupKeys.filter((k) =>
                  selected.includes(k),
                );
                const allSelected =
                  grantableKeys.length > 0 &&
                  grantableKeys.every((k) => selected.includes(k));

                return (
                  <div
                    key={group.label}
                    className="flex flex-col rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4"
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 mb-3">
                      <span className="text-xs font-bold text-slate-900">
                        {group.label}
                      </span>
                      {grantableKeys.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleGroup(groupKeys, allSelected)}
                          className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                        >
                          {allSelected ? "Temizle" : "Tümünü Seç"}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {group.permissions.map((permission) => {
                        const allowed = grantable.includes(permission.key);
                        const isChecked = selected.includes(permission.key);

                        return (
                          <label
                            key={permission.key}
                            className={`flex items-start gap-2.5 text-xs font-medium cursor-pointer select-none transition ${
                              allowed
                                ? "text-slate-800 hover:text-slate-950"
                                : "text-slate-400 cursor-not-allowed opacity-60"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={!allowed}
                              onChange={() => togglePermission(permission.key)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div className="flex flex-col">
                              <span>{permission.label}</span>
                              {!allowed && (
                                <span className="text-[10px] text-slate-400 italic">
                                  (Sizde bu yetki olmadığı için devredilemez)
                                </span>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          <span className="text-xs text-slate-500 font-medium">
            Toplam <strong>{selected.length}</strong> yetki verilecek
          </span>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
              className="h-10 px-5 text-xs font-semibold text-slate-700 hover:bg-white cursor-pointer"
            >
              Vazgeç
            </Button>

            <Button
              type="button"
              disabled={pending || !name.trim()}
              onClick={onSave}
              className="h-10 bg-emerald-700 px-6 text-xs font-bold text-white shadow-md hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
            >
              {pending ? (
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Kaydediliyor...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>💾</span>
                  <span>{editingId ? "Güncelle" : "Rolü Kaydet"}</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                ROLE MANAGER                                */
/* -------------------------------------------------------------------------- */

export function RoleManager({
  roles,
  grantable,
}: {
  roles: RoleView[];
  grantable: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "system" | "custom">("all");
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  // İstatistikler
  const stats = useMemo(() => {
    const total = roles.length;
    const system = roles.filter((r) => r.isSystem).length;
    const custom = roles.filter((r) => !r.isSystem).length;
    const totalUsers = roles.reduce((sum, r) => sum + r.userCount, 0);
    return { total, system, custom, totalUsers };
  }, [roles]);

  function reset() {
    setEditingId(null);
    setName("");
    setDescription("");
    setSelected([]);
    setMessage(null);
  }

  function handleCreateNew() {
    reset();
    setIsModalOpen(true);
  }

  function handleEdit(role: RoleView) {
    setEditingId(role.id);
    setName(role.name);
    setDescription(role.description ?? "");
    setSelected(role.permissions);
    setMessage(null);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    reset();
    setIsModalOpen(false);
  }

  function save() {
    if (!name.trim()) return;

    startTransition(async () => {
      const result = await saveRoleAction(editingId, {
        name: name.trim(),
        description: description.trim() || null,
        permissions: selected,
      });

      if (result.ok) {
        setMessage({
          text: editingId
            ? "Rol başarıyla güncellendi."
            : "Yeni rol başarıyla oluşturuldu.",
          error: false,
        });
        reset();
        setIsModalOpen(false);
      } else {
        setMessage({
          text: result.error ?? "Kaydedilemedi",
          error: true,
        });
      }
    });
  }

  function remove(id: string, roleName: string) {
    if (!window.confirm(`"${roleName}" rolünü silmek istediğinize emin misiniz?`))
      return;

    startTransition(async () => {
      const result = await deleteRoleAction(id);
      setMessage(
        result.ok
          ? { text: `"${roleName}" rolü silindi.`, error: false }
          : { text: result.error ?? "Silinemedi", error: true },
      );
      if (result.ok && editingId === id) {
        reset();
        setIsModalOpen(false);
      }
    });
  }

  // Filtrelenmiş roller
  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      // Sekme filtresi
      if (filterTab === "system" && !role.isSystem) return false;
      if (filterTab === "custom" && role.isSystem) return false;

      // Arama filtresi
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = role.name.toLowerCase().includes(q);
      const matchDesc = role.description?.toLowerCase().includes(q);
      const matchPerm = role.permissions.some((p) => {
        const label = LABELS.get(p as never) ?? p;
        return label.toLowerCase().includes(q) || p.toLowerCase().includes(q);
      });
      return matchName || matchDesc || matchPerm;
    });
  }, [roles, filterTab, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      {/* Rol Ekleme/Düzenleme Modalı */}
      <RoleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        editingId={editingId}
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        selected={selected}
        setSelected={setSelected}
        grantable={grantable}
        onSave={save}
        pending={pending}
        message={message}
      />

      {/* Üst İstatistik Kartları */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Toplam Tanımlı Rol</span>
            <span className="text-base">🛡️</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {stats.total}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Sistem Rolleri</span>
            <span className="text-base">👑</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-emerald-700">
            {stats.system}
          </p>
          <span className="text-[10px] text-slate-400">Korumalı / Sabit</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Özel Roller</span>
            <span className="text-base">⚙️</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-sky-700">
            {stats.custom}
          </p>
          <span className="text-[10px] text-slate-400">Özel Yetkilendirme</span>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Rol Atanmış Personel</span>
            <span className="text-base">👥</span>
          </div>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
            {stats.totalUsers}
          </p>
          <span className="text-[10px] text-slate-400">Aktif Yönetici</span>
        </div>
      </div>

      {/* Sayfa Bildirim Mesajı (Modal kapalıyken) */}
      {message && !isModalOpen && (
        <div
          role={message.error ? "alert" : "status"}
          className={`rounded-2xl border p-4 text-xs font-semibold flex items-center justify-between ${
            message.error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{message.error ? "⚠️" : "✓"}</span>
            <span>{message.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-xs hover:opacity-75 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Kontrol & Filtre Çubuğu */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          {/* Sekmeler */}
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setFilterTab("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                filterTab === "all"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tüm Roller ({roles.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("system")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                filterTab === "system"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sistem ({stats.system})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab("custom")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                filterTab === "custom"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Özel Roller ({stats.custom})
            </button>
          </div>

          {/* Arama */}
          <div className="relative w-full sm:w-60">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
              🔍
            </span>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rol veya yetki ara..."
              className="h-9 pl-8 text-xs bg-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Yeni Rol Butonu (Artık Modal Açıyor) */}
        <Button
          type="button"
          onClick={handleCreateNew}
          className="h-9 bg-emerald-700 px-4 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 cursor-pointer"
        >
          + Yeni Rol Oluştur
        </Button>
      </div>

      {/* Rol Kartları Listesi (Tam Genişlik) */}
      <div className="grid gap-4 sm:grid-cols-2 items-stretch">
        {filteredRoles.map((role) => (
          <Card
            key={role.id}
            className="flex flex-col justify-between overflow-hidden border-slate-200/80 shadow-2xs hover:border-slate-300 transition"
          >
            <div>
              {/* Kart Başlığı */}
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm shadow-2xs ${
                      role.isSystem
                        ? "bg-amber-100 text-amber-900"
                        : "bg-emerald-100 text-emerald-900"
                    }`}
                  >
                    {role.isSystem ? "👑" : "⚙️"}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-bold text-slate-900 truncate">
                        {role.name}
                      </CardTitle>
                      {role.isSystem ? (
                        <Badge tone="neutral" className="text-[10px]">
                          Sistem Rolü
                        </Badge>
                      ) : (
                        <Badge tone="success" className="text-[10px]">
                          Özel Rol
                        </Badge>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      👥 {role.userCount} personele tanımlı
                    </span>
                  </div>
                </div>

                {!role.isSystem ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(role)}
                      className="h-7.5 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Düzenle
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending || role.userCount > 0}
                      onClick={() => remove(role.id, role.name)}
                      className="h-7.5 px-2 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40 cursor-pointer"
                      title={
                        role.userCount > 0
                          ? "Personele atanmış roller silinemez"
                          : "Rolü Sil"
                      }
                    >
                      Sil
                    </Button>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium italic">
                    🔒 Korumalı
                  </span>
                )}
              </CardHeader>

              {/* Kart Açıklaması & Yetki Matrisi */}
              <CardContent className="flex flex-col gap-3.5 p-4.5">
                {role.description ? (
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {role.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Bu rol için özel bir açıklama girilmemiş.
                  </p>
                )}

                {/* İzin Rozetleri */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>Atanmış Yetkiler</span>
                    <span className="text-emerald-700">
                      {role.permissions.length} İzin
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200/90 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                      >
                        <span>✓</span>
                        <span>{LABELS.get(perm as never) ?? perm}</span>
                      </span>
                    ))}

                    {role.permissions.length === 0 && (
                      <span className="text-xs text-slate-400 italic">
                        Hiçbir izin atanmamış.
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </div>

            {/* Kart Alt Bilgisi */}
            <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Durum: Aktif Yetkilendirme</span>
              <span className="font-mono text-slate-400">ID: #{role.id.slice(0, 8)}</span>
            </div>
          </Card>
        ))}

        {filteredRoles.length === 0 && (
          <div className="sm:col-span-2 flex flex-col items-center justify-center py-16 px-4 rounded-3xl border border-dashed border-slate-200 bg-white text-center">
            <span className="text-4xl mb-2">🛡️</span>
            <p className="text-sm font-bold text-slate-800">Rol bulunamadı</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {searchQuery
                ? `"${searchQuery}" aramasına uygun rol veya yetki eşleşmedi.`
                : "Listelenecek rol kaydı bulunmuyor."}
            </p>
            <Button
              type="button"
              onClick={handleCreateNew}
              className="mt-4 bg-emerald-700 text-xs font-bold text-white hover:bg-emerald-800"
            >
              + Yeni Rol Oluştur
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
