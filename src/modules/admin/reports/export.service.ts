import { toCsv } from "@/shared/csv";
import type { ExportRepository } from "./export.repository";

export class ExportService {
  constructor(private readonly exports: ExportRepository) {}

  /** Siparişleri satır bazında (her ürün bir satır) CSV olarak döndürür. */
  async ordersCsv(range: { from?: Date; to?: Date } = {}): Promise<string> {
    const lines = await this.exports.listOrderExportLines(range);

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
      lines.map((line) => [
        line.orderNumber,
        line.createdAt,
        line.status,
        line.paymentStatus,
        line.guestEmail,
        line.customerName,
        line.city,
        line.productName,
        line.variantName,
        line.sku,
        line.quantity,
        line.unitPrice,
        line.lineTotal,
        line.discountTotal,
        line.shippingTotal,
        line.grandTotal,
        line.couponCode,
      ]),
    );
  }

  /** Ürünleri varyant bazında CSV olarak döndürür (fiyat/stok kontrolü için). */
  async productsCsv(): Promise<string> {
    const lines = await this.exports.listProductExportLines();

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
      lines.map((line) => [
        line.productName,
        line.productStatus,
        line.categoryName,
        line.brandName,
        line.sku,
        line.barcode,
        line.optionLabel,
        line.price,
        line.compareAtPrice,
        line.taxRate,
        line.stockQuantity,
        line.reservedQuantity,
        line.isActive ? "Evet" : "Hayır",
      ]),
    );
  }
}
