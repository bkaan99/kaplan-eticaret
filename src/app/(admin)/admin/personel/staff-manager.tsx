"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/cn";
import {
  inviteStaffAction,
  resendInviteAction,
  setStaffActiveAction,
  setStaffRolesAction,
} from "./actions";

export interface StaffView {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  hasPassword: boolean;
  roleIds: string[];
  isSelf: boolean;
}

export interface RoleOption {
  id: string;
  name: string;
}

type FilterTab = "all" | "active" | "pending" | "inactive";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function RoleChecklist({
  roles,
  value,
  onChange,
  disabled,
}: {
  roles: RoleOption[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  if (roles.length === 0) {
    return (
      <p className="text-[12px] text-slate-400">
        Tanımlı rol yok. Önce Roller sayfasından rol oluşturun.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => {
        const checked = value.includes(role.id);
        return (
          <label
            key={role.id}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 text-[12px] font-medium select-none transition",
              disabled && "cursor-not-allowed opacity-60",
              checked
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
            )}
          >
            <input
              type="checkbox"
              className="sr-only"
              disabled={disabled}
              checked={checked}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...value, role.id]
                    : value.filter((id) => id !== role.id),
                )
              }
            />
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                checked ? "bg-emerald-500" : "bg-slate-300",
              )}
              aria-hidden
            />
            {role.name}
          </label>
        );
      })}
    </div>
  );
}

function StaffRow({
  member,
  roles,
  run,
  pending,
}: {
  member: StaffView;
  roles: RoleOption[];
  run: (
    task: () => Promise<{ ok: boolean; error?: string }>,
    ok: string,
  ) => void;
  pending: boolean;
}) {
  const [roleIds, setRoleIds] = useState(member.roleIds);
  const changed =
    roleIds.length !== member.roleIds.length ||
    roleIds.some((id) => !member.roleIds.includes(id));

  useEffect(() => {
    setRoleIds(member.roleIds);
  }, [member.roleIds]);

  const roleNames = roles
    .filter((role) => member.roleIds.includes(role.id))
    .map((role) => role.name);

  return (
    <li className="flex flex-col gap-3 px-4 py-4 transition hover:bg-slate-50/60">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold",
              member.isActive
                ? "bg-slate-100 text-slate-700"
                : "bg-slate-50 text-slate-400",
            )}
          >
            {initials(member.name)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[13px] font-semibold text-slate-900">
                {member.name}
              </span>
              {member.isSelf ? (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase">
                  Siz
                </span>
              ) : null}
              {!member.isActive ? (
                <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 uppercase">
                  Pasif
                </span>
              ) : null}
              {!member.hasPassword ? (
                <span className="rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800 uppercase">
                  Davet bekliyor
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-[12px] text-slate-500">
              {member.email}
            </p>
            {roleNames.length > 0 ? (
              <p className="mt-1 text-[11px] text-slate-400">
                {roleNames.join(" · ")}
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-amber-700">Rol atanmamış</p>
            )}
          </div>
        </div>

        {!member.isSelf ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {!member.hasPassword ? (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  run(() => resendInviteAction(member.id), "Davet yeniden gönderildi")
                }
              >
                Daveti tekrar gönder
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                run(
                  () => setStaffActiveAction(member.id, !member.isActive),
                  member.isActive ? "Pasifleştirildi" : "Etkinleştirildi",
                )
              }
              className={
                member.isActive
                  ? undefined
                  : "border-emerald-200 text-emerald-800 hover:bg-emerald-50"
              }
            >
              {member.isActive ? "Pasifleştir" : "Etkinleştir"}
            </Button>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400">
            Kendi hesabınızı buradan kapatamazsınız
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            Roller
          </p>
          <RoleChecklist
            roles={roles}
            value={roleIds}
            onChange={setRoleIds}
            disabled={member.isSelf || pending}
          />
        </div>

        {changed ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => setRoleIds(member.roleIds)}
            >
              Vazgeç
            </Button>
            <Button
              size="sm"
              disabled={pending}
              onClick={() =>
                run(
                  () => setStaffRolesAction(member.id, roleIds),
                  "Roller güncellendi",
                )
              }
            >
              Kaydet
            </Button>
          </div>
        ) : null}
      </div>
    </li>
  );
}

