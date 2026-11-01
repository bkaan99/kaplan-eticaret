import { and, eq } from "drizzle-orm";
import { SYSTEM_ROLES } from "../src/shared/permissions";
import { slugify } from "../src/shared/slug";
import {
  attribute,
  attributeValue,
  brand,
  category,
  customerGroup,
  dec,
  newId,
  page,
  pickleIngredient,
  product,
  productAttributeValue,
  productImage,
  productOption,
  productOptionValue,
  productVariant,
  role,
  rolePermission,
  runBatch,
  variantOptionValue,
  type Db,
} from "../src/db";
import { LEGAL_PAGE_TEMPLATES } from "./legal-pages";

/** Tekrar çalıştırılabilir (idempotent) başlangıç verisi: roller, demo katalog, malzemeler, yasal sayfalar. */
export async function runSeed(db: Db): Promise<void> {
  await seedRoles(db);
  await seedCustomerGroups(db);
  await seedDemoCatalog(db);
  await seedCustomPickle(db);
  await seedLegalPages(db);
}

async function seedRoles(db: Db): Promise<void> {
  for (const systemRole of SYSTEM_ROLES) {
    await db
      .insert(role)
      .values({ name: systemRole.name, description: systemRole.description, isSystem: true })
      .onConflictDoUpdate({ target: role.name, set: { description: systemRole.description } });
    const [saved] = await db.select({ id: role.id }).from(role).where(eq(role.name, systemRole.name));

    await runBatch(db, [
      db.delete(rolePermission).where(eq(rolePermission.roleId, saved!.id)),
      ...systemRole.permissions.map((permission) =>
        db.insert(rolePermission).values({ roleId: saved!.id, permission }),
      ),
    ]);
  }
}

async function seedCustomerGroups(db: Db): Promise<void> {
  const groups = [
    { name: "Bayi", slug: "bayi", discountPercent: 20 },
    { name: "Toptan", slug: "toptan", discountPercent: 30 },
  ];

  for (const group of groups) {
    await db
      .insert(customerGroup)
      .values({ name: group.name, slug: group.slug, discountPercent: dec(group.discountPercent) })
      .onConflictDoNothing({ target: customerGroup.slug });
  }
}

interface DemoProduct {
  name: string;
  slug: string;
  category: string;
  brand: string;
  description: string;
  basePrice: number;
  featured?: boolean;
  spice?: string;
  method?: string;
  /** Tek seçenek ekseni (ör. Boyut) ve değerlere göre fiyat */
  option?: { name: string; prices: Record<string, number> };
  compareAtPrice?: number;
}

const DEMO_CATEGORIES = [
  { name: "Klasik Turşular", slug: "klasik-tursular", parent: null },
  { name: "Acılı Turşular", slug: "acili-tursular", parent: null },
  { name: "Şalgam & Turşu Suyu", slug: "salgam-ve-tursu-suyu", parent: null },
  { name: "Hediye Kutuları", slug: "hediye-kutulari", parent: null },
] as const;

const DEMO_BRANDS = ["Kaplan"];

const DEMO_ATTRIBUTES = [
  { name: "Acılık", slug: "acilik", values: ["Acısız", "Orta acı", "Acılı"] },
  { name: "Yapım", slug: "yapim", values: ["Doğal fermente", "Sirkeli"] },
];

