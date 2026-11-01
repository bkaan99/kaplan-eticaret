import { siteConfig } from "@/config/site.config";
import { getDb } from "@/shared/db";
import { D1ReportingRepository } from "./reporting.repository";
import { ReportingService } from "./reporting.service";

export const reportingService = new ReportingService(
  new D1ReportingRepository(getDb),
  siteConfig.inventory.lowStockThreshold,
);
