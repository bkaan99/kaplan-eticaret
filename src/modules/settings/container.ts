import { getDb } from "@/shared/db";
import { getAuditLogger } from "@/shared/audit";
import { D1SettingsRepository } from "./settings.repository";
import { SettingsService } from "./settings.service";

export const settingsService = new SettingsService(
  new D1SettingsRepository(getDb),
  getAuditLogger(),
);
