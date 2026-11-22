import { describe, expect, it } from "vitest";
import type { IngredientView } from "@/modules/custom-pickle/custom-pickle.types";
import { tasteTags } from "./flavor-profile";

const view = (
  slug: string,
  group: IngredientView["group"] = "VEGETABLE",
): IngredientView => ({ slug, group }) as IngredientView;

describe("tasteTags", () => {
  it("belirgin özellikleri yazar: ekşi ve kıtır", () => {
    expect(tasteTags(view("kornison"))).toEqual(["Ekşi", "Kıtır"]);
  });
  it("acı malzemede acıyı öne alır", () => {
    expect(tasteTags(view("sivri-biber"))[0]).toBe("Acı");
  });
  it("tanımsız malzemede orta değerleri kullanır", () => {
    expect(tasteTags(view("yeni-malzeme"))).toEqual(["Dengeli", "Çıtır"]);
  });
  it("aromalar için etiket üretmez", () => {
    expect(tasteTags(view("sarimsak", "AROMA"))).toEqual([]);
  });
  it("en fazla iki etiket döner", () => {
    expect(tasteTags(view("kornison")).length).toBeLessThanOrEqual(2);
  });
});
