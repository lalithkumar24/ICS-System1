import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  pgEnum,
  uuid,
  boolean,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("auditor"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit status enum
export const auditStatusEnum = pgEnum("audit_status", [
  "pending",
  "in_progress",
  "completed",
  "failed",
  "paused"
]);

// Risk level enum
export const riskLevelEnum = pgEnum("risk_level", [
  "low",
  "medium",
  "high",
  "critical",
  "informational"
]);

// Contract type enum
export const contractTypeEnum = pgEnum("contract_type", [
  "defi",
  "nft",
  "governance",
  "token",
  "bridge",
  "other"
]);

// Smart contracts table
export const smartContracts = pgTable("smart_contracts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 42 }).unique(),
  source_code: text("source_code"),
  compiler_version: varchar("compiler_version", { length: 50 }),
  network: varchar("network", { length: 50 }).notNull(),
  contract_type: contractTypeEnum("contract_type").default("other"),
  deployment_date: timestamp("deployment_date"),
  verified: boolean("verified").default(false),
  uploaded_by: varchar("uploaded_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Audits table
export const audits = pgTable("audits", {
  id: serial("id").primaryKey(),
  contract_id: integer("contract_id").references(() => smartContracts.id),
  auditor_id: varchar("auditor_id").references(() => users.id),
  status: auditStatusEnum("status").default("pending"),
  audit_type: varchar("audit_type", { length: 100 }).default("comprehensive"),
  priority: varchar("priority", { length: 20 }).default("standard"),
  progress: integer("progress").default(0),
  risk_score: decimal("risk_score", { precision: 3, scale: 1 }),
  findings_count: integer("findings_count").default(0),
  critical_issues: integer("critical_issues").default(0),
  high_issues: integer("high_issues").default(0),
  medium_issues: integer("medium_issues").default(0),
  low_issues: integer("low_issues").default(0),
  started_at: timestamp("started_at"),
  completed_at: timestamp("completed_at"),
  notes: text("notes"),
  configuration: jsonb("configuration"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Audit findings table
export const auditFindings = pgTable("audit_findings", {
  id: serial("id").primaryKey(),
  audit_id: integer("audit_id").references(() => audits.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  severity: riskLevelEnum("severity").notNull(),
  category: varchar("category", { length: 100 }),
  line_number: integer("line_number"),
  code_snippet: text("code_snippet"),
  recommendation: text("recommendation"),
  status: varchar("status", { length: 50 }).default("open"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});

// Transactions table for monitoring
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  hash: varchar("hash", { length: 66 }).unique().notNull(),
  contract_address: varchar("contract_address", { length: 42 }),
  from_address: varchar("from_address", { length: 42 }),
  to_address: varchar("to_address", { length: 42 }),
  value: varchar("value"),
  gas_used: varchar("gas_used"),
  gas_price: varchar("gas_price"),
  block_number: varchar("block_number"),
  timestamp: timestamp("timestamp"),
  risk_level: riskLevelEnum("risk_level").default("low"),
  flags: jsonb("flags"),
  analyzed: boolean("analyzed").default(false),
  created_at: timestamp("created_at").defaultNow(),
});

// Audit reports table
export const auditReports = pgTable("audit_reports", {
  id: serial("id").primaryKey(),
  audit_id: integer("audit_id").references(() => audits.id),
  title: varchar("title", { length: 255 }).notNull(),
  summary: text("summary"),
  report_data: jsonb("report_data"),
  file_path: varchar("file_path"),
  generated_by: varchar("generated_by").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  audits: many(audits),
  uploadedContracts: many(smartContracts),
  generatedReports: many(auditReports),
}));

export const smartContractsRelations = relations(smartContracts, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [smartContracts.uploaded_by],
    references: [users.id],
  }),
  audits: many(audits),
}));

export const auditsRelations = relations(audits, ({ one, many }) => ({
  contract: one(smartContracts, {
    fields: [audits.contract_id],
    references: [smartContracts.id],
  }),
  auditor: one(users, {
    fields: [audits.auditor_id],
    references: [users.id],
  }),
  findings: many(auditFindings),
  reports: many(auditReports),
}));

export const auditFindingsRelations = relations(auditFindings, ({ one }) => ({
  audit: one(audits, {
    fields: [auditFindings.audit_id],
    references: [audits.id],
  }),
}));

export const auditReportsRelations = relations(auditReports, ({ one }) => ({
  audit: one(audits, {
    fields: [auditReports.audit_id],
    references: [audits.id],
  }),
  generatedBy: one(users, {
    fields: [auditReports.generated_by],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertSmartContractSchema = createInsertSchema(smartContracts).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertAuditSchema = createInsertSchema(audits).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertAuditFindingSchema = createInsertSchema(auditFindings).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  created_at: true,
});

export const insertAuditReportSchema = createInsertSchema(auditReports).omit({
  id: true,
  created_at: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type SmartContract = typeof smartContracts.$inferSelect;
export type InsertSmartContract = z.infer<typeof insertSmartContractSchema>;
export type Audit = typeof audits.$inferSelect;
export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type AuditFinding = typeof auditFindings.$inferSelect;
export type InsertAuditFinding = z.infer<typeof insertAuditFindingSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type AuditReport = typeof auditReports.$inferSelect;
export type InsertAuditReport = z.infer<typeof insertAuditReportSchema>;