function InviteStaffModal({
  isOpen,
  onClose,
  roles,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  roles: RoleOption[];
  onSuccess: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setEmail("");
    setFirstName("");
    setLastName("");
    setRoleIds([]);

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

  function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !firstName.trim()) return;

    startTransition(async () => {
      setError(null);
      const result = await inviteStaffAction({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        roleIds,
      });

      if (result.ok) {
        onSuccess();
        onClose();
      } else {
        setError(result.error ?? "Eklenemedi");
      }
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
    >
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px]"
      />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2
              id="staff-modal-title"
              className="text-[15px] font-semibold text-slate-900"
            >
              Personel davet et
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Parola belirleme bağlantısı e-posta ile gönderilir.
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

        <form onSubmit={invite} className="flex flex-col">
          <div className="space-y-4 px-5 py-5">
            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-800"
              >
                {error}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="staff-first"
                  className="text-[13px] font-medium text-slate-700"
                >
                  Ad <span className="text-red-500">*</span>
                </Label>
                <Input
                  autoFocus
                  id="staff-first"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Ahmet"
                  className="bg-white"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="staff-last"
                  className="text-[13px] font-medium text-slate-700"
                >
                  Soyad
                </Label>
                <Input
                  id="staff-last"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Yılmaz"
                  className="bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="staff-email"
                className="text-[13px] font-medium text-slate-700"
              >
                E-posta <span className="text-red-500">*</span>
              </Label>
              <Input
                id="staff-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ahmet@kaplantursu.com"
                className="bg-white"
              />
            </div>

            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
              <p className="mb-2 text-[12px] font-semibold text-slate-800">
                Başlangıç rolleri
              </p>
              <RoleChecklist
                roles={roles}
                value={roleIds}
                onChange={setRoleIds}
                disabled={pending}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-3.5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              disabled={pending || !email.trim() || !firstName.trim()}
            >
              {pending ? "Gönderiliyor…" : "Davet gönder"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function StaffManager({
  staff,
  roles,
}: {
  staff: StaffView[];
  roles: RoleOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

  const stats = useMemo(() => {
    const active = staff.filter((m) => m.isActive && m.hasPassword).length;
    const pendingInvite = staff.filter((m) => !m.hasPassword).length;
    const inactive = staff.filter((m) => !m.isActive).length;
    return {
      total: staff.length,
      active,
      pendingInvite,
      inactive,
    };
  }, [staff]);

  const filtered = useMemo(() => {
    return staff.filter((member) => {
      if (filterTab === "active" && !(member.isActive && member.hasPassword)) {
        return false;
      }
      if (filterTab === "pending" && member.hasPassword) return false;
      if (filterTab === "inactive" && member.isActive) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const roleMatch = roles.some(
        (role) =>
          member.roleIds.includes(role.id) &&
          role.name.toLowerCase().includes(q),
      );
      return (
        member.name.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q) ||
        roleMatch
      );
    });
  }, [staff, roles, filterTab, searchQuery]);

  function run(
    task: () => Promise<{ ok: boolean; error?: string }>,
    success: string,
  ) {
    startTransition(async () => {
      const result = await task();
      setMessage(
        result.ok
          ? { text: success, error: false }
          : { text: result.error ?? "İşlem tamamlanamadı", error: true },
      );
    });
  }

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "Tümü", count: stats.total },
    { id: "active", label: "Aktif", count: stats.active },
    { id: "pending", label: "Davet", count: stats.pendingInvite },
    { id: "inactive", label: "Pasif", count: stats.inactive },
  ];

  return (
    <div className="flex flex-col gap-5">
      <InviteStaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roles={roles}
        onSuccess={() => {
          setMessage({
            text: "Personel eklendi; parola belirleme bağlantısı e-posta ile gönderildi.",
            error: false,
          });
        }}
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {[
          { label: "Toplam", value: stats.total },
          { label: "Aktif", value: stats.active, hint: "Giriş yapabilir" },
          {
            label: "Davet bekliyor",
            value: stats.pendingInvite,
            hint: "Parola yok",
          },
          { label: "Pasif", value: stats.inactive, hint: "Erişim kapalı" },
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

      {message ? (
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
          <div className="flex flex-wrap gap-1 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1">
            {tabs.map((tab) => {
              const active = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className={cn(
                    "min-h-10 rounded-lg px-3 py-2 text-[12px] font-semibold transition sm:min-h-0 sm:py-1.5",
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
              placeholder="Ad, e-posta veya rol ara…"
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

        <Button type="button" onClick={() => setIsModalOpen(true)}>
          Personel davet et
        </Button>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-2xs">
        <header className="border-b border-slate-100 px-4 py-3.5">
          <h2 className="text-[13px] font-semibold text-slate-900">
            Panel kullanıcıları
          </h2>
          <p className="mt-0.5 text-[12px] text-slate-500">
            {filtered.length} / {staff.length} kişi listeleniyor
          </p>
        </header>

        {filtered.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {filtered.map((member) => (
              <StaffRow
                key={member.id}
                member={member}
                roles={roles}
                run={run}
                pending={pending}
              />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
            <p className="text-[14px] font-semibold text-slate-800">
              Personel bulunamadı
            </p>
            <p className="mt-1 max-w-sm text-[12px] text-slate-500">
              {searchQuery
                ? `“${searchQuery}” ile eşleşen kayıt yok.`
                : "Bu filtrede listelenecek personel yok."}
            </p>
            <Button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-4"
            >
              Personel davet et
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
