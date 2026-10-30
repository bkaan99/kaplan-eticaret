import type { Metadata } from "next";
import { Suspense } from "react";
import { FilterPanel } from "@/components/storefront/filter-panel";
import { Pagination } from "@/components/storefront/pagination";
import { ProductGrid } from "@/components/storefront/product-grid";
import { SortLinks } from "@/components/storefront/sort-links";
import { getRequestPricing } from "@/modules/b2b/pricing-identity";
import { catalogService } from "@/modules/catalog/container";
import { parseListQuery, toSearchString } from "@/modules/catalog/query-params";

export async function generateMetadata({
  searchParams,
}: PageProps<"/ara">): Promise<Metadata> {
  const query = parseListQuery(await searchParams);
  const isSearch = Boolean(query.search && query.search.trim().length > 0);
  return {
    title: isSearch ? `“${query.search}” Arama Sonuçları` : "Tüm Ürünler",
    robots: isSearch
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}

async function SearchContent({
  searchParams,
}: Pick<PageProps<"/ara">, "searchParams">) {
  const query = parseListQuery(await searchParams);
  const isSearch = Boolean(query.search && query.search.trim().length > 0);
  const result = await catalogService.list(query, await getRequestPricing());

  const title = isSearch
    ? `“${query.search}” için ${result.total} sonuç`
    : `Tüm Ürünler (${result.total} ürün)`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {!isSearch ? (
          <p className="text-sm text-muted-foreground">
            Geleneksel fermantasyon yöntemiyle hazırlanan tüm doğal turşularımız ve lezzetlerimiz.
          </p>
        ) : null}
      </div>
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside aria-label="Filtreler">
          <FilterPanel
            action="/ara"
            query={query}
            attributeFacets={result.attributeFacets}
            brandFacet={result.brandFacet}
          />
        </aside>
        <div className="flex flex-col gap-6">
          <SortLinks basePath="/ara" query={query} />
          {result.items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-muted-foreground">
                {isSearch
                  ? "Aradığınız kriterlere uygun ürün bulunamadı."
                  : "Henüz listelenecek ürün bulunmuyor."}
              </p>
            </div>
          ) : (
            <>
              <ProductGrid products={result.items} />
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                hrefFor={(page) => `/ara${toSearchString(query, { page })}`}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage({ searchParams }: PageProps<"/ara">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Yükleniyor...</p>}>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}
