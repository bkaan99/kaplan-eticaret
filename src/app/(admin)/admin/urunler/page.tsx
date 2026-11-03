import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import {
  AdminEmpty,
  AdminLoading,
  AdminMeta,
  AdminPagination,
  AdminPanel,
  AdminTabs,
  AdminToolbar,
} from "@/components/admin/admin-list";
import { CsvDownloadLink } from "@/components/admin/csv-download-link";
import { PageHeader } from "@/components/admin/page-header";
import { Price } from "@/components/storefront/price";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getProductAdminService } from "@/modules/admin/container";
import { adminPage } from "@/modules/admin/guard";
import { cn } from "@/shared/cn";
import { PERMISSIONS } from "@/shared/permissions";
import { NewProductButton } from "./new-product-button";

export const metadata: Metadata = { title: "Ürünler" };

const PAGE_SIZE = 25;
const STATUS_LABELS = {
  DRAFT: "Taslak",
  ACTIVE: "Yayında",
  ARCHIVED: "Arşiv",
} as const;
const TONES = {
  DRAFT: "warning",
  ACTIVE: "success",
  ARCHIVED: "neutral",
} as const;

function isStatus(
  value: string | undefined,
): value is keyof typeof STATUS_LABELS {
  return value === "DRAFT" || value === "ACTIVE" || value === "ARCHIVED";
}

function stockTone(stock: number): string {
  if (stock === 0) return "bg-rose-50 text-rose-700 ring-rose-200/80";
  if (stock < 10) return "bg-amber-50 text-amber-800 ring-amber-200/80";
  return "bg-emerald-50 text-emerald-800 ring-emerald-200/80";
}

function stockLabel(stock: number): string {
  if (stock === 0) return "Tükendi";
  if (stock < 10) return `Düşük · ${stock}`;
  return String(stock);
}

