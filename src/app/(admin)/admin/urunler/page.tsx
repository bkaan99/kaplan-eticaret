import { AdminSearchIcon } from "@/components/admin/search-icon";
import { isOneOf } from "@/shared/guards";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import {
  AdminEmpty,
  AdminLoading,
  AdminPagination,
  AdminPanel,
} from "@/components/admin/admin-list";
import { CsvDownloadLink } from "@/components/admin/csv-download-link";
import { formatAdminDate } from "@/components/admin/order-status";
import { PageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { siteConfig } from "@/config/site.config";
import { getProductAdminService } from "@/modules/admin/container";
import type { ProductListRow } from "@/modules/admin/catalog/product-admin.repository";
import { adminPage } from "@/modules/admin/guard";
import { cn } from "@/shared/cn";
import { formatMoney } from "@/shared/money";
import { PERMISSIONS } from "@/shared/permissions";
import { NewProductButton } from "./new-product-button";

export const metadata: Metadata = { title: "Ürünler" };

const PAGE_SIZE = 25;
type ProductStatus = ProductListRow["status"];
const STATUS_ORDER: ProductStatus[] = ["ACTIVE", "DRAFT", "ARCHIVED"];
const STATUS: Record<
  ProductStatus,
  { label: string; pill: string; dot: string }
> = {
  ACTIVE: {
    label: "Yayında",
    pill: "bg-emerald-50 text-emerald-800 ring-emerald-200/70",
    dot: "bg-emerald-500",
  },
  DRAFT: {
    label: "Taslak",
    pill: "bg-amber-50 text-amber-800 ring-amber-200/70",
    dot: "bg-amber-500",
  },
  ARCHIVED: {
    label: "Arşiv",
    pill: "bg-slate-100 text-slate-600 ring-slate-200",
    dot: "bg-slate-400",
  },
};

const integer = new Intl.NumberFormat("tr-TR");

const isStatus = (value: string | undefined): value is ProductStatus =>
  isOneOf(STATUS_ORDER, value);

function StatusBadge({ status }: { status: ProductStatus }) {
  const style = STATUS[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 ring-inset",
        style.pill,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {style.label}
    </span>
  );
}

/**
 * Stok rozeti. Eşik panodaki kritik stok uyarısıyla aynıdır
 * (siteConfig.inventory.lowStockThreshold); takip yoksa adet gösterilmez.
 */
function StockBadge({ product }: { product: ProductListRow }) {
  if (!product.trackInventory) {
    return <span className="text-[12px] text-slate-400">Takip yok</span>;
  }
  const threshold = siteConfig.inventory.lowStockThreshold;
  const stock = product.totalStock;
  const tone =
    stock === 0
      ? "bg-rose-50 text-rose-700 ring-rose-200/70"
      : stock <= threshold
        ? "bg-amber-50 text-amber-800 ring-amber-200/70"
        : "bg-slate-50 text-slate-700 ring-slate-200/80";
  return (
    <span className="flex flex-col items-start gap-0.5">
      <span
        className={cn(
          "inline-flex items-center rounded-md px-1.5 py-0.5 text-[12px] font-semibold whitespace-nowrap tabular-nums ring-1 ring-inset",
          tone,
        )}
      >
        {stock === 0 ? "Tükendi" : `${integer.format(stock)} adet`}
      </span>
      {stock > 0 && product.outOfStockVariants > 0 ? (
        <span className="text-[11px] text-rose-600">
          {product.outOfStockVariants} varyant tükendi
        </span>
      ) : stock > 0 && stock <= threshold ? (
        <span className="text-[11px] text-amber-700">Az kaldı</span>
      ) : null}
    </span>
  );
}

/** Mobil kartta tek satırlık stok özeti. */
function MobileStock({ product }: { product: ProductListRow }) {
  if (!product.trackInventory) return <>stok takibi yok</>;
  const stock = product.totalStock;
  if (stock === 0)
    return <span className="font-medium text-rose-600">Tükendi</span>;
  if (stock <= siteConfig.inventory.lowStockThreshold) {
    return (
      <span className="font-medium text-amber-700">{stock} adet kaldı</span>
    );
  }
  return <>{integer.format(stock)} adet</>;
}

function PriceCell({ product }: { product: ProductListRow }) {
  if (!product.minPrice) return <span className="text-slate-400">—</span>;
  return (
    <span className="flex flex-col items-end">
      {product.hasPriceRange ? (
        <span className="text-[10px] font-medium text-slate-400">
          başlangıç
        </span>
      ) : null}
      <span className="font-semibold text-slate-900 tabular-nums">
        {formatMoney(product.minPrice)}
      </span>
    </span>
  );
}

function Thumb({ src, size }: { src: string | null; size: 40 | 44 }) {
  return (
    <span
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-900/5",
        size === 44 ? "h-11 w-11" : "h-10 w-10",
      )}
    >
      <Image
        src={src ?? "/placeholder.svg"}
        alt=""
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
    </span>
  );
}

