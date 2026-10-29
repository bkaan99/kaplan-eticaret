import type { OrderLookupRepository } from "../../orders/order.repository";
import type { NotificationDispatcher } from "../notification-dispatcher";
import {
  renderAdminNewOrder,
  renderOrderCancelled,
  renderOrderConfirmation,
  renderOrderPlacedManual,
  renderOrderShipped,
  type BankAccountInfo,
  type EmailContext,
} from "../templates/order-emails";

export interface OrderNotificationHandlerDeps {
  orders: OrderLookupRepository;
  dispatcher: NotificationDispatcher;
  context: EmailContext;
  adminEmail: string;
  bankAccounts?: readonly BankAccountInfo[];
}

/** Sipariş yaşam döngüsü olaylarında ilgili e-postaları üreterek dağıtıcıya iletir. */
export class OrderNotificationHandler {
  constructor(private readonly deps: OrderNotificationHandlerDeps) {}

  async onOrderPaid(orderId: string): Promise<void> {
    const order = await this.deps.orders.findById(orderId);
    if (!order) return;

    await this.deps.dispatcher.dispatch(
      order.email,
      renderOrderConfirmation(order, this.deps.context),
    );
    await this.deps.dispatcher.dispatch(
      this.deps.adminEmail,
      renderAdminNewOrder(order, this.deps.context),
    );
  }

  async onOrderPlaced(
    orderId: string,
    method: "BANK_TRANSFER" | "DEFERRED",
  ): Promise<void> {
    const order = await this.deps.orders.findById(orderId);
    if (!order) return;

    const bankAccounts = this.deps.bankAccounts ?? [];
    await this.deps.dispatcher.dispatch(
      order.email,
      renderOrderPlacedManual(order, method, bankAccounts, this.deps.context),
    );
    await this.deps.dispatcher.dispatch(
      this.deps.adminEmail,
      renderAdminNewOrder(order, this.deps.context),
    );
  }

  async onOrderCancelled(orderId: string, refunded: boolean): Promise<void> {
    const order = await this.deps.orders.findById(orderId);
    if (!order) return;

    await this.deps.dispatcher.dispatch(
      order.email,
      renderOrderCancelled(order, refunded, this.deps.context),
    );
  }

  async onOrderShipped(orderId: string): Promise<void> {
    const order = await this.deps.orders.findById(orderId);
    if (!order) return;

    await this.deps.dispatcher.dispatch(
      order.email,
      renderOrderShipped(order, this.deps.context),
    );
  }
}