async function ProductsContent({
  searchParams,
}: Pick<PageProps<"/admin/urunler">, "searchParams">) {
  const user = await adminPage(PERMISSIONS.PRODUCT_READ);
  if (!user) return <AccessDenied />;

  const canWrite = user.permissions.includes(PERMISSIONS.PRODUCT_WRITE);
  const service = getProductAdminService();

  const params = await searchParams;
  const search = typeof params["q"] === "string" ? params["q"] : "";
  const rawStatus =
    typeof params["durum"] === "string" ? params["durum"] : undefined;
  const page = Math.max(1, Number(params["sayfa"]) || 1);
  const activeStatus = isStatus(rawStatus) ? rawStatus : "";

  const [result, references] = await Promise.all([
    service.list({
      search,
      status: isStatus(rawStatus) ? rawStatus : undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    canWrite ? service.references() : Promise.resolve(null),
  ]);

  const buildHref = (opts: {
    q?: string;
    durum?: string;
    sayfa?: number;
  }) => {
    const query = new URLSearchParams();
    const q = opts.q ?? search;
    const durum = opts.durum === undefined ? activeStatus : opts.durum;
    const sayfa = opts.sayfa ?? 1;
    if (q) query.set("q", q);
    if (durum) query.set("durum", durum);
    if (sayfa > 1) query.set("sayfa", String(sayfa));
    const text = query.toString();
    return `/admin/urunler${text ? `?${text}` : ""}`;
  };

  const statusTabs = [
    { value: "", label: "Tümü", href: buildHref({ durum: "", sayfa: 1 }) },
    {
      value: "ACTIVE",
      label: "Yayında",
      href: buildHref({ durum: "ACTIVE", sayfa: 1 }),
    },
    {
      value: "DRAFT",
      label: "Taslak",
      href: buildHref({ durum: "DRAFT", sayfa: 1 }),
    },
    {
      value: "ARCHIVED",
      label: "Arşiv",
      href: buildHref({ durum: "ARCHIVED", sayfa: 1 }),
    },
  ];

  return (
    <>
      <PageHeader
        title="Ürünler"
        description="Katalog, stok ve yayın durumunu yönetin."
        actions={
          <>
            <CsvDownloadLink href="/admin/disa-aktar/urunler" />
            {canWrite ? (
              <Link
                href="/admin/urunler/ice-aktar"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                İçe aktar
              </Link>
            ) : null}
            {references ? <NewProductButton references={references} /> : null}
          </>
        }
      />

      <div className="flex flex-col gap-4">
        <AdminTabs items={statusTabs} active={activeStatus} />

        <AdminToolbar className="items-center gap-3 p-3 sm:p-3.5">
          <form
            action="/admin/urunler"
            className="flex flex-1 flex-wrap items-center gap-2.5"
          >
            {activeStatus ? (
              <input type="hidden" name="durum" value={activeStatus} />
            ) : null}
            <label className="relative min-w-[14rem] flex-1">
              <span className="sr-only">Ara</span>
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400">
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </span>
              <Input
                name="q"
                defaultValue={search}
                placeholder="Ürün adı veya SKU ara…"
                aria-label="Ara"
                className="border-slate-200/90 bg-slate-50/80 pl-9 focus:bg-white"
              />
            </label>
            <Button type="submit" variant="outline">
              Ara
            </Button>
            {search || activeStatus ? (
              <Link
                href="/admin/urunler"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "text-slate-500",
                )}
              >
                Temizle
              </Link>
            ) : null}
          </form>
        </AdminToolbar>

        <div className="flex items-center justify-between gap-3">
          <AdminMeta>
            <span className="font-semibold text-slate-800">{result.total}</span>{" "}
            ürün
            {activeStatus ? (
              <span className="text-slate-400">
                {" "}
                · {STATUS_LABELS[activeStatus as keyof typeof STATUS_LABELS]}
              </span>
            ) : null}
            {search ? (
              <span className="text-slate-400"> · “{search}”</span>
            ) : null}
          </AdminMeta>
        </div>

        <AdminPanel>
          <Table>
            <THead>
              <tr>
                <TH className="w-[42%]">Ürün</TH>
                <TH>Kategori</TH>
                <TH>Durum</TH>
                <TH className="text-center">Varyant</TH>
                <TH>Stok</TH>
                <TH className="text-right">Fiyat</TH>
                <TH className="hidden text-right lg:table-cell">Güncellendi</TH>
              </tr>
            </THead>
            <TBody>
              {result.items.map((product) => (
                <TR key={product.id} className="group">
                  <TD>
                    <Link
                      href={`/admin/urunler/${product.id}`}
                      className="flex items-center gap-3.5"
                    >
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#f3f4ef] ring-1 ring-slate-900/10 transition group-hover:ring-primary/25">
                        <Image
                          src={product.imageUrl ?? "/placeholder.svg"}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-slate-900 transition group-hover:text-primary">
                          {product.name}
                        </span>
                        <span className="mt-0.5 block truncate font-mono text-[11px] text-slate-400">
                          /{product.slug}
                        </span>
                      </span>
                    </Link>
                  </TD>
                  <TD>
                    <span className="text-sm text-slate-600">
                      {product.categoryName}
                    </span>
                  </TD>
                  <TD>
                    <Badge tone={TONES[product.status]}>
                      {STATUS_LABELS[product.status]}
                    </Badge>
                  </TD>
                  <TD className="text-center tabular-nums text-slate-600">
                    {product.variantCount}
                  </TD>
                  <TD>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                        stockTone(product.totalStock),
                      )}
                    >
                      {stockLabel(product.totalStock)}
                    </span>
                  </TD>
                  <TD className="text-right">
                    {product.minPrice ? (
                      <Price value={product.minPrice} />
                    ) : (
                      <span className="text-slate-400">–</span>
                    )}
                  </TD>
                  <TD className="hidden text-right text-xs text-slate-400 lg:table-cell">
                    {product.updatedAt.toLocaleDateString("tr-TR")}
                  </TD>
                </TR>
              ))}
              {result.items.length === 0 ? (
                <TR>
                  <TD colSpan={7} className="p-0">
                    <AdminEmpty
                      title="Ürün bulunamadı"
                      description={
                        search || activeStatus
                          ? "Arama veya filtreyi temizleyip tekrar deneyin."
                          : "İlk ürününüzü ekleyerek kataloğu oluşturun."
                      }
                    />
                  </TD>
                </TR>
              ) : null}
            </TBody>
          </Table>
        </AdminPanel>

        <AdminPagination
          page={page}
          totalPages={result.totalPages}
          hrefFor={(target) => buildHref({ sayfa: target })}
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
