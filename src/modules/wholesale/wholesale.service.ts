import "server-only";
import { z } from "zod";
import type { Actor, AuditLogger } from "@/shared/audit";
import { withActor } from "@/shared/audit/audit-logger";
import { NotFoundError, ValidationError } from "@/shared/errors";
import { firstIssue } from "@/shared/validation";
import {
  WHOLESALE_LEAD_STATUSES,
  type WholesaleLeadStatus,
} from "@/db/schema/wholesale";
import type { WholesaleLeadRepository } from "./wholesale.repository";
import type {
  WholesaleLeadInput,
  WholesaleLeadRecord,
} from "./wholesale.types";

const createSchema = z.object({
  companyName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(10).max(20),
  city: z.string().trim().min(2).max(80),
  businessType: z.string().trim().min(1).max(60),
  orderVolume: z.string().trim().min(1).max(60),
  details: z.string().trim().max(2000).nullable(),
  contactChannels: z.array(z.string().trim().min(1)).min(1),
  note: z.string().trim().max(1000).nullable(),
});

const statusSchema = z.object({
  status: z.enum(WHOLESALE_LEAD_STATUSES),
  adminNote: z
    .string()
    .trim()
    .max(1000)
    .nullish()
    .transform((value) => value || null),
});

export class WholesaleLeadService {
  constructor(
    private readonly repository: WholesaleLeadRepository,
    private readonly audit: AuditLogger,
  ) {}

  create(raw: WholesaleLeadInput): Promise<string> {
    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) throw new ValidationError(firstIssue(parsed.error));
    return this.repository.create(parsed.data);
  }

  list(status?: WholesaleLeadStatus): Promise<WholesaleLeadRecord[]> {
    return this.repository.list(status);
  }

  countNew(): Promise<number> {
    return this.repository.countByStatus("NEW");
  }

  async updateStatus(
    id: string,
    raw: unknown,
    actor: Actor,
  ): Promise<void> {
    const lead = await this.repository.findById(id);
    if (!lead) throw new NotFoundError("Toptan başvurusu");

    const parsed = statusSchema.safeParse(raw);
    if (!parsed.success) throw new ValidationError(firstIssue(parsed.error));

    await this.repository.updateStatus(
      id,
      parsed.data.status,
      parsed.data.adminNote,
    );

    await this.audit.log(
      withActor(actor, {
        action: "wholesale.status",
        entityType: "WholesaleLead",
        entityId: id,
        before: { status: lead.status },
        after: {
          status: parsed.data.status,
          adminNote: parsed.data.adminNote,
        },
      }),
    );
  }
}
