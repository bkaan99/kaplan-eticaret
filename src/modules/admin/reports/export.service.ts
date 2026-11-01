import { toCsv } from "@/shared/csv";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import {
  brand,
  category,
  order as orderTable,
  product,
  productVariant,
  type Db,
} from "@/db";

const MAX_ROWS = 20_000;

export class ExportService {
  constructor(private readonly db: () => Db) {}

  /** Siparişleri satır bazında (her ürün bir satır) CSV olarak döndürür. */
  async ordersCsv(range: { from?: Date; to?: Date } = {}): Promise<string> {
    const orders = await this.db().query.order.findMany({
      where: and(
        range.from ? gte(orderTable.createdAt, range.from) : undefined,
        range.to ? lte(orderTable.createdAt, range.to) : undefined,
      ),
      orderBy: desc(orderTable.createdAt),
      limit: MAX_ROWS,
      with: { items: true },
    });

    const rows: unknown[][] = [];
    for (const order of orders) {
      const address = (order.shippingAddress ?? {}) as Record<
        string,
        string | null
      >;
      for (const item of order.items) {
        rows.push([
          order.orderNumber,
          order.createdAt,
          order.status,
          order.paymentStatus,
          order.guestEmail ?? "",
          `${address["firstName"] ?? ""} ${address["lastName"] ?? ""}`.trim(),
          address["city"] ?? "",
          item.productName,
          item.variantName ?? "",
          item.sku,
          item.quantity,
          item.unitPrice.toFixed(2),
          item.lineTotal.toFixed(2),
          order.discountTotal.toFixed(2),
          order.shippingTotal.toFixed(2),
          order.grandTotal.toFixed(2),
          order.couponCode ?? "",
        ]);
      }
    }

    return toCsv(
      [
        "Sipariş no",
        "Tarih",
        "Durum",
        "Ödeme durumu",
        "E-posta",
        "Müşteri",
        "İl",
        "Ürün",
        "Varyant",
        "SKU",
        "Adet",
        "Birim fiyat",
        "Satır tutarı",
        "İndirim",
        "Kargo",
        "Sipariş toplamı",
        "Kupon",
      ],
      rows,
    );
  }

  /** Ürünleri varyant bazında CSV olarak döndürür (fiyat/stok kontrolü için). */
  async productsCsv(): Promise<string> {
    const variants = await this.db()
      .select({
        productName: product.name,
        productStatus: product.status,
        categoryName: category.name,
        brandName: brand.name,
        taxRate: product.taxRate,
        sku: productVariant.sku,
        barcode: productVariant.barcode,
        price: productVariant.price,
        compareAtPrice: productVariant.compareAtPrice,
        stockQuantity: productVariant.stockQuantity,
        reservedQuantity: productVariant.reservedQuantity,
        isActive: productVariant.isActive,
        optionLabel: sql<string | null>`(
          SELECT group_concat("ProductOptionValue"."value", ' / ')
          FROM "VariantOptionValue"
          INNER JOIN "ProductOptionValue" ON "ProductOptionValue"."id" = "VariantOptionValue"."optionValueId"
          WHERE "VariantOptionValue"."variantId" = ${productVariant.id}
        )`,
      })
      .from(productVariant)
      .innerJoin(product, eq(product.id, productVariant.productId))
      .innerJoin(category, eq(category.id, product.categoryId))
      .leftJoin(brand, eq(brand.id, product.brandId))
      .orderBy(asc(product.name), asc(productVariant.sku))
      .limit(MAX_ROWS);

    return toCsv(
      [
        "Ürün",
        "Durum",
        "Kategori",
        "Marka",
        "SKU",
        "Barkod",
        "Seçenekler",
        "Fiyat",
        "Eski fiyat",
        "KDV %",
        "Stok",
        "Rezerve",
        "Aktif",
      ],
      variants.map((variant) => [
        variant.productName,
        variant.productStatus,
        variant.categoryName,
        variant.brandName ?? "",
        variant.sku,
        variant.barcode ?? "",
        variant.optionLabel ?? "",
        variant.price.toFixed(2),
        variant.compareAtPrice?.toFixed(2) ?? "",
        variant.taxRate.toFixed(2),
        variant.stockQuantity,
        variant.reservedQuantity,
        variant.isActive ? "Evet" : "Hayır",
      ]),
    );
  }
}
