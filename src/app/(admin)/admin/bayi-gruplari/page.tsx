import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading } from "@/components/admin/admin-list";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { features } from "@/config/features";
import { getPriceListService } from "@/modules/admin/container";
import { adminPage } from "@/modules/admin/guard";
import { PERMISSIONS } from "@/shared/permissions";
import { GroupManager } from "./group-manager";
import { VariantPriceRow } from "./variant-price-row";

export const metadata: Metadata = { title: "Bayi grupları ve fiyatlar" };

async function GroupsContent({
  searchParams,
}: Pick<PageProps<"/admin/bayi-gruplari">, "searchParams">) {
  const user = await adminPage(PERMISSIONS.PROMOTION_MANAGE);
  if (!user) return <AccessDenied />;

  const params = await searchParams;
  const service = getPriceListService();
  const groups = await service.listGroups();

  const selectedId =
    typeof params["grup"] === "string" &&
    groups.some((g) => g.id === params["grup"])
      ? params["grup"]
      : (groups[0]?.id ?? null);
  const search = typeof params["q"] === "string" ? params["q"] : "";

  const selected = groups.find((group) => group.id === selectedId) ?? null;
  const rows = selected
    ? await service.searchVariants(selected.id, search)
    : [];

  return (
    <div className="flex flex-col gap-8">
      <GroupManager
        groups={groups.map((group) => ({
          id: group.id,
          name: group.name,
          discountPercent: group.discountPercent,
          customerCount: group.customerCount,
        }))}
        selectedId={selectedId}
      />

      {selected ? (
        <Card>
          <CardHeader>
            <CardTitle>
              Fiyat listesi: {selected.name}
              {selected.discountPercent
                ? ` (genel iskonto %${Number(selected.discountPercent)})`
                : ""}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Boş bırakılan grup fiyatı için grubun iskontosu (yoksa liste
              fiyatı) uygulanır. Kademeler <code>adet:fiyat</code> biçimindedir
              (örn. 10:90, 50:75); adet kademesi daha düşükse en düşük fiyat
              geçerli olur.
            </p>
            <form
              action="/admin/bayi-gruplari"
              className="flex w-full flex-col gap-2 sm:flex-row sm:items-center"
            >
              <input type="hidden" name="grup" value={selected.id} />
              <Input
                name="q"
                defaultValue={search}
                placeholder="Ürün adı veya SKU"
                className="w-full sm:max-w-xs"
                aria-label="Ürün ara"
              />
              <Button type="submit" variant="outline" className="w-full sm:w-auto">
                Ara
              </Button>
            </form>

            <ul className="flex flex-col gap-3 md:hidden">
              {rows.map((row) => (
                <VariantPriceRow
                  key={`m-${selected.id}-${row.variantId}`}
                  groupId={selected.id}
                  row={row}
                  layout="card"
                />
              ))}
              {rows.length === 0 ? (
                <li className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-muted-foreground">
                  Ürün bulunamadı.
                </li>
              ) : null}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-left text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Ürün</th>
                    <th className="px-3 py-2">Liste</th>
                    <th className="px-3 py-2">Grup fiyatı</th>
                    <th className="px-3 py-2">Adet kademeleri</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => (
                    <VariantPriceRow
                      key={`${selected.id}-${row.variantId}`}
                      groupId={selected.id}
                      row={row}
                    />
                  ))}
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-6 text-center text-muted-foreground"
                      >
                        Ürün bulunamadı.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export default function AdminGroupsPage({
  searchParams,
}: PageProps<"/admin/bayi-gruplari">) {
  if (!features.b2b) notFound();

  return (
    <>
      <PageHeader
        title="Bayi grupları ve fiyatlar"
        description="Gruba özel fiyat, yüzde iskonto ve adet kademeli fiyatları yönetin."
      />
      <Suspense
        fallback={<AdminLoading />}
      >
        <GroupsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
