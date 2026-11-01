import { getAuditLogger } from "@/shared/audit";
import { getDb } from "@/shared/db";
import { priceResolver } from "../catalog/container";
import { D1CustomPickleRepository } from "./custom-pickle.repository";
import { CustomPickleService } from "./custom-pickle.service";

export const customPickleService = new CustomPickleService(
  new D1CustomPickleRepository(getDb),
  priceResolver,
  getAuditLogger(),
);
