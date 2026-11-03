import { getAuditLogger } from "@/shared/audit";
import { getDb } from "@/shared/db";
import { getEventBus } from "@/shared/events";
import { getOrderService, orderRepository } from "../orders/container";
import { D1ProductAdminRepository } from "./catalog/product-admin.repository";
import { ProductAdminService } from "./catalog/product-admin.service";
import { D1TaxonomyRepository } from "./taxonomy/taxonomy.repository";
import { TaxonomyService } from "./taxonomy/taxonomy.service";
import { D1PromotionRepository } from "./promotions/promotion.repository";
import { PromotionService } from "./promotions/promotion.service";
import { AuditQueryService } from "./audit/audit-query";
import { CustomerQueryService } from "./customers/customer-query";
import { D1PriceListRepository } from "./pricing/price-list.repository";
import { PriceListService } from "./pricing/price-list.service";
import { D1AdminOrderRepository } from "./orders/admin-order.repository";
import { AdminOrderService } from "./orders/admin-order.service";
import { D1BulkUpdateRepository } from "./import/bulk-update.repository";
import { BulkUpdateService } from "./import/bulk-update.service";
import { D1ImportRepository } from "./import/import.repository";
import { ProductImportService } from "./import/product-import.service";
import { getAccountService } from "../account/container";
import { D1StaffRepository } from "./staff/staff.repository";
import { StaffService } from "./staff/staff.service";
import { D1ExportRepository } from "./reports/export.repository";
import { ExportService } from "./reports/export.service";

export function getExportService(): ExportService {
  return new ExportService(new D1ExportRepository(getDb));
}

export function getAdminOrderService(): AdminOrderService {
  return new AdminOrderService(
    new D1AdminOrderRepository(getDb),
    getOrderService(),
    getEventBus(),
    getAuditLogger(),
    orderRepository,
  );
}

export function getProductAdminService(): ProductAdminService {
  return new ProductAdminService(
    new D1ProductAdminRepository(getDb),
    getEventBus(),
    getAuditLogger(),
  );
}

export function getTaxonomyService(): TaxonomyService {
  return new TaxonomyService(new D1TaxonomyRepository(getDb), getAuditLogger());
}

export function getPromotionService(): PromotionService {
  return new PromotionService(
    new D1PromotionRepository(getDb),
    getAuditLogger(),
  );
}

export function getAuditQueryService(): AuditQueryService {
  return new AuditQueryService(getDb);
}

export function getCustomerQueryService(): CustomerQueryService {
  return new CustomerQueryService(getDb);
}

export function getPriceListService(): PriceListService {
  return new PriceListService(
    new D1PriceListRepository(getDb),
    getAuditLogger(),
  );
}

export function getBulkUpdateService(): BulkUpdateService {
  return new BulkUpdateService(
    new D1BulkUpdateRepository(getDb),
    getEventBus(),
    getAuditLogger(),
  );
}

export function getProductImportService(): ProductImportService {
  return new ProductImportService(
    getProductAdminService(),
    new D1ImportRepository(getDb),
  );
}

export function getStaffService(): StaffService {
  return new StaffService(
    new D1StaffRepository(getDb),
    {
      // Parola belirleme bağlantısı, parola sıfırlama akışıyla gönderilir.
      sendPasswordSetup: (email) =>
        getAccountService().requestPasswordReset(email),
    },
    getAuditLogger(),
  );
}
