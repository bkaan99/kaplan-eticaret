import type Decimal from "decimal.js";
import {
  ConflictError,
  ForbiddenError,
  ValidationError,
} from "@/shared/errors";
import { formatMoney, toDecimal } from "@/shared/money";
import { CreditLimitPolicy } from "../b2b/credit-limit.policy";
import { availableQuantity } from "../catalog/availability";
import type { CartIdentity } from "../cart/cart.types";
import type { CouponUsageRepository } from "../orders/order.repository";
import type {
  CheckoutLineRecord,
  CheckoutRepository,
  CouponRecord,
} from "./checkout.repository";
import type {
  CartSource,
  CheckoutSettings,
  DealerTerms,
  PaymentOption,
} from "./checkout.types";
import {
  CheckoutPaymentStrategyRegistry,
  createDefaultCheckoutPaymentStrategies,
} from "./checkout-payment-strategy";
import type { CustomizationPricer } from "../custom-pickle/custom-pickle.types";
import { quoteCustomizations } from "./checkout-customizations";

export interface CheckoutValidatorDeps {
  carts: CartSource;
  checkout: CheckoutRepository;
  orders: CouponUsageRepository;
  dealers?: DealerTerms;
  customizations?: CustomizationPricer;
  settings: CheckoutSettings;
  now: () => Date;
  strategies?: CheckoutPaymentStrategyRegistry;
}

export type DealerProfileResult = Awaited<
  ReturnType<DealerTerms["findProfile"]>
>;

/** Checkout doğrulama ve ön koşul denetimlerinden sorumlu sınıf. */
export class CheckoutValidator {
  private readonly strategies: CheckoutPaymentStrategyRegistry;

  constructor(private readonly deps: CheckoutValidatorDeps) {
    this.strategies =
      deps.strategies ?? createDefaultCheckoutPaymentStrategies();
  }

  /** Misafir checkout kapalıysa giriş kontrolü yapar. */
  assertGuestCheckoutAllowed(userId: string | null): void {
    if (!userId && !this.deps.settings.guestCheckoutEnabled) {
      throw new ForbiddenError("Sipariş vermek için giriş yapmalısınız");
    }
  }

  /** Bayi profilini getirir; kullanıcı yoksa veya bayi sistemi kapalıysa null döner. */
  async loadDealer(userId: string | null): Promise<DealerProfileResult> {
    if (!userId || !this.deps.dealers) return null;
    return this.deps.dealers.findProfile(userId);
  }

  /** Yalnızca-B2B modunda bayilik zorunluluğunu denetler. */
  assertDealerRequirement(dealer: DealerProfileResult): void {
    if (this.deps.settings.requireDealer && dealer?.status !== "APPROVED") {
      throw new ForbiddenError(
        "Bu mağazada yalnızca onaylı bayiler sipariş verebilir",
      );
    }
  }

  /** Bayiye tanımlı minimum sipariş tutarı kontrolünü yapar. */
  assertMinimumOrderAmount(
    dealer: DealerProfileResult,
    subtotal: Decimal.Value,
    discountTotal: Decimal.Value,
  ): void {
    const payable = toDecimal(subtotal).minus(discountTotal);
    if (
      dealer?.status === "APPROVED" &&
      dealer.minOrderAmount &&
      payable.lt(dealer.minOrderAmount)
    ) {
      throw new ValidationError(
        `Minimum sipariş tutarınız ${formatMoney(dealer.minOrderAmount)}`,
      );
    }
  }

  /** Seçilen ödeme yönteminin müşteri ve sepet için geçerli olduğunu doğrular (OCP). */
  async assertPaymentMethod(
    method: PaymentOption["method"],
    dealer: DealerProfileResult,
    userId: string | null,
    grandTotal: string,
  ): Promise<void> {
    const strategy = this.strategies.get(method);
    await strategy.validate({
      dealer,
      userId,
      grandTotal,
      settings: this.deps.settings,
      dealers: this.deps.dealers,
    });
  }

  /** Sepetteki satırları yükler, stok ve satış durumlarını doğrular. */
  async loadSellableLines(identity: CartIdentity): Promise<{
    cartId: string;
    lines: CheckoutLineRecord[];
  }> {
    const { cart } = await this.deps.carts.getCart(identity);
    if (!cart.id || cart.lines.length === 0) {
      throw new ValidationError("Sepetiniz boş");
    }

    const lines = await this.deps.checkout.loadCartLines(cart.id);
    if (lines.length === 0) throw new ValidationError("Sepetiniz boş");

    for (const line of lines) {
      if (!line.isActive || line.product.status !== "ACTIVE") {
        throw new ConflictError(`"${line.product.name}" artık satışta değil`);
      }

      const available = availableQuantity({
        trackInventory: line.product.trackInventory,
        stockQuantity: line.stockQuantity,
        reservedQuantity: line.reservedQuantity,
      });
      if (available !== null && line.quantity > available) {
        throw new ConflictError(
          `"${line.product.name}" için yeterli stok yok (kalan: ${available})`,
        );
      }
    }

    // Özelleştirilmiş satırların malzemeleri hâlâ satışta olmalı.
    const custom = await quoteCustomizations(lines, this.deps.customizations);
    lines.forEach((line, index) => {
      if (line.customizationKey && !custom[index]?.available) {
        throw new ConflictError(
          `"${line.product.name}" içindeki malzemelerden biri artık mevcut değil; lütfen sepetinizi güncelleyin`,
        );
      }
    });

    return { cartId: cart.id, lines };
  }

  /** Kuponun tarihler, limitler ve sepet tutarı açısından kullanılabilirliğini denetler. */
  async assertCouponUsable(
    coupon: CouponRecord | null,
    subtotal: Decimal,
    owner: { userId: string | null; email: string | null },
  ): Promise<void> {
    const now = this.deps.now();

    if (!coupon || !coupon.isActive) {
      throw new ValidationError("Kupon kodu geçersiz");
    }
    if (coupon.startsAt && coupon.startsAt > now) {
      throw new ValidationError("Kupon henüz geçerli değil");
    }
    if (coupon.endsAt && coupon.endsAt < now) {
      throw new ValidationError("Kuponun süresi dolmuş");
    }
    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      throw new ValidationError("Kuponun kullanım limiti dolmuş");
    }
    if (coupon.minSubtotal && subtotal.lt(coupon.minSubtotal)) {
      throw new ValidationError(
        `Bu kupon için minimum sepet tutarı ${formatMoney(coupon.minSubtotal)}`,
      );
    }
    if (coupon.perCustomerLimit !== null && owner.email) {
      const used = await this.deps.orders.countCouponUses(coupon.code, {
        userId: owner.userId,
        email: owner.email,
      });
      if (used >= coupon.perCustomerLimit) {
        throw new ValidationError("Bu kuponu daha fazla kullanamazsınız");
      }
    }
  }
}
