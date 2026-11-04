import { describe, expect, it, vi } from "vitest";
import type { OrderView } from "@/modules/orders/order.types";
import type { JobQueue } from "@/shared/queue";
import { renderOrderShippedSms } from "../templates/order-sms";
import {
  JOB_SEND_SMS,
  SmsNotificationHandler,
} from "./sms-notification.handler";

const context = { siteName: "Kaplan Turşu", baseUrl: "https://site.test" };

function order(overrides: Partial<OrderView> = {}): OrderView {
  return {
    id: "o1",
    orderNumber: "SABC123",
    lookupToken: "tok",
    carrier: "Yurtiçi Kargo",
    trackingNumber: "987654",
    shippingAddress: { phone: "0507 542 03 01" },
    ...overrides,
  } as OrderView;
}

function setup(found: OrderView | null, enqueue = vi.fn(async () => "job")) {
  const queue = { enqueue } as unknown as JobQueue;
  const handler = new SmsNotificationHandler({
    orders: { findById: async () => found } as never,
    queue,
    context,
  });
  return { handler, enqueue };
}

describe("renderOrderShippedSms", () => {
  it("firma, takip numarası ve takip bağlantısını yazar", () => {
    expect(renderOrderShippedSms(order(), context)).toBe(
      "Kaplan Turşu: SABC123 numaralı siparişiniz Yurtiçi Kargo ile kargoya verildi. Takip no: 987654. https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=987654",
    );
  });

  it("takip bağlantısı yoksa sipariş sayfasını verir", () => {
    expect(
      renderOrderShippedSms(
        order({ carrier: "Diğer", trackingNumber: null }),
        context,
      ),
    ).toBe(
      "Kaplan Turşu: SABC123 numaralı siparişiniz kargoya verildi. https://site.test/siparis/SABC123?t=tok",
    );
  });
});

describe("SmsNotificationHandler", () => {
  it("kargoya verilen sipariş için normalize numarayla SMS işi kuyruğa atar", async () => {
    const { handler, enqueue } = setup(order());
    await handler.onOrderShipped("o1");

    expect(enqueue).toHaveBeenCalledWith(
      JOB_SEND_SMS,
      expect.objectContaining({ to: "5075420301" }),
      expect.objectContaining({ singletonKey: "sms:shipped:o1" }),
    );
  });

  it("cep numarası geçersizse SMS atmaz", async () => {
    const { handler, enqueue } = setup(
      order({
        shippingAddress: {
          phone: "0312 555 44 33",
        } as OrderView["shippingAddress"],
      }),
    );
    await handler.onOrderShipped("o1");
    expect(enqueue).not.toHaveBeenCalled();
  });

  it("kuyruk hatasını yutar; kargo işlemi bozulmaz", async () => {
    const { handler } = setup(
      order(),
      vi.fn(async () => {
        throw new Error("kuyruk kapalı");
      }),
    );
    await expect(handler.onOrderShipped("o1")).resolves.toBeUndefined();
  });
});
