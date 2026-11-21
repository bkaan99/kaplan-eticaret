import { describe, expect, it } from "vitest";
import { categoryInputSchema } from "./taxonomy.schema";

describe("categoryInputSchema", () => {
  it("formdan gelen null opsiyonel alanları kabul eder", () => {
    const parsed = categoryInputSchema.safeParse({
      name: "Alt Kategori",
      slug: "alt-kategori",
      parentId: "parent-id",
      description: null,
      imageUrl: null,
      sortOrder: "0",
      isActive: true,
      seoTitle: null,
      seoDescription: null,
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).toMatchObject({
      name: "Alt Kategori",
      parentId: "parent-id",
      description: null,
      imageUrl: null,
      seoTitle: null,
      seoDescription: null,
      sortOrder: 0,
    });
  });

  it("boş üst kategori için parentId null olur", () => {
    const parsed = categoryInputSchema.safeParse({
      name: "Kök",
      parentId: null,
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.parentId).toBeNull();
  });
});