async function ProductsContent({
  searchParams,
}: Pick<PageProps<"/admin/urunler">, "searchParams">) {
  const user = await adminPage(PERMISSIONS.PRODUCT_READ);
  if (!user) return <AccessDenied />;

  const canWrite = user.permissions.includes(PERMISSIONS.PRODUCT_WRITE);
  const service = getProductAdminService();

  const params = await searchParams;
  const search = typeof params["q"] === "string" ? params["q"].trim() : "";
  const rawStatus =
    typeof params["durum"] === "string" ? params["durum"] : undefined;
  const status = isStatus(rawStatus) ? rawStatus : undefined;
  const rawCategory =
    typeof params["kategori"] === "string" ? params["kategori"] : "";
  const page = Math.max(1, Number(params["sayfa"]) || 1);

  const references = await service.references();
  const categoryId = references.categories.some((c) => c.id === rawCategory)
    ? rawCategory
    : undefined;

  const [result, counts] = await Promise.all([
    service.list({ search, status, categoryId, page, pageSize: PAGE_SIZE }),
    service.statusCounts({ search, categoryId }),
  ]);
  const allCount = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);

  const hrefWith = (next: { status?: ProductStatus; page?: number }) => {
    const query = new URLSearchParams();
    if (next.status) query.set("durum", next.status);
    if (search) query.set("q", search);
    if (categoryId) query.set("kategori", categoryId);
    if (next.page && next.page > 1) query.set("sayfa", String(next.page));
    const text = query.toString();
    return `/admin/urunler${text ? `?${text}` : ""}`;
  };

  const tabs: { key: ProductStatus | "ALL"; label: string; count: number }[] = [
    { key: "ALL", label: "Tümü", count: allCount },
    ...STATUS_ORDER.map((value) => ({
      key: value,
      label: STATUS[value].label,
      count: counts[value] ?? 0,
    })),
  ];
  const filtered = Boolean(search || categoryId);
  const first = result.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, result.total);
  const emptyTitle = search
    ? `“${search}” için ürün bulunamadı`
    : status
      ? `“${STATUS[status].label}” durumunda ürün yok`
      : categoryId
        ? "Bu kategoride ürün yok"
        : "Henüz ürün eklenmemiş";
  const emptyText =
    filtered || status
      ? "Aramayı, kategoriyi veya durum sekmesini değiştirerek tekrar deneyin."
      : "İlk ürününüzü ekleyerek kataloğu oluşturun.";

  return (
    <>
      <PageHeader
        title="Ürünler"
        description="Katalog, fiyat, stok ve yayın durumunu yönetin."
        actions={
          <>
            <CsvDownloadLink href="/admin/disa-aktar/urunler" />
            {canWrite ? (
              <Link
                href="/admin/urunler/ice-aktar"
                className={buttonVariants({ variant: "outline" })}
              >
                İçe aktar
              </Link>
            ) : null}
            {canWrite ? <NewProductButton references={references} /> : null}
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <AdminPanel>
          {/* Yayın durumu sekmeleri */}
          <nav
            aria-label="Yayın durumu"
            className="flex gap-1 overflow-x-auto border-b border-slate-100 px-2 pt-2 [scrollbar-width:none]"
          >
            {tabs.map((tab) => {
              const active = (status ?? "ALL") === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={hrefWith({
                    status: tab.key === "ALL" ? undefined : tab.key,
                  })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 pt-1.5 pb-2.5 text-[13px] font-medium whitespace-nowrap transition-colors",
                    active
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-slate-500 hover:text-slate-800",
                  )}
                >
                  {tab.key !== "ALL" ? (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        STATUS[tab.key].dot,
                      )}
                    />
                  ) : null}
                  {tab.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-[11px] font-semibold tabular-nums",
                      active
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-500",
                    )}
                  >
                    {integer.format(tab.count)}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Arama + kategori */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <form
              action="/admin/urunler"
              role="search"
              className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap"
            >
              {status ? (
                <input type="hidden" name="durum" value={status} />
              ) : null}
              <label className="relative min-w-0 flex-1 basis-56 lg:w-80 lg:flex-none">
                <span className="sr-only">Ürün ara</span>
                <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-slate-400">
                  <AdminSearchIcon />
                </span>
                <input
                  name="q"
                  type="search"
                  defaultValue={search}
                  placeholder="Ürün adı veya SKU ara"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-8 text-[13px] text-slate-900 outline-none placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </label>
              <label className="min-w-0 flex-1 basis-40 lg:w-52 lg:flex-none">
                <span className="sr-only">Kategori</span>
                <select
                  name="kategori"
                  defaultValue={categoryId ?? ""}
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] text-slate-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  <option value="">Tüm kategoriler</option>
                  {references.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="h-9 rounded-lg bg-slate-900 px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-slate-800"
              >
                Filtrele
              </button>
              {filtered ? (
                <Link
                  href={hrefWith({ status })}
                  className="h-9 content-center px-1 text-[12px] font-medium text-slate-500 hover:text-slate-900"
                >
                  Temizle
                </Link>
              ) : null}
            </form>
            <p className="text-[12px] text-slate-500 tabular-nums">
              {result.total === 0
                ? "Sonuç yok"
                : `${integer.format(result.total)} üründen ${first}–${last} arası`}
            </p>
          </div>

          {/* Mobil: kart listesi */}
          <ul className="divide-y divide-slate-100 border-t border-slate-100 md:hidden">
            {result.items.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/admin/urunler/${product.id}`}
                  className="flex items-center gap-3 px-4 py-3 active:bg-slate-50"
                >
                  <Thumb src={product.imageUrl} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-medium text-slate-900">
                        {product.name}
                      </span>
                      <span className="shrink-0 text-[13px] font-semibold text-slate-900 tabular-nums">
                        {product.minPrice ? formatMoney(product.minPrice) : "—"}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] text-slate-400">
                        {product.categoryName} ·{" "}
                        <MobileStock product={product} />
                      </span>
                      <StatusBadge status={product.status} />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
            {result.items.length === 0 ? (
              <li>
                <AdminEmpty title={emptyTitle} description={emptyText} />
              </li>
            ) : null}
          </ul>

          {/* Masaüstü: tablo */}
          <div className="hidden border-t border-slate-100 md:block">
            <Table>
              <THead>
                <tr>
                  <TH className="pl-4">Ürün</TH>
                  <TH>Kategori</TH>
                  <TH>Durum</TH>
                  <TH>Stok</TH>
                  <TH className="text-right">Fiyat</TH>
                  <TH className="hidden text-right lg:table-cell">
                    Güncellendi
                  </TH>
                  <TH className="w-8 pr-4">
                    <span className="sr-only">Düzenle</span>
                  </TH>
                </tr>
              </THead>
              <TBody>
                {result.items.map((product) => (
                  <TR key={product.id} className="group relative">
                    <TD className="py-2.5 pl-4">
                      <div className="flex items-center gap-3">
                        <Thumb src={product.imageUrl} size={40} />
                        <div className="min-w-0">
                          {/* Satırın tamamını tıklanabilir yapan bağlantı */}
                          <Link
                            href={`/admin/urunler/${product.id}`}
                            className="block max-w-[22rem] truncate font-medium text-slate-900 after:absolute after:inset-0 after:content-[''] group-hover:text-primary"
                          >
                            {product.name}
                          </Link>
                          <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                            {product.sku ? (
                              <span className="font-mono">{product.sku}</span>
                            ) : null}
                            {product.variantCount > 1
                              ? ` · ${product.variantCount} varyant`
                              : ""}
                          </span>
                        </div>
                      </div>
                    </TD>
                    <TD className="py-2.5 text-slate-600">
                      {product.categoryName}
                    </TD>
                    <TD className="py-2.5">
                      <StatusBadge status={product.status} />
                    </TD>
                    <TD className="py-2.5">
                      <StockBadge product={product} />
                    </TD>
                    <TD className="py-2.5 text-right">
                      <PriceCell product={product} />
                    </TD>
                    <TD className="hidden py-2.5 text-right text-[12px] whitespace-nowrap text-slate-400 lg:table-cell">
                      {formatAdminDate(product.updatedAt)}
                    </TD>
                    <TD className="py-2.5 pr-4 text-slate-300 group-hover:text-slate-500">
                      <svg
                        viewBox="0 0 24 24"
                        width={15}
                        height={15}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </TD>
                  </TR>
                ))}
                {result.items.length === 0 ? (
                  <tr>
                    <TD colSpan={7} className="p-0">
                      <AdminEmpty title={emptyTitle} description={emptyText} />
                    </TD>
                  </tr>
                ) : null}
              </TBody>
            </Table>
          </div>
        </AdminPanel>

        <AdminPagination
          page={page}
          totalPages={result.totalPages}
          hrefFor={(target) => hrefWith({ status, page: target })}
        />
      </div>
    </>
  );
}

export default function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/urunler">) {
  return (
    <Suspense fallback={<AdminLoading label="Ürünler yükleniyor…" />}>
      <ProductsContent searchParams={searchParams} />
    </Suspense>
  );
}
