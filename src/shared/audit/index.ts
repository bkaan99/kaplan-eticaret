import "server-only";
import { getDb } from "../db";
import type { AuditLogger } from "./audit-logger";
import { D1AuditLogger } from "./d1-audit-logger";

export type { Actor, AuditEntry, AuditLogger } from "./audit-logger";

let logger: AuditLogger | undefined;

export function getAuditLogger(): AuditLogger {
  logger ??= new D1AuditLogger(getDb);
  return logger;
}
