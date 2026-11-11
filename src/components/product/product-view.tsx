import type { ReactNode } from "react";
import type { ProductDetail } from "@/modules/catalog/catalog.types";
import { ProductAccordions } from "./product-accordions";
import { ProductInteractive } from "./product-interactive";

/** PDP iskeleti: başlık + akordeon RSC; galeri/satın alma client ada. */
export function ProductView({
  product,
  wishlistEnabled,
  highlights,
  shippingInfo,
}: {
  product: ProductDetail;
  wishlistEnabled: boolean;
  /** Sepet butonunun altında gösterilen güven maddeleri */
  highlights?: ReactNode;
  /** "Kargo ve iade" bölümünün içeriği */
  shippingInfo?: ReactNode;
}) {
  return (
    <ProductInteractive
      product={product}
      wishlistEnabled={wishlistEnabled}
      highlights={highlights}
      title={
        <div className="flex flex-col gap-3">
          <h1 className="font-display text-4xl leading-tight font-semibold tracking-tight text-slate-900 sm:text-5xl">
            {product.name}
          </h1>
          {product.attributes.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {product.attributes.flatMap((attribute) =>
                attribute.values.map((value) => (
                  <li
                    key={`${attribute.name}-${value}`}
                    className="rounded-full border border-primary/15 bg-white px-3 py-1 text-xs font-medium text-primary"
                  >
                    {value}
                  </li>
                )),
              )}
            </ul>
          ) : null}
        </div>
      }
      footer={
        <ProductAccordions product={product} shippingInfo={shippingInfo} />
      }
    />
  );
}
