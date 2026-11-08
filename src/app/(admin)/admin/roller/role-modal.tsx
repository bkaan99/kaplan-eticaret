"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PERMISSION_GROUPS } from "@/shared/permissions";

export interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  nameLocked: boolean;
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

export function RoleModal({
  isOpen,
  onClose,
  editingId,
  nameLocked,
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
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-100 text-lg shadow-2xs">
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
                  ? nameLocked
                    ? `"${name}" sistem rolü — ad sabit, yetkiler ve açıklama güncellenebilir`
                    : `"${name}" rolünün izin ve açıklamalarını güncelliyorsunuz`
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
              <Label
                htmlFor="role-name"
                className="text-xs font-bold text-slate-700"
              >
                Rol Adı <span className="text-red-500">*</span>
              </Label>
              <Input
                autoFocus={!nameLocked}
                id="role-name"
                value={name}
                maxLength={40}
                disabled={nameLocked}
                onChange={(event) => setName(event.target.value)}
                placeholder="Örn: Sipariş ve Kargo Sorumlusu"
                className="h-9 text-xs font-semibold bg-white disabled:bg-slate-50 disabled:text-slate-500"
              />
              {nameLocked ? (
                <p className="text-[11px] text-slate-400">
                  Sistem rollerinin adı değiştirilemez.
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="role-description"
                className="text-xs font-bold text-slate-700"
              >
                Açıklama (İsteğe bağlı)
              </Label>
              <Input
                id="role-description"
                value={description}
                maxLength={200}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Örn: Yalnızca sipariş ve kargo süreçlerini yönetir"
                className="h-9 text-xs bg-white"
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
              className="h-9 px-3.5 text-[13px] font-medium text-slate-600 hover:bg-white cursor-pointer"
            >
              Vazgeç
            </Button>

            <Button
              type="button"
              disabled={pending || !name.trim()}
              onClick={onSave}
              className="h-9 bg-emerald-700 px-4 text-[13px] font-semibold text-white shadow-2xs hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
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
