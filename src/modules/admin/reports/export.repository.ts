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

export interface OrderExportLine {
  orderNumber: string;
  createdAt: Date;
  status: string;
  paymentStatus: string;
  guestEmail: string;
  customerName: string;
  city: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  discountTotal: string;
  shippingTotal: string;
  grandTotal: string;
  couponCode: string;
}

export interface ProductExportLine {
  productName: string;
  productStatus: string;
  categoryName: string;
  brandName: string;
  taxRate: string;
  sku: string;
  barcode: string;
  optionLabel: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: number;
  reservedQuantity: number;
  isActive: boolean;
}

export interface ExportRepository {
  listOrderExportLines(range?: {
    from?: Date;
    to?: Date;
  }): Promise<OrderExportLine[]>;
  listProductExportLines(): Promise<ProductExportLine[]>;
}

export class D1ExportRepository implements ExportRepository {
  constructor(private readonly db: () => Db) {}

  async listOrderExportLines(
    range: { from?: Date; to?: Date } = {},
  ): Promise<OrderExportLine[]> {
    const orders = await this.db().query.order.findMany({
      where: and(
        range.from ? gte(orderTable.createdAt, range.from) : undefined,
        range.to ? lte(orderTable.createdAt, range.to) : undefined,
      ),
      orderBy: desc(orderTable.createdAt),
      limit: MAX_ROWS,
      with: { items: true },
    });

    const lines: OrderExportLine[] = [];
    for (const order of orders) {
      const address = (order.shippingAddress ?? {}) as Record<
        string,
        string | null
      >;
      for (const item of order.items) {
        lines.push({
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          status: order.status,
          paymentStatus: order.paymentStatus,
          guestEmail: order.guestEmail ?? "",
          customerName:
            `${address["firstName"] ?? ""} ${address["lastName"] ?? ""}`.trim(),
          city: address["city"] ?? "",
          productName: item.productName,
          variantName: item.variantName ?? "",
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          lineTotal: item.lineTotal.toFixed(2),
          discountTotal: order.discountTotal.toFixed(2),
          shippingTotal: order.shippingTotal.toFixed(2),
          grandTotal: order.grandTotal.toFixed(2),
          couponCode: order.couponCode ?? "",
        });
      }
    }
    return lines;
  }

  async listProductExportLines(): Promise<ProductExportLine[]> {
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

    return variants.map((variant) => ({
      productName: variant.productName,
      productStatus: variant.productStatus,
      categoryName: variant.categoryName,
      brandName: variant.brandName ?? "",
      taxRate: variant.taxRate.toFixed(2),
      sku: variant.sku,
      barcode: variant.barcode ?? "",
      optionLabel: variant.optionLabel ?? "",
      price: variant.price.toFixed(2),
      compareAtPrice: variant.compareAtPrice?.toFixed(2) ?? "",
      stockQuantity: variant.stockQuantity,
      reservedQuantity: variant.reservedQuantity,
      isActive: variant.isActive,
    }));
  }
}