const JAR_SIZES = (small: number, large: number) => ({
  name: "Boyut",
  prices: { "500 g": small, "1 kg": large },
});

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    name: "Ev Usulü Salatalık Turşusu",
    slug: "ev-usulu-salatalik-tursusu",
    category: "klasik-tursular",
    brand: "Kaplan",
    description:
      "Taze salatalıklar taş tuzu, sarımsak ve dereotuyla kurulur; çıtır çıtır, ev usulü bir lezzet.",
    basePrice: 149.9,
    featured: true,
    spice: "acisiz",
    method: "dogal-fermente",
    option: JAR_SIZES(149.9, 249.9),
  },
  {
    name: "Kornişon Turşusu",
    slug: "kornison-tursusu",
    category: "klasik-tursular",
    brand: "Kaplan",
    description:
      "Küçük boy, sert ve çıtır kornişonlar. Kahvaltıların ve sandviçlerin vazgeçilmezi.",
    basePrice: 179.9,
    featured: true,
    spice: "acisiz",
    method: "sirkeli",
    option: JAR_SIZES(179.9, 299.9),
    compareAtPrice: 209.9,
  },
  {
    name: "Lahana Turşusu",
    slug: "lahana-tursusu",
    category: "klasik-tursular",
    brand: "Kaplan",
    description:
      "İnce kıyılmış beyaz lahana, havuç ve kırmızı biberle. Kışın sofraların yıldızı.",
    basePrice: 139.9,
    spice: "acisiz",
    method: "dogal-fermente",
    option: JAR_SIZES(139.9, 229.9),
  },
  {
    name: "Karışık Turşu",
    slug: "karisik-tursu",
    category: "klasik-tursular",
    brand: "Kaplan",
    description:
      "Salatalık, lahana, havuç ve biberin bir arada olduğu klasik bahçe karışımı.",
    basePrice: 159.9,
    featured: true,
    spice: "orta-aci",
    method: "dogal-fermente",
    option: JAR_SIZES(159.9, 269.9),
  },
  {
    name: "Acı Sivri Biber Turşusu",
    slug: "aci-sivri-biber-tursusu",
    category: "acili-tursular",
    brand: "Kaplan",
    description:
      "Yakan cinsten sivri biberler, sarımsaklı salamurada. Acı sevenlere.",
    basePrice: 159.9,
    featured: true,
    spice: "acili",
    method: "sirkeli",
    option: JAR_SIZES(159.9, 269.9),
  },
  {
    name: "Tombul Biber Turşusu",
    slug: "tombul-biber-tursusu",
    category: "acili-tursular",
    brand: "Kaplan",
    description:
      "Etli ve dolgun tombul biberler; hafif acı, bol aromalı bir turşu.",
    basePrice: 169.9,
    spice: "orta-aci",
    method: "sirkeli",
    option: JAR_SIZES(169.9, 289.9),
  },
  {
    name: "Acılı Karışık Turşu",
    slug: "acili-karisik-tursu",
    category: "acili-tursular",
    brand: "Kaplan",
    description:
      "Klasik karışımın acılı hâli: kırmızı biber, salatalık ve havuç bir arada.",
    basePrice: 169.9,
    spice: "acili",
    method: "dogal-fermente",
    option: JAR_SIZES(169.9, 279.9),
    compareAtPrice: 189.9,
  },
  {
    name: "Acılı Şalgam Suyu",
    slug: "acili-salgam-suyu",
    category: "salgam-ve-tursu-suyu",
    brand: "Kaplan",
    description:
      "Mor havuç ve şalgamla geleneksel yöntemle fermente edilen, acılı şalgam suyu.",
    basePrice: 79.9,
    featured: true,
    spice: "acili",
    method: "dogal-fermente",
    option: { name: "Hacim", prices: { "1 L": 79.9, "2 L": 139.9 } },
  },
  {
    name: "Pancarlı Turşu Suyu",
    slug: "pancarli-tursu-suyu",
    category: "salgam-ve-tursu-suyu",
    brand: "Kaplan",
    description:
      "Pancar ve lahana turşusunun suyu; ferahlatıcı, hafif ekşi bir içecek.",
    basePrice: 69.9,
    spice: "acisiz",
    method: "dogal-fermente",
    option: { name: "Hacim", prices: { "1 L": 69.9, "2 L": 119.9 } },
  },
  {
    name: "Turşu Tadım Kutusu",
    slug: "tursu-tadim-kutusu",
    category: "hediye-kutulari",
    brand: "Kaplan",
    description:
      "Kornişon, tombul biber ve lahana turşusundan oluşan üç kavanozluk tadım kutusu.",
    basePrice: 449.9,
    featured: true,
    compareAtPrice: 519.9,
  },
  {
    name: "Aile Boyu Turşu Kutusu",
    slug: "aile-boyu-tursu-kutusu",
    category: "hediye-kutulari",
    brand: "Kaplan",
    description:
      "Dört farklı turşu ve bir şişe şalgam suyuyla kalabalık sofralar için büyük kutu.",
    basePrice: 799.9,
  },
];

/** Benzersiz anahtara göre kaydı yoksa ekler; kimliğini döndürür. */
async function ensureId(
  db: Db,
  table: typeof category | typeof brand | typeof attribute,
  slug: string,
  values: Record<string, unknown>,
): Promise<string> {
  await db
    .insert(table)
    .values({ ...values, slug } as never)
    .onConflictDoNothing({ target: table.slug });
  const [row] = await db.select({ id: table.id }).from(table).where(eq(table.slug, slug));
  return row!.id;
}

