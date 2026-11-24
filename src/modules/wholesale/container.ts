import "server-only";
import { getAuditLogger } from "@/shared/audit";
import { getDb } from "@/shared/db";
import { D1WholesaleLeadRepository } from "./wholesale.repository";
import { WholesaleLeadService } from "./wholesale.service";

export function getWholesaleLeadService(): WholesaleLeadService {
  return new WholesaleLeadService(
    new D1WholesaleLeadRepository(getDb),
    getAuditLogger(),
  );
}
