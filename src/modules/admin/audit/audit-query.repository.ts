import { and, asc, desc, eq } from "drizzle-orm";
import { auditLog, containsText, countWhere, type Db } from "@/db";
import type { AuditQuery, AuditRow } from "./audit-query";

export interface AuditSearchResult {
  items: AuditRow[];
  total: number;
  entityTypes: string[];
}

export interface AuditQueryRepository {
  search(query: AuditQuery): Promise<AuditSearchResult>;
}

export class D1AuditQueryRepository implements AuditQueryRepository {
  constructor(private readonly db: () => Db) {}

  async search(query: AuditQuery): Promise<AuditSearchResult> {
    const db = this.db();
    const where = and(
      query.action ? containsText(auditLog.action, query.action) : undefined,
      query.entityType ? eq(auditLog.entityType, query.entityType) : undefined,
      query.actorId ? eq(auditLog.actorId, query.actorId) : undefined,
    );

    const [total, rows, types] = await Promise.all([
      countWhere(db, auditLog, where),
      db.query.auditLog.findMany({
        where,
        orderBy: desc(auditLog.createdAt),
        offset: (query.page - 1) * query.pageSize,
        limit: query.pageSize,
        with: {
          actor: { columns: { firstName: true, lastName: true, email: true } },
        },
      }),
      db
        .selectDistinct({ entityType: auditLog.entityType })
        .from(auditLog)
        .orderBy(asc(auditLog.entityType)),
    ]);

    return {
      total,
      entityTypes: types.map((row) => row.entityType),
      items: rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        actorName: row.actor
          ? `${row.actor.firstName} ${row.actor.lastName}`.trim()
          : null,
        actorEmail: row.actor?.email ?? null,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        before: row.before,
        after: row.after,
        ip: row.ip,
      })),
    };
  }
}