async function seedDemoCatalog(db: Db): Promise<void> {
  const categoryIds = new Map<string, string>();
  for (const [index, demoCategory] of DEMO_CATEGORIES.entries()) {
    const id = await ensureId(db, category, demoCategory.slug, {
      name: demoCategory.name,
      sortOrder: index,
      imageUrl: `/images/kategoriler/${demoCategory.slug}.jpg`,
      parentId: demoCategory.parent ? categoryIds.get(demoCategory.parent) : null,
    });
    categoryIds.set(demoCategory.slug, id);
  }

  const brandIds = new Map<string, string>();
  for (const name of DEMO_BRANDS) {
    brandIds.set(name, await ensureId(db, brand, slugify(name), { name }));
  }

  const attributeValueIds = new Map<string, string>();
  for (const [position, demoAttribute] of DEMO_ATTRIBUTES.entries()) {
    const attributeId = await ensureId(db, attribute, demoAttribute.slug, {
      name: demoAttribute.name,
      position,
    });
    for (const [valuePosition, value] of demoAttribute.values.entries()) {
      const valueSlug = slugify(value);
      await db
        .insert(attributeValue)
        .values({ attributeId, value, slug: valueSlug, position: valuePosition })
        .onConflictDoNothing({ target: [attributeValue.attributeId, attributeValue.slug] });
      const [saved] = await db
        .select({ id: attributeValue.id })
        .from(attributeValue)
        .where(and(eq(attributeValue.attributeId, attributeId), eq(attributeValue.slug, valueSlug)));
      attributeValueIds.set(`${demoAttribute.slug}:${valueSlug}`, saved!.id);
    }
  }

  for (const demo of DEMO_PRODUCTS) {
    const [exists] = await db.select({ id: product.id }).from(product).where(eq(product.slug, demo.slug));
    if (exists) continue;

    const attributeLinks = [
      demo.spice ? attributeValueIds.get(`acilik:${demo.spice}`) : undefined,
      demo.method ? attributeValueIds.get(`yapim:${demo.method}`) : undefined,
    ].filter((id): id is string => id !== undefined);

    const productId = newId();
    const optionId = newId();
    const optionValues = demo.option
      ? Object.keys(demo.option.prices).map((value, position) => ({ id: newId(), value, position }))
      : [];
    const variants = optionValues.length > 0 ? optionValues : [null];

    // Ürün, görsel, öznitelik, seçenek ve varyantlar tek batch'te (atomik) oluşur.
    await runBatch(db, [
      db.insert(product).values({
        id: productId,
        name: demo.name,
        slug: demo.slug,
        description: demo.description,
        status: "ACTIVE",
        isFeatured: demo.featured ?? false,
        categoryId: categoryIds.get(demo.category)!,
        brandId: brandIds.get(demo.brand)!,
        taxRate: dec(demo.category === "salgam-ve-tursu-suyu" ? 10 : 1),
      }),
      db.insert(productImage).values({
        productId,
        url: `/images/urunler/${demo.slug}.jpg`,
        alt: demo.name,
      }),
      ...attributeLinks.map((attributeValueId) =>
        db.insert(productAttributeValue).values({ productId, attributeValueId }),
      ),
      ...(demo.option
        ? [
            db.insert(productOption).values({ id: optionId, productId, name: demo.option.name, position: 0 }),
            ...optionValues.map((value) =>
              db.insert(productOptionValue).values({
                id: value.id,
                optionId,
                value: value.value,
                position: value.position,
              }),
            ),
          ]
        : []),
      ...variants.flatMap((value, index) => {
        const price = value ? (demo.option?.prices[value.value] ?? demo.basePrice) : demo.basePrice;
        // İndirim yalnızca ilk (en küçük) boyutta gösterilir
        const compareAt = index === 0 && demo.compareAtPrice ? demo.compareAtPrice : undefined;
        const variantId = newId();
        return [
          db.insert(productVariant).values({
            id: variantId,
            productId,
            sku: `${demo.slug}-${value ? slugify(value.value) : "std"}`.toUpperCase(),
            price: dec(price.toFixed(2)),
            compareAtPrice: dec(compareAt?.toFixed(2)),
            stockQuantity: 30,
          }),
          ...(value ? [db.insert(variantOptionValue).values({ variantId, optionValueId: value.id })] : []),
        ];
      }),
    ]);
  }
}

const CUSTOM_PICKLE_SIZES = [
  { label: "3 kg bidon", price: 249.9, weightGram: 3000 },
  { label: "5 kg bidon", price: 379.9, weightGram: 5000 },
  { label: "10 kg bidon", price: 699.9, weightGram: 10000 },
];

