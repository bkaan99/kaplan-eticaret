import type { Actor, AuditLogger } from "@/shared/audit";
import { ValidationError } from "@/shared/errors";
import { slugify } from "@/shared/slug";
import type { CustomPickleRepository } from "./custom-pickle.repository";
import {
  ingredientInputSchema,
  pickleOptionsConfigSchema,
} from "./custom-pickle.schema";
import { firstIssue } from "@/shared/validation";
import { registerOptions, toView } from "./custom-pickle.support";
import {
  CUSTOM_PICKLE_PRODUCT_SLUG,
  type IngredientView,
} from "./custom-pickle.types";

/** Kendi Turşunu Yap yönetim paneli: malzeme ve seçenek yönetimi (müşteri akışından ayrı). */
export class CustomPickleAdminService {
  constructor(
    private readonly repository: CustomPickleRepository,
    private readonly audit?: AuditLogger,
  ) {}

  /** Bidon boyutlarının yönetildiği ürünün kimliği (ürün düzenleme bağlantısı için). */
  async builderProductId(): Promise<string | null> {
    const product = await this.repository.findBuilderProduct(
      CUSTOM_PICKLE_PRODUCT_SLUG,
    );
    return product?.id ?? null;
  }

  async listIngredients(): Promise<IngredientView[]> {
    return (await this.repository.listIngredients({ activeOnly: false })).map(
      (item) => toView(item),
    );
  }

  async saveIngredient(
    id: string | null,
    raw: unknown,
    actor: Actor,
  ): Promise<void> {
    const parsed = ingredientInputSchema.safeParse(raw);
    if (!parsed.success) throw new ValidationError(firstIssue(parsed.error));
    const input = parsed.data;

    let savedId: string;
    if (id) {
      await this.repository.updateIngredient(id, input);
      savedId = id;
    } else {
      const base = slugify(input.name) || "malzeme";
      let slug = base;
      for (
        let suffix = 2;
        await this.repository.findIngredientBySlug(slug);
        suffix++
      ) {
        slug = `${base}-${suffix}`;
      }
      savedId = await this.repository.createIngredient({ ...input, slug });
    }

    await this.audit?.log({
      actorId: actor.userId,
      ip: actor.ip,
      action: id ? "pickle-ingredient.update" : "pickle-ingredient.create",
      entityType: "PickleIngredient",
      entityId: savedId,
      after: input,
    });
  }

  async deleteIngredient(id: string, actor: Actor): Promise<void> {
    await this.repository.deleteIngredient(id);
    await this.audit?.log({
      actorId: actor.userId,
      ip: actor.ip,
      action: "pickle-ingredient.delete",
      entityType: "PickleIngredient",
      entityId: id,
    });
  }

  async saveOptions(raw: unknown, actor: Actor): Promise<void> {
    const parsed = pickleOptionsConfigSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ValidationError(firstIssue(parsed.error));
    }
    const before = await this.repository.getPickleOptions();
    await this.repository.savePickleOptions(parsed.data);
    registerOptions(parsed.data);

    await this.audit?.log({
      actorId: actor.userId,
      ip: actor.ip,
      action: "custom-pickle.options.update",
      entityType: "CustomPickleOptions",
      before,
      after: parsed.data,
    });
  }
}
