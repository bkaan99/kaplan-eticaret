import { beforeEach, describe, expect, it } from "vitest";
import type { AuditEntry } from "@/shared/audit/audit-logger";
import type {
  AttributeRecord,
  BrandRecord,
  CategoryRecord,
  TaxonomyRepository,
} from "./taxonomy.repository";
import { TaxonomyService } from "./taxonomy.service";

const actor = { userId: "staff", ip: null };

const category = (
  id: string,
  parentId: string | null,
  slug = id,
): CategoryRecord => ({
  id,
  parentId,
  name: id.toUpperCase(),
  slug,
  description: null,
  imageUrl: null,
  sortOrder: 0,
  isActive: true,
  seoTitle: null,
  seoDescription: null,
  productCount: 0,
});

class FakeRepo implements TaxonomyRepository {
  categories: CategoryRecord[] = [
    category("a", null, "giyim"),
    category("b", "a", "erkek"),
  ];
  brands: BrandRecord[] = [
    { id: "b1", name: "Kaplan", slug: "kaplan", logoUrl: null, productCount: 0 },
  ];
  attributes: AttributeRecord[] = [
    {
      id: "at1",
      name: "Acılık",
      slug: "acilik",
      type: "SELECT",
      isFilterable: true,
      position: 0,
      values: [
        { id: "v1", value: "Az", slug: "az", productCount: 0 },
        { id: "v2", value: "Çok", slug: "cok", productCount: 2 },
      ],
    },
  ];
  takenCategorySlugs = new Set<string>();
  redirects: [string, string][] = [];
  childCount = 0;
  productCount = 0;
  brandProducts = 0;
  attributeProducts = 0;
  deleted: string[] = [];
  valueProducts = 0;
  takenValueSlugs = new Set<string>();
  takenBrandSlugs = new Set<string>();
  addedValues: string[] = [];
  updatedValues: string[] = [];
  updatedBrands: string[] = [];
  updated: { id: string; slug: string }[] = [];

  async listCategories() {
    return this.categories;
  }
  async findCategory(id: string) {
    return this.categories.find((c) => c.id === id) ?? null;
  }
  async categorySlugTaken(slug: string) {
    return this.takenCategorySlugs.has(slug);
  }
  async createCategory() {
    return "new";
  }
  async updateCategory(id: string, _input: unknown, slug: string) {
    this.updated.push({ id, slug });
  }
  async countCategoryChildren() {
    return this.childCount;
  }
  async countCategoryProducts() {
    return this.productCount;
  }
  async deleteCategory(id: string) {
    this.deleted.push(id);
  }
  async addRedirect(from: string, to: string) {
    this.redirects.push([from, to]);
  }
  async listBrands() {
    return this.brands;
  }
  async findBrand(id: string) {
    return this.brands.find((b) => b.id === id) ?? null;
  }
  async brandSlugTaken(slug: string) {
    return this.takenBrandSlugs.has(slug);
  }
  async createBrand() {
    return "b-new";
  }
  async updateBrand(id: string) {
    this.updatedBrands.push(id);
  }
  async countBrandProducts() {
    return this.brandProducts;
  }
  async deleteBrand(id: string) {
    this.deleted.push(id);
  }
  async listAttributes() {
    return this.attributes;
  }
  async findAttribute(id: string) {
    return this.attributes.find((a) => a.id === id) ?? null;
  }
  async attributeSlugTaken() {
    return false;
  }
  async createAttribute() {
    return "at1";
  }
  async updateAttribute() {}
  async countAttributeProducts() {
    return this.attributeProducts;
  }
  async deleteAttribute(id: string) {
    this.deleted.push(id);
  }
  async addAttributeValue(_id: string, value: string) {
    this.addedValues.push(value);
  }
  async findAttributeValue(valueId: string) {
    for (const attr of this.attributes) {
      const value = attr.values.find((v) => v.id === valueId);
      if (value) {
        return {
          id: value.id,
          attributeId: attr.id,
          value: value.value,
          slug: value.slug,
        };
      }
    }
    return null;
  }
  async attributeValueSlugTaken(_id: string, slug: string) {
    return this.takenValueSlugs.has(slug);
  }
  async updateAttributeValue(_id: string, value: string) {
    this.updatedValues.push(value);
  }
  async countAttributeValueProducts() {
    return this.valueProducts;
  }
  async deleteAttributeValue() {}
}

