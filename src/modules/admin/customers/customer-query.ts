import type { CustomerQueryRepository } from "./customer-query.repository";

export interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  isActive: boolean;
  orderCount: number;
  totalSpent: string;
  createdAt: Date;
}

export interface CustomerDetail extends CustomerRow {
  b2bStatus: string;
  companyName: string | null;
  groupName: string | null;
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

  async search(query: {
    search?: string;
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
