CREATE TABLE "WholesaleLead" (
  "id" text PRIMARY KEY NOT NULL,
  "companyName" text NOT NULL,
  "email" text NOT NULL,
  "phone" text NOT NULL,
  "city" text NOT NULL,
  "businessType" text NOT NULL,
  "orderVolume" text NOT NULL,
  "details" text,
  "contactChannels" text NOT NULL,
  "note" text,
  "status" text DEFAULT 'NEW' NOT NULL,
  "adminNote" text,
  "createdAt" text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updatedAt" text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX "WholesaleLead_status_createdAt_idx"
  ON "WholesaleLead" ("status", "createdAt");
CREATE INDEX "WholesaleLead_createdAt_idx"
  ON "WholesaleLead" ("createdAt");
