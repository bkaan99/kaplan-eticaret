import { describe, expect, it, vi } from "vitest";
import type { NotificationDispatcher } from "../notification-dispatcher";
import { AccountNotificationHandler } from "./account-notification.handler";
import { DealerNotificationHandler } from "./dealer-notification.handler";
import { OrderNotificationHandler } from "./order-notification.handler";
import { ReturnNotificationHandler } from "./return-notification.handler";
import { StockAlertNotificationHandler } from "./stock-alert-notification.handler";

describe("Notification Handlers", () => {
  it("AccountNotificationHandler şifre sıfırlama ve e-posta doğrulama dağıtır", async () => {
    const dispatch = vi.fn<NotificationDispatcher["dispatch"]>(async () => {});
    const dispatcher: NotificationDispatcher = { dispatch };
    const handler = new AccountNotificationHandler({
      dispatcher,
      siteName: "Test Mağaza",
    });

    await handler.sendEmailVerification("user@test.com", "https://site.test/verify");
    await handler.sendPasswordReset("user@test.com", "https://site.test/reset");

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch.mock.calls[0]?.[0]).toBe("user@test.com");
    expect(dispatch.mock.calls[0]?.[1].text).toContain("https://site.test/verify");
    expect(dispatch.mock.calls[1]?.[0]).toBe("user@test.com");
    expect(dispatch.mock.calls[1]?.[1].text).toContain("https://site.test/reset");
  });

  it("DealerNotificationHandler yönetici ve bayi bildirimlerini dağıtır", async () => {
    const dispatch = vi.fn<NotificationDispatcher["dispatch"]>(async () => {});
    const dispatcher: NotificationDispatcher = { dispatch };
    const handler = new DealerNotificationHandler({
      dispatcher,
      context: { siteName: "Test Mağaza", baseUrl: "https://site.test" },
      adminEmail: "admin@test.com",
    });

    await handler.sendDealerApplicationToAdmin({
      companyName: "Kaplan A.Ş.",
      taxNumber: "1234567890",
      email: "bayi@test.com",
    });
    await handler.sendDealerDecision("bayi@test.com", true, "Onaylandı");

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch.mock.calls[0]?.[0]).toBe("admin@test.com");
    expect(dispatch.mock.calls[0]?.[1].text).toContain("Kaplan A.Ş.");
    expect(dispatch.mock.calls[1]?.[0]).toBe("bayi@test.com");
    expect(dispatch.mock.calls[1]?.[1].text).toContain("onaylandı");
  });

  it("ReturnNotificationHandler iade karar bildirimini dağıtır", async () => {
    const dispatch = vi.fn<NotificationDispatcher["dispatch"]>(async () => {});
    const dispatcher: NotificationDispatcher = { dispatch };
    const handler = new ReturnNotificationHandler({
      dispatcher,
      context: { siteName: "Test Mağaza", baseUrl: "https://site.test" },
      currency: "TRY",
    });

    await handler.onReturnDecided({
      email: "musteri@test.com",
      orderNumber: "ORD-999",
      approved: true,
      amount: "150.00",
      note: "İade onaylandı",
    });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0]?.[0]).toBe("musteri@test.com");
    expect(dispatch.mock.calls[0]?.[1].subject).toContain("ORD-999");
  });

  it("StockAlertNotificationHandler stok bildirimini dağıtır", async () => {
    const dispatch = vi.fn<NotificationDispatcher["dispatch"]>(async () => {});
    const dispatcher: NotificationDispatcher = { dispatch };
    const handler = new StockAlertNotificationHandler({
      dispatcher,
      context: { siteName: "Test Mağaza", baseUrl: "https://site.test" },
    });

    await handler.sendStockAvailable(
      "alici@test.com",
      { name: "Salatalık Turşusu", slug: "salatalik-tursusu" },
      "https://site.test/unsubscribe",
    );

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0]?.[0]).toBe("alici@test.com");
    expect(dispatch.mock.calls[0]?.[1].subject).toContain("Salatalık Turşusu");
  });

  it("OrderNotificationHandler sipariş bulunamadığında hata fırlatmadan güvenle sonlanır", async () => {
    const dispatch = vi.fn<NotificationDispatcher["dispatch"]>(async () => {});
    const dispatcher: NotificationDispatcher = { dispatch };
    const orders = {
      findById: vi.fn(async () => null),
    };

    const handler = new OrderNotificationHandler({
      orders,
      dispatcher,
      context: { siteName: "Test Mağaza", baseUrl: "https://site.test" },
      adminEmail: "admin@test.com",
    });

    await handler.onOrderPaid("non-existent-order");
    await handler.onOrderPlaced("non-existent-order", "BANK_TRANSFER");
    await handler.onOrderCancelled("non-existent-order", false);
    await handler.onOrderShipped("non-existent-order");

    expect(dispatch).not.toHaveBeenCalled();
    expect(orders.findById).toHaveBeenCalledTimes(4);
  });
});