describe("TaxonomyService", () => {
  let repo: FakeRepo;
  let audit: AuditEntry[];
  let service: TaxonomyService;

  beforeEach(() => {
    repo = new FakeRepo();
    audit = [];
    service = new TaxonomyService(repo, {
      log: async (entry) => void audit.push(entry),
      purgeOlderThan: async () => 0,
    });
  });

  it("kategoriyi kendi alt kategorisinin altına taşımayı reddeder", async () => {
    await expect(
      service.saveCategory("a", { name: "Giyim", parentId: "b" }, actor),
    ).rejects.toThrow("kendi alt");
  });

  it("slug değişince yönlendirme yazar", async () => {
    await service.saveCategory("a", { name: "Giyim", slug: "moda" }, actor);
    expect(repo.updated).toEqual([{ id: "a", slug: "moda" }]);
    expect(repo.redirects).toEqual([["/kategori/giyim", "/kategori/moda"]]);
    expect(audit[0]).toMatchObject({ action: "category.update" });
  });

  it("başka kategoride kullanılan slug'ı reddeder", async () => {
    repo.takenCategorySlugs = new Set(["moda"]);
    await expect(
      service.saveCategory("a", { name: "Giyim", slug: "moda" }, actor),
    ).rejects.toThrow("başka bir kategoride");
  });

  it("alt kategorisi veya ürünü olan kategoriyi silmez", async () => {
    repo.childCount = 1;
    await expect(service.deleteCategory("a", actor)).rejects.toThrow(
      "Alt kategorisi",
    );

    repo.childCount = 0;
    repo.productCount = 3;
    await expect(service.deleteCategory("a", actor)).rejects.toThrow(
      "Ürünü olan",
    );
    expect(repo.deleted).toHaveLength(0);
  });

  it("boş kategoriyi siler ve denetim kaydı yazar", async () => {
    await service.deleteCategory("b", actor);
    expect(repo.deleted).toEqual(["b"]);
    expect(audit[0]).toMatchObject({ action: "category.delete" });
  });

  it("markayı günceller; ürünü olanı silmez", async () => {
    await service.saveBrand("b1", { name: "Kaplan Gurme" }, actor);
    expect(repo.updatedBrands).toEqual(["b1"]);
    expect(audit[0]).toMatchObject({ action: "brand.update" });

    repo.brandProducts = 2;
    await expect(service.deleteBrand("b1", actor)).rejects.toThrow(
      "Ürünü olan marka",
    );
  });

  it("nitelik değeri ekler, tekrarını reddeder", async () => {
    await service.addAttributeValue("at1", { value: "Pamuk" }, actor);
    expect(repo.addedValues).toEqual(["Pamuk"]);

    repo.takenValueSlugs = new Set(["keten"]);
    await expect(
      service.addAttributeValue("at1", { value: "Keten" }, actor),
    ).rejects.toThrow("zaten var");
  });

  it("nitelik değerini yeniden adlandırır", async () => {
    await service.updateAttributeValue("v1", { value: "Orta" }, actor);
    expect(repo.updatedValues).toEqual(["Orta"]);
    expect(audit[0]).toMatchObject({ action: "attribute.value.update" });
  });

  it("ürünlerde kullanılan nitelik değerini silmez", async () => {
    repo.valueProducts = 2;
    await expect(service.deleteAttributeValue("v1", actor)).rejects.toThrow(
      "Ürünlerde kullanılan",
    );
  });

  it("ürünlerde kullanılan niteliği silmez", async () => {
    repo.attributeProducts = 3;
    await expect(service.deleteAttribute("at1", actor)).rejects.toThrow(
      "Ürünlerde kullanılan nitelik",
    );
  });
});
