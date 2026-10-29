import { isAppError } from "@/shared/errors";
import type { CartIdentity, CartMutationResult } from "../cart/cart.types";
import { customizationKey } from "../custom-pickle/custom-pickle.service";
import type { StoredCustomization } from "../custom-pickle/custom-pickle.types";
import type { OrderAccess } from "./order.service";
import type { OrderView } from "./order.types";

export interface ReorderResult {
  added: number;
  skipped: { productName: string; reason: string }[];
  /** İlk ekleme yeni misafir sepeti oluşturduysa çerezde saklanacak belirteç */
  sessionToken?: string;
}

interface CustomizationSnapshotLike {
  kind?: string;
  ingredients?: { id: string }[];
  brine?: string;
  spice?: string;
  note?: string | null;
}

/** "Tekrar sipariş ver": önceki siparişin ürünlerini mevcut stok ve fiyatla sepete ekler. */
export class ReorderService {
  constructor(
    private readonly orders: {
      getForAccess(
        orderNumber: string,
        access: OrderAccess,
      ): Promise<OrderView>;
    },
    private readonly cart: {
      addItem(
        identity: CartIdentity,
        variantId: string,
        quantity: number,
      ): Promise<CartMutationResult>;
      addCustomItem?(
        identity: CartIdentity,
        variantId: string,
        line: { key: string; customization: StoredCustomization },
        quantity: number,
      ): Promise<CartMutationResult>;
    },
  ) {}

  async reorder(
    orderNumber: string,
    access: OrderAccess,
    identity: CartIdentity,
  ): Promise<ReorderResult> {
    const order = await this.orders.getForAccess(orderNumber, access);

    let current = identity;
    let added = 0;
    let sessionToken: string | undefined;
    const skipped: ReorderResult["skipped"] = [];

    for (const item of order.items) {
      if (!item.variantId) {
        skipped.push({
          productName: item.productName,
          reason: "Ürün artık satışta değil",
        });
        continue;
      }

      try {
        const snap = item.customization as CustomizationSnapshotLike | undefined;
        let result: CartMutationResult;

        if (
          snap?.kind === "custom-pickle" &&
          Array.isArray(snap.ingredients) &&
          this.cart.addCustomItem
        ) {
          const stored: StoredCustomization = {
            kind: "custom-pickle",
            ingredientIds: snap.ingredients.map((i) => i.id),
            brine: snap.brine ?? "VINEGAR",
            spice: snap.spice ?? "MEDIUM",
            note: snap.note ?? null,
          };
          const key = customizationKey(stored);
          result = await this.cart.addCustomItem(
            current,
            item.variantId,
            { key, customization: stored },
            item.quantity,
          );
        } else {
          result = await this.cart.addItem(
            current,
            item.variantId,
            item.quantity,
          );
        }

        added += 1;

        // Misafir için oluşan sepet belirteci sonraki eklemelerde kullanılır.
        if (result.sessionToken) {
          sessionToken = result.sessionToken;
          current = { ...current, sessionToken: result.sessionToken };
        }
      } catch (error) {
        if (!isAppError(error)) throw error;
        skipped.push({ productName: item.productName, reason: error.message });
      }
    }

    return { added, skipped, sessionToken };
  }
}
