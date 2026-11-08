import { getAuditLogger } from "@/shared/audit";
import { getDb } from "@/shared/db";
import { priceResolver } from "../catalog/container";
import { D1CustomPickleRepository } from "./custom-pickle.repository";
import { CustomPickleAdminService } from "./custom-pickle-admin.service";
import { CustomPickleService } from "./custom-pickle.service";

const customPickleRepository = new D1CustomPickleRepository(getDb);

export const customPickleService = new CustomPickleService(
  customPickleRepository,
  priceResolver,
  getAuditLogger(),
);

export const customPickleAdminService = new CustomPickleAdminService(
  customPickleRepository,
  getAuditLogger(),
);
