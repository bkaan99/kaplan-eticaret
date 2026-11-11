import { PERMISSIONS, type Permission } from "@/shared/permissions";

export type AdminNavGroup = "overview" | "sales" | "catalog" | "people" | "system";

export interface AdminNavItem {
  href: string;
  label: string;
  group: AdminNavGroup;
  /** Menüde görünmesi için gereken yetki; boşsa her personel görür */
  permission?: Permission;
  /** Yalnızca B2B özelliği açıkken görünür */
  requiresB2b?: boolean;
}

export const ADMIN_NAV_GROUP_LABELS: Record<AdminNavGroup, string> = {
  overview: "Genel",
  sales: "Satış",
  catalog: "Katalog",
  people: "Kişiler",
  system: "Sistem",
};

export const ADMIN_NAV: readonly AdminNavItem[] = [
  { href: "/admin", label: "Pano", group: "overview" },
  {
    href: "/admin/siparisler",
    label: "Siparişler",
    group: "sales",
    permission: PERMISSIONS.ORDER_READ,
  },
  {
    href: "/admin/iadeler",
    label: "İade talepleri",
    group: "sales",
    permission: PERMISSIONS.RETURN_MANAGE,
  },
  {
    href: "/admin/kuponlar",
    label: "Kupon ve kampanyalar",
    group: "sales",
    permission: PERMISSIONS.PROMOTION_MANAGE,
  },
  {
    href: "/admin/urunler",
    label: "Ürünler",
    group: "catalog",
    permission: PERMISSIONS.PRODUCT_READ,
  },
  {
    href: "/admin/tursu-malzemeleri",
    label: "Kendi turşunu yap",
    group: "catalog",
    permission: PERMISSIONS.PRODUCT_WRITE,
  },
  {
    href: "/admin/kategoriler",
    label: "Kategoriler",
    group: "catalog",
    permission: PERMISSIONS.CATALOG_MANAGE,
  },
  {
    href: "/admin/nitelikler",
    label: "Nitelikler",
    group: "catalog",
    permission: PERMISSIONS.CATALOG_MANAGE,
  },
  {
    href: "/admin/icerik",
    label: "İçerik",
    group: "catalog",
    permission: PERMISSIONS.CONTENT_MANAGE,
  },
  {
    href: "/admin/musteriler",
    label: "Müşteriler",
    group: "people",
    permission: PERMISSIONS.CUSTOMER_READ,
  },
  {
    href: "/admin/bayiler",
    label: "Bayiler",
    group: "people",
    permission: PERMISSIONS.B2B_APPROVE,
    requiresB2b: true,
  },
  {
    href: "/admin/bayi-gruplari",
    label: "Bayi grupları ve fiyatlar",
    group: "people",
    permission: PERMISSIONS.PROMOTION_MANAGE,
    requiresB2b: true,
  },
  {
    href: "/admin/personel",
    label: "Personel",
    group: "people",
    permission: PERMISSIONS.ROLE_MANAGE,
  },
  {
    href: "/admin/roller",
    label: "Roller ve yetkiler",
    group: "people",
    permission: PERMISSIONS.ROLE_MANAGE,
  },
  {
    href: "/admin/odeme",
    label: "Ödeme Ayarları",
    group: "system",
    permission: PERMISSIONS.SETTING_MANAGE,
  },
  {
    href: "/admin/ayarlar",
    label: "Site Ayarları",
    group: "system",
    permission: PERMISSIONS.SETTING_MANAGE,
  },
  {
    href: "/admin/denetim",
    label: "Denetim günlüğü",
    group: "system",
    permission: PERMISSIONS.AUDIT_VIEW,
  },
];

export const ADMIN_NAV_GROUP_ORDER: readonly AdminNavGroup[] = [
  "overview",
  "sales",
  "catalog",
  "people",
  "system",
];

/** Kullanıcının yetkilerine göre görünen menü öğeleri. */
export function visibleNav(
  permissions: readonly string[],
  options: { b2bEnabled?: boolean } = {},
): AdminNavItem[] {
  return ADMIN_NAV.filter(
    (item) =>
      (!item.permission || permissions.includes(item.permission)) &&
      (!item.requiresB2b || options.b2bEnabled === true),
  );
}
