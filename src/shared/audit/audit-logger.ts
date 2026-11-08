export interface Actor {
  userId: string;
  ip?: string | null;
}

export interface AuditEntry {
  actorId: string | null;
  /** Örn. "product.price.update", "order.refund" */
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
}

/** Denetim kaydı yalnızca eklenir; güncelleme ve tekil silme yoktur. */
export interface AuditLogger {
  log(entry: AuditEntry): Promise<void>;
  /** Saklama süresi dolan kayıtları toplu siler. */
  purgeOlderThan(cutoff: Date): Promise<number>;
}


/** Eylemi yapan kullanıcının kimliği ve IP bilgisini denetim kaydına ekler. */
export function withActor(
  actor: Actor,
  entry: Omit<AuditEntry, "actorId" | "ip">,
): AuditEntry {
  return { ...entry, actorId: actor.userId, ip: actor.ip };
}
