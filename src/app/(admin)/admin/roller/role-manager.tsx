"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/cn";
import { deleteRoleAction, saveRoleAction } from "./actions";
import { RoleModal } from "./role-modal";
import {
  permissionGroupSummary,
  permissionLabel,
  type RoleView,
} from "./role-types";

export type { RoleView } from "./role-types";

type FilterTab = "all" | "system" | "custom";

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
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  const stats = useMemo(() => {
    const total = roles.length;
    const system = roles.filter((r) => r.isSystem).length;
    const custom = roles.filter((r) => !r.isSystem).length;
    const totalUsers = roles.reduce((sum, r) => sum + r.userCount, 0);
    return { total, system, custom, totalUsers };
  }, [roles]);

  function resetForm() {
    setEditingId(null);
    setEditingIsSystem(false);
    setName("");
    setDescription("");
    setSelected([]);
  }

  function handleCreateNew() {
    resetForm();
    setMessage(null);
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
    resetForm();
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
        setIsModalOpen(false);
        resetForm();
        setMessage({
          text: editingId
            ? "Rol güncellendi."
            : "Yeni rol oluşturuldu.",
          error: false,
        });
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
      !window.confirm(`“${roleName}” rolünü silmek istediğinize emin misiniz?`)
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteRoleAction(id);
      setMessage(
        result.ok
          ? { text: `“${roleName}” silindi.`, error: false }
          : { text: result.error ?? "Silinemedi", error: true },
      );
      if (result.ok && editingId === id) {
        resetForm();
        setIsModalOpen(false);
      }
    });
  }

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      if (filterTab === "system" && !role.isSystem) return false;
      if (filterTab === "custom" && role.isSystem) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchName = role.name.toLowerCase().includes(q);
      const matchDesc = role.description?.toLowerCase().includes(q);
      const matchPerm = role.permissions.some((p) => {
        const label = permissionLabel(p);
        return label.toLowerCase().includes(q) || p.toLowerCase().includes(q);
      });
      return matchName || matchDesc || matchPerm;
    });
  }, [roles, filterTab, searchQuery]);

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "Tümü", count: roles.length },
    { id: "system", label: "Sistem", count: stats.system },
    { id: "custom", label: "Özel", count: stats.custom },
  ];

  return (
    <div className="flex flex-col gap-5">
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
        message={isModalOpen ? message : null}
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: "Toplam rol", value: stats.total },
          { label: "Sistem", value: stats.system, hint: "Adı sabit" },
          { label: "Özel", value: stats.custom, hint: "Silinebilir" },
          {
            label: "Atanmış personel",
            value: stats.totalUsers,
            hint: "Rol eşleşmesi",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200/80 bg-white px-3.5 py-3 shadow-2xs"
          >
            <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
              {item.label}
            </p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {item.value}
            </p>
            {item.hint ? (
              <p className="mt-0.5 text-[11px] text-slate-400">{item.hint}</p>
            ) : null}
          </div>
        ))}
      </div>

      {message && !isModalOpen ? (
        <div
          role={message.error ? "alert" : "status"}
          className={cn(
            "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-[13px] font-medium",
            message.error
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800",
          )}
        >
          <span>{message.text}</span>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-current/70 hover:text-current"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="flex gap-1 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1">
            {tabs.map((tab) => {
              const active = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition",
                    active
                      ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
                      : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {tab.label}
                  <span className="ml-1 text-slate-400">{tab.count}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rol veya yetki ara…"
              className="bg-white pr-8"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-600"
                aria-label="Aramayı temizle"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>

        <Button type="button" onClick={handleCreateNew}>
          Yeni rol
        </Button>
      </div>

      <div className="grid items-stretch gap-3 sm:grid-cols-2">
        {filteredRoles.map((role) => {
          const groups = permissionGroupSummary(role.permissions);
          const expanded = expandedId === role.id;
          const previewPerms = role.permissions.slice(0, 4);
          const moreCount = Math.max(0, role.permissions.length - previewPerms.length);

          return (
            <article
              key={role.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs transition hover:border-slate-300"
            >
              <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3.5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-[14px] font-semibold text-slate-900">
                      {role.name}
                    </h3>
                    <span
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase",
                        role.isSystem
                          ? "bg-amber-50 text-amber-800"
                          : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {role.isSystem ? "Sistem" : "Özel"}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-slate-500">
                    {role.userCount === 0
                      ? "Personele atanmamış"
                      : `${role.userCount} personele atanmış`}
                    {" · "}
                    {role.permissions.length} yetki
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(role)}
                  >
                    Düzenle
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending || role.userCount > 0}
                    onClick={() => remove(role.id, role.name)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-40"
                    title={
                      role.userCount > 0
                        ? "Önce personelden rolü kaldırın"
                        : "Rolü sil"
                    }
                  >
                    Sil
                  </Button>
                </div>
              </header>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <p
                  className={cn(
                    "text-[12px] leading-relaxed",
                    role.description ? "text-slate-600" : "text-slate-400",
                  )}
                >
                  {role.description || "Açıklama yok"}
                </p>

                {groups.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {groups.map((group) => (
                      <span
                        key={group.label}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700"
                      >
                        {group.label}
                        <span className="text-slate-400">
                          {group.selected}/{group.total}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-amber-700">
                    Bu role henüz yetki atanmamış.
                  </p>
                )}

                <div className="border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(expanded ? null : role.id)
                    }
                    className="flex w-full items-center justify-between text-left text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                  >
                    <span>Yetki listesi</span>
                    <span>{expanded ? "Gizle" : "Göster"}</span>
                  </button>

                  {expanded ? (
                    <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                      {role.permissions.map((perm) => (
                        <li
                          key={perm}
                          className="rounded-md bg-slate-50 px-2 py-1 text-[11px] text-slate-700"
                        >
                          {permissionLabel(perm)}
                        </li>
                      ))}
                      {role.permissions.length === 0 ? (
                        <li className="text-[11px] text-slate-400">
                          Boş izin seti
                        </li>
                      ) : null}
                    </ul>
                  ) : previewPerms.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {previewPerms.map((perm) => (
                        <span
                          key={perm}
                          className="rounded-md bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-600"
                        >
                          {permissionLabel(perm)}
                        </span>
                      ))}
                      {moreCount > 0 ? (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                          +{moreCount}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}

        {filteredRoles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 py-14 text-center sm:col-span-2">
            <p className="text-[14px] font-semibold text-slate-800">
              Rol bulunamadı
            </p>
            <p className="mt-1 max-w-sm text-[12px] text-slate-500">
              {searchQuery
                ? `“${searchQuery}” ile eşleşen rol veya yetki yok.`
                : "Bu filtrede listelenecek rol yok."}
            </p>
            <Button type="button" onClick={handleCreateNew} className="mt-4">
              Yeni rol oluştur
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
