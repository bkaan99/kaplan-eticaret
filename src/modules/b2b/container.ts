import { getAuditLogger } from "@/shared/audit";
import { getDb } from "@/shared/db";
import { getNotificationService } from "../notifications/container";
import { PrismaDealerRepository } from "./dealer.repository";
import { DealerService } from "./dealer.service";

export function getDealerService(): DealerService {
  return new DealerService(
    new PrismaDealerRepository(getDb),
    getNotificationService(),
    getAuditLogger(),
  );
}
