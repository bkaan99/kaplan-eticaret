import { lt } from "drizzle-orm";
import { auditLog, type Db } from "@/db";
import type { AuditEntry, AuditLogger } from "./audit-logger";

/** JSON'a çevrilebilir kopya (Date, class örnekleri vb. düzleşir); boş değer null'a döner. */
function toJson(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  return JSON.parse(JSON.stringify(value));
}

export class D1AuditLogger implements AuditLogger {
  /** Fonksiyon verilirse istemci ilk kullanımda alınır (modül yüklenirken D1 bağlaması olmayabilir). */
  constructor(private readonly source: Db | (() => Db)) {}

  private get db(): Db {
    return typeof this.source === "function" ? this.source() : this.source;
  }

  async log(entry: AuditEntry): Promise<void> {
    await this.db.insert(auditLog).values({
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId ?? null,
      before: toJson(entry.before),
      after: toJson(entry.after),
      ip: entry.ip ?? null,
    });
  }

  async purgeOlderThan(cutoff: Date): Promise<number> {
    const result = await this.db.delete(auditLog).where(lt(auditLog.createdAt, cutoff)).run();
    return result.meta.changes;
  }
}
