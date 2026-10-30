"use client";

import type { ReactNode } from "react";
import type { ProductDetail } from "@/modules/catalog/catalog.types";

export function InfoSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group border-b border-border py-1 [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-display text-lg font-semibold">
        <h2>{title}</h2>
        <span
          aria-hidden="true"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-primary transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="pb-5 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  );
}

export function ProductAccordions({
  product,
  shippingInfo,
}: {
  product: ProductDetail;
  shippingInfo?: ReactNode;
}) {
  return (
    <div className="border-t border-border">
      {product.description ? (
        <InfoSection title="Ürün açıklaması" defaultOpen>
          <p className="whitespace-pre-line">{product.description}</p>
        </InfoSection>
      ) : null}

      {product.attributes.length > 0 ? (
        <InfoSection title="Özellikler">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
            {product.attributes.map((attribute) => (
              <div key={attribute.name} className="contents">
                <dt>{attribute.name}</dt>
                <dd className="font-medium text-foreground">
                  {attribute.values.join(", ")}
                </dd>
              </div>
            ))}
          </dl>
        </InfoSection>
      ) : null}

      <InfoSection title="Saklama ve tüketim">
        <p>
          Açılmamış ürünü serin, kuru ve güneş görmeyen bir yerde saklayın.
          Açıldıktan sonra buzdolabında muhafaza edin; turşularda ürünün
          salamura suyunun içinde kalmasına dikkat edin ve servis ederken temiz,
          kuru bir çatal kullanın.
        </p>
      </InfoSection>

      {shippingInfo ? (
        <InfoSection title="Kargo ve iade">{shippingInfo}</InfoSection>
      ) : null}
    </div>
  );
}
