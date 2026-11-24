import type { WholesaleLeadStatus } from "@/db/schema/wholesale";

export type { WholesaleLeadStatus };

export interface WholesaleLeadInput {
  companyName: string;
  email: string;
  phone: string;
  city: string;
  businessType: string;
  orderVolume: string;
  details: string | null;
  contactChannels: string[];
  note: string | null;
}

export interface WholesaleLeadRecord extends WholesaleLeadInput {
  id: string;
  status: WholesaleLeadStatus;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}
