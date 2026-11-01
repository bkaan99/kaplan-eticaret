import { and, asc, desc, eq } from "drizzle-orm";
import { auditLog, containsText, countWhere, type Db } from "@/db";

export interface AuditQuery {
  action?: string;
  entityType?: string;
  actorId?: string;
  page: number;
  pageSize: number;
}

export interface AuditRow {
  id: string;
  createdAt: Date;
  actorName: string | null;
  actorEmail: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
}

export interface AuditPage {
  items: AuditRow[];
  total: number;
  page: number;
  totalPages: number;
  entityTypes: string[];
}

/** Denetim günlüğü okuma modeli: yalnızca sorgular, yazma `AuditLogger`dadır. */
export class AuditQueryService {
  constructor(private readonly db: () => Db) {}

  async search(query: AuditQuery): Promise<AuditPage> {
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
      page: query.page,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
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
