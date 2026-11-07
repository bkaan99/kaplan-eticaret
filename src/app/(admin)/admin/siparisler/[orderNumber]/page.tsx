import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AccessDenied } from "@/components/admin/access-denied";
import { AdminLoading } from "@/components/admin/admin-list";
import { getAdminOrderService } from "@/modules/admin/container";
import { adminPage } from "@/modules/admin/guard";
import {
  allowedTransitions,
  isStaffCancellable,
} from "@/modules/admin/orders/order-state";
import { hasPermission } from "@/modules/auth/authorization";
import { isAppError } from "@/shared/errors";
import { PERMISSIONS } from "@/shared/permissions";
import { OrderActions } from "./order-actions";
import { OrderDetailView } from "./order-detail-view";

export const metadata: Metadata = { title: "Sipariş detayı" };

async function OrderDetail({
  params,
}: Pick<PageProps<"/admin/siparisler/[orderNumber]">, "params">) {
  const user = await adminPage(PERMISSIONS.ORDER_READ);
  if (!user) return <AccessDenied />;

  const { orderNumber } = await params;

  let order;
  try {
    order = await getAdminOrderService().get(orderNumber);
  } catch (error) {
    if (isAppError(error)) notFound();
    throw error;
  }

  const transitions = allowedTransitions(order.status);
  const canUpdate = hasPermission(user.permissions, PERMISSIONS.ORDER_UPDATE);
  const canCancel = hasPermission(user.permissions, PERMISSIONS.ORDER_CANCEL);
  const payment = order.payments[0];

  return (
    <OrderDetailView
      order={order}
      actions={
        canUpdate || canCancel ? (
          <OrderActions
            orderNumber={order.orderNumber}
            canProcess={canUpdate && transitions.includes("PROCESSING")}
            canShip={canUpdate && transitions.includes("SHIPPED")}
            canDeliver={canUpdate && transitions.includes("DELIVERED")}
            canCancel={canCancel && isStaffCancellable(order.status)}
            canConfirmBankTransfer={
              canUpdate &&
              payment?.method === "BANK_TRANSFER" &&
              order.status === "PENDING_PAYMENT"
            }
            canCollectDeferred={
              canUpdate &&
              payment?.method === "DEFERRED" &&
              order.paymentStatus === "PENDING" &&
              order.status !== "CANCELLED"
            }
            paid={order.paymentStatus === "PAID"}
          />
        ) : null
      }
    />
  );
}

export default function AdminOrderPage({
  params,
}: PageProps<"/admin/siparisler/[orderNumber]">) {
  return (
    <Suspense fallback={<AdminLoading label="Sipariş yükleniyor..." />}>
      <OrderDetail params={params} />
    </Suspense>
  );
}
