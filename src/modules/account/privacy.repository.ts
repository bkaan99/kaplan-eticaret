import { and, count, desc, eq, inArray, or } from "drizzle-orm";
import {
  address,
  cart,
  customer,
  order,
  runBatch,
  user as userTable,
  userRole,
  wishlistItem,
  type Db,
} from "@/db";

export interface UserDataExport {
  exportedAt: string;
  account: {
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    emailVerified: boolean;
    createdAt: string;
  };
  addresses: Record<string, unknown>[];
  orders: Record<string, unknown>[];
  wishlist: { product: string; slug: string }[];
  dealer: Record<string, unknown> | null;
}

export interface PrivacyRepository {
  collectExport(userId: string): Promise<UserDataExport | null>;
  /** Teslimi veya ödemesi tamamlanmamış sipariş sayısı. */
  openOrderCount(userId: string): Promise<number>;
  findIdentity(userId: string): Promise<{
    email: string;
    type: "CUSTOMER" | "STAFF";
    passwordHash: string | null;
    anonymized: boolean;
  } | null>;
  /** Kişisel verileri siler/anonimleştirir; yasal saklama gereken siparişler korunur. */
  anonymize(userId: string): Promise<void>;
}

export class D1PrivacyRepository implements PrivacyRepository {
  constructor(private readonly db: () => Db) {}

  async collectExport(userId: string): Promise<UserDataExport | null> {
    const user = await this.db().query.user.findFirst({
      where: eq(userTable.id, userId),
      with: {
        addresses: true,
        customer: { with: { group: { columns: { name: true } } } },
        wishlist: {
          with: { product: { columns: { name: true, slug: true } } },
        },
        orders: {
          orderBy: desc(order.createdAt),
          with: { items: true, payments: true },
        },
      },
    });
    if (!user) return null;

    return {
      exportedAt: new Date().toISOString(),
      account: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        emailVerified: user.emailVerifiedAt !== null,
        createdAt: user.createdAt.toISOString(),
      },
      addresses: user.addresses.map((address) => ({
        title: address.title,
        firstName: address.firstName,
        lastName: address.lastName,
        phone: address.phone,
        city: address.city,
        district: address.district,
        neighborhood: address.neighborhood,
        addressLine: address.addressLine,
        postalCode: address.postalCode,
        invoiceType: address.invoiceType,
        companyName: address.companyName,
        taxNumber: address.taxNumber,
        taxOffice: address.taxOffice,
      })),
      orders: user.orders.map((order) => ({
        orderNumber: order.orderNumber,
        createdAt: order.createdAt.toISOString(),
        status: order.status,
        paymentStatus: order.paymentStatus,
        currency: order.currency,
        subtotal: order.subtotal.toFixed(2),
        discountTotal: order.discountTotal.toFixed(2),
        shippingTotal: order.shippingTotal.toFixed(2),
        grandTotal: order.grandTotal.toFixed(2),
        couponCode: order.couponCode,
        shippingAddress: order.shippingAddress,
        billingAddress: order.billingAddress,
        items: order.items.map((item) => ({
          product: item.productName,
          variant: item.variantName,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toFixed(2),
          lineTotal: item.lineTotal.toFixed(2),
        })),
        payments: order.payments.map((payment) => ({
          method: payment.method,
          status: payment.status,
          amount: payment.amount.toFixed(2),
          paidAt: payment.paidAt?.toISOString() ?? null,
        })),
      })),
      wishlist: user.wishlist.map((item) => ({
        product: item.product.name,
        slug: item.product.slug,
      })),
      dealer: user.customer
        ? {
            status: user.customer.b2bStatus,
            companyName: user.customer.companyName,
            taxNumber: user.customer.taxNumber,
            taxOffice: user.customer.taxOffice,
            group: user.customer.group?.name ?? null,
          }
        : null,
    };
  }

  async openOrderCount(userId: string): Promise<number> {
    const [row] = await this.db()
      .select({ n: count() })
      .from(order)
      .where(
        and(
          eq(order.userId, userId),
          or(
            inArray(order.status, [
              "PENDING_PAYMENT",
              "PAID",
              "PROCESSING",
              "SHIPPED",
            ]),
            // Teslim edilmiş ama vadeli ödemesi tahsil edilmemiş sipariş
            and(
              eq(order.status, "DELIVERED"),
              eq(order.paymentStatus, "PENDING"),
            ),
          ),
        ),
      );
    return row!.n;
  }

  async findIdentity(userId: string) {
    const user = await this.db().query.user.findFirst({
      where: eq(userTable.id, userId),
      columns: {
        email: true,
        type: true,
        passwordHash: true,
        anonymizedAt: true,
      },
    });
    return user
      ? {
          email: user.email,
          type: user.type,
          passwordHash: user.passwordHash,
          anonymized: user.anonymizedAt !== null,
        }
      : null;
  }

  async anonymize(userId: string): Promise<void> {
    const db = this.db();
    // Tüm işlemler tek batch'te: ya hepsi uygulanır ya hiçbiri.
    await runBatch(db, [
      db.delete(address).where(eq(address.userId, userId)),
      db.delete(wishlistItem).where(eq(wishlistItem.userId, userId)),
      db.delete(cart).where(eq(cart.userId, userId)),
      db.delete(userRole).where(eq(userRole.userId, userId)),
      db
        .update(customer)
        .set({
          b2bStatus: "NONE",
          groupId: null,
          companyName: null,
          taxNumber: null,
          taxOffice: null,
          creditLimit: null,
          minOrderAmount: null,
          b2bNote: null,
        })
        .where(eq(customer.userId, userId)),
      db
        .update(userTable)
        .set({
          // Sipariş kayıtları yasal saklama gereği korunur; kimlik bağlantısı kopar.
          email: `silinmis-${userId}@anonim.invalid`,
          firstName: "Silinmiş",
          lastName: "Kullanıcı",
          phone: null,
          passwordHash: null,
          isActive: false,
          emailVerifiedAt: null,
          anonymizedAt: new Date(),
        })
        .where(eq(userTable.id, userId)),
    ]);
  }
}
