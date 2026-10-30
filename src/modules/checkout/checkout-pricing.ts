import type Decimal from "decimal.js";
import { toDecimal } from "@/shared/money";
import type { PriceResolver } from "../catalog/pricing";
import type { CustomizationPricer } from "../custom-pickle/custom-pickle.types";
import type {
  CheckoutLineRecord,
  CheckoutRepository,
} from "./checkout.repository";
import {
  CouponRule,
  applyDiscountRules,
  createCampaignRule,
  type AppliedDiscount,
  type DiscountRule,
} from "./discounts";
import type { ShippingRateCalculator } from "./shipping";
import { calculateOrderTotals, type OrderTotals } from "./totals";
import {
  lineVariantName,
  type CheckoutQuote,
  type CheckoutSettings,
  type ComputedCheckout,
  type PricedLine,
} from "./checkout.types";
import { quoteCustomizations } from "./checkout-customizations";
import type { CheckoutValidator } from "./checkout-validator";

export interface CheckoutPricingDeps {
  priceResolver: PriceResolver;
  shipping: ShippingRateCalculator;
  checkout: Pick<CheckoutRepository, "listActiveCampaigns" | "findCoupon">;
  settings: Pick<CheckoutSettings, "shippingTaxRate">;
  validator: Pick<CheckoutValidator, "assertCouponUsable">;
  customizations?: CustomizationPricer;
  now: () => Date;
}

/** Checkout fiyat, indirim, kargo ve vergi hesaplamalarından sorumlu motor. */
export class CheckoutPricingEngine {
  constructor(private readonly deps: CheckoutPricingDeps) {}

  /** Sepet satırları, kupon ve kampanyaları hesaplayıp nihai özet ve fiyatlandırılmış satırları döner. */
  async compute(
    cartId: string,
    lines: CheckoutLineRecord[],
    couponCode: string | null,
    owner: { userId: string | null; email: string | null },
    customerGroupId: string | null,
  ): Promise<ComputedCheckout> {
    const unitPrices = await this.deps.priceResolver.resolveUnitPrices(
      lines.map((record) => ({
        variantId: record.variantId,
        listPrice: record.price,
        quantity: record.quantity,
      })),
      { customerGroupId },
    );
    const custom = await quoteCustomizations(lines, this.deps.customizations);
    const priced: PricedLine[] = lines.map((record, index) => {
      const base = unitPrices.get(record.variantId) ?? toDecimal(record.price);
      const quote = custom[index];
      return {
        record,
        unitPrice: quote ? base.plus(quote.extra) : base,
        custom: quote,
      };
    });

    const subtotal = priced.reduce(
      (sum, entry) => sum.plus(entry.unitPrice.times(entry.record.quantity)),
      toDecimal(0),
    );

    const rules = await this.collectRules(subtotal, couponCode, owner);
    const discountContext = {
      subtotal,
      lines: priced.map((entry) => ({
        variantId: entry.record.variantId,
        categoryId: entry.record.product.categoryId,
        quantity: entry.record.quantity,
        unitPrice: entry.unitPrice,
      })),
    };
    const { applied, total: discountTotal } = applyDiscountRules(
      rules.list,
      discountContext,
    );

    const afterDiscount = subtotal.minus(discountTotal);
    const totalDesi = priced.reduce(
      (sum, entry) => sum + entry.record.desi * entry.record.quantity,
      0,
    );
    const shippingTotal = this.deps.shipping.calculate({
      subtotal: afterDiscount,
      totalDesi,
    });

    const totals = calculateOrderTotals({
      lines: priced.map((entry) => ({
        variantId: entry.record.variantId,
        quantity: entry.record.quantity,
        unitPrice: entry.unitPrice,
        taxRate: entry.record.product.taxRate,
      })),
      discountTotal,
      shippingTotal,
      shippingTaxRate: this.deps.settings.shippingTaxRate,
    });

    const currency = priced[0]?.record.currency ?? "TRY";

    return {
      priced,
      totals,
      appliedCoupon: rules.couponApplied ? couponCode : null,
      quote: this.toQuote(cartId, currency, priced, totals, applied),
    };
  }

  private async collectRules(
    subtotal: Decimal,
    couponCode: string | null,
    owner: { userId: string | null; email: string | null },
  ): Promise<{ list: DiscountRule[]; couponApplied: boolean }> {
    const now = this.deps.now();
    const campaigns = await this.deps.checkout.listActiveCampaigns(now);
    const list: DiscountRule[] = campaigns
      .map((campaign) =>
        createCampaignRule({
          name: campaign.name,
          ruleType: campaign.ruleType,
          config: campaign.config,
        }),
      )
      .filter((rule): rule is DiscountRule => rule !== null);

    if (!couponCode) return { list, couponApplied: false };

    const coupon = await this.deps.checkout.findCoupon(couponCode);
    await this.deps.validator.assertCouponUsable(coupon, subtotal, owner);

    list.push(
      new CouponRule({
        code: coupon!.code,
        type: coupon!.type,
        value: coupon!.value,
        minSubtotal: coupon!.minSubtotal,
      }),
    );
    return { list, couponApplied: true };
  }

  private toQuote(
    cartId: string,
    currency: string,
    priced: PricedLine[],
    totals: OrderTotals,
    applied: AppliedDiscount[],
  ): CheckoutQuote {
    return {
      cartId,
      currency,
      subtotal: totals.subtotal.toFixed(2),
      discountTotal: totals.discountTotal.toFixed(2),
      shippingTotal: totals.shippingTotal.toFixed(2),
      taxTotal: totals.taxTotal.toFixed(2),
      grandTotal: totals.grandTotal.toFixed(2),
      discounts: applied.map((item) => ({
        label: item.label,
        amount: item.amount.toFixed(2),
      })),
      lines: priced.map((entry, index) => ({
        variantId: entry.record.variantId,
        productName: entry.record.product.name,
        variantName: lineVariantName(entry),
        quantity: entry.record.quantity,
        unitPrice: entry.unitPrice.toFixed(2),
        lineTotal: totals.lines[index]!.lineTotal.toFixed(2),
      })),
    };
  }
}
