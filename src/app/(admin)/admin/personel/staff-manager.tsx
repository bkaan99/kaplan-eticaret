"use client";

import { useEffect, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {roles.map((role) => (
        <label
          key={role.id}
          className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none"
        >
          <input
            type="checkbox"
            disabled={disabled}
            checked={value.includes(role.id)}
            onChange={(event) =>
              onChange(
                event.target.checked
                  ? [...value, role.id]
                  : value.filter((id) => id !== role.id),
              )
            }
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span>{role.name}</span>
        </label>
      ))}
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

  return (
    <li className="flex flex-col gap-3 py-4 text-sm transition hover:bg-slate-50/50 px-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 shadow-2xs">
            👤
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">{member.name}</span>
              {member.isSelf ? <Badge tone="neutral">Siz</Badge> : null}
              {!member.isActive ? <Badge tone="warning">Pasif</Badge> : null}
              {!member.hasPassword ? (
                <Badge tone="warning">Davet bekliyor</Badge>
              ) : null}
            </div>
            <span className="text-[11px] text-slate-500">{member.email}</span>
          </div>
        </div>

        {!member.isSelf ? (
          <div className="flex items-center gap-1.5">
            {!member.hasPassword ? (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  run(() => resendInviteAction(member.id), "Davet gönderildi")
                }
                className="h-7.5 px-2.5 text-xs text-slate-700 hover:bg-slate-50 cursor-pointer"
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
              className={`h-7.5 px-2.5 text-xs font-semibold cursor-pointer ${
                member.isActive
                  ? "text-slate-600 hover:bg-slate-100"
                  : "text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              }`}
            >
              {member.isActive ? "Pasifleştir" : "Etkinleştir"}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Roller:
          </span>
          <RoleChecklist
            roles={roles}
            value={roleIds}
            onChange={setRoleIds}
            disabled={member.isSelf || pending}
          />
        </div>

        {changed ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              run(
                () => setStaffRolesAction(member.id, roleIds),
                "Roller güncellendi",
              )
            }
            className="h-7 px-3 text-xs bg-emerald-700 font-bold text-white hover:bg-emerald-800 cursor-pointer"
          >
            Değişiklikleri Kaydet
          </Button>
        ) : null}
      </div>
    </li>
  );
}

interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: RoleOption[];
  onSuccess: () => void;
}

function InviteStaffModal({
  isOpen,
  onClose,
  roles,
  onSuccess,
}: InviteStaffModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
      />

      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 bg-linear-to-r from-slate-50 to-emerald-50/30 px-6 py-4.5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-lg shadow-2xs">
              👥
            </span>
            <div>
              <h2
                id="staff-modal-title"
                className="text-base font-bold text-slate-900"
              >
                Yeni Personel Ekle
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Yönetim paneline yeni bir personel veya yetkili davet edin
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

        <form onSubmit={invite} className="flex flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-800 flex items-center gap-2"
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="staff-first" className="text-xs font-bold text-slate-700">
                  Ad *
                </Label>
                <Input
                  autoFocus
                  id="staff-first"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Örn: Ahmet"
                  className="h-10 text-xs font-semibold bg-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="staff-last" className="text-xs font-bold text-slate-700">
                  Soyad
                </Label>
                <Input
                  id="staff-last"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Örn: Yılmaz"
                  className="h-10 text-xs font-semibold bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="staff-email" className="text-xs font-bold text-slate-700">
                E-posta Adresi *
              </Label>
              <Input
                id="staff-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ahmet@kaplangurme.com"
                className="h-10 text-xs font-semibold bg-white"
              />
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Yetki Rolleri
              </span>
              <RoleChecklist
                roles={roles}
                value={roleIds}
                onChange={setRoleIds}
                disabled={pending}
              />
            </div>

            <p className="text-xs text-slate-500 italic">
              * Kişiye parola belirleme ve aktivasyon bağlantısı e-posta ile otomatik olarak gönderilecektir.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
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
              type="submit"
              disabled={pending || !email.trim() || !firstName.trim()}
              className="h-10 bg-emerald-700 px-6 text-xs font-bold text-white shadow-md hover:bg-emerald-800 disabled:opacity-60 cursor-pointer"
            >
              {pending ? (
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Davet Ediliyor...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>✉️</span>
                  <span>Davet Gönder</span>
                </div>
              )}
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
  const [message, setMessage] = useState<{
    text: string;
    error: boolean;
  } | null>(null);

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

  return (
    <div className="flex flex-col gap-6">
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

      {message && (
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

      {/* Personel Listesi - Tam Genişlik */}
      <Card className="overflow-hidden border-slate-200/80 shadow-xs">
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Personel ve Yetkililer
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Yönetim paneline erişimi olan çalışanlar ve yetki rolleri ({staff.length} kayıtlı)
            </p>
          </div>

          <Button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="h-9 bg-emerald-700 px-4 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 cursor-pointer"
          >
            + Personel Ekle
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <ul className="divide-y divide-slate-100">
            {staff.map((member) => (
              <StaffRow
                key={`${member.id}-${member.roleIds.join(",")}`}
                member={member}
                roles={roles}
                run={run}
                pending={pending}
              />
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
