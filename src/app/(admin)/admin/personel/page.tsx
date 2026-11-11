import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading } from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { getStaffService } from "@/modules/admin/container";
import { adminPage } from "@/modules/admin/guard";
import { PERMISSIONS } from "@/shared/permissions";
import { StaffManager } from "./staff-manager";

export const metadata: Metadata = { title: "Personel" };

async function StaffContent() {
  const user = await adminPage(PERMISSIONS.ROLE_MANAGE);
  if (!user) return <AccessDenied />;

  const service = getStaffService();
  const [staff, roles] = await Promise.all([
    service.listStaff(),
    service.listRoles(),
  ]);

  return (
    <StaffManager
      staff={staff.map((member) => ({
        id: member.id,
        email: member.email,
        name: member.name,
        isActive: member.isActive,
        hasPassword: member.hasPassword,
        roleIds: member.roles.map((role) => role.id),
        isSelf: member.id === user.id,
      }))}
      roles={roles.map((role) => ({ id: role.id, name: role.name }))}
    />
  );
}

export default function StaffPage() {
  return (
    <>
      <PageHeader
        title="Personel"
        description="Yönetim paneline erişecek kişileri davet edin, rollerini atayın ve hesap durumunu yönetin."
        actions={
          <Link
            href="/admin/roller"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
          >
            Roller ve yetkiler
            <span className="text-slate-400">→</span>
          </Link>
        }
      />
      <Suspense fallback={<AdminLoading label="Personel yükleniyor..." />}>
        <StaffContent />
      </Suspense>
    </>
  );
}
