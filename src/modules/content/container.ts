import { getAuditLogger } from "@/shared/audit";
import { getDb } from "@/shared/db";
import { D1ContentRepository } from "./content.repository";
import { ContentService } from "./content.service";

export function getContentService(): ContentService {
  return new ContentService(new D1ContentRepository(getDb), getAuditLogger());
}
