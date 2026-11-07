import type { CustomerQueryRepository } from "./customer-query.repository";

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  isActive: boolean;
  /** Tamamlanan (ödenmiş, iptal/iade olmayan) sipariş sayısı */
  orderCount: number;
  totalSpent: string;
  /** Son tamamlanan siparişin tarihi */
  lastOrderAt: Date | null;
  createdAt: Date;
}

/** Liste segmentleri: sekmelerde gösterilir. */
export type CustomerSegment = "all" | "buyers" | "no-orders" | "unverified";
export const CUSTOMER_SEGMENTS: readonly CustomerSegment[] = [
  "all",
  "buyers",
  "no-orders",
  "unverified",
];

export interface CustomerAddressView {
  id: string;
  title: string;
  name: string;
  phone: string;
  line: string;
  district: string;
  city: string;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
  companyName: string | null;
}

export interface CustomerDetail extends CustomerRow {
  b2bStatus: string;
  companyName: string | null;
  groupName: string | null;
  addresses: CustomerAddressView[];
  orders: {
    orderNumber: string;
    status: string;
    grandTotal: string;
    createdAt: Date;
  }[];
}

export interface CustomerPage {
  items: CustomerRow[];
  total: number;
  page: number;
  totalPages: number;
}

/** Müşteri okuma modeli (yönetim panelinde yalnızca görüntüleme). */
export class CustomerQueryService {
  constructor(private readonly customers: CustomerQueryRepository) {}

  segmentCounts(search?: string): Promise<Record<CustomerSegment, number>> {
    return this.customers.segmentCounts(search);
  }

  async search(query: {
    search?: string;
    segment?: CustomerSegment;
    page: number;
    pageSize: number;
  }): Promise<CustomerPage> {
    const result = await this.customers.search(query);
    return {
      ...result,
      page: query.page,
      totalPages: Math.max(1, Math.ceil(result.total / query.pageSize)),
    };
  }

  get(id: string): Promise<CustomerDetail | null> {
    return this.customers.findById(id);
  }
}
