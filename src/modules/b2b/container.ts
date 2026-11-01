import { getAuditLogger } from "@/shared/audit";
import { getDb } from "@/shared/db";
import { getNotificationService } from "../notifications/container";
import { D1DealerRepository } from "./dealer.repository";
import { DealerService } from "./dealer.service";

export function getDealerService(): DealerService {
  return new DealerService(
    new D1DealerRepository(getDb),
    getNotificationService(),
    getAuditLogger(),
  );
}