/** Kendi turşunu yap malzemeleri; ücret bidonun kilogramı başınadır. */
const PICKLE_INGREDIENTS: {
  name: string;
  slug: string;
  group: "VEGETABLE" | "AROMA";
  pricePerKg: number;
}[] = [
  { name: "Salatalık", slug: "salatalik", group: "VEGETABLE", pricePerKg: 5 },
  { name: "Kornişon", slug: "kornison", group: "VEGETABLE", pricePerKg: 8 },
  {
    name: "Beyaz lahana",
    slug: "beyaz-lahana",
    group: "VEGETABLE",
    pricePerKg: 3,
  },
  {
    name: "Kırmızı lahana",
    slug: "kirmizi-lahana",
    group: "VEGETABLE",
    pricePerKg: 4,
  },
  { name: "Havuç", slug: "havuc", group: "VEGETABLE", pricePerKg: 3 },
  {
    name: "Sivri biber",
    slug: "sivri-biber",
    group: "VEGETABLE",
    pricePerKg: 6,
  },
  {
    name: "Kırmızı biber",
    slug: "kirmizi-biber",
    group: "VEGETABLE",
    pricePerKg: 6,
  },
  { name: "Karnabahar", slug: "karnabahar", group: "VEGETABLE", pricePerKg: 6 },
  { name: "Pancar", slug: "pancar", group: "VEGETABLE", pricePerKg: 4 },
  {
    name: "Yeşil domates",
    slug: "yesil-domates",
    group: "VEGETABLE",
    pricePerKg: 7,
  },
  { name: "Ayva", slug: "ayva", group: "VEGETABLE", pricePerKg: 8 },
  { name: "Sarımsak", slug: "sarimsak", group: "AROMA", pricePerKg: 3 },
  { name: "Dereotu", slug: "dereotu", group: "AROMA", pricePerKg: 2 },
  {
    name: "Hardal tohumu",
    slug: "hardal-tohumu",
    group: "AROMA",
    pricePerKg: 2.5,
  },
  {
    name: "Defne yaprağı",
    slug: "defne-yapragi",
    group: "AROMA",
    pricePerKg: 1.5,
  },
  { name: "Nohut", slug: "nohut", group: "AROMA", pricePerKg: 2 },
  {
    name: "Kuru acı biber",
    slug: "kuru-aci-biber",
    group: "AROMA",
    pricePerKg: 3,
  },
];

async function seedCustomPickle(db: Db): Promise<void> {
  for (const [index, item] of PICKLE_INGREDIENTS.entries()) {
    await db
      .insert(pickleIngredient)
      .values({
        name: item.name,
        slug: item.slug,
        group: item.group,
        imageUrl: `/images/malzemeler/${item.slug}.svg`,
        pricePerKg: dec(item.pricePerKg.toFixed(2)),
        sortOrder: index,
      })
      .onConflictDoNothing({ target: pickleIngredient.slug });
  }

  const slug = "kendi-tursunu-yap";
  const [existing] = await db.select({ id: product.id }).from(product).where(eq(product.slug, slug));
  if (existing) return;

  const [parent] = await db.select({ id: category.id }).from(category).where(eq(category.slug, "klasik-tursular"));
  const [kaplan] = await db.select({ id: brand.id }).from(brand).where(eq(brand.slug, "kaplan"));
  if (!parent) return;

  const productId = newId();
  const optionId = newId();
  const sizes = CUSTOM_PICKLE_SIZES.map((size, position) => ({ ...size, valueId: newId(), position }));

  await runBatch(db, [
    db.insert(product).values({
      id: productId,
      name: "Kendi Turşunu Yap",
      slug,
      description:
        "Bidon boyutunu seçin, sevdiğiniz sebze ve baharatları ekleyin; salamurasına ve acılığına siz karar verin.",
      status: "ACTIVE",
      isFeatured: true,
      categoryId: parent.id,
      brandId: kaplan?.id,
      taxRate: dec(1),
    }),
    db.insert(productImage).values({ productId, url: `/images/urunler/${slug}.svg`, alt: "Kendi Turşunu Yap" }),
    db.insert(productOption).values({ id: optionId, productId, name: "Boyut", position: 0 }),
    ...sizes.flatMap((size) => {
      const variantId = newId();
      return [
        db
          .insert(productOptionValue)
          .values({ id: size.valueId, optionId, value: size.label, position: size.position }),
        db.insert(productVariant).values({
          id: variantId,
          productId,
          sku: `${slug}-${slugify(size.label)}`.toUpperCase(),
          price: dec(size.price.toFixed(2)),
          weightGram: size.weightGram,
          stockQuantity: 50,
        }),
        db.insert(variantOptionValue).values({ variantId, optionValueId: size.valueId }),
      ];
    }),
  ]);
}

async function seedLegalPages(db: Db): Promise<void> {
  for (const template of LEGAL_PAGE_TEMPLATES) {
    await db
      .insert(page)
      // Mevcut (düzenlenmiş) içerik asla ezilmez.
      .values({ ...template, isPublished: false })
      .onConflictDoNothing({ target: page.slug });
  }
}
