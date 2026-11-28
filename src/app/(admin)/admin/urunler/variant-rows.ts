/**
 * Ürün varyantları için sade düzenleyicinin saf mantığı (React'ten bağımsız).
 *
 * Model: ürünün en fazla bir seçenek ekseni vardır (örn. "Boyut") ve her varyant
 * satırı o eksenin bir değeridir ("3 kg", "5 kg"); her satırın kendi fiyatı, eski
 * fiyatı, stoğu ve SKU'su vardır. Eksen yoksa ürünün tek bir varsayılan varyantı vardır.
 * Seçenek listesi (`options`) satırlardaki değerlerden türetilir, ayrı tutulmaz.
 */

export interface OptionRow {
  name: string;
  values: string;
}

export interface VariantRow {
  id?: string;
  sku: string;
  barcode: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: string;
  isActive: boolean;
  optionValues: Record<string, string>;
}

export interface VariantState {
  options: OptionRow[];
  variants: VariantRow[];
}

export const DEFAULT_AXIS_NAME = "Boyut";

/** Sık kullanılan boyutlar (hızlı ekleme düğmeleri). */
export const QUICK_SIZES = ["500 g", "1 kg", "2 kg", "3 kg", "5 kg", "10 kg"];

const clean = (value: string) => value.trim();
const sameValue = (a: string, b: string) =>
  clean(a).toLocaleLowerCase("tr-TR") === clean(b).toLocaleLowerCase("tr-TR");

/** Ürün adı/slug'ından SKU öneki. */
export function baseSkuFrom(slug: string, name: string): string {
  return (slug || name || "URUN")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .slice(0, 24);
}

/** Bir varyant değeri için önerilen SKU ("URUN-3KG"). */
export function skuForValue(baseSku: string, value: string): string {
  const suffix = clean(value)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");
  return suffix ? `${baseSku}-${suffix}` : baseSku;
}

/** Tek eksenli ürünün ekseni; yoksa null. */
export function axisOf(options: readonly OptionRow[]): string | null {
  return options.length === 1 ? options[0]!.name : null;
}

/** Satırlardaki değerlerden seçenek listesini üretir (tekrarsız, sıralı). */
export function optionsFromRows(
  axis: string,
  variants: readonly VariantRow[],
): OptionRow[] {
  const values: string[] = [];
  for (const variant of variants) {
    const value = clean(variant.optionValues[axis] ?? "");
    if (value && !values.some((existing) => sameValue(existing, value))) {
      values.push(value);
    }
  }
  return [{ name: axis, values: values.join(", ") }];
}

function withOptions(
  state: VariantState,
  variants: VariantRow[],
): VariantState {
  const axis = axisOf(state.options);
  return {
    variants,
    options: axis ? optionsFromRows(axis, variants) : state.options,
  };
}

/** SKU'yu sistem üretmişse (kullanıcı elle değiştirmemişse) true. */
function skuIsAuto(row: VariantRow, baseSku: string, value: string): boolean {
  return !row.id && (row.sku === "" || row.sku === skuForValue(baseSku, value));
}

/**
 * Tek fiyattan boyut/seçenek varyantlarına geçer: mevcut varsayılan varyant ilk
 * satır olur (değeri boş, kullanıcı yazar) ve ikinci boş satır eklenir.
 */
export function enableAxis(
  state: VariantState,
  baseSku: string,
  axisName = DEFAULT_AXIS_NAME,
): VariantState {
  if (axisOf(state.options)) return state;
  const [first, ...rest] = state.variants;
  const firstRow: VariantRow = first
    ? { ...first, optionValues: { [axisName]: "" } }
    : emptyRow(baseSku, axisName, "");
  const rows = [
    firstRow,
    ...rest.map((row) => ({
      ...row,
      optionValues: { [axisName]: row.optionValues[axisName] ?? "" },
    })),
  ];
  if (rows.length < 2) rows.push(emptyRow(baseSku, axisName, ""));
  return { options: optionsFromRows(axisName, rows), variants: rows };
}

function emptyRow(baseSku: string, axis: string, value: string): VariantRow {
  return {
    sku: skuForValue(baseSku, value),
    barcode: "",
    price: "",
    compareAtPrice: "",
    stockQuantity: "0",
    isActive: true,
    optionValues: { [axis]: value },
  };
}

