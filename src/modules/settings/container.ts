import { getDb } from "@/shared/db";
import { getAuditLogger } from "@/shared/audit";
import { SettingsService } from "./settings.service";

export const settingsService = new SettingsService(getDb, getAuditLogger());
