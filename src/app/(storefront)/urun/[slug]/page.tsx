import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/storefront/breadcrumbs";
import { JsonLd } from "@/components/storefront/json-ld";
import { ProductGrid } from "@/components/storefront/product-grid";
import { ProductView } from "@/components/product/product-view";
import { JarIcon, LeafIcon, TruckIcon } from "@/components/storefront/icons";
import { isFeatureEnabled } from "@/config/features";
import { siteConfig } from "@/config/site.config";
import { formatMoney } from "@/shared/money";
import { getRequestPricing } from "@/modules/b2b/pricing-identity";
import { catalogService } from "@/modules/catalog/container";
import { loadProduct } from "@/modules/catalog/loaders";
import { TrackOnMount } from "@/shared/analytics/track-on-mount";
import { absoluteUrl } from "@/shared/site-url";

function plainText(value: string | null, max: number): string | undefined {
  if (!value) return undefined;
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export async function generateMetadata({
  params,
}: PageProps<"/urun/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const loaded = await loadProduct(slug);
  if (loaded.kind !== "ok") return {};

  const product = loaded.value;
  const description =
    product.seoDescription ?? plainText(product.description, 160);
  const image = product.images[0];

  return {
    title: product.seoTitle ?? product.name,
    description,
    alternates: { canonical: absoluteUrl(`/urun/${product.slug}`) },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      images: image
        ? [
            {
              url: image.url.startsWith("/")
                ? absoluteUrl(image.url)
                : image.url,
              alt: image.alt,
            },
          ]
        : undefined,
    },
  };
}

async function RelatedProducts({
  productId,
  categoryId,
}: {
  productId: string;
  categoryId: string;
}) {
  const related = await catalogService.getRelatedProducts(
    productId,
    categoryId,
    4,
    await getRequestPricing(),
  );
  if (related.length === 0) return null;

  return (
    <section className="flex flex-col gap-8 border-t border-border pt-14">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold tracking-[0.25em] text-brand-leaf uppercase">
          Bunları da sevebilirsiniz
        </span>
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Benzer ürünler
        </h2>
      </div>
      <ProductGrid products={related} />
    </section>
  );
}

function Highlights() {
  const items = [
    {
      icon: TruckIcon,
      text: `${formatMoney(siteConfig.shipping.freeShippingThreshold)} ve üzeri siparişlerde ücretsiz kargo`,
    },
    { icon: JarIcon, text: "Kavanozlar kırılmaya karşı tek tek paketlenir" },
    {
      icon: LeafIcon,
      text: `${siteConfig.returns.withdrawalPeriodDays} gün içinde iade hakkı`,
    },
  ];

  return (
    <ul className="flex flex-col gap-3 rounded-2xl bg-muted p-5">
      {items.map(({ icon: Icon, text }) => (
        <li key={text} className="flex items-center gap-3 text-sm">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-primary">
            <Icon width={18} height={18} />
          </span>
          {text}
        </li>
      ))}
    </ul>
  );
}

function ShippingInfo() {
  return (
    <div className="flex flex-col gap-2">
      <p>
        {formatMoney(siteConfig.shipping.freeShippingThreshold)} ve üzeri
        siparişlerde kargo ücretsizdir; altındaki siparişlerde{" "}
        {formatMoney(siteConfig.shipping.flatRate)} kargo ücreti uygulanır.
      </p>
      <p>
        Teslim aldığınız tarihten itibaren{" "}
        {siteConfig.returns.withdrawalPeriodDays} gün içinde iade talebi
        oluşturabilirsiniz. Gıda ürünlerinde ambalajı açılmış ürünler hijyen
        nedeniyle iade alınamaz; hasarlı ulaşan ürünler için bizimle iletişime
        geçin.
      </p>
    </div>
  );
}

async function ProductContent({
  params,
}: Pick<PageProps<"/urun/[slug]">, "params">) {
  const { slug } = await params;
  const loaded = await loadProduct(slug);

  if (loaded.kind === "redirect") permanentRedirect(loaded.to);
  if (loaded.kind === "missing") notFound();

  const product = loaded.value;
  const prices = product.variants.map((variant) => Number(variant.price));
  const lowPrice = Math.min(...prices);
  const highPrice = Math.max(...prices);
  const currency = product.variants[0]?.currency ?? "TRY";
  const anyInStock = product.variants.some((variant) => variant.inStock);
  const breadcrumbs = product.breadcrumbs;

  const crumbs = [
    { name: "Ana sayfa", href: "/" },
    ...breadcrumbs.map((crumb) => ({
      name: crumb.name,
      href: `/kategori/${crumb.slug}`,
    })),
    { name: product.name },
  ];

  const availability = anyInStock
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";

  return (
    <div className="flex flex-col gap-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: plainText(product.description, 500),
          sku: product.variants[0]?.sku,
          image: product.images.map((image) =>
            image.url.startsWith("http") ? image.url : absoluteUrl(image.url),
          ),
          brand: product.brand
            ? { "@type": "Brand", name: product.brand.name }
            : undefined,
          offers: !product.priceVisible
            ? undefined
            : product.variants.length > 1 && lowPrice !== highPrice
              ? {
                  "@type": "AggregateOffer",
                  priceCurrency: currency,
                  lowPrice: lowPrice.toFixed(2),
                  highPrice: highPrice.toFixed(2),
                  offerCount: product.variants.length,
                  availability,
                  url: absoluteUrl(`/urun/${product.slug}`),
                }
              : {
                  "@type": "Offer",
                  priceCurrency: currency,
                  price: lowPrice.toFixed(2),
                  availability,
                  url: absoluteUrl(`/urun/${product.slug}`),
                },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.name,
            item: absoluteUrl(`/kategori/${crumb.slug}`),
          })),
        }}
      />
      <TrackOnMount
        name="view_item"
        payload={{
          currency,
          value: lowPrice,
          item: {
            id: product.id,
            name: product.name,
            price: lowPrice,
            brand: product.brand?.name ?? null,
            category: breadcrumbs.at(-1)?.name ?? null,
          },
        }}
      />

      <Breadcrumbs items={crumbs} />
      <ProductView
        product={product}
        wishlistEnabled={isFeatureEnabled("wishlist")}
        highlights={<Highlights />}
        shippingInfo={<ShippingInfo />}
      />

      <Suspense fallback={null}>
        <RelatedProducts
          productId={product.id}
          categoryId={product.categoryId}
        />
      </Suspense>
    </div>
  );
}

export default function ProductPage({ params }: PageProps<"/urun/[slug]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Yükleniyor...</p>}>
      <ProductContent params={params} />
    </Suspense>
  );
}
