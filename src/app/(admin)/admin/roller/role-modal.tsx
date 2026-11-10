"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PERMISSION_GROUPS } from "@/shared/permissions";
import { cn } from "@/shared/cn";

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
      setSelected((current) =>
        current.filter((k) => !grantableGroupKeys.includes(k)),
      );
    } else {
      setSelected((current) =>
        Array.from(new Set([...current, ...grantableGroupKeys])),
      );
    }
  }

  const grantableCount = grantable.length;
  const selectedGrantable = selected.filter((k) => grantable.includes(k)).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
    >
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px]"
      />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="role-modal-title"
              className="text-[15px] font-semibold text-slate-900"
            >
              {editingId ? "Rolü düzenle" : "Yeni rol oluştur"}
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-500">
              {editingId
                ? nameLocked
                  ? "Sistem rolü — ad sabit; yetkiler ve açıklama güncellenebilir."
                  : "İzin setini ve açıklamayı güncelleyin."
                : "Personelin panel erişimini bu rolle sınırlayın. Yalnızca sizde olan yetkileri devredebilirsiniz."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          {message ? (
            <div
              role={message.error ? "alert" : "status"}
              className={cn(
                "rounded-xl border px-3.5 py-2.5 text-[13px] font-medium",
                message.error
                  ? "border-red-200 bg-red-50 text-red-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800",
              )}
            >
              {message.text}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="role-name"
                className="text-[13px] font-medium text-slate-700"
              >
                Rol adı <span className="text-red-500">*</span>
              </Label>
              <Input
                autoFocus={!nameLocked}
                id="role-name"
                value={name}
                maxLength={40}
                disabled={nameLocked}
                onChange={(event) => setName(event.target.value)}
                placeholder="Örn. Sipariş sorumlusu"
                className="bg-white disabled:bg-slate-50 disabled:text-slate-500"
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
                className="text-[13px] font-medium text-slate-700"
              >
                Açıklama
              </Label>
              <Input
                id="role-description"
                value={description}
                maxLength={200}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Bu rol ne işe yarar?"
                className="bg-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <p className="text-[13px] font-semibold text-slate-900">
                  Yetki grupları
                </p>
                <p className="text-[11px] text-slate-500">
                  Devredebileceğiniz {grantableCount} yetkiden seçim yapın.
                </p>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                {selected.length} seçili
                {grantableCount > 0
                  ? ` · ${selectedGrantable}/${grantableCount} verilebilir`
                  : null}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {PERMISSION_GROUPS.map((group) => {
                const groupKeys = group.permissions.map((p) => p.key);
                const grantableKeys = groupKeys.filter((k) =>
                  grantable.includes(k),
                );
                const selectedInGroup = groupKeys.filter((k) =>
                  selected.includes(k),
                ).length;
                const allSelected =
                  grantableKeys.length > 0 &&
                  grantableKeys.every((k) => selected.includes(k));

                return (
                  <div
                    key={group.label}
                    className="flex flex-col rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5"
                  >
                    <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-slate-900">
                          {group.label}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {selectedInGroup}/{group.permissions.length}
                        </p>
                      </div>
                      {grantableKeys.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => toggleGroup(groupKeys, allSelected)}
                          className="shrink-0 text-[11px] font-semibold text-emerald-700 hover:underline"
                        >
                          {allSelected ? "Temizle" : "Tümünü seç"}
                        </button>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2">
                      {group.permissions.map((permission) => {
                        const allowed = grantable.includes(permission.key);
                        const isChecked = selected.includes(permission.key);

                        return (
                          <label
                            key={permission.key}
                            className={cn(
                              "flex cursor-pointer items-start gap-2.5 text-[12px] font-medium select-none",
                              allowed
                                ? "text-slate-800"
                                : "cursor-not-allowed text-slate-400 opacity-70",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={!allowed}
                              onChange={() => togglePermission(permission.key)}
                              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="min-w-0">
                              <span className="block leading-snug">
                                {permission.label}
                              </span>
                              {!allowed ? (
                                <span className="mt-0.5 block text-[10px] font-normal text-slate-400">
                                  Sizde olmadığı için devredilemez
                                </span>
                              ) : null}
                            </span>
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

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-3.5 sm:px-6">
          <p className="text-[12px] text-slate-500">
            {selected.length === 0
              ? "Henüz yetki seçilmedi"
              : `${selected.length} yetki atanacak`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              disabled={pending || !name.trim()}
              onClick={onSave}
            >
              {pending
                ? "Kaydediliyor…"
                : editingId
                  ? "Güncelle"
                  : "Rolü kaydet"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
