import "dotenv/config";
import { SYSTEM_ROLES } from "../src/shared/permissions";
import { slugify } from "../src/shared/slug";
import { LEGAL_PAGE_TEMPLATES } from "./legal-pages";
import {
  createPrismaClient,
  type PrismaClient,
} from "../src/shared/prisma-client";

async function seedRoles(db: PrismaClient): Promise<void> {
  for (const role of SYSTEM_ROLES) {
    const saved = await db.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: {
        name: role.name,
        description: role.description,
        isSystem: true,
      },
    });

    await db.rolePermission.deleteMany({ where: { roleId: saved.id } });
    await db.rolePermission.createMany({
      data: role.permissions.map((permission) => ({
        roleId: saved.id,
        permission,
      })),
    });
  }
}

async function seedCustomerGroups(db: PrismaClient): Promise<void> {
  const groups = [
    { name: "Bayi", slug: "bayi", discountPercent: 20 },
    { name: "Toptan", slug: "toptan", discountPercent: 30 },
  ];

  for (const group of groups) {
    await db.customerGroup.upsert({
      where: { slug: group.slug },
      update: {},
      create: group,
    });
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

async function seedDemoCatalog(db: PrismaClient): Promise<void> {
  const categoryIds = new Map<string, string>();
  for (const [index, category] of DEMO_CATEGORIES.entries()) {
    const saved = await db.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: {
        name: category.name,
        slug: category.slug,
        sortOrder: index,
        imageUrl: `/images/kategoriler/${category.slug}.jpg`,
        parentId: category.parent ? categoryIds.get(category.parent) : null,
      },
    });
    categoryIds.set(category.slug, saved.id);
  }

  const brandIds = new Map<string, string>();
  for (const name of DEMO_BRANDS) {
    const saved = await db.brand.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: { name, slug: slugify(name) },
    });
    brandIds.set(name, saved.id);
  }

  const attributeValueIds = new Map<string, string>();
  for (const [position, attribute] of DEMO_ATTRIBUTES.entries()) {
    const saved = await db.attribute.upsert({
      where: { slug: attribute.slug },
      update: {},
      create: { name: attribute.name, slug: attribute.slug, position },
    });
    for (const [valuePosition, value] of attribute.values.entries()) {
      const valueSlug = slugify(value);
      const savedValue = await db.attributeValue.upsert({
        where: { attributeId_slug: { attributeId: saved.id, slug: valueSlug } },
        update: {},
        create: {
          attributeId: saved.id,
          value,
          slug: valueSlug,
          position: valuePosition,
        },
      });
      attributeValueIds.set(`${attribute.slug}:${valueSlug}`, savedValue.id);
    }
  }

  for (const demo of DEMO_PRODUCTS) {
    const exists = await db.product.findUnique({ where: { slug: demo.slug } });
    if (exists) continue;

    const attributeLinks = [
      demo.spice ? attributeValueIds.get(`acilik:${demo.spice}`) : undefined,
      demo.method ? attributeValueIds.get(`yapim:${demo.method}`) : undefined,
    ].filter((id): id is string => id !== undefined);

    const product = await db.product.create({
      data: {
        name: demo.name,
        slug: demo.slug,
        description: demo.description,
        status: "ACTIVE",
        isFeatured: demo.featured ?? false,
        categoryId: categoryIds.get(demo.category)!,
        brandId: brandIds.get(demo.brand)!,
        images: {
          create: {
            url: `/images/urunler/${demo.slug}.jpg`,
            alt: demo.name,
          },
        },
        attributes: {
          create: attributeLinks.map((attributeValueId) => ({
            attributeValueId,
          })),
        },
        options: demo.option
          ? {
              create: {
                name: demo.option.name,
                position: 0,
                values: {
                  create: Object.keys(demo.option.prices).map(
                    (value, position) => ({ value, position }),
                  ),
                },
              },
            }
          : undefined,
      },
      include: { options: { include: { values: true } } },
    });

    const values = (product.options[0]?.values ?? []).sort(
      (a, b) => a.position - b.position,
    );
    const variants = values.length > 0 ? values : [null];

    for (const [index, value] of variants.entries()) {
      const price = value
        ? (demo.option?.prices[value.value] ?? demo.basePrice)
        : demo.basePrice;
      // İndirim yalnızca ilk (en küçük) boyutta gösterilir
      const compareAt =
        index === 0 && demo.compareAtPrice ? demo.compareAtPrice : undefined;
      await db.productVariant.create({
        data: {
          productId: product.id,
          sku: `${demo.slug}-${value ? slugify(value.value) : "std"}`.toUpperCase(),
          price: price.toFixed(2),
          compareAtPrice: compareAt?.toFixed(2),
          stockQuantity: 30,
          optionValues: value
            ? { create: { optionValueId: value.id } }
            : undefined,
        },
      });
    }
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

async function seedCustomPickle(db: PrismaClient): Promise<void> {
  for (const [index, item] of PICKLE_INGREDIENTS.entries()) {
    await db.pickleIngredient.upsert({
      where: { slug: item.slug },
      update: {},
      create: {
        name: item.name,
        slug: item.slug,
        group: item.group,
        imageUrl: `/images/malzemeler/${item.slug}.svg`,
        pricePerKg: item.pricePerKg.toFixed(2),
        sortOrder: index,
      },
    });
  }

  const slug = "kendi-tursunu-yap";
  if (await db.product.findUnique({ where: { slug } })) return;

  const category = await db.category.findUnique({
    where: { slug: "klasik-tursular" },
  });
  const brand = await db.brand.findUnique({ where: { slug: "kaplan" } });
  if (!category) return;

  const product = await db.product.create({
    data: {
      name: "Kendi Turşunu Yap",
      slug,
      description:
        "Bidon boyutunu seçin, sevdiğiniz sebze ve baharatları ekleyin; salamurasına ve acılığına siz karar verin.",
      status: "ACTIVE",
      isFeatured: true,
      categoryId: category.id,
      brandId: brand?.id,
      images: {
        create: {
          url: `/images/urunler/${slug}.svg`,
          alt: "Kendi Turşunu Yap",
        },
      },
      options: {
        create: {
          name: "Boyut",
          position: 0,
          values: {
            create: CUSTOM_PICKLE_SIZES.map((size, position) => ({
              value: size.label,
              position,
            })),
          },
        },
      },
    },
    include: { options: { include: { values: true } } },
  });

  for (const value of product.options[0]!.values) {
    const size = CUSTOM_PICKLE_SIZES.find(
      (item) => item.label === value.value,
    )!;
    await db.productVariant.create({
      data: {
        productId: product.id,
        sku: `${slug}-${slugify(size.label)}`.toUpperCase(),
        price: size.price.toFixed(2),
        weightGram: size.weightGram,
        stockQuantity: 50,
        optionValues: { create: { optionValueId: value.id } },
      },
    });
  }
}

async function seedLegalPages(db: PrismaClient): Promise<void> {
  for (const page of LEGAL_PAGE_TEMPLATES) {
    await db.page.upsert({
      where: { slug: page.slug },
      // Mevcut (düzenlenmiş) içerik asla ezilmez.
      update: {},
      create: { ...page, isPublished: false },
    });
  }
}

async function main(): Promise<void> {
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error("DATABASE_URL tanımlı değil");
  }

  const db = createPrismaClient(connectionString);
  try {
    await seedRoles(db);
    await seedCustomerGroups(db);
    await seedDemoCatalog(db);
    await seedCustomPickle(db);
    await seedLegalPages(db);
    console.log("Seed tamamlandı.");
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
