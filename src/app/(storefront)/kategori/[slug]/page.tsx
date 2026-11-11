import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/storefront/breadcrumbs";
import { FilterPanel } from "@/components/storefront/filter-panel";
import { JsonLd } from "@/components/storefront/json-ld";
import { MobileFilterDrawer } from "@/components/storefront/mobile-filter-drawer";
import { Pagination } from "@/components/storefront/pagination";
import { ProductGrid } from "@/components/storefront/product-grid";
import { SortLinks } from "@/components/storefront/sort-links";
import { getRequestPricing } from "@/modules/b2b/pricing-identity";
import { catalogService } from "@/modules/catalog/container";
import { loadCategory } from "@/modules/catalog/loaders";
import type {
  CategoryBreadcrumb,
  CategoryNode,
} from "@/modules/catalog/catalog.types";
import { parseListQuery, toSearchString } from "@/modules/catalog/query-params";
import { absoluteUrl } from "@/shared/site-url";

export async function generateMetadata({
  params,
  searchParams,
}: PageProps<"/kategori/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadCategory(slug);
  if (loaded.kind === "redirect") permanentRedirect(loaded.to);
  if (loaded.kind === "missing") notFound();

  const { category } = loaded.value;
  const query = parseListQuery(await searchParams, { categorySlug: slug });
  const hasFilters = Boolean(
    (query.sort && query.sort !== "newest") ||
    (query.brandSlugs && query.brandSlugs.length > 0) ||
    (query.attributeFilters && Object.keys(query.attributeFilters).length > 0) ||
    query.minPrice !== undefined ||
    query.maxPrice !== undefined,
  );

  const page = query.page ?? 1;
  // Sayfalama otoritesini bölmemek için canonical her zaman 1. sayfa.
  const canonicalPath = `/kategori/${category.slug}`;

  const baseTitle = category.seoTitle ?? category.name;
  const title = page > 1 ? `${baseTitle} - Sayfa ${page}` : baseTitle;

  const description =
    category.seoDescription ??
    category.description ??
    `${category.name} kategorisindeki ürünleri keşfedin.`;

  const categoryImageUrl = category.imageUrl
    ? category.imageUrl.startsWith("http")
      ? category.imageUrl
      : absoluteUrl(category.imageUrl)
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(canonicalPath) },
    robots: hasFilters || page > 1
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      type: "website",
      images: categoryImageUrl
        ? [
            {
              url: categoryImageUrl,
              alt: category.name,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: categoryImageUrl ? [categoryImageUrl] : undefined,
    },
  };
}

async function CategoryContent({
  category,
  breadcrumbs,
  searchParams,
}: {
  category: CategoryNode;
  breadcrumbs: CategoryBreadcrumb[];
  searchParams: PageProps<"/kategori/[slug]">["searchParams"];
}) {
  const query = parseListQuery(await searchParams, {
    categorySlug: category.slug,
  });
  const result = await catalogService.list(query, await getRequestPricing());
  const basePath = `/kategori/${category.slug}`;
  const hasFilters = Boolean(
    (query.sort && query.sort !== "newest") ||
      (query.brandSlugs && query.brandSlugs.length > 0) ||
      (query.attributeFilters &&
        Object.keys(query.attributeFilters).length > 0) ||
      query.minPrice !== undefined ||
      query.maxPrice !== undefined,
  );
  const page = query.page ?? 1;
  const showItemList =
    !hasFilters && page === 1 && result.items.length > 0;

  const crumbs = [
    { name: "Ana sayfa", href: "/" },
    ...breadcrumbs.map((crumb, index) => ({
      name: crumb.name,
      href:
        index === breadcrumbs.length - 1
          ? undefined
          : `/kategori/${crumb.slug}`,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Ana Sayfa",
              item: absoluteUrl("/"),
            },
            ...breadcrumbs.map((crumb, index) => ({
              "@type": "ListItem",
              position: index + 2,
              name: crumb.name,
              item: absoluteUrl(`/kategori/${crumb.slug}`),
            })),
          ],
        }}
      />
      {showItemList ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: category.name,
            numberOfItems: result.total,
            itemListElement: result.items.map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absoluteUrl(`/urun/${item.slug}`),
              name: item.name,
            })),
          }}
        />
      ) : null}
      <Breadcrumbs items={crumbs} />
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{category.name}</h1>
        {category.description ? (
          <p className="text-muted-foreground">{category.description}</p>
        ) : null}
      </header>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block" aria-label="Filtreler">
          <FilterPanel
            action={basePath}
            query={query}
            attributeFacets={result.attributeFacets}
            brandFacet={result.brandFacet}
          />
        </aside>
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <MobileFilterDrawer>
                <FilterPanel
                  action={basePath}
                  query={query}
                  attributeFacets={result.attributeFacets}
                  brandFacet={result.brandFacet}
                />
              </MobileFilterDrawer>
              <p className="text-sm text-muted-foreground">
                {result.total} ürün
              </p>
            </div>
            <SortLinks basePath={basePath} query={query} />
          </div>
          <ProductGrid products={result.items} />
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            hrefFor={(page) => `${basePath}${toSearchString(query, { page })}`}
          />
        </div>
      </div>
    </div>
  );
}

export default async function CategoryPage({
  params,
  searchParams,
}: PageProps<"/kategori/[slug]">) {
  // Suspense dışında çözülür ki HTTP durumu hâlâ 404/301 yapılabilsin.
  const { slug } = await params;
  const loaded = await loadCategory(slug);
  if (loaded.kind === "redirect") permanentRedirect(loaded.to);
  if (loaded.kind === "missing") notFound();

  return (
    <Suspense fallback={<p className="text-muted-foreground">Yükleniyor...</p>}>
      <CategoryContent
        category={loaded.value.category}
        breadcrumbs={loaded.value.breadcrumbs}
        searchParams={searchParams}
      />
    </Suspense>
  );
}
