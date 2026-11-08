"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteRoleAction, saveRoleAction } from "./actions";
import { RoleModal } from "./role-modal";
import { LABELS, type RoleView } from "./role-types";
export type { RoleView } from "./role-types";

export function RoleManager({
  roles,
  grantable,
}: {
  roles: RoleView[];
  grantable: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingIsSystem, setEditingIsSystem] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "system" | "custom">(
    "all",
  );
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
    setEditingIsSystem(false);
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
    setEditingIsSystem(role.isSystem);
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
    if (
      !window.confirm(`"${roleName}" rolünü silmek istediğinize emin misiniz?`)
    )
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
        nameLocked={editingIsSystem}
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
                        ? "Personele atanmış roller silinemez; önce personelden rolü kaldırın"
                        : "Rolü sil"
                    }
                  >
                    Sil
                  </Button>
                </div>
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
              <span className="font-mono text-slate-400">
                ID: #{role.id.slice(0, 8)}
              </span>
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