/** Yeni boş (veya adı verilmiş) varyant satırı ekler. */
export function addRow(
  state: VariantState,
  baseSku: string,
  value = "",
): VariantState {
  const axis = axisOf(state.options);
  if (!axis) return enableAxis(state, baseSku);
  if (
    value &&
    state.variants.some((row) => sameValue(row.optionValues[axis] ?? "", value))
  ) {
    return state;
  }
  return withOptions(state, [
    ...state.variants,
    emptyRow(baseSku, axis, value),
  ]);
}

/** Bir satırın değerini (örn. "3 kg") değiştirir; sistem üretimi SKU de güncellenir. */
export function setRowValue(
  state: VariantState,
  baseSku: string,
  index: number,
  value: string,
): VariantState {
  const axis = axisOf(state.options);
  if (!axis) return state;
  const variants = state.variants.map((row, i) => {
    if (i !== index) return row;
    const previous = row.optionValues[axis] ?? "";
    const sku = skuIsAuto(row, baseSku, previous)
      ? skuForValue(baseSku, value)
      : row.sku;
    return {
      ...row,
      sku,
      optionValues: { ...row.optionValues, [axis]: value },
    };
  });
  return withOptions(state, variants);
}

/** Eksenin adını ("Boyut" → "Ağırlık") değiştirir; tüm satırlar yeni adla yeniden anahtarlanır. */
export function renameAxis(state: VariantState, newName: string): VariantState {
  const axis = axisOf(state.options);
  if (!axis || axis === newName) return state;
  const variants = state.variants.map((row) => ({
    ...row,
    optionValues: { [newName]: row.optionValues[axis] ?? "" },
  }));
  return { variants, options: optionsFromRows(newName, variants) };
}

/**
 * Satırı kaldırır. Kayıtlı varyant silinmez (sipariş geçmişi korunur), satıştan
 * kaldırılır (pasifleşir); henüz kaydedilmemiş satır tamamen çıkarılır.
 */
export function removeRow(state: VariantState, index: number): VariantState {
  const row = state.variants[index];
  if (!row) return state;
  if (row.id) {
    return withOptions(
      state,
      state.variants.map((item, i) =>
        i === index ? { ...item, isActive: false } : item,
      ),
    );
  }
  return withOptions(
    state,
    state.variants.filter((_, i) => i !== index),
  );
}

/** Tek satır kaldıysa boyut eksenini kaldırıp tek fiyatlı ürüne döner. */
export function canDisableAxis(state: VariantState): boolean {
  return (
    axisOf(state.options) !== null &&
    state.variants.filter((row) => row.isActive).length <= 1 &&
    state.variants.length === 1
  );
}

export function disableAxis(state: VariantState): VariantState {
  if (!canDisableAxis(state)) return state;
  return {
    options: [],
    variants: state.variants.map((row) => ({ ...row, optionValues: {} })),
  };
}

/** Aktif satır sayısı (kaldırılamayacak son satırı korumak için). */
export function activeCount(variants: readonly VariantRow[]): number {
  return variants.filter((row) => row.isActive).length;
}

const MONEY = /^\d+([.,]\d{1,2})?$/;

export interface RowIssues {
  value?: string;
  price?: string;
  compareAtPrice?: string;
  stockQuantity?: string;
}

/** Kaydetmeden önce satır bazında istemci doğrulaması; sorunsuzsa boş nesne. */
export function validateRows(state: VariantState): Record<number, RowIssues> {
  const axis = axisOf(state.options);
  const issues: Record<number, RowIssues> = {};
  const add = (index: number, patch: RowIssues) => {
    issues[index] = { ...issues[index], ...patch };
  };

  state.variants.forEach((row, index) => {
    if (axis) {
      const value = clean(row.optionValues[axis] ?? "");
      if (!value) add(index, { value: "Ad yazın (örn. 3 kg)" });
      else if (
        state.variants.some(
          (other, j) =>
            j < index && sameValue(other.optionValues[axis] ?? "", value),
        )
      ) {
        add(index, { value: "Bu ad zaten var" });
      }
    }
    if (!MONEY.test(clean(row.price))) {
      add(index, { price: "Fiyat girin" });
    }
    const compare = clean(row.compareAtPrice);
    if (compare && !MONEY.test(compare)) {
      add(index, { compareAtPrice: "Geçerli tutar girin" });
    }
    const stock = clean(row.stockQuantity);
    if (!/^\d+$/.test(stock)) {
      add(index, { stockQuantity: "Tam sayı girin" });
    }
  });
  return issues;
}
