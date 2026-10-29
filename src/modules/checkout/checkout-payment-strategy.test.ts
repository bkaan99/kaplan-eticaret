import Decimal from "decimal.js";
import { describe, expect, it, vi } from "vitest";
import { InMemoryEventBus } from "@/shared/events/event-bus";
import {
  BankTransferPaymentStrategy,
  CardPaymentStrategy,
  CheckoutPaymentStrategyRegistry,
  DeferredPaymentStrategy,
  createDefaultCheckoutPaymentStrategies,
} from "./checkout-payment-strategy";
import type { CheckoutSettings } from "./checkout.types";

const defaultSettings: CheckoutSettings = {
  guestCheckoutEnabled: true,
  reservationMinutes: 15,
  shippingTaxRate: 0.2,
  paymentProvider: "paytr",
  bankTransferConfigured: true,
  bankTransferHoldHours: 48,
  deferredPaymentDays: 45,
};

describe("CheckoutPaymentStrategy", () => {
  describe("CardPaymentStrategy", () => {
    const strategy = new CardPaymentStrategy();

    it("tüm müşteriler için geçerlidir", async () => {
      await expect(
        strategy.validate({
          dealer: null,
          userId: null,
          grandTotal: "100.00",
          settings: defaultSettings,
        }),
      ).resolves.toBeUndefined();
    });

    it("ayarlardaki standart rezervasyon süresini ve sağlayıcıyı döner", () => {
      expect(strategy.getReservationMinutes(defaultSettings)).toBe(15);
      expect(strategy.getPaymentProvider(defaultSettings)).toBe("paytr");
    });

    it("pending sipariş oluşturur ve olay fırlatmaz", async () => {
      const orders = {
        createPendingOrder: vi.fn(async () => ({
          orderId: "o1",
          orderNumber: "S1",
          lookupToken: "tok",
          merchantOid: "M1",
        })),
        createDeferredOrder: vi.fn(),
      };
      const events = new InMemoryEventBus();
      const publishSpy = vi.spyOn(events, "publish");

      const created = await strategy.placeOrder({
        orders,
        newOrder: {} as any,
        dealer: null,
        settings: defaultSettings,
        now: () => new Date(),
      });

      expect(created.orderId).toBe("o1");
      expect(orders.createPendingOrder).toHaveBeenCalled();
      await strategy.publishPlacedEvent(events, "o1");
      expect(publishSpy).not.toHaveBeenCalled();
    });
  });

  describe("BankTransferPaymentStrategy", () => {
    const strategy = new BankTransferPaymentStrategy();

    it("onaylı olmayan bayiyi reddeder", async () => {
      await expect(
        strategy.validate({
          dealer: null,
          userId: "u1",
          grandTotal: "100.00",
          settings: defaultSettings,
        }),
      ).rejects.toThrow("onaylı bayiler");
    });

    it("havale hesabı tanımlı değilse hata fırlatır", async () => {
      await expect(
        strategy.validate({
          dealer: { status: "APPROVED", creditLimit: "1000", minOrderAmount: null },
          userId: "u1",
          grandTotal: "100.00",
          settings: { ...defaultSettings, bankTransferConfigured: false },
        }),
      ).rejects.toThrow("Havale/EFT şu anda kullanılamıyor");
    });

    it("tutma saatini dakikaya çevirir ve bank_transfer sağlayıcısı döner", () => {
      expect(strategy.getReservationMinutes(defaultSettings)).toBe(48 * 60);
      expect(strategy.getPaymentProvider(defaultSettings)).toBe("bank_transfer");
    });

    it("pending sipariş oluşturur ve order.placed olayı yayınlar", async () => {
      const orders = {
        createPendingOrder: vi.fn(async () => ({
          orderId: "o2",
          orderNumber: "S2",
          lookupToken: "tok",
          merchantOid: "M2",
        })),
        createDeferredOrder: vi.fn(),
      };
      const events = new InMemoryEventBus();
      const handler = vi.fn();
      events.subscribe("order.placed", handler);

      const created = await strategy.placeOrder({
        orders,
        newOrder: {} as any,
        dealer: { status: "APPROVED", creditLimit: "1000", minOrderAmount: null },
        settings: defaultSettings,
        now: () => new Date(),
      });

      expect(created.orderId).toBe("o2");
      await strategy.publishPlacedEvent(events, "o2");
      expect(handler).toHaveBeenCalledWith({
        orderId: "o2",
        method: "BANK_TRANSFER",
      });
    });
  });

  describe("DeferredPaymentStrategy", () => {
    const strategy = new DeferredPaymentStrategy();

    it("kredi limiti tanımlı değilse veya yetersizse reddeder", async () => {
      await expect(
        strategy.validate({
          dealer: { status: "APPROVED", creditLimit: null, minOrderAmount: null },
          userId: "u1",
          grandTotal: "100.00",
          settings: defaultSettings,
        }),
      ).rejects.toThrow("kredi limitiniz tanımlı değil");

      await expect(
        strategy.validate({
          dealer: { status: "APPROVED", creditLimit: "50.00", minOrderAmount: null },
          userId: "u1",
          grandTotal: "100.00",
          settings: defaultSettings,
          dealers: {
            findProfile: vi.fn(),
            outstandingDeferredTotal: vi.fn(async () => new Decimal("0.00")),
          },
        }),
      ).rejects.toThrow("Kredi limitiniz yetersiz");
    });

    it("vadeli sipariş oluşturur ve dueAt tarihini hesaplar", async () => {
      const orders = {
        createPendingOrder: vi.fn(),
        createDeferredOrder: vi.fn(async () => ({
          orderId: "o3",
          orderNumber: "S3",
          lookupToken: "tok",
          merchantOid: "M3",
        })),
      };
      const events = new InMemoryEventBus();
      const handler = vi.fn();
      events.subscribe("order.placed", handler);

      const now = new Date("2026-01-01T00:00:00Z");
      const created = await strategy.placeOrder({
        orders,
        newOrder: {} as any,
        dealer: { status: "APPROVED", creditLimit: "5000.00", minOrderAmount: null },
        settings: defaultSettings,
        now: () => now,
      });

      expect(created.orderId).toBe("o3");
      expect(orders.createDeferredOrder).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          creditLimit: "5000.00",
          dueAt: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
        }),
      );

      await strategy.publishPlacedEvent(events, "o3");
      expect(handler).toHaveBeenCalledWith({
        orderId: "o3",
        method: "DEFERRED",
      });
    });
  });

  describe("CheckoutPaymentStrategyRegistry", () => {
    it("tanımlı tüm stratejileri çözer ve bilinmeyende hata verir", () => {
      const registry = createDefaultCheckoutPaymentStrategies();
      expect(registry.get("CARD").method).toBe("CARD");
      expect(registry.get("BANK_TRANSFER").method).toBe("BANK_TRANSFER");
      expect(registry.get("DEFERRED").method).toBe("DEFERRED");
      expect(() => registry.get("INVALID" as any)).toThrow("Geçersiz ödeme yöntemi");
    });
  });
});
