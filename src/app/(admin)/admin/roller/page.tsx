import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading } from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { getStaffService } from "@/modules/admin/container";
import { adminPage } from "@/modules/admin/guard";
import { PERMISSIONS } from "@/shared/permissions";
import { RoleManager } from "./role-manager";

export const metadata: Metadata = { title: "Roller ve Yetkiler" };

async function RolesContent() {
  const user = await adminPage(PERMISSIONS.ROLE_MANAGE);
  if (!user) return <AccessDenied />;

  const roles = await getStaffService().listRoles();
  return <RoleManager roles={roles} grantable={user.permissions} />;
}

export default function RolesPage() {
  return (
    <>
      <PageHeader
        title="Roller ve Yetkiler"
        description="Özel yetki profilleri oluşturun; yalnızca kendinizde bulunan yetkileri devredebilirsiniz. Sistem rolleri güvenlik gereği değiştirilemez."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/personel"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              <span>👥 Personel Yönetimi</span>
              <span className="text-slate-400">→</span>
            </Link>
          </div>
        }
      />
      <Suspense fallback={<AdminLoading label="Yetki rolleri yükleniyor..." />}>
        <RolesContent />
      </Suspense>
    </>
  );
}
