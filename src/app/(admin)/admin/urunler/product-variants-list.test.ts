import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ProductVariantsList } from "./product-variants-list";
import type { VariantRow } from "./variant-rows";

const row = (patch: Partial<VariantRow>): VariantRow => ({
  id: "x",
  sku: "TURSU",
  barcode: "",
  price: "",
  compareAtPrice: "",
  stockQuantity: "0",
  isActive: true,
  optionValues: {},
  ...patch,
});

function render(
  variants: VariantRow[],
  axis: string | null,
  extra: Record<string, unknown> = {},
) {
  const form = {
    options: axis ? [{ name: axis, values: "3 kg, 5 kg" }] : [],
    variants,
    updateVariant: vi.fn(),
    variantEditor: {
      addRow: vi.fn(),
      setRowValue: vi.fn(),
      renameAxis: vi.fn(),
      removeRow: vi.fn(),
      enableAxis: vi.fn(),
      disableAxis: vi.fn(),
      canDisableAxis: false,
    },
    variantIssues: {},
    fieldErrors: {},
    trackInventory: true,
    ...extra,
  };
  return renderToStaticMarkup(createElement(ProductVariantsList, { form }));
}

describe("ProductVariantsList", () => {
  const sized = [
    row({
      id: "a",
      sku: "TURSU-3KG",
      price: "249.90",
      compareAtPrice: "299.90",
      stockQuantity: "10",
      optionValues: { Boyut: "3 kg" },
    }),
    row({
      id: "b",
      sku: "TURSU-5KG",
      price: "379.90",
      stockQuantity: "4",
      optionValues: { Boyut: "5 kg" },
    }),
  ];

  it("her varyant için ayrı fiyat, eski fiyat ve stok alanı çizer", () => {
    const html = render(sized, "Boyut");
    expect(html).toContain("Varyant 1");
    expect(html).toContain("Varyant 2");
    expect(html.match(/Fiyat \(₺\)/g)).toHaveLength(2);
    expect(html.match(/Eski fiyat \(₺\)/g)).toHaveLength(2);
    expect(html).toContain('value="249.90"');
    expect(html).toContain('value="379.90"');
    expect(html).toContain('value="3 kg"');
    expect(html).toContain('value="5 kg"');
  });

  it("eski fiyat doluysa indirim yüzdesini gösterir", () => {
    const html = render(sized, "Boyut");
    expect(html).toContain("%17 indirim");
  });

  it("hızlı ekle düğmelerinde var olan boyutu işaretler", () => {
    const html = render(sized, "Boyut");
    expect(html).toContain("✓ 3 kg");
    expect(html).toContain("+ 10 kg");
  });

  it("pasif varyantı belirgin gösterir ve yeniden satışa alma sunar", () => {
    const html = render(
      [sized[0]!, { ...sized[1]!, isActive: false }],
      "Boyut",
    );
    expect(html).toContain("Satışta değil");
    expect(html).toContain("Yeniden satışa al");
  });

  it("tek aktif varyantın kaldırma düğmesini kapatır", () => {
    const html = render([sized[0]!], "Boyut");
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Satıştan kaldır<\/button>/);
  });

  it("tek fiyatlı üründe tek alan seti ve boyut ekleme düğmesi gösterir", () => {
    const html = render(
      [row({ id: "v", price: "249.90", stockQuantity: "7" })],
      null,
    );
    expect(html).toContain("Fiyat ve stok");
    expect(html.match(/Fiyat \(₺\)/g)).toHaveLength(1);
    expect(html).toContain("+ Boyut / varyant ekle");
    expect(html).not.toContain("Varyant 1");
  });

  it("istemci doğrulama hatasını ilgili alanın altında gösterir", () => {
    const html = render(sized, "Boyut", {
      variantIssues: {
        1: { price: "Fiyat girin", value: "Ad yazın (örn. 3 kg)" },
      },
    });
    expect(html).toContain("Fiyat girin");
    expect(html).toContain("Ad yazın (örn. 3 kg)");
  });

  it("sunucudan dönen alan hatasını gösterir", () => {
    const html = render(sized, "Boyut", {
      fieldErrors: { "variants.0.sku": "SKU tekrar ediyor" },
    });
    expect(html).toContain("SKU tekrar ediyor");
  });
});
