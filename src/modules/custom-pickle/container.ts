import { getAuditLogger } from "@/shared/audit";
import { getDb } from "@/shared/db";
import { priceResolver } from "../catalog/container";
import { PrismaCustomPickleRepository } from "./custom-pickle.repository";
import { CustomPickleService } from "./custom-pickle.service";

export const customPickleService = new CustomPickleService(
  new PrismaCustomPickleRepository(getDb),
  priceResolver,
  getAuditLogger(),
);
