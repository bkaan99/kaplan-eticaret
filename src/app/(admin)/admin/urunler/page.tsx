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
  AdminToolbar,
} from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { Price } from "@/components/storefront/price";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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

  const [result, references] = await Promise.all([
    service.list({
      search,
      status: isStatus(rawStatus) ? rawStatus : undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    canWrite ? service.references() : Promise.resolve(null),
  ]);

  const queryFor = (target: number) => {
    const query = new URLSearchParams();
    if (search) query.set("q", search);
    if (isStatus(rawStatus)) query.set("durum", rawStatus);
    if (target > 1) query.set("sayfa", String(target));
    const text = query.toString();
    return `/admin/urunler${text ? `?${text}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Ürünler"
        description="Katalog, stok ve yayın durumunu yönetin."
        actions={
          <>
            <a
              href="/admin/disa-aktar/urunler"
              className={cn(buttonVariants({ variant: "outline" }))}
              download
            >
              CSV indir
            </a>
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
        <AdminToolbar>
          <form
            action="/admin/urunler"
            className="flex flex-1 flex-wrap items-end gap-2.5"
          >
            <label className="flex min-w-[12rem] flex-1 flex-col gap-1.5 text-xs font-semibold text-slate-600">
              Ara
              <Input
                name="q"
                defaultValue={search}
                placeholder="Ürün adı veya SKU"
                aria-label="Ara"
              />
            </label>
            <label className="flex w-40 flex-col gap-1.5 text-xs font-semibold text-slate-600">
              Durum
              <Select
                name="durum"
                defaultValue={rawStatus ?? ""}
                aria-label="Durum"
              >
                <option value="">Tüm durumlar</option>
                <option value="ACTIVE">Yayında</option>
                <option value="DRAFT">Taslak</option>
                <option value="ARCHIVED">Arşiv</option>
              </Select>
            </label>
            <Button type="submit" variant="outline">
              Filtrele
            </Button>
          </form>
        </AdminToolbar>

        <AdminMeta>{result.total} ürün</AdminMeta>

        <AdminPanel>
          <Table>
            <THead>
              <tr>
                <TH>Ürün</TH>
                <TH>Kategori</TH>
                <TH>Durum</TH>
                <TH>Varyant</TH>
                <TH>Stok</TH>
                <TH className="text-right">Fiyat</TH>
              </tr>
            </THead>
            <TBody>
              {result.items.map((product) => (
                <TR key={product.id}>
                  <TD>
                    <Link
                      href={`/admin/urunler/${product.id}`}
                      className="flex items-center gap-3"
                    >
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/80">
                        <Image
                          src={product.imageUrl ?? "/placeholder.svg"}
                          alt=""
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      </span>
                      <span className="font-semibold text-slate-900 hover:text-primary">
                        {product.name}
                      </span>
                    </Link>
                  </TD>
                  <TD className="text-slate-600">{product.categoryName}</TD>
                  <TD>
                    <Badge tone={TONES[product.status]}>
                      {STATUS_LABELS[product.status]}
                    </Badge>
                  </TD>
                  <TD>{product.variantCount}</TD>
                  <TD>
                    <span
                      className={cn(
                        "font-semibold",
                        product.totalStock === 0
                          ? "text-rose-600"
                          : product.totalStock < 10
                            ? "text-amber-700"
                            : "text-slate-800",
                      )}
                    >
                      {product.totalStock}
                    </span>
                  </TD>
                  <TD className="text-right font-semibold text-slate-900">
                    {product.minPrice ? <Price value={product.minPrice} /> : "–"}
                  </TD>
                </TR>
              ))}
              {result.items.length === 0 ? (
                <TR>
                  <TD colSpan={6} className="p-0">
                    <AdminEmpty
                      title="Ürün bulunamadı"
                      description="Yeni ürün ekleyin veya arama filtresini temizleyin."
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
          hrefFor={queryFor}
        />
      </div>
    </>
  );
}

export default function AdminProductsPage({
  searchParams,
}: PageProps<"/admin/urunler">) {
  return (
    <Suspense fallback={<AdminLoading label="Ürünler yükleniyor..." />}>
      <ProductsContent searchParams={searchParams} />
    </Suspense>
  );
}
