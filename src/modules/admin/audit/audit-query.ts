import type { AuditQueryRepository } from "./audit-query.repository";

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
  constructor(private readonly audits: AuditQueryRepository) {}

  async search(query: AuditQuery): Promise<AuditPage> {
    const result = await this.audits.search(query);
    return {
      ...result,
      page: query.page,
      totalPages: Math.max(1, Math.ceil(result.total / query.pageSize)),
    };
  }
}
